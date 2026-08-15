-- 将每件兑换商品的「每人限兑次数」统一改为 5 件
-- 仅更新已存在数据；新建部署会由 main.go 种子 / migrate_exchange.sql 直接写入 5。
UPDATE `exchange_items`
SET `limit_per_user` = 5
WHERE `limit_per_user` <> 5;
