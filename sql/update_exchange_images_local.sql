-- 兑换商品图：更新为小程序本地打包路径（无需 COS、无需配置 downloadFile 合法域名）
-- 说明：图片为 AI 生成的占位图，已打包进 miniprogram/assets/exchange/，重新编译上传小程序后即生效。
-- 后续若改为 COS 远程图，只需把这里换成 https://greencycle-image-1255464850.cos.ap-guangzhou.myqcloud.com/exchange/xxx.png 并在公众平台配置 downloadFile 合法域名。

UPDATE `exchange_items`
SET `image` = CASE `name`
  WHEN '环保帆布袋'   THEN '/assets/exchange/bag.png'
  WHEN '碳中和徽章'   THEN '/assets/exchange/badge.png'
  WHEN '绿植种子套装' THEN '/assets/exchange/seeds.png'
  WHEN '保温杯'       THEN '/assets/exchange/cup.png'
  WHEN '电动牙刷'     THEN '/assets/exchange/toothbrush.png'
  ELSE `image`
END
WHERE `name` IN ('环保帆布袋','碳中和徽章','绿植种子套装','保温杯','电动牙刷');

-- 已生成的兑换工单：回填商品图快照（item_image 是下单时快照，原为空/假域名）
-- 仅更新为空或仍为旧假域名的记录；之后新下单会自动快照最新商品图。
UPDATE `exchange_records` r
  JOIN `exchange_items` i ON i.id = r.item_id
SET r.`item_image` = i.`image`
WHERE r.`item_image` = '' OR r.`item_image` LIKE '%cos.example.com%';
