-- 兑换商品图：改为「服务端静态托管」地址（随容器镜像提供，不再打包进小程序）
-- 前置条件：最新镜像已包含 server/assets/exchange/*.png（见 Dockerfile 的 COPY server/assets）
-- 访问示例：https://sxyrgy.cn/assets/exchange/bag.png
-- ⚠️ 重要：前端 <image> 加载远程图，需在微信公众平台
--    「开发管理 → 开发设置 → 服务器域名 → downloadFile 合法域名」中加入 sxyrgy.cn
-- 执行后前端无需重发版，刷新即可加载新图（前提是镜像已重新部署）。

-- 1) 商品主表：更新为服务端绝对 URL
UPDATE `exchange_items`
SET `image` = CASE `name`
  WHEN '环保帆布袋'   THEN 'https://sxyrgy.cn/assets/exchange/bag.png'
  WHEN '碳中和徽章'   THEN 'https://sxyrgy.cn/assets/exchange/badge.png'
  WHEN '绿植种子套装' THEN 'https://sxyrgy.cn/assets/exchange/seeds.png'
  WHEN '保温杯'       THEN 'https://sxyrgy.cn/assets/exchange/cup.png'
  WHEN '电动牙刷'     THEN 'https://sxyrgy.cn/assets/exchange/toothbrush.png'
  ELSE `image`
END
WHERE `name` IN ('环保帆布袋','碳中和徽章','绿植种子套装','保温杯','电动牙刷');

-- 2) 已生成的兑换工单：回填商品图快照（item_image 是下单时快照，原为空/旧域名）
UPDATE `exchange_records`
SET `item_image` = CASE `item_name`
  WHEN '环保帆布袋'   THEN 'https://sxyrgy.cn/assets/exchange/bag.png'
  WHEN '碳中和徽章'   THEN 'https://sxyrgy.cn/assets/exchange/badge.png'
  WHEN '绿植种子套装' THEN 'https://sxyrgy.cn/assets/exchange/seeds.png'
  WHEN '保温杯'       THEN 'https://sxyrgy.cn/assets/exchange/cup.png'
  WHEN '电动牙刷'     THEN 'https://sxyrgy.cn/assets/exchange/toothbrush.png'
  ELSE `item_image`
END
WHERE `item_name` IN ('环保帆布袋','碳中和徽章','绿植种子套装','保温杯','电动牙刷');
