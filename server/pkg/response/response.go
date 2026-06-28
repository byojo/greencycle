// Package response 统一响应
package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// 业务错误码
const (
	CodeSuccess      = 0
	CodeBadRequest   = 400
	CodeUnauthorized = 401
	CodeForbidden    = 403
	CodeNotFound     = 404
	CodeServerError  = 500
)

// Response 通用响应
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// PageData 分页数据
type PageData struct {
	List  interface{} `json:"list"`
	Total int64       `json:"total"`
	Page  int         `json:"page"`
	Size  int         `json:"size"`
}

// Success 成功
func Success(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    CodeSuccess,
		Message: "success",
		Data:    data,
	})
}

// SuccessWithMessage 带消息的成功
func SuccessWithMessage(c *gin.Context, message string, data interface{}) {
	c.JSON(http.StatusOK, Response{
		Code:    CodeSuccess,
		Message: message,
		Data:    data,
	})
}

// Fail 失败
func Fail(c *gin.Context, code int, message string) {
	c.JSON(http.StatusOK, Response{
		Code:    code,
		Message: message,
	})
}

// NotFound 404
func NotFound(c *gin.Context, message string) {
	Fail(c, CodeNotFound, message)
}

// BadRequest 400
func BadRequest(c *gin.Context, message string) {
	Fail(c, CodeBadRequest, message)
}

// Unauthorized 401
func Unauthorized(c *gin.Context, message string) {
	Fail(c, CodeUnauthorized, message)
}

// ServerError 500
func ServerError(c *gin.Context, message string) {
	Fail(c, CodeServerError, message)
}