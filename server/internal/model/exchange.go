package model

import "time"

// ExchangeItem 兑换商品
type ExchangeItem struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"size:128;not null" json:"name"`
	Desc         string    `gorm:"size:500" json:"desc"`
	Image        string    `gorm:"size:255;not null" json:"image"`
	Points       int       `gorm:"not null" json:"points"`
	Stock        int       `gorm:"not null;default:0" json:"stock"`
	LimitPerUser int       `gorm:"not null;default:0" json:"limitPerUser"`
	Sort         int       `gorm:"not null;default:0" json:"sort"`
	Enabled      bool      `gorm:"not null;default:true" json:"enabled"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

func (ExchangeItem) TableName() string {
	return "exchange_items"
}

// ExchangeRecord 用户兑换记录（兑换工单）
type ExchangeRecord struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	OrderNo   string  `gorm:"size:32" json:"orderNo"` // 兑换工单号（EX + 时间戳 + 随机）
	UserID    uint    `gorm:"index:idx_user_item,priority:1;not null" json:"userId"`
	ItemID    uint    `gorm:"index:idx_user_item;not null" json:"itemId"`
	ItemName  string  `gorm:"size:128;not null" json:"itemName"`
	ItemImage string  `gorm:"size:255;not null" json:"itemImage"`
	Quantity  int     `gorm:"not null;default:1" json:"quantity"` // 兑换数量（默认 1）
	Points    int     `gorm:"not null" json:"points"`             // 消耗积分（= 单价 × 数量，已完成扣减后写入作为冗余快照）
	Status    int     `gorm:"not null;default:1" json:"status"`   // 1待发货 2配送中 3已完成 4已取消
	AddressID *uint64 `json:"addressId"`
	// 收货地址快照
	DeliveryName  string  `gorm:"size:64" json:"deliveryName"`
	DeliveryPhone string  `gorm:"size:20" json:"deliveryPhone"`
	DeliveryAddr  string  `gorm:"size:500" json:"deliveryAddr"`
	DeliveryLat   float64 `json:"deliveryLat"`
	DeliveryLng   float64 `json:"deliveryLng"`
	// 配送专员
	RiderID    *uint  `gorm:"index" json:"riderId"`
	RiderName  string `gorm:"size:64" json:"riderName"`
	RiderPhone string `gorm:"size:20" json:"riderPhone"`
	// 期望配送时间（用户在下单时选择，如 "2026-08-16 上午 09:00-12:00"）
	ExpectedTime string `gorm:"size:64" json:"expectedTime"`
	// 时间节点
	ShippedAt   *time.Time `json:"shippedAt"`
	CompletedAt *time.Time `json:"completedAt"`
	// 其他
	ExpressNo string    `gorm:"size:64" json:"expressNo"`
	Remark    string    `gorm:"size:255" json:"remark"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (ExchangeRecord) TableName() string {
	return "exchange_records"
}

// ExchangeRecordResp 兑换记录响应（含商品快照）
type ExchangeRecordResp struct {
	ExchangeRecord
	Address string `json:"address,omitempty"` // 收货地址（冗余展示用）
}
