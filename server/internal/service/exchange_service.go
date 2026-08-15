package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/greencycle/server/internal/model"
	"github.com/greencycle/server/internal/repository"
	"github.com/greencycle/server/pkg/wecom"
)

type ExchangeService struct {
	repo *repository.Repository
}

func NewExchangeService(repo *repository.Repository) *ExchangeService {
	return &ExchangeService{repo: repo}
}

// ListItems 可兑换商品列表
func (s *ExchangeService) ListItems(ctx context.Context) ([]model.ExchangeItem, error) {
	return s.repo.Exchange.ListActive(ctx)
}

// ExchangeReq 兑换请求
type ExchangeReq struct {
	ItemID    uint   `json:"itemId" binding:"required"`
	AddressID uint64 `json:"addressId" binding:"required"`
	Quantity  int    `json:"quantity"` // 兑换数量（默认 1，前端可选）
}

// Exchange 兑换商品
func (s *ExchangeService) Exchange(ctx context.Context, userID uint, req *ExchangeReq) error {
	// 数量归一化
	qty := req.Quantity
	if qty <= 0 {
		qty = 1
	}

	// 获取商品（仅上架商品）
	item, err := s.repo.Exchange.GetByID(ctx, req.ItemID)
	if err != nil {
		return errors.New("商品不存在或已下架")
	}
	if item.Stock <= 0 {
		return errors.New("商品库存不足")
	}
	if qty > item.Stock {
		return errors.New("兑换数量超过库存")
	}

	// 验证收货地址属于当前用户
	addr, err := s.repo.Address.GetByIDAndUser(ctx, uint(req.AddressID), userID)
	if err != nil {
		return errors.New("地址验证失败")
	}
	if addr == nil {
		return errors.New("收货地址不存在")
	}

	// 消耗积分 = 单价 × 数量
	totalPoints := item.Points * qty

	// 事务：锁用户行 → 限兑检查 → 扣积分 → 扣库存 → 创建记录
	// 锁用户行串行化同一用户的并发请求，防止限兑次数 TOCTOU
	return s.repo.WithTx(ctx, func(tx *gorm.DB) error {
		// 1. 锁定用户行（SELECT FOR UPDATE），串行化同一用户的并发兑换
		var user model.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			First(&user, userID).Error; err != nil {
			return errors.New("用户信息获取失败")
		}

		// 2. 检查限兑次数（事务内，持锁状态下查询，防止 TOCTOU）
		if item.LimitPerUser > 0 {
			var count int64
			if err := tx.Model(&model.ExchangeRecord{}).
				Where("user_id = ? AND item_id = ? AND status != ?", userID, item.ID, 4).
				Count(&count).Error; err != nil {
				return errors.New("限兑检查失败")
			}
			// 限兑次数按件数累计（已含 quantity）
			if int(count)+qty > item.LimitPerUser {
				return errors.New("该商品每人限兑 " + fmt.Sprintf("%d", item.LimitPerUser) + " 件，您已达上限")
			}
		}

		// 3. 检查积分余额
		if user.Points < totalPoints {
			return errors.New("积分不足，无法兑换")
		}

		// 4. 扣减用户积分（条件更新 + RowsAffected 双保险）
		result := tx.Model(&model.User{}).Where("id = ? AND points >= ?", userID, totalPoints).
			UpdateColumn("points", gorm.Expr("points - ?", totalPoints))
		if result.Error != nil {
			return errors.New("积分扣减失败")
		}
		if result.RowsAffected == 0 {
			return errors.New("积分不足，兑换失败")
		}

		// 5. 扣减库存（条件更新 + RowsAffected 防超卖，按 qty 扣减）
		stockResult, err := s.repo.Exchange.DeductStockBy(ctx, tx, req.ItemID, qty)
		if err != nil {
			return errors.New("库存扣减失败")
		}
		if stockResult == 0 {
			return errors.New("商品库存不足")
		}

		// 6. 查询扣减后的最新积分余额
		var updatedUser model.User
		if err := tx.Select("points").First(&updatedUser, userID).Error; err != nil {
			return errors.New("查询积分余额失败")
		}

		// 7. 创建积分流水（type=3 兑换）
		pointLog := &model.CarbonPointLog{
			UserID:  userID,
			Type:    3, // 兑换
			Amount:  -totalPoints,
			Balance: updatedUser.Points,
			Remark:  "兑换：" + item.Name + " × " + fmt.Sprintf("%d", qty),
		}
		if err := s.repo.Point.CreateLog(ctx, tx, pointLog); err != nil {
			return errors.New("积分记录创建失败")
		}

		// 8. 创建兑换记录（含收货地址快照）
		addrID := req.AddressID
		fullAddr := addr.Province + addr.City + addr.District + addr.Detail
		record := &model.ExchangeRecord{
			UserID:        userID,
			ItemID:        item.ID,
			ItemName:      item.Name,
			ItemImage:     item.Image,
			Quantity:      qty,
			Points:        totalPoints,
			Status:        1, // 待发货
			DeliveryName:  addr.Name,
			DeliveryPhone: addr.Phone,
			DeliveryAddr:  fullAddr,
			DeliveryLat:   addr.Lat,
			DeliveryLng:   addr.Lng,
		}
		record.AddressID = &addrID
		return s.repo.Exchange.CreateRecord(ctx, tx, record)
	})
	if err != nil {
		return err
	}

	// 推送新兑换工单通知到企业微信群
	go s.notifyGroupNewExchange(record)

	return nil
}

