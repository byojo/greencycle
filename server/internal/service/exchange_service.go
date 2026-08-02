package service

import (
	"context"
	"errors"

	"gorm.io/gorm"

	"github.com/greencycle/server/internal/model"
	"github.com/greencycle/server/internal/repository"
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
	ItemID     uint   `json:"itemId" binding:"required"`
	AddressID  uint64 `json:"addressId" binding:"required"`
}

// Exchange 兑换商品
func (s *ExchangeService) Exchange(ctx context.Context, userID uint, req *ExchangeReq) error {
	// 获取商品
	item, err := s.repo.Exchange.GetByID(ctx, req.ItemID)
	if err != nil {
		return errors.New("商品不存在或已下架")
	}
	if item.Stock <= 0 {
		return errors.New("商品库存不足")
	}

	// 检查限兑次数
	if item.LimitPerUser > 0 {
		count, _ := s.repo.Exchange.UserExchangeCount(ctx, userID, req.ItemID)
		if int(count) >= item.LimitPerUser {
			return errors.New("该商品每人限兑一次，您已达上限")
		}
	}

	// 检查积分余额
	user, err := s.repo.User.FindByID(ctx, userID)
	if err != nil {
		return errors.New("用户信息获取失败")
	}
	if user.Points < item.Points {
		return errors.New("积分不足，无法兑换")
	}

	// 事务：扣积分 + 扣库存 + 创建记录
	return s.repo.WithTx(ctx, func(tx *gorm.DB) error {
		// 扣减用户积分
		if err := tx.Model(&model.User{}).Where("id = ? AND points >= ?", userID, item.Points).
			UpdateColumn("points", gorm.Expr("points - ?", item.Points)).Error; err != nil {
			return errors.New("积分扣减失败")
		}

		// 扣减库存
		if err := s.repo.Exchange.DeductStock(ctx, tx, req.ItemID); err != nil {
			return errors.New("库存扣减失败")
		}

		// 创建积分流水（type=3 兑换）
		balance := user.Points - item.Points
		pointLog := &model.CarbonPointLog{
			UserID:   userID,
			Type:     3, // 兑换
			Amount:   -item.Points,
			Balance:  balance,
			Remark:   "兑换：" + item.Name,
		}
		if err := s.repo.Point.CreateLog(ctx, tx, pointLog); err != nil {
			return errors.New("积分记录创建失败")
		}

		// 创建兑换记录
		addrID := req.AddressID
		record := &model.ExchangeRecord{
			UserID:    userID,
			ItemID:    item.ID,
			ItemName:  item.Name,
			ItemImage: item.Image,
			Points:    item.Points,
			Status:    1, // 待发货
		}
		record.AddressID = &addrID
		return s.repo.Exchange.CreateRecord(ctx, tx, record)
	})
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
