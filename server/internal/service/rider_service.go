package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"sort"
	"time"

	"gorm.io/gorm"

	"github.com/greencycle/server/internal/model"
	"github.com/greencycle/server/internal/repository"
	"github.com/greencycle/server/pkg/wecom"
)

type RiderService struct {
	repo *repository.Repository
}

func NewRiderService(repo *repository.Repository) *RiderService {
	return &RiderService{repo: repo}
}

// List 在职回收专员列表
func (s *RiderService) List(ctx context.Context) ([]model.Rider, error) {
	return s.repo.Rider.List(ctx)
}

// UpdateLocation 更新专员实时位置
func (s *RiderService) UpdateLocation(ctx context.Context, riderID uint, lat, lng float64) error {
	now := time.Now()
	return s.repo.Rider.UpdateLocation(ctx, riderID, lat, lng, &now)
}

// NearestRiders 查找距离订单最近的专员
func (s *RiderService) NearestRiders(ctx context.Context, orderLat, orderLng float64, limit int) ([]map[string]interface{}, error) {
	riders, err := s.repo.Rider.List(ctx)
	if err != nil {
		return nil, err
	}

	var result []map[string]interface{}
	for _, r := range riders {
		distance := 0.0
		online := false
		if r.Lat != 0 && r.Lng != 0 {
			distance = haversine(orderLat, orderLng, r.Lat, r.Lng)
		}
		if r.LastLocationAt != nil && time.Since(*r.LastLocationAt) < 30*time.Minute {
			online = true
		}
		result = append(result, map[string]interface{}{
			"id":              r.ID,
			"name":            r.Name,
			"phone":           r.Phone,
			"rating":          r.Rating,
			"serviceCnt":      r.ServiceCnt,
			"distance":        distance,
			"distanceText":    formatDistance(distance),
			"online":          online,
			"lastLocationAt":  r.LastLocationAt,
		})
	}

	// 按距离排序（有坐标的优先，距离近的优先）
	sort.Slice(result, func(i, j int) bool {
		di, _ := result[i]["distance"].(float64)
		dj, _ := result[j]["distance"].(float64)
		if (di == 0) != (dj == 0) {
			return di > 0 // 有坐标的排前面
		}
		return di < dj
	})

	if limit > 0 && len(result) > limit {
		result = result[:limit]
	}
	return result, nil
}

func haversine(lat1, lng1, lat2, lng2 float64) float64 {
	const R = 6371.0
	dLat := (lat2 - lat1) * math.Pi / 180
	dLng := (lng2 - lng1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLng/2)*math.Sin(dLng/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return R * c
}

func formatDistance(km float64) string {
	if km == 0 {
		return "未知"
	}
	if km < 1 {
		return fmt.Sprintf("%.0f米", km*1000)
	}
	return fmt.Sprintf("%.1f公里", km)
}

// Create 创建回收专员
func (s *RiderService) Create(ctx context.Context, name, phone, idCard, plateNo string) error {
	rider := &model.Rider{
		Name:    name,
		Phone:   phone,
		IDCard:  idCard,
		PlateNo: plateNo,
		Status:  1,
		Rating:  5.0,
	}
	return s.repo.Rider.Create(ctx, rider)
}

// Update 更新回收专员
func (s *RiderService) Update(ctx context.Context, id uint, updates map[string]interface{}) error {
	if len(updates) == 0 {
		return errors.New("无更新内容")
	}
	return s.repo.Rider.Update(ctx, id, updates)
}

// GetOrdersByRiderID 获取分配给专员的订单
func (s *RiderService) GetOrdersByRiderID(ctx context.Context, riderID uint) ([]model.Order, error) {
	return s.repo.Order.FindByRiderID(ctx, riderID)
}

// PickOrder 专员标记已取件
func (s *RiderService) PickOrder(ctx context.Context, orderID uint64, riderID uint) error {
	order, err := s.repo.Order.FindByID(ctx, orderID)
	if err != nil {
		return errors.New("订单不存在")
	}
	if order.RiderID == nil || *order.RiderID != riderID {
		return errors.New("该订单未分配给您")
	}
	if order.Status != model.OrderStatusAssigned {
		return errors.New("订单当前状态不允许取件")
	}

	updates := map[string]interface{}{"status": model.OrderStatusPicked}
	if err := s.repo.Order.AdminUpdateStatus(ctx, orderID, updates); err != nil {
		return errors.New("更新状态失败")
	}

	// 创建时间线
	s.repo.Order.CreateTimelineWithDetails(ctx, orderID, model.OrderStatusPicked,
		"回收专员已取件", "回收专员")

	return nil
}

// CompleteOrder 专员完成订单（输入金额）
func (s *RiderService) CompleteOrder(ctx context.Context, orderID uint64, riderID uint, finalAmount int) error {
	order, err := s.repo.Order.FindByID(ctx, orderID)
	if err != nil {
		return errors.New("订单不存在")
	}
	if order.RiderID == nil || *order.RiderID != riderID {
		return errors.New("该订单未分配给您")
	}
	if order.Status != model.OrderStatusPicked {
		return errors.New("订单当前状态不允许完成")
	}

	// 调用 OrderService.Complete 完成订单（积分+减碳+通知）
	// 但这里需要 riderID 权限校验，所以直接复用 order service 的逻辑
	return s.completeOrderInternal(ctx, order, finalAmount)
}

func (s *RiderService) completeOrderInternal(ctx context.Context, order *model.Order, finalAmount int) error {
	points := calculateCarbonPoints(order.CategoryCode, finalAmount)
	carbonKg := calculateCarbonKg(order.CategoryCode, finalAmount)
	treeCount := carbonKg / 18.0

	now := time.Now()
	err := s.repo.Order.Transaction(ctx, func(tx *gorm.DB) error {
		// 1. 更新订单
		if err := tx.Model(order).Updates(map[string]interface{}{
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
		var updatedUser model.User
		if err := tx.First(&updatedUser, order.UserID).Error; err != nil {
			return err
		}
		log := &model.CarbonPointLog{
			UserID:  order.UserID,
			OrderID: &order.ID,
			Type:    1,
			Amount:  points,
			Balance: updatedUser.Points,
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
		if err := s.repo.Point.CreateReduction(ctx, tx, red); err != nil {
			return err
		}

		// 5. 记录完成时间线
		timeline := &model.OrderTimeline{
			OrderID:  order.ID,
			Status:   model.OrderStatusCompleted,
			Content:  fmt.Sprintf("订单完成，奖励 %d 积分", points),
			Operator: "回收专员",
		}
		return tx.Create(timeline).Error
	})

	if err != nil {
		return err
	}

	// 推送到企业微信群
	go func() {
		msg := fmt.Sprintf(`## ✅ 订单已完成

**订单号：** %s
**物品：** %s
**获得积分：** %d
**完成时间：** %s`,
			order.OrderNo,
			order.ItemName,
			points,
			time.Now().Format("2006-01-02 15:04"))
		wecom.SendMarkdown(msg)
	}()

	return nil
}
