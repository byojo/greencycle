// Package wecom 企业微信群机器人
package wecom

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

var client = &http.Client{Timeout: 10 * time.Second}

// BotURL 获取机器人 webhook URL
func BotURL() string {
	key := os.Getenv("WECOM_BOT_KEY")
	if key == "" {
		return ""
	}
	return fmt.Sprintf("https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=%s", key)
}

// SendText 发送文本消息
func SendText(content string) error {
	url := BotURL()
	if url == "" {
		return nil // 未配置则跳过
	}

	body, _ := json.Marshal(map[string]interface{}{
		"msgtype": "text",
		"text": map[string]string{
			"content": content,
		},
	})

	resp, err := client.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var result struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	if result.ErrCode != 0 {
		return fmt.Errorf("企业微信推送失败: %d %s", result.ErrCode, result.ErrMsg)
	}
	return nil
}

// SendMarkdown 发送 Markdown 消息
func SendMarkdown(content string) error {
	url := BotURL()
	if url == "" {
		return nil
	}

	body, _ := json.Marshal(map[string]interface{}{
		"msgtype": "markdown",
		"markdown": map[string]string{
			"content": content,
		},
	})

	resp, err := client.Post(url, "application/json", bytes.NewReader(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var result struct {
		ErrCode int    `json:"errcode"`
		ErrMsg  string `json:"errmsg"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	if result.ErrCode != 0 {
		return fmt.Errorf("企业微信推送失败: %d %s", result.ErrCode, result.ErrMsg)
	}
	return nil
}
