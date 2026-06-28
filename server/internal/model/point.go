package model

import "time"

// CarbonPointLog 碳积分流水
type CarbonPointLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"userId"`
	OrderID   *uint64   `gorm:"index" json:"orderId"`
	Type      int       `gorm:"not null" json:"type"` // 1:回收奖励 2:签到 3:兑换 4:退款
	Amount    int       `gorm:"not null" json:"amount"`
	Balance   int       `gorm:"not null" json:"balance"`
	Remark    string    `gorm:"size:255" json:"remark"`
	CreatedAt time.Time `json:"createdAt"`
}

func (CarbonPointLog) TableName() string {
	return "carbon_point_logs"
}

// CarbonReduction 碳减排记录
type CarbonReduction struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	UserID       uint      `gorm:"index;not null" json:"userId"`
	OrderID      uint64    `gorm:"uniqueIndex;not null" json:"orderId"`
	CategoryCode string    `gorm:"size:32;not null" json:"categoryCode"`
	CarbonKg     float64   `gorm:"not null" json:"carbonKg"`
	TreeCount    float64   `gorm:"not null" json:"treeCount"`
	CreatedAt    time.Time `json:"createdAt"`
}

func (CarbonReduction) TableName() string {
	return "carbon_reductions"
}