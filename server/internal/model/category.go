package model

import "time"

// Category 品类
type Category struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Code      string    `gorm:"size:32;uniqueIndex;not null" json:"code"`
	Name      string    `gorm:"size:64;not null" json:"name"`
	Icon      string    `gorm:"size:32" json:"icon"`
	BGColor   string    `gorm:"size:64" json:"bgColor"`
	Tagline   string    `gorm:"size:128" json:"tagline"`
	Sort      int       `gorm:"default:0" json:"sort"`
	Enabled   bool      `gorm:"default:true" json:"enabled"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (Category) TableName() string {
	return "categories"
}

// CategoryField 品类动态字段配置
type CategoryField struct {
	ID          uint   `gorm:"primaryKey" json:"id"`
	CategoryID  uint   `gorm:"index;not null" json:"categoryId"`
	FieldKey    string `gorm:"size:32;not null" json:"fieldKey"`
	FieldLabel  string `gorm:"size:64;not null" json:"fieldLabel"`
	FieldType   string `gorm:"size:16;not null" json:"fieldType"` // text/select/multi/number/switch
	Required    bool   `gorm:"default:false" json:"required"`
	Options     string `gorm:"type:json" json:"optionsJSON"`
	Placeholder string `gorm:"size:128" json:"placeholder"`
	Sort        int    `gorm:"default:0" json:"sort"`
}

func (CategoryField) TableName() string {
	return "category_fields"
}