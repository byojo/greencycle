package model

import "time"

// Address 用户地址
type Address struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"index;not null" json:"userId"`
	Name      string    `gorm:"size:64;not null" json:"name"`
	Phone     string    `gorm:"size:20;not null" json:"phone"`
	Province  string    `gorm:"size:64;not null" json:"province"`
	City      string    `gorm:"size:64;not null" json:"city"`
	District  string    `gorm:"size:64;not null" json:"district"`
	Detail    string    `gorm:"size:255;not null" json:"detail"`
	Tag       string    `gorm:"size:16;default:''" json:"tag"`        // 家/公司/学校/其他
	Lat       float64   `json:"lat"`
	Lng       float64   `json:"lng"`
	IsDefault bool      `gorm:"default:false" json:"isDefault"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (Address) TableName() string {
	return "addresses"
}
