-- =====================================================
-- 绿循环小程序 - 初始数据
-- =====================================================

-- -----------------------------------------------------
-- 1. 品类数据
-- -----------------------------------------------------
INSERT INTO `categories` (`code`, `name`, `icon`, `bg_color`, `tagline`, `sort`) VALUES
('phone',   '手机回收',   '📱', 'from-blue-100 to-blue-200',       '高价回收 · 隐私彻底清除', 1),
('clothes', '衣物回收',   '👕', 'from-pink-100 to-pink-200',       '5kg 起 · 旧衣改造',     2),
('digital', '数码回收',   '💻', 'from-indigo-100 to-indigo-200',   '笔记本平板 · 当面验机', 3),
('home',    '家电回收',   '🔌', 'from-red-100 to-red-200',         '上门拆机 · 免费搬运',   4),
('luxury',  '闲置包回收', '👜', 'from-purple-100 to-purple-200',   '专业鉴定 · 全程录像',   5),
('book',    '书籍回收',   '📚', 'from-emerald-100 to-emerald-200', '5本起 · 山区捐赠',     6),
('metal',   '废品回收',   '♻️', 'from-cyan-100 to-cyan-200',       '纸壳金属 · 环保再生',   7);

-- -----------------------------------------------------
-- 2. 手机品类字段配置
-- -----------------------------------------------------
INSERT INTO `category_fields` (`category_id`, `field_key`, `field_label`, `field_type`, `required`, `options`, `placeholder`, `sort`) VALUES
(1, 'model',     '品牌型号', 'text',    0, NULL,                              '如：iPhone 14 Pro', 1),
(1, 'condition', '外观成色', 'select', 0, '["99新","95新","9新","8新"]',     NULL,                2),
(1, 'capacity',  '存储容量', 'text',    0, NULL,                              '如：256G',          3);

-- -----------------------------------------------------
-- 3. 衣物品类字段配置
-- -----------------------------------------------------
INSERT INTO `category_fields` (`category_id`, `field_key`, `field_label`, `field_type`, `required`, `options`, `placeholder`, `sort`) VALUES
(2, 'types',    '衣物类型', 'multi',  0, '["冬装","夏装","运动鞋","包帽","床单被套"]', NULL, 1),
(2, 'weight',   '预估重量', 'text',   0, NULL,                              '单位：kg',          2),
(2, 'count',    '件数',     'text',   0, NULL,                              '如：20 件',         3);

-- -----------------------------------------------------
-- 4. 数码品类字段配置
-- -----------------------------------------------------
INSERT INTO `category_fields` (`category_id`, `field_key`, `field_label`, `field_type`, `required`, `options`, `placeholder`, `sort`) VALUES
(3, 'device_type', '设备类型', 'select', 0, '["笔记本","平板","相机","耳机"]', NULL,                                1),
(3, 'model',       '品牌型号', 'text',    0, NULL,                            '如：MacBook Pro 13寸 / iPad Air', 2),
(3, 'years',       '使用年限', 'text',    0, NULL,                            '如：2年',                          3);

-- -----------------------------------------------------
-- 5. 家电品类字段配置
-- -----------------------------------------------------
INSERT INTO `category_fields` (`category_id`, `field_key`, `field_label`, `field_type`, `required`, `options`, `placeholder`, `sort`) VALUES
(4, 'home_type',   '家电类型', 'select', 0, '["空调","冰箱","洗衣机","小家电"]', NULL,         1),
(4, 'model',       '品牌型号', 'text',    0, NULL,                          '如：格力1.5匹', 2),
(4, 'need_install','需要拆机', 'switch', 0, NULL,                          NULL,            3);

-- -----------------------------------------------------
-- 6. 闲置包品类字段配置
-- -----------------------------------------------------
INSERT INTO `category_fields` (`category_id`, `field_key`, `field_label`, `field_type`, `required`, `options`, `placeholder`, `sort`) VALUES
(5, 'brand', '品牌',     'text', 0, NULL, '如：Coach / Michael Kors', 1),
(5, 'year',  '购买年份', 'text', 0, NULL, '如：2022',                  2);

-- -----------------------------------------------------
-- 7. 书籍品类字段配置
-- -----------------------------------------------------
INSERT INTO `category_fields` (`category_id`, `field_key`, `field_label`, `field_type`, `required`, `options`, `placeholder`, `sort`) VALUES
(6, 'book_type', '类别', 'multi', 0, '["教材","课外书","小说","儿童读物"]', NULL, 1),
(6, 'count',     '数量', 'text',  0, NULL, '如：23本',                       2);

-- -----------------------------------------------------
-- 8. 废品品类字段配置
-- -----------------------------------------------------
INSERT INTO `category_fields` (`category_id`, `field_key`, `field_label`, `field_type`, `required`, `options`, `placeholder`, `sort`) VALUES
(7, 'metal_type', '类型', 'multi', 0, '["纸壳","塑料瓶","金属","玻璃"]', NULL, 1),
(7, 'weight',     '预估重量', 'text', 0, NULL, '单位：kg',                       2);

-- -----------------------------------------------------
-- 9. 改造故事（示例数据）
-- -----------------------------------------------------
INSERT INTO `stories` (`title`, `desc`, `cover`, `type`, `view_count`, `like_count`, `author`, `enabled`) VALUES
('300 件旧衣改造的亲子礼服，背后是她对女儿的承诺',
 '用 30 个家庭的旧衣物，做成亲子礼服。每一件衣服都值得被温柔告别...',
 'https://cdn.greencycle.com/stories/story1.jpg',
 'video', 124000, 86000, '故事官阿琳', 1),

('iPhone 回收后的"第二人生"：拆解、检测、重生的全过程',
 '跟随镜头走进我们合作的环保工厂，看一台手机的再生之旅...',
 'https://cdn.greencycle.com/stories/story2.jpg',
 'image', 86000, 52000, '数码专栏', 1),

('女儿小学时的毛绒玩具，去向让人泪目',
 '500 个旧玩偶，消毒、修复后送到了山区幼儿园，孩子们的笑脸比什么都值...',
 'https://cdn.greencycle.com/stories/story3.jpg',
 'image', 51000, 38000, '用户投稿', 1),

('3 万本旧书，跨越 2000 公里，到达这所村小',
 '用户@甜甜圈 一家三口整理了 3 年的旧书，我们全程直播送往云南...',
 'https://cdn.greencycle.com/stories/story4.jpg',
 'image', 42000, 29000, '用户投稿', 1),

('旧笔记本翻新记：送给乡村学校的编程课',
 '翻新 200 台旧电脑，每台成本不到 200 元，让山里孩子也能学编程...',
 'https://cdn.greencycle.com/stories/story5.jpg',
 'image', 38000, 26000, '志愿者', 1);

-- -----------------------------------------------------
-- 10. 骑手示例数据
-- -----------------------------------------------------
INSERT INTO `riders` (`name`, `phone`, `id_card`, `plate_no`, `rating`, `service_cnt`, `status`) VALUES
('张师傅',  '13800138001', '310115199001011234', '沪A·8862', 4.95, 268, 1),
('李师傅',  '13800138002', '310115199002022345', '沪A·8863', 4.88, 192, 1),
('王师傅',  '13800138003', '310115199003033456', '沪A·8864', 4.92, 234, 1),
('赵师傅',  '13800138004', '310115199004044567', '沪A·8865', 4.85, 156, 1),
('刘师傅',  '13800138005', '310115199005055678', '沪A·8866', 4.90, 201, 1);

-- -----------------------------------------------------
-- 完成
-- -----------------------------------------------------
SELECT '初始化数据插入完成' AS message;