// notifyGroupNewExchange 推送新兑换工单到企业微信群
func (s *ExchangeService) notifyGroupNewExchange(record *model.ExchangeRecord) {
	msg := fmt.Sprintf(`## 🎁 新兑换工单

**订单类型：** 兑换工单
**工单号：** #%d
**商品：** %s × %d
**消耗积分：** %d
**收货人：** %s
**联系电话：** %s
**收货地址：** %s

请尽快安排发货/配送`,
		record.ID,
		record.ItemName,
		record.Quantity,
		record.Points,
		record.DeliveryName,
		record.DeliveryPhone,
		record.DeliveryAddr,
	)

	if err := wecom.SendMarkdown(msg); err != nil {
		fmt.Printf("⚠️ 企业微信群推送失败: %v\n", err)
	}
}

// notifyGroupAssignedExchange 推送兑换工单派单通知到企业微信群
func (s *ExchangeService) notifyGroupAssignedExchange(record *model.ExchangeRecord, rider *model.Rider) {
	msg := fmt.Sprintf(`## 📋 兑换工单已派单

**订单类型：** 兑换工单
**工单号：** #%d
**商品：** %s
**收货地址：** %s
**配送员：** %s
**联系电话：** %s

@%s 请及时上门配送`,
		record.ID,
		record.ItemName,
		record.DeliveryAddr,
		rider.Name,
		rider.Phone,
		rider.Name,
	)

	if err := wecom.SendMarkdown(msg); err != nil {
		fmt.Printf("⚠️ 企业微信群推送失败: %v\n", err)
	}
}

// notifyGroupCompletedExchange 推送兑换工单送达完成通知到企业微信群
func (s *ExchangeService) notifyGroupCompletedExchange(record *model.ExchangeRecord) {
	completedAt := time.Now().Format("2006-01-02 15:04")
	if record.CompletedAt != nil {
		completedAt = record.CompletedAt.Format("2006-01-02 15:04")
	}
	msg := fmt.Sprintf(`## ✅ 兑换工单已完成

**订单类型：** 兑换工单
**工单号：** #%d
**商品：** %s
**完成时间：** %s`,
		record.ID,
		record.ItemName,
		completedAt,
	)

	if err := wecom.SendMarkdown(msg); err != nil {
		fmt.Printf("⚠️ 企业微信群推送失败: %v\n", err)
	}
}

// notifyGroupCancelledExchange 推送兑换工单取消通知到企业微信群
func (s *ExchangeService) notifyGroupCancelledExchange(record *model.ExchangeRecord) {
	msg := fmt.Sprintf(`## ❌ 兑换工单已取消

**订单类型：** 兑换工单
**工单号：** #%d
**商品：** %s`,
		record.ID,
		record.ItemName,
	)

	if err := wecom.SendMarkdown(msg); err != nil {
		fmt.Printf("⚠️ 企业微信群推送失败: %v\n", err)
	}
}

// ExchangeHistory 用户兑换记录
func (s *ExchangeService) ExchangeHistory(ctx context.Context, userID uint, page, size int) ([]model.ExchangeRecord, int64, error) {
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 20
	}
	return s.repo.Exchange.UserExchangeHistory(ctx, userID, page, size)
}

// AdminList 管理端兑换工单列表
func (s *ExchangeService) AdminList(ctx context.Context, status int) ([]model.ExchangeRecord, error) {
	return s.repo.Exchange.AdminListRecords(ctx, status)
}

// AssignRider 分配配送专员
func (s *ExchangeService) AssignRider(ctx context.Context, recordID uint, riderID uint) error {
	// 获取专员信息
	rider, err := s.repo.Rider.GetByID(ctx, riderID)
	if err != nil {
		return errors.New("回收专员查询失败")
	}
	if rider == nil {
		return errors.New("回收专员不存在")
	}
	if rider.Status != 1 {
		return errors.New("该专员已离职")
	}

	// 获取兑换记录
	record, err := s.repo.Exchange.GetRecordByID(ctx, recordID)
	if err != nil {
		return errors.New("兑换记录不存在")
	}
	if record.Status != 1 {
		return errors.New("该工单当前状态不允许分配")
	}

	if err := s.repo.Exchange.AssignRider(ctx, recordID, riderID, rider.Name, rider.Phone); err != nil {
		return errors.New("分配失败")
	}

	// 推送派单通知到企业微信群
	go s.notifyGroupAssignedExchange(record, rider)

	return nil
}

// CompleteDelivery 标记配送完成
func (s *ExchangeService) CompleteDelivery(ctx context.Context, recordID uint, riderID uint) error {
	// 获取兑换记录用于通知
	record, _ := s.repo.Exchange.GetRecordByID(ctx, recordID)

	if err := s.repo.Exchange.CompleteDelivery(ctx, recordID, riderID); err != nil {
		return err
	}

	// 推送送达完成通知到企业微信群
	if record != nil {
		go s.notifyGroupCompletedExchange(record)
	}

	return nil
}

// CancelRecord 取消兑换工单
func (s *ExchangeService) CancelRecord(ctx context.Context, recordID uint) error {
	// 获取兑换记录用于通知
	record, err := s.repo.Exchange.GetRecordByID(ctx, recordID)
	if err != nil {
		return errors.New("兑换记录不存在")
	}

	if err := s.repo.Exchange.CancelRecord(ctx, recordID); err != nil {
		return errors.New("取消失败")
	}

	// 推送取消通知到企业微信群
	go s.notifyGroupCancelledExchange(record)

	return nil
}

// RiderDeliveries 获取专员的配送任务
func (s *ExchangeService) RiderDeliveries(ctx context.Context, riderID uint) ([]model.ExchangeRecord, error) {
	return s.repo.Exchange.FindDeliveriesByRiderID(ctx, riderID)
}
