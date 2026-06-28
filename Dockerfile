# 纸飞机服务端 Dockerfile（仓库根目录 · 云托管构建入口）

FROM golang:1.21-alpine AS builder

ENV GO111MODULE=on     GOPROXY=https://goproxy.cn,direct     CGO_ENABLED=0     GOOS=linux

WORKDIR /build

COPY server/go.mod server/go.sum* ./

COPY server/ .

RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /build/server ./cmd/api

FROM alpine:3.18

RUN apk add --no-cache tzdata ca-certificates curl &&     cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime &&     echo "Asia/Shanghai" > /etc/timezone

WORKDIR /app

COPY --from=builder /build/server /app/server

ENV PORT=80
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3   CMD curl -f http://localhost:80/health || exit 1

CMD ["/app/server"]
