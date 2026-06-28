// Package JWT 工具
package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/greencycle/server/pkg/config"
)

type Claims struct {
	UserID uint   `json:"userId"`
	OpenID string `json:"openId"`
	jwt.RegisteredClaims
}

// Generate 生成 token
func Generate(userID uint, openID string) (string, error) {
	cfg := config.Get().JWT
	claims := Claims{
		UserID: userID,
		OpenID: openID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(cfg.ExpireHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "greencycle",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.Secret))
}

// Parse 解析 token
func Parse(tokenStr string) (*Claims, error) {
	cfg := config.Get().JWT
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.Secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}
	return nil, errors.New("invalid token")
}