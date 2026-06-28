package model

import "time"

// Story 改造故事
type Story struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Title     string    `gorm:"size:255;not null" json:"title"`
	Desc      string    `gorm:"size:500" json:"desc"`
	Cover     string    `gorm:"size:255" json:"cover"`
	Type      string    `gorm:"size:16;not null" json:"type"` // video / image
	VideoURL  string    `gorm:"size:255" json:"videoUrl"`
	ViewCount int       `gorm:"default:0" json:"viewCount"`
	LikeCount int       `gorm:"default:0" json:"likeCount"`
	Author    string    `gorm:"size:64" json:"author"`
	Enabled   bool      `gorm:"default:true" json:"enabled"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (Story) TableName() string {
	return "stories"
}

// Rider 骑手（回收员）
type Rider struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	Name       string    `gorm:"size:32;not null" json:"name"`
	Phone      string    `gorm:"size:20;not null" json:"phone"`
	IDCard     string    `gorm:"size:20" json:"idCard"`
	PlateNo    string    `gorm:"size:20" json:"plateNo"`
	Rating     float64   `gorm:"type:decimal(3,2);default:5.00" json:"rating"`
	ServiceCnt int       `gorm:"default:0" json:"serviceCnt"`
	Status     int       `gorm:"default:1" json:"status"` // 1在职 0离职
	Lat        float64   `json:"lat"`
	Lng        float64   `json:"lng"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
}

func (Rider) TableName() string {
	return "riders"
}