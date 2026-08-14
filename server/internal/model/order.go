package model

import (
	"time"

	"gorm.io/gorm"
)

// Order 订单状态
const (
	OrderStatusPending   = 1 // 待评估
	OrderStatusAssigned  = 2 // 已派单
	OrderStatusPicked    = 3 // 已取件
	OrderStatusCompleted = 4 // 已完成
	OrderStatusCancelled = 5 // 已取消
)

// Order 订单
type Order struct {
	ID           uint64         `gorm:"primaryKey" json:"id"`
	OrderNo      string         `gorm:"size:32;uniqueIndex;not null" json:"orderNo"`
	UserID       uint           `gorm:"index;not null" json:"userId"`
	CategoryCode string         `gorm:"size:32;index;not null" json:"categoryCode"`
	ItemName     string         `gorm:"size:128;not null" json:"itemName"`
	ItemDesc     string         `gorm:"size:255" json:"itemDesc"`
	FormData     string         `gorm:"type:json" json:"formData"`
	Status       int            `gorm:"index;default:1" json:"status"`
	EstimatedAt  *time.Time     `json:"estimatedAt"`
	RiderID      *uint          `gorm:"index" json:"riderId"`
	RiderName    string         `gorm:"size:32" json:"riderName"`
	RiderPhone   string         `gorm:"size:20" json:"riderPhone"`
	PickupAddr   string         `gorm:"size:255;not null" json:"pickupAddr"`
	PickupLat    float64        `json:"pickupLat"`
	PickupLng    float64        `json:"pickupLng"`
	FinalAmount  int            `gorm:"default:0" json:"finalAmount"` // 分
	CarbonPoints int            `gorm:"default:0" json:"carbonPoints"`
	CancelReason string         `gorm:"size:255" json:"cancelReason"`
	Remark       string         `gorm:"size:255" json:"remark"`
	PickupAt     *time.Time     `json:"pickupAt"` // 专员取件时间
	CompletedAt  *time.Time     `json:"completedAt"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"updatedAt"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// 专员实时位置（非表字段，详情接口填充，供用户端计算距离/ETA）
	RiderLat            float64    `gorm:"-" json:"riderLat"`
	RiderLng            float64    `gorm:"-" json:"riderLng"`
	RiderLastLocationAt *time.Time `gorm:"-" json:"riderLastLocationAt"`

	// 关联
	Images    []OrderImage    `gorm:"foreignKey:OrderID" json:"images,omitempty"`
	Timelines []OrderTimeline `gorm:"foreignKey:OrderID" json:"timelines,omitempty"`

	// 客户联系方式（仅专员详情接口填充，非表字段）
	CustomerName  string `gorm:"-" json:"customerName,omitempty"`
	CustomerPhone string `gorm:"-" json:"customerPhone,omitempty"`

	// 回收类型名称（列表/详情接口按 categoryCode 反查填充，非表字段）
	CategoryName string `gorm:"-" json:"categoryName,omitempty"`
}

func (Order) TableName() string {
	return "orders"
}

// OrderImage 订单图片
type OrderImage struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	OrderID   uint64    `gorm:"index;not null" json:"orderId"`
	URL       string    `gorm:"size:255;not null" json:"url"`
	Sort      int       `gorm:"default:0" json:"sort"`
	CreatedAt time.Time `json:"createdAt"`
}

func (OrderImage) TableName() string {
	return "order_images"
}

// OrderTimeline 订单时间线
type OrderTimeline struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	OrderID   uint64    `gorm:"index;not null" json:"orderId"`
	Status    int       `gorm:"not null" json:"status"`
	Content   string    `gorm:"size:255;not null" json:"content"`
	Operator  string    `gorm:"size:64" json:"operator"`
	CreatedAt time.Time `json:"createdAt"`
}

func (OrderTimeline) TableName() string {
	return "order_timelines"
}
