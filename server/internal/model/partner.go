package model

import "time"

// PartnerApplication 合作加盟申请
type PartnerApplication struct {
	ID        uint64    `json:"id" gorm:"primaryKey;autoIncrement"`
	Name      string    `json:"name" gorm:"type:varchar(64);not null;comment:姓名"`
	Phone     string    `json:"phone" gorm:"type:varchar(20);not null;comment:手机号"`
	District  string    `json:"district" gorm:"type:varchar(128);comment:所在区域"`
	Remark    string    `json:"remark" gorm:"type:text;comment:备注"`
	Status    int       `json:"status" gorm:"type:tinyint;not null;default:0;comment:状态 0待处理 1已联系 2已拒绝"`
	CreatedAt time.Time `json:"createdAt" gorm:"autoCreateTime"`
}

func (PartnerApplication) TableName() string {
	return "partner_applications"
}
