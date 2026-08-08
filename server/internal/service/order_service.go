package service

import (
	"context"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/greencycle/server/internal/model"
	"github.com/greencycle/server/internal/repository"
	"github.com/greencycle/server/pkg/wechat"
)

type OrderService struct {
	repo   *repository.Repository
	wechat *wechat.Client
}

func NewOrderService(repo *repository.Repository, wc *wechat.Client) *OrderService {
	return &OrderService{repo: repo, wechat: wc}
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

// AdminListByUser 管理端订单列表（不按用户过滤）
func (s *OrderService) AdminListByUser(ctx context.Context, page, size int, status int) ([]model.Order, int64, error) {
	if page < 1 {
		page = 1
	}
	if size < 1 || size > 100 {
		size = 20
	}
	return s.repo.Order.AdminList(ctx, page, size, status)
}

// AssignRider 派单：从骑手表读取骑手信息，关联到订单
func (s *OrderService) AssignRider(ctx context.Context, orderID uint64, riderID uint) error {
	// 1. 查骑手是否存在且在职
	rider, err := s.repo.Rider.GetByID(ctx, riderID)
	if err != nil {
		return errors.New("骑手查询失败")
	}
	if rider == nil {
		return errors.New("骑手不存在")
	}
	if rider.Status != 1 {
		return errors.New("该骑手已离职")
	}

	// 2. 查订单是否存在
	order, err := s.repo.Order.FindByID(ctx, orderID)
	if err != nil {
		return errors.New("订单不存在")
	}
	if order.Status != model.OrderStatusPending {
		return errors.New("订单当前状态不允许派单")
	}

	// 3. 更新订单：状态改为已派单 + 写入骑手信息
	updates := map[string]interface{}{
		"status":      model.OrderStatusAssigned,
		"rider_id":    rider.ID,
		"rider_name":  rider.Name,
		"rider_phone": rider.Phone,
	}
	if err := s.repo.Order.AdminUpdateStatus(ctx, orderID, updates); err != nil {
		return errors.New("派单失败")
	}

	// 4. 创建时间线
	_ = s.repo.Order.CreateTimelineWithDetails(ctx, orderID, model.OrderStatusAssigned,
		"已派单，回收员 "+rider.Name+" 即将上门", "管理员")

	// 5. 骑手服务次数 +1
	_ = s.repo.Rider.IncrementServiceCount(ctx, riderID)

	// 6. 发送订阅消息通知用户
	s.notifyOrderAssigned(order, rider)

	return nil
}

// notifyOrderAssigned 通知用户订单已派单
func (s *OrderService) notifyOrderAssigned(order *model.Order, rider *model.Rider) {
	// 查用户 openid
	user, err := s.repo.User.FindByID(context.Background(), order.UserID)
	if err != nil || user.OpenID == "" {
		return
	}

	// 模板 ID（替换为你自己的）
	const tplID = "REPLACE_WITH_YOUR_TEMPLATE_ID"

	msg := wechat.SubscribeMessage{
		Touser:     user.OpenID,
		TemplateID: tplID,
		Page:       fmt.Sprintf("pages/order-detail/order-detail?id=%d", order.ID),
		Data: map[string]interface{}{
			"thing1": map[string]string{"value": order.ItemName},           // 物品名称
			"phrase1": map[string]string{"value": "已派单，即将上门"},          // 当前状态
			"thing2":  map[string]string{"value": rider.Name},              // 回收员
			"phone_number1": map[string]string{"value": rider.Phone},       // 联系电话
		},
	}

	if err := s.wechat.SendSubscribeMessage(msg); err != nil {
		fmt.Printf("⚠️ 发送派单通知失败: %v\n", err)
	}
}

// AdminUpdateStatus 管理端更新订单状态
func (s *OrderService) AdminUpdateStatus(ctx context.Context, orderID uint64, status int, riderID *uint, riderName, riderPhone string) error {
	updates := map[string]interface{}{
		"status": status,
	}
	if riderID != nil {
		updates["rider_id"] = *riderID
	}
	if riderName != "" {
		updates["rider_name"] = riderName
	}
	if riderPhone != "" {
		updates["rider_phone"] = riderPhone
	}

	err := s.repo.Order.AdminUpdateStatus(ctx, orderID, updates)
	if err != nil {
		return err
	}

	// 创建时间线
	timeline := &model.OrderTimeline{
		OrderID:  orderID,
		Status:   status,
		Operator: "管理员",
	}
	switch status {
	case model.OrderStatusAssigned:
		timeline.Content = "已派单，回收员即将上门"
	case model.OrderStatusPicked:
		timeline.Content = "回收员已取件"
	case model.OrderStatusCompleted:
		timeline.Content = "订单已完成"
	case model.OrderStatusCancelled:
		timeline.Content = "订单已取消"
	}
	_ = s.repo.Order.CreateTimelineWithDetails(ctx, orderID, timeline.Status, timeline.Content, timeline.Operator)

	return nil
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
	return s.repo.Order.Transaction(ctx, func(tx *gorm.DB) error {
		if err := tx.Model(&model.Order{}).Where("id = ?", orderID).
			Updates(map[string]interface{}{
				"status":        model.OrderStatusCancelled,
				"cancel_reason": reason,
			}).Error; err != nil {
			return err
		}
		timeline := &model.OrderTimeline{
			OrderID:  order.ID,
			Status:   model.OrderStatusCancelled,
			Content:  "用户取消订单：" + reason,
			Operator: "用户",
		}
		return tx.Create(timeline).Error
	})
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
	var completedPoints int
	var completedUser *model.User
	err = s.repo.Order.Transaction(ctx, func(tx *gorm.DB) error {
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
		var updatedUser model.User
		if err := tx.Select("points").First(&updatedUser, order.UserID).Error; err != nil {
			return err
		}
		log := &model.CarbonPointLog{
			UserID:  order.UserID,
			OrderID: &order.ID,
			Type:    1, // 回收奖励
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
			Operator: "系统",
		}
		if err := tx.Create(timeline).Error; err != nil {
			return err
		}

		// 保存用于事务后通知
		completedPoints = points
		completedUser = &updatedUser
		return nil
	})

	// 事务成功后发送通知（不阻塞事务）
	if err == nil && completedUser != nil {
		s.notifyOrderCompleted(order, completedPoints, completedUser.OpenID)
	}
	return err
}

// notifyOrderCompleted 通知用户订单已完成
func (s *OrderService) notifyOrderCompleted(order *model.Order, points int, openID string) {
	if openID == "" {
		return
	}

	const tplID = "REPLACE_WITH_YOUR_TEMPLATE_ID"

	msg := wechat.SubscribeMessage{
		Touser:     openID,
		TemplateID: tplID,
		Page:       fmt.Sprintf("pages/order-detail/order-detail?id=%d", order.ID),
		Data: map[string]interface{}{
			"thing1":         map[string]string{"value": order.ItemName},        // 物品名称
			"phrase1":        map[string]string{"value": "已完成"},               // 当前状态
			"character_string1": map[string]string{"value": fmt.Sprintf("%d", points)}, // 获得积分
			"time1":          map[string]string{"value": time.Now().Format("2006-01-02 15:04")}, // 完成时间
		},
	}

	if err := s.wechat.SendSubscribeMessage(msg); err != nil {
		fmt.Printf("⚠️ 发送完成通知失败: %v\n", err)
	}
}

// generateOrderNo 生成订单号
func generateOrderNo() string {
	return fmt.Sprintf("GC%s%06d",
		time.Now().Format("20060102150405"),
		rand.Intn(1000000))
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