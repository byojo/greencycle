#!/usr/bin/env python3
"""
将本地商品图上传到腾讯云 COS（"积分商城兑换商品图"切换为 COS 托管）。

前置依赖：
    pip install cos-python-sdk-v5

环境变量（在云托管控制台「环境变量」或桶 API 密钥中获取）：
    export COS_SECRETID=AKIDxxxxxxxxxxxxxxxx
    export COS_SECRETKEY=xxxxxxxxxxxxxxxx
    export COS_REGION=ap-guangzhou
    export COS_BUCKET=greencycle-image-1255464850

运行：
    python3 scripts/upload_exchange_images.py

上传后文件 key 为 exchange/<文件名>，对应可访问 URL：
    https://greencycle-image-1255464850.cos.ap-guangzhou.myqcloud.com/exchange/<文件名>
桶为公有读，无需签名即可被小程序 <image> 直接加载。
若配置了 COS_CDN，请把上面的域名替换为你的 CDN 域名（与 sql/update_exchange_images_cos.sql 中的 URL 保持一致）。
"""
import os
import sys

try:
    from qcloud_cos import CosConfig, CosS3Client
except ImportError:
    print("缺少依赖，请先执行：pip install cos-python-sdk-v5")
    sys.exit(1)

SECRET_ID = os.environ.get("COS_SECRETID")
SECRET_KEY = os.environ.get("COS_SECRETKEY")
REGION = os.environ.get("COS_REGION", "ap-guangzhou")
BUCKET = os.environ.get("COS_BUCKET", "greencycle-image-1255464850")

if not (SECRET_ID and SECRET_KEY and BUCKET):
    print("缺少环境变量：请设置 COS_SECRETID / COS_SECRETKEY / COS_BUCKET")
    sys.exit(1)

config = CosConfig(Region=REGION, SecretId=SECRET_ID, SecretKey=SECRET_KEY)
client = CosS3Client(config)

SRC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "exchange")
KEY_PREFIX = "exchange/"

EXTS = (".png", ".jpg", ".jpeg", ".webp")
files = sorted(f for f in os.listdir(SRC_DIR) if f.lower().endswith(EXTS))
if not files:
    print(f"在 {SRC_DIR} 未找到图片")
    sys.exit(1)

print(f"上传到桶 {BUCKET}（{REGION}），key 前缀 {KEY_PREFIX}")
for name in files:
    local = os.path.join(SRC_DIR, name)
    key = KEY_PREFIX + name
    client.upload_file(Bucket=BUCKET, Key=key, LocalFilePath=local, EnableMD5=False)
    url = f"https://{BUCKET}.cos.{REGION}.myqcloud.com/{key}"
    print(f"  ✅ {name} -> {url}")

print("\n全部上传完成。")
print("下一步：")
print("  1) 在微信公众平台「开发管理-开发设置-服务器域名-downloadFile 合法域名」加入："
      f"{BUCKET}.cos.{REGION}.myqcloud.com")
print("  2) 在线上数据库执行 sql/update_exchange_images_cos.sql")
print("  3) 重新编译/上传小程序以应用此前的前端修复")
