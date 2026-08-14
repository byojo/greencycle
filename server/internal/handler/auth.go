package handler

import (
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/greencycle/server/pkg/response"
)

// LoginRequest 登录请求
type LoginRequest struct {
	Code       string                 `json:"code" binding:"required"`
	UserInfo   map[string]interface{} `json:"userInfo"`
	InviteCode string                 `json:"inviteCode"`
}

// Login 微信登录
func (h *Handler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	result, err := h.Svc.Auth.WechatLogin(c.Request.Context(), req.Code, req.UserInfo, req.InviteCode)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"token": result.Token,
		"user":  result.User,
		"isNew": result.IsNew,
	})
}

// UserInfo 获取用户信息
func (h *Handler) UserInfo(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "未登录")
		return
	}

	user, err := h.Svc.Auth.GetUserInfo(c.Request.Context(), userID)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}

	response.Success(c, user)
}

// UpdateProfileRequest 更新用户资料请求
type UpdateProfileRequest struct {
	Nickname string `json:"nickname"`
}

// UpdateProfile 更新当前用户昵称
func (h *Handler) UpdateProfile(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "未登录")
		return
	}

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	nick := strings.TrimSpace(req.Nickname)
	if nick == "" {
		response.BadRequest(c, "昵称不能为空")
		return
	}
	// 按 rune 计算长度，避免 emoji/中文被截断算错
	if len([]rune(nick)) > 32 {
		response.BadRequest(c, "昵称过长（最多 32 个字符）")
		return
	}

	ctx := c.Request.Context()
	user, err := h.Svc.Repo.User.FindByID(ctx, userID)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}
	if user == nil {
		response.NotFound(c, "用户不存在")
		return
	}

	user.Nickname = nick
	if err := h.Svc.Repo.User.Update(ctx, user); err != nil {
		response.ServerError(c, "更新失败: "+err.Error())
		return
	}

	response.Success(c, user)
}

// Logout 退出登录（前端清本地 token 即可，这里可选做服务端吊销）
func (h *Handler) Logout(c *gin.Context) {
	response.Success(c, nil)
}

// IsAdmin 判断当前用户是否是管理员
func (h *Handler) IsAdmin(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "未登录")
		return
	}

	isAdmin := checkAdmin(userID)
	isRider := isRiderUser(userID)
	response.Success(c, gin.H{"isAdmin": isAdmin, "isRider": isRider})
}

// InviteList 邀请记录
func (h *Handler) InviteList(c *gin.Context) {
	userID := getUserID(c)
	if userID == 0 {
		response.Unauthorized(c, "未登录")
		return
	}

	list, err := h.Svc.Auth.GetInviteList(c.Request.Context(), userID)
	if err != nil {
		response.ServerError(c, err.Error())
		return
	}
	response.Success(c, gin.H{"list": list})
}

// checkAdmin 检查用户是否是管理员（通过 ADMIN_USER_IDS 环境变量）
func checkAdmin(userID uint) bool {
	ids := os.Getenv("ADMIN_USER_IDS")
	if ids == "" {
		return false
	}
	for _, idStr := range strings.Split(ids, ",") {
		id, err := strconv.ParseUint(strings.TrimSpace(idStr), 10, 64)
		if err == nil && uint(id) == userID {
			return true
		}
	}
	return false
}
