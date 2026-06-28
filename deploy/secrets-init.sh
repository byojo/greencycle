#!/usr/bin/env bash
#
# 交互式初始化 .env（包含敏感密钥）
# 用法：bash secrets-init.sh
#
# 重要：此脚本创建的 .env 已在 .gitignore 中，不会被 commit
#      请勿手动复制 .env 内容到任何公开的地方
#
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$(dirname "$0")"

if [ -f ".env" ]; then
  echo -e "${YELLOW}检测到 .env 已存在${NC}"
  read -p "覆盖吗？(y/N) " OVERWRITE
  [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ] && { echo "已取消"; exit 0; }
fi

echo ""
echo -e "${GREEN}==== 纸飞机 · 密钥配置向导 ====${NC}"
echo "请依次输入（输入不会显示，直接粘贴即可）："
echo ""

# ===== 1. MySQL =====
echo "【1/7】MySQL Root 密码（首次启动数据库用）"
read -s -p "MYSQL_ROOT_PASSWORD: " V_ROOT; echo
echo "【2/7】MySQL 业务用户密码（API 连库用）"
read -s -p "MYSQL_PASSWORD: " V_USER; echo

# ===== 2. JWT =====
V_JWT=$(openssl rand -hex 32 2>/dev/null || echo "change-me-$(date +%s)")
echo "【3/7】JWT 密钥（已自动生成）: ${V_JWT:0:8}..."

# ===== 3. 微信 =====
echo ""
echo "【4/7】微信 AppID"
read -p "WECHAT_APPID (回车默认 wx36bbf191a358e44b): " V_APPID
V_APPID=${V_APPID:-wx36bbf191a358e44b}

echo "【5/7】微信 AppSecret（去 mp.weixin.qq.com 开发设置看）"
read -s -p "WECHAT_APPSECRET: " V_SECRET; echo

# ===== 4. COS =====
echo ""
echo "【6/7】腾讯云 COS 配置（去 console.cloud.tencent.com/cos 看）"
read -p "COS_SECRETID: " V_COS_ID
read -s -p "COS_SECRETKEY: " V_COS_KEY; echo
read -p "COS_BUCKET (例 paper-plane-prod-1300000000): " V_COS_BUCKET
read -p "COS_REGION (默认 ap-shanghai): " V_COS_REGION
V_COS_REGION=${V_COS_REGION:-ap-shanghai}
read -p "COS_CDN (默认 https://cdn.sxyrgy.cn): " V_COS_CDN
V_COS_CDN=${V_COS_CDN:-https://cdn.sxyrgy.cn}

# ===== 5. 站点域名 =====
echo ""
echo "【7/7】站点域名（默认 https://sxyrgy.cn）"
read -p "API_BASE (回车默认): " V_API
V_API=${V_API:-https://sxyrgy.cn}

# ===== 写入 .env =====
cat > .env <<EOF
# ===== 纸飞机 · 运行时配置 =====
# ⚠️  WARNING: 此文件包含敏感密钥，已在 .gitignore 中
# ⚠️  请勿提交到 Git / 截图 / 公开分享
# 生成时间: $(date '+%Y-%m-%d %H:%M:%S')

# ---- MySQL ----
MYSQL_ROOT_PASSWORD=${V_ROOT}
MYSQL_DATABASE=greencycle
MYSQL_USER=greencycle
MYSQL_PASSWORD=${V_USER}

# ---- JWT ----
JWT_SECRET=${V_JWT}

# ---- 微信小程序 ----
WECHAT_APPID=${V_APPID}
WECHAT_APPSECRET=${V_SECRET}

# ---- 腾讯云 COS ----
COS_SECRETID=${V_COS_ID}
COS_SECRETKEY=${V_COS_KEY}
COS_REGION=${V_COS_REGION}
COS_BUCKET=${V_COS_BUCKET}
COS_CDN=${V_COS_CDN}

# ---- 站点 ----
API_BASE=${V_API}
EOF

# 加严权限（仅 owner 可读）
chmod 600 .env

echo ""
echo -e "${GREEN}✓ .env 已生成（权限 600）${NC}"
echo ""
echo "下一步："
echo "  docker compose up -d"
echo ""
echo "查看密钥（敏感操作，确认无人在看）："
echo "  grep -v '^#' .env | head -20"
