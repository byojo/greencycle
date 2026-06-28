-- =====================================================
-- 绿循环小程序 - 数据库 Schema
-- MySQL 8.0+
-- 字符集：utf8mb4
-- 排序规则：utf8mb4_unicode_ci
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- 用户表
-- -----------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT          COMMENT '主键',
  `open_id`      VARCHAR(64)     NOT NULL                         COMMENT '微信OpenID',
  `union_id`     VARCHAR(64)     DEFAULT NULL                     COMMENT '微信UnionID',
  `nickname`     VARCHAR(64)     DEFAULT NULL                     COMMENT '昵称',
  `avatar`       VARCHAR(255)    DEFAULT NULL                     COMMENT '头像URL',
  `phone`        VARCHAR(20)     DEFAULT NULL                     COMMENT '手机号',
  `gender`       TINYINT         NOT NULL DEFAULT 0               COMMENT '0未知 1男 2女',
  `level`        TINYINT         NOT NULL DEFAULT 1               COMMENT '1:绿V1 2:绿V2 ...',
  `points`       INT             NOT NULL DEFAULT 0               COMMENT '碳积分余额',
  `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`   DATETIME        DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_open_id` (`open_id`),
  KEY `idx_union_id` (`union_id`),
  KEY `idx_phone` (`phone`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- -----------------------------------------------------
-- 品类表
-- -----------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id`         INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `code`       VARCHAR(32)     NOT NULL                          COMMENT '唯一标识：phone/clothes/digital/...',
  `name`       VARCHAR(64)     NOT NULL                          COMMENT '展示名',
  `icon`       VARCHAR(32)     NOT NULL                          COMMENT 'Emoji 或图标 URL',
  `bg_color`   VARCHAR(64)     DEFAULT NULL                      COMMENT '背景色（Tailwind class）',
  `tagline`    VARCHAR(128)    DEFAULT NULL                      COMMENT '副标题',
  `sort`       INT             NOT NULL DEFAULT 0                COMMENT '排序，升序',
  `enabled`    TINYINT(1)      NOT NULL DEFAULT 1                COMMENT '是否启用',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_enabled_sort` (`enabled`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='回收品类表';

-- -----------------------------------------------------
-- 品类字段配置表（动态表单）
-- -----------------------------------------------------
DROP TABLE IF EXISTS `category_fields`;
CREATE TABLE `category_fields` (
  `id`           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id`  INT UNSIGNED    NOT NULL,
  `field_key`    VARCHAR(32)     NOT NULL                         COMMENT '字段名，如 model/condition',
  `field_label`  VARCHAR(64)     NOT NULL                         COMMENT '显示标签，如 品牌型号',
  `field_type`   VARCHAR(16)     NOT NULL                         COMMENT 'text/select/multi/number/switch',
  `required`     TINYINT(1)      NOT NULL DEFAULT 0               COMMENT '是否必填',
  `options`      JSON            DEFAULT NULL                      COMMENT '可选项 JSON 数组',
  `placeholder`  VARCHAR(128)    DEFAULT NULL                     COMMENT '输入提示',
  `sort`         INT             NOT NULL DEFAULT 0               COMMENT '字段顺序',
  PRIMARY KEY (`id`),
  KEY `idx_category_id_sort` (`category_id`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='品类动态字段配置';

-- -----------------------------------------------------
-- 订单表
-- -----------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no`        VARCHAR(32)     NOT NULL                       COMMENT '业务订单号',
  `user_id`         BIGINT UNSIGNED NOT NULL,
  `category_code`   VARCHAR(32)     NOT NULL                       COMMENT '品类 code',
  `item_name`       VARCHAR(128)    NOT NULL                       COMMENT '物品名',
  `item_desc`       VARCHAR(255)    DEFAULT NULL                   COMMENT '物品描述',
  `form_data`       JSON            DEFAULT NULL                   COMMENT '动态表单数据',
  `status`          TINYINT         NOT NULL DEFAULT 1             COMMENT '1待评估 2已派单 3已取件 4已完成 5已取消',
  `estimated_at`    DATETIME        DEFAULT NULL                   COMMENT '预约时间',
  `rider_id`        INT UNSIGNED    DEFAULT NULL,
  `rider_name`      VARCHAR(32)     DEFAULT NULL,
  `rider_phone`     VARCHAR(20)     DEFAULT NULL,
  `pickup_addr`     VARCHAR(255)    NOT NULL,
  `pickup_lat`      DECIMAL(10,6)   DEFAULT NULL,
  `pickup_lng`      DECIMAL(10,6)   DEFAULT NULL,
  `final_amount`    INT             NOT NULL DEFAULT 0             COMMENT '最终金额（分）',
  `carbon_points`   INT             NOT NULL DEFAULT 0             COMMENT '获得碳积分',
  `cancel_reason`   VARCHAR(255)    DEFAULT NULL,
  `completed_at`    DATETIME        DEFAULT NULL,
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at`      DATETIME        DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_status_created` (`user_id`, `status`, `created_at`),
  KEY `idx_category_code` (`category_code`),
  KEY `idx_rider_id` (`rider_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- -----------------------------------------------------
-- 订单图片表
-- -----------------------------------------------------
DROP TABLE IF EXISTS `order_images`;
CREATE TABLE `order_images` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`   BIGINT UNSIGNED NOT NULL,
  `url`        VARCHAR(255)    NOT NULL,
  `sort`       INT             NOT NULL DEFAULT 0,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id_sort` (`order_id`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单图片';

-- -----------------------------------------------------
-- 订单时间线
-- -----------------------------------------------------
DROP TABLE IF EXISTS `order_timelines`;
CREATE TABLE `order_timelines` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id`   BIGINT UNSIGNED NOT NULL,
  `status`     TINYINT         NOT NULL,
  `content`    VARCHAR(255)    NOT NULL,
  `operator`   VARCHAR(64)     DEFAULT NULL                       COMMENT '操作人/系统',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id_created` (`order_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单时间线';

-- -----------------------------------------------------
-- 碳积分流水
-- -----------------------------------------------------
DROP TABLE IF EXISTS `carbon_point_logs`;
CREATE TABLE `carbon_point_logs` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `order_id`   BIGINT UNSIGNED DEFAULT NULL,
  `type`       TINYINT         NOT NULL                         COMMENT '1回收奖励 2签到 3兑换 4退款',
  `amount`     INT             NOT NULL                         COMMENT '正=收入 负=支出',
  `balance`    INT             NOT NULL                         COMMENT '操作后余额',
  `remark`     VARCHAR(255)    DEFAULT NULL,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id_created` (`user_id`, `created_at`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='碳积分流水';

-- -----------------------------------------------------
-- 碳减排记录
-- -----------------------------------------------------
DROP TABLE IF EXISTS `carbon_reductions`;
CREATE TABLE `carbon_reductions` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`       BIGINT UNSIGNED NOT NULL,
  `order_id`      BIGINT UNSIGNED NOT NULL,
  `category_code` VARCHAR(32)     NOT NULL,
  `carbon_kg`     DECIMAL(10,3)   NOT NULL                       COMMENT '减碳 kg',
  `tree_count`    DECIMAL(10,3)   NOT NULL                       COMMENT '等效种树',
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_id` (`order_id`),
  KEY `idx_user_id_created` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='碳减排记录';

-- -----------------------------------------------------
-- 改造故事
-- -----------------------------------------------------
DROP TABLE IF EXISTS `stories`;
CREATE TABLE `stories` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`      VARCHAR(255)    NOT NULL,
  `desc`       VARCHAR(500)    DEFAULT NULL,
  `cover`      VARCHAR(255)    DEFAULT NULL,
  `type`       VARCHAR(16)     NOT NULL                         COMMENT 'video / image',
  `video_url`  VARCHAR(255)    DEFAULT NULL,
  `view_count` INT             NOT NULL DEFAULT 0,
  `like_count` INT             NOT NULL DEFAULT 0,
  `author`     VARCHAR(64)     DEFAULT NULL,
  `enabled`    TINYINT(1)      NOT NULL DEFAULT 1,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_enabled_created` (`enabled`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='改造故事';

-- -----------------------------------------------------
-- 地址表
-- -----------------------------------------------------
DROP TABLE IF EXISTS `addresses`;
CREATE TABLE `addresses` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `name`       VARCHAR(64)     NOT NULL,
  `phone`      VARCHAR(20)     NOT NULL,
  `province`   VARCHAR(64)     NOT NULL,
  `city`       VARCHAR(64)     NOT NULL,
  `district`   VARCHAR(64)     NOT NULL,
  `detail`     VARCHAR(255)    NOT NULL,
  `tag`        VARCHAR(16)     NOT NULL DEFAULT '',
  `lat`        DECIMAL(10,6)   DEFAULT NULL,
  `lng`        DECIMAL(10,6)   DEFAULT NULL,
  `is_default` TINYINT(1)      NOT NULL DEFAULT 0,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id_default` (`user_id`, `is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户地址';

-- -----------------------------------------------------
-- 骑手表
-- -----------------------------------------------------
DROP TABLE IF EXISTS `riders`;
CREATE TABLE `riders` (
  `id`          INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(32)     NOT NULL,
  `phone`       VARCHAR(20)     NOT NULL,
  `id_card`     VARCHAR(20)     DEFAULT NULL,
  `plate_no`    VARCHAR(20)     DEFAULT NULL                    COMMENT '车牌号',
  `rating`      DECIMAL(3,2)    NOT NULL DEFAULT 5.00,
  `service_cnt` INT             NOT NULL DEFAULT 0,
  `status`      TINYINT         NOT NULL DEFAULT 1              COMMENT '1在职 0离职',
  `lat`         DECIMAL(10,6)   DEFAULT NULL,
  `lng`         DECIMAL(10,6)   DEFAULT NULL,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status_rating` (`status`, `rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='骑手（回收员）';

-- -----------------------------------------------------
-- 反馈意见
-- -----------------------------------------------------
DROP TABLE IF EXISTS `feedbacks`;
CREATE TABLE `feedbacks` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    BIGINT UNSIGNED NOT NULL,
  `content`    TEXT            NOT NULL,
  `contact`    VARCHAR(64)     DEFAULT NULL,
  `images`     JSON            DEFAULT NULL                     COMMENT '图片 URL 数组',
  `status`     TINYINT         NOT NULL DEFAULT 0               COMMENT '0待处理 1已处理',
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id_created` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户反馈';

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 完成
-- =====================================================