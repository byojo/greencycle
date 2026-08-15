-- 兑换商品图：改为腾讯云 COS 公有读桶托管地址
-- 前置：已用 scripts/upload_exchange_images.py 将 assets/exchange/*.png 上传到桶
--       greencycle-image-1255464850（ap-guangzhou），key 为 exchange/<文件名>
-- 可访问 URL：https://greencycle-image-1255464850.cos.ap-guangzhou.myqcloud.com/exchange/<文件名>
-- 注意：前端 <image> 加载远程图需在微信公众平台「开发管理-开发设置-服务器域名-downloadFile 合法域名」
--       加入 greencycle-image-1255464850.cos.ap-guangzhou.myqcloud.com
--       （若配置了 COS_CDN，请把下面所有域名换成你的 CDN 域名）

UPDATE `exchange_items`
SET `image` = CASE `name`
  WHEN '环保帆布袋'   THEN 'https://greencycle-image-1255464850.cos.ap-guangzhou.myqcloud.com/exchange/bag.png'
  WHEN '碳中和徽章'   THEN 'https://greencycle-image-1255464850.cos.ap-guangzhou.myqcloud.com/exchange/badge.png'
  WHEN '绿植种子套装' THEN 'https://greencycle-image-1255464850.cos.ap-guangzhou.myqcloud.com/exchange/seeds.png'
  WHEN '保温杯'       THEN 'https://greencycle-image-1255464850.cos.ap-guangzhou.myqcloud.com/exchange/cup.png'
  WHEN '电动牙刷'     THEN 'https://greencycle-image-1255464850.cos.ap-guangzhou.myqcloud.com/exchange/toothbrush.png'
  ELSE `image`
END
WHERE `name` IN ('环保帆布袋','碳中和徽章','绿植种子套装','保温杯','电动牙刷');

-- 已生成的兑换工单：回填商品图快照（item_image 是下单时快照）
UPDATE `exchange_records`
SET `item_image` = CASE `item_name`
  WHEN '环保帆布袋'   THEN 'https://greencycle-image-1255464850.cos.ap-guangzhou.myqcloud.com/exchange/bag.png'
  WHEN '碳中和徽章'   THEN 'https://greencycle-image-1255464850.cos.ap-guangzhou.myqcloud.com/exchange/badge.png'
  WHEN '绿植种子套装' THEN 'https://greencycle-image-1255464850.cos.ap-guangzhou.myqcloud.com/exchange/seeds.png'
  WHEN '保温杯'       THEN 'https://greencycle-image-1255464850.cos.ap-guangzhou.myqcloud.com/exchange/cup.png'
  WHEN '电动牙刷'     THEN 'https://greencycle-image-1255464850.cos.ap-guangzhou.myqcloud.com/exchange/toothbrush.png'
  ELSE `item_image`
END
WHERE `item_name` IN ('环保帆布袋','碳中和徽章','绿植种子套装','保温杯','电动牙刷');
