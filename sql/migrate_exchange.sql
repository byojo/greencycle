-- 兑换商品表
CREATE TABLE IF NOT EXISTS `exchange_items` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`         VARCHAR(128)    NOT NULL                       COMMENT '商品名称',
  `desc`         VARCHAR(500)    DEFAULT NULL                   COMMENT '商品描述',
  `image`        VARCHAR(255)    NOT NULL                       COMMENT '商品图片 URL',
  `points`       INT             NOT NULL                       COMMENT '所需积分',
  `stock`        INT             NOT NULL DEFAULT 0             COMMENT '库存数量',
  `limit_per_user` INT            NOT NULL DEFAULT 0             COMMENT '每人限兑次数，0=不限',
  `sort`         INT             NOT NULL DEFAULT 0             COMMENT '排序',
  `enabled`      TINYINT(1)      NOT NULL DEFAULT 1             COMMENT '是否启用',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_enabled_sort` (`enabled`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='兑换商品表';

-- 用户兑换记录表
CREATE TABLE IF NOT EXISTS `exchange_records` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`      BIGINT UNSIGNED NOT NULL,
  `item_id`      BIGINT UNSIGNED NOT NULL,
  `item_name`    VARCHAR(128)    NOT NULL                       COMMENT '下单时商品名称快照',
  `item_image`   VARCHAR(255)    NOT NULL                       COMMENT '下单时商品图片快照',
  `points`       INT             NOT NULL                       COMMENT '消耗积分',
  `status`       TINYINT         NOT NULL DEFAULT 1             COMMENT '1待发货 2已发货 3已完成 4已取消',
  `address_id`   BIGINT UNSIGNED DEFAULT NULL                   COMMENT '收货地址',
  `express_no`   VARCHAR(64)     DEFAULT NULL                    COMMENT '快递单号',
  `remark`       VARCHAR(255)    DEFAULT NULL                   COMMENT '备注',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id_created` (`user_id`, `created_at`),
  KEY `idx_item_id` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户兑换记录表';

-- 初始化兑换商品数据（已有数据时跳过）
INSERT IGNORE INTO `exchange_items` (`name`, `desc`, `image`, `points`, `stock`, `limit_per_user`, `sort`, `enabled`) VALUES
('环保帆布袋', '可循环使用的棉布购物袋，减少一次性塑料袋使用', 'https://cos.example.com/exchange/bag.png', 200, 100, 1, 1, 1),
('碳中和徽章', '绿循环官方认证碳中和徽章，佩戴即环保', 'https://cos.example.com/exchange/badge.png', 500, 200, 1, 2, 1),
('绿植种子套装', '包含 3 种适合家养的绿植种子，共建绿色家园', 'https://cos.example.com/exchange/seeds.png', 800, 50, 2, 3, 1),
('保温杯', '不锈钢真空保温杯，随手环保从一杯热水开始', 'https://cos.example.com/exchange/cup.png', 1500, 30, 1, 4, 1),
('电动牙刷', '声波震动牙刷，环保从每一次刷牙开始', 'https://cos.example.com/exchange/toothbrush.png', 3000, 20, 1, 5, 1);
