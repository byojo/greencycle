// Package wechat 微信开放接口封装
package wechat

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/patrickmn/go-cache"

	"github.com/greencycle/server/pkg/config"
)

var httpClient = &http.Client{Timeout: 10 * time.Second}

type Client struct {
	appID     string
	appSecret string
	cache     *cache.Cache
}

type Session struct {
	OpenID     string `json:"openid"`
	UnionID    string `json:"unionid"`
	SessionKey string `json:"session_key"`
}

type Code2SessionResponse struct {
	Session
	ErrCode int    `json:"errcode"`
	ErrMsg   string `json:"errmsg"`
}

func NewClient() *Client {
	cfg := config.Get().Wechat
	return &Client{
		appID:     cfg.AppID,
		appSecret: cfg.AppSecret,
		cache:     cache.New(110*time.Minute, 5*time.Minute),
	}
}

// Code2Session code 换取 session
func (c *Client) Code2Session(code string) (*Session, error) {
	apiURL := "https://api.weixin.qq.com/sns/jscode2session"
	params := url.Values{}
	params.Set("appid", c.appID)
	params.Set("secret", c.appSecret)
	params.Set("js_code", code)
	params.Set("grant_type", "authorization_code")

	resp, err := httpClient.Get(apiURL + "?" + params.Encode())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result Code2SessionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if result.ErrCode != 0 {
		return nil, fmt.Errorf("微信登录失败: %d %s", result.ErrCode, result.ErrMsg)
	}

	return &result.Session, nil
}

type AccessTokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
	ErrCode     int    `json:"errcode"`
	ErrMsg      string `json:"errmsg"`
}

// GetAccessToken 获取 access_token（带缓存）
func (c *Client) GetAccessToken() (string, error) {
	if v, found := c.cache.Get("access_token"); found {
		return v.(string), nil
	}

	apiURL := "https://api.weixin.qq.com/cgi-bin/token"
	params := url.Values{}
	params.Set("grant_type", "client_credential")
	params.Set("appid", c.appID)
	params.Set("secret", c.appSecret)

	resp, err := httpClient.Get(apiURL + "?" + params.Encode())
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result AccessTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if result.ErrCode != 0 {
		return "", fmt.Errorf("获取 access_token 失败: %d %s", result.ErrCode, result.ErrMsg)
	}

	expiresIn := result.ExpiresIn
	if expiresIn > 200 {
		expiresIn = expiresIn - 200
	} else {
		expiresIn = expiresIn / 2
	}
	c.cache.Set("access_token", result.AccessToken, time.Duration(expiresIn)*time.Second)
	return result.AccessToken, nil
}

// SendSubscribeMessage 发送订阅消息
type SubscribeMessage struct {
	Touser     string                 `json:"touser"`
	TemplateID string                 `json:"template_id"`
	Page       string                 `json:"page,omitempty"`
	Data       map[string]interface{} `json:"data"`
	MiniprogramState string           `json:"miniprogram_state,omitempty"`
}

func (c *Client) SendSubscribeMessage(msg SubscribeMessage) error {
	token, err := c.GetAccessToken()
	if err != nil {
		return err
	}

	apiURL := fmt.Sprintf("https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=%s", token)

	body, _ := json.Marshal(msg)
	resp, err := httpClient.Post(apiURL, "application/json", bytes.NewReader(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var result struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return err
	}
	if result.ErrCode != 0 {
		return fmt.Errorf("发送订阅消息失败: %d %s", result.ErrCode, result.ErrMsg)
	}
	return nil
}