package model

import "time"

// ExchangeItem 兑换商品
type ExchangeItem struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Name          string    `gorm:"size:128;not null" json:"name"`
	Desc          string    `gorm:"size:500" json:"desc"`
	Image         string    `gorm:"size:255;not null" json:"image"`
	Points        int       `gorm:"not null" json:"points"`
	Stock         int       `gorm:"not null default 0" json:"stock"`
	LimitPerUser  int       `gorm:"not null default 0" json:"limitPerUser"`
	Sort          int       `gorm:"not null default 0" json:"sort"`
	Enabled       bool      `gorm:"not null default true" json:"enabled"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

func (ExchangeItem) TableName() string {
	return "exchange_items"
}

// ExchangeRecord 用户兑换记录
type ExchangeRecord struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	UserID     uint      `gorm:"index;not null" json:"userId"`
	ItemID     uint      `gorm:"not null" json:"itemId"`
	ItemName   string    `gorm:"size:128;not null" json:"itemName"`
	ItemImage  string    `gorm:"size:255;not null" json:"itemImage"`
	Points     int       `gorm:"not null" json:"points"`
	Status     int       `gorm:"not null default 1" json:"status"` // 1待发货 2已发货 3已完成 4已取消
	AddressID  *uint64   `json:"addressId"`
	ExpressNo  string    `gorm:"size:64" json:"expressNo"`
	Remark     string    `gorm:"size:255" json:"remark"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

func (ExchangeRecord) TableName() string {
	return "exchange_records"
}

// ExchangeRecordResp 兑换记录响应（含商品快照）
type ExchangeRecordResp struct {
	ExchangeRecord
	Address string `json:"address,omitempty"` // 收货地址（冗余展示用）
}
