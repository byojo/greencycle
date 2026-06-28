-- partner_applications: 合作加盟申请表
CREATE TABLE IF NOT EXISTS `partner_applications` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name`       VARCHAR(64)     NOT NULL                COMMENT '姓名',
  `phone`      VARCHAR(20)     NOT NULL                COMMENT '手机号',
  `district`   VARCHAR(128)    DEFAULT NULL            COMMENT '所在区域',
  `remark`     TEXT             DEFAULT NULL            COMMENT '备注',
  `status`     TINYINT         NOT NULL DEFAULT 0      COMMENT '状态 0待处理 1已联系 2已拒绝',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='合作加盟申请表';
