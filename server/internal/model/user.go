// Package model 数据模型
package model

import (
	"time"

	"gorm.io/gorm"
)

// User 用户
type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	OpenID    string         `gorm:"size:64;uniqueIndex;not null" json:"openId"`
	UnionID   string         `gorm:"size:64;index" json:"unionId"`
	Nickname  string         `gorm:"size:64" json:"nickname"`
	Avatar    string         `gorm:"size:255" json:"avatar"`
	Phone     string         `gorm:"size:20;index" json:"phone"`
	Gender    int            `gorm:"default:0" json:"gender"`
	Level     int            `gorm:"default:1" json:"level"`
	Points    int            `gorm:"default:0" json:"points"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (User) TableName() string {
	return "users"
}