package service

import (
	"context"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"

	"github.com/greencycle/server/internal/model"
	"github.com/greencycle/server/internal/repository"
)

type OrderService struct {
	repo *repository.Repository
}

func NewOrderService(repo *repository.Repository) *OrderService {
	return &OrderService{repo: repo}
}

type CreateOrderParams struct {
	UserID       uint
	CategoryCode string
	ItemName     string
	ItemDesc     string
	FormData     string
	PhotoKeys    []string
	EstimatedAt  time.Time
	PickupAddr   string
	PickupLat    float64
	PickupLng    float64
	Remark       string
}

// Create 创建订单（事务）
func (s *OrderService) Create(ctx context.Context, p CreateOrderParams) (*model.Order, error) {
	order := &model.Order{
		OrderNo:      generateOrderNo(),
		UserID:       p.UserID,
		CategoryCode: p.CategoryCode,
		ItemName:     p.ItemName,
		ItemDesc:     p.ItemDesc,
		FormData:     p.FormData,
		Status:       model.OrderStatusPending,
		EstimatedAt:  &p.EstimatedAt,
		PickupAddr:   p.PickupAddr,
		PickupLat:    p.PickupLat,
		PickupLng:    p.PickupLng,
	}

	images := make([]model.OrderImage, len(p.PhotoKeys))
	for i, key := range p.PhotoKeys {
		images[i] = model.OrderImage{
			URL:  key,
			Sort: i,
		}
	}

	err := s.repo.Order.Transaction(ctx, func(tx *gorm.DB) error {
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		for i := range images {
			images[i].OrderID = order.ID
		}
		if len(images) > 0 {
			if err := tx.Create(&images).Error; err != nil {
				return err
			}
		}
		timeline := &model.OrderTimeline{
			OrderID: order.ID,
			Status:  model.OrderStatusPending,
			Content: "订单已提交，等待回收员上门",
			Operator: "系统",
		}
		return tx.Create(timeline).Error
	})

	if err != nil {
		return nil, fmt.Errorf("创建订单失败: %w", err)
	}

	order.Images = images
	return order, nil
}

// GetDetail 获取详情
func (s *OrderService) GetDetail(ctx context.Context, orderID uint64, userID uint) (*model.Order, error) {
	order, err := s.repo.Order.FindByID(ctx, orderID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("订单不存在")
		}
		return nil, err
	}
	if order.UserID != userID {
		return nil, errors.New("无权访问该订单")
	}
	return order, nil
}

// ListByUser 用户订单列表
func (s *OrderService) ListByUser(ctx context.Context, userID uint, page, size int, status int) ([]model.Order, int64, error) {
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 20
	}
	return s.repo.Order.ListByUser(ctx, userID, page, size, status)
}

// Cancel 取消订单
func (s *OrderService) Cancel(ctx context.Context, orderID uint64, userID uint, reason string) error {
	order, err := s.GetDetail(ctx, orderID, userID)
	if err != nil {
		return err
	}
	if order.Status >= model.OrderStatusCompleted {
		return errors.New("订单已完成，无法取消")
	}
	return s.repo.Order.UpdateStatus(ctx, orderID, model.OrderStatusCancelled)
}

// Complete 完成订单（事务：更新订单 + 奖励积分 + 减碳记录）
func (s *OrderService) Complete(ctx context.Context, orderID uint64, finalAmount int) error {
	order, err := s.repo.Order.FindByID(ctx, orderID)
	if err != nil {
		return fmt.Errorf("订单不存在: %w", err)
	}

	points := calculateCarbonPoints(order.CategoryCode, finalAmount)
	carbonKg := calculateCarbonKg(order.CategoryCode, finalAmount)
	treeCount := carbonKg / 18.0

	now := time.Now()
	return s.repo.Order.Transaction(ctx, func(tx *gorm.DB) error {
		// 1. 更新订单
		if err := tx.Model(order).
			Updates(map[string]interface{}{
				"status":        model.OrderStatusCompleted,
				"final_amount":  finalAmount,
				"carbon_points": points,
				"completed_at":  &now,
			}).Error; err != nil {
			return err
		}

		// 2. 增加用户积分
		if err := s.repo.User.IncrementPoints(ctx, tx, order.UserID, points); err != nil {
			return err
		}

		// 3. 记录积分流水
		log := &model.CarbonPointLog{
			UserID:  order.UserID,
			OrderID: &order.ID,
			Type:    1, // 回收奖励
			Amount:  points,
			Balance: 0, // TODO: 查询最新余额
			Remark:  fmt.Sprintf("回收 %s 奖励", order.ItemName),
		}
		if err := s.repo.Point.CreateLog(ctx, tx, log); err != nil {
			return err
		}

		// 4. 记录减碳
		red := &model.CarbonReduction{
			UserID:       order.UserID,
			OrderID:      order.ID,
			CategoryCode: order.CategoryCode,
			CarbonKg:     carbonKg,
			TreeCount:    treeCount,
		}
		return s.repo.Point.CreateReduction(ctx, tx, red)
	})
}

// generateOrderNo 生成订单号
func generateOrderNo() string {
	return fmt.Sprintf("GC%s%04d",
		time.Now().Format("20060102150405"),
		time.Now().Nanosecond()/100000)
}

// 计算碳积分（简化版）
func calculateCarbonPoints(categoryCode string, finalAmount int) int {
	// 简化规则：金额的 5% + 基础分
	base := map[string]int{
		"phone":   100,
		"clothes": 30,
		"digital": 150,
		"home":    50,
		"luxury":  200,
		"book":    20,
		"metal":   10,
	}
	return base[categoryCode] + finalAmount/100*5
}

// 计算减碳（kg）
func calculateCarbonKg(categoryCode string, finalAmount int) float64 {
	// 简化规则
	ratio := map[string]float64{
		"phone":   0.0008,
		"clothes": 0.005,
		"digital": 0.0012,
		"home":    0.002,
		"luxury":  0.0006,
		"book":    0.001,
		"metal":   0.001,
	}
	r, ok := ratio[categoryCode]
	if !ok {
		r = 0.001
	}
	return float64(finalAmount) / 100.0 * r
}