# 绿循环项目 Makefile
# 常用运维命令

.PHONY: help dev build up down restart logs clean deploy

# 默认目标
.DEFAULT_GOAL := help

help: ## 显示帮助
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ====== 开发 ======
dev: ## 启动开发环境（Docker Compose）
	cd deploy && docker compose up -d
	@echo "✅ 服务已启动"
	@echo "   API:    http://localhost:8080"
	@echo "   Nginx:  http://localhost"
	@echo "   MySQL:  localhost:3306"
	@echo "   Redis:  localhost:6379"

dev-build: ## 重新构建并启动
	cd deploy && docker compose up -d --build
	@echo "✅ 重新构建完成"

down: ## 停止开发环境
	cd deploy && docker compose down

logs: ## 查看日志
	cd deploy && docker compose logs -f --tail=100

logs-api: ## 查看 API 日志
	cd deploy && docker compose logs -f --tail=100 api

# ====== 数据库 ======
db-shell: ## 进入 MySQL 控制台
	cd deploy && docker compose exec mysql mysql -ugreencycle -pgreencycle123 greencycle

db-backup: ## 备份数据库
	cd deploy && docker compose exec mysql sh -c 'mysqldump -uroot -p$$MYSQL_ROOT_PASSWORD greencycle' > backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ 备份完成"

db-restore: ## 恢复数据库（usage: make db-restore FILE=backup.sql）
	@if [ -z "$(FILE)" ]; then echo "请指定 FILE: make db-restore FILE=backup.sql"; exit 1; fi
	cd deploy && cat $(FILE) | docker compose exec -T mysql mysql -uroot -p$$MYSQL_ROOT_PASSWORD greencycle
	@echo "✅ 恢复完成"

# ====== 服务端 ======
build: ## 构建 Go 服务端二进制
	cd server && CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/greencycle-server ./cmd/api
	@echo "✅ 构建完成: server/bin/greencycle-server"

test: ## 运行测试
	cd server && go test -v ./...

lint: ## 代码检查
	cd server && go vet ./...
	cd server && test -f go.sum && go mod verify || echo "go.sum 不存在"

tidy: ## 整理依赖
	cd server && go mod tidy

# ====== 镜像 ======
image: ## 构建 Docker 镜像
	cd server && docker build -t greencycle/server:latest .
	@echo "✅ 镜像构建完成: greencycle/server:latest"

# ====== 清理 ======
clean: ## 清理临时文件
	rm -rf server/bin/
	rm -rf deploy/logs/*
	@echo "✅ 清理完成"

clean-all: ## 完全清理（包括 Docker 资源）
	cd deploy && docker compose down -v --remove-orphans
	docker image prune -af
	docker volume prune -f
	@echo "⚠️  完全清理完成"

# ====== 部署 ======
deploy: ## 部署到生产（需要 SSH 配置）
	@echo "🚀 开始部署..."
	@echo "请确保 GitHub Secrets 配置正确：SERVER_HOST, SERVER_USER, SSH_PRIVATE_KEY"
	git push origin main
	@echo "✅ 推送完成，CI 将自动部署"

# ====== 小程序 ======
mini-dev: ## 启动微信开发者工具打开小程序
	open -a "微信开发者工具" miniprogram/

mini-upload: ## 上传小程序代码（需要在开发者工具中先预览）
	@echo "请在微信开发者工具中点击「上传」"