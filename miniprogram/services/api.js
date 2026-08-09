// services/api.js
// API 接口定义

const { get, post, put, delete: del } = require('./request.js');

module.exports = {
  // ========== 鉴权 ==========
  // 微信登录
  login: (code, userInfo) => post('/auth/login', { code, userInfo }),

  // 退出登录
  logout: () => post('/auth/logout'),

  // ========== 用户 ==========
  // 获取用户信息
  getUserInfo: () => get('/user/info'),

  // 判断是否管理员
  isAdmin: () => get('/user/is-admin'),

  // 更新用户信息
  updateUserInfo: (data) => put('/user/info', data),

  // 获取用户地址列表
  getAddresses: () => get('/user/addresses'),

  // 添加地址
  addAddress: (data) => post('/user/addresses', data),

  // 更新地址
  updateAddress: (id, data) => put(`/user/addresses/${id}`, data),

  // 删除地址
  deleteAddress: (id) => del(`/user/addresses/${id}`),

  // ========== 品类 ==========
  // 品类列表
  getCategories: () => get('/categories'),

  // 品类详情
  getCategoryDetail: (code) => get(`/categories/${code}`),

  // 品类字段配置（用于动态表单）
  getCategoryFields: (code) => get(`/categories/${code}/fields`),

  // ========== 订单 ==========
  // 创建订单
  createOrder: (data) => post('/orders', data, { showLoading: true, loadingText: '提交中...' }),

  // 订单列表
  getOrders: (params) => get('/orders', params),

  // 订单详情
  getOrderDetail: (id) => get(`/orders/${id}`),

  // 订单时间线
  getOrderTimeline: (id) => get(`/orders/${id}/timeline`),

  // 取消订单
  cancelOrder: (id, reason) => post(`/orders/${id}/cancel`, { reason }),

  // 申请售后
  applyAfterSale: (id, data) => post(`/orders/${id}/after-sale`, data),

  // ========== 碳积分 ==========
  // 积分概览
  getPoints: () => get('/points'),

  // 积分流水
  getPointsHistory: (params) => get('/points/history', params),

  // 提现
  withdrawPoints: (amount) => post('/points/withdraw', { amount }),

  // 签到
  signIn: () => post('/points/sign-in', {}, { showLoading: true }),

  // ========== 内容 ==========
  // 故事列表
  getStories: (params) => get('/stories', params),

  // 故事详情
  getStoryDetail: (id) => get(`/stories/${id}`),

  // ========== 通用 ==========
  // 上传签名（直传 COS）
  getUploadSign: (data) => post('/upload/sign', data),

  // 全局配置
  getConfig: () => get('/config'),

  // 反馈意见
  submitFeedback: (data) => post('/feedback', data, { showLoading: true, loadingText: '提交中...' }),

  // ========== 合作加盟 ==========
  // 提交加盟申请
  submitPartnerApply: (data) => post('/partner-apply', data, { showLoading: true, loadingText: '提交中...' }),

  // ========== 积分商城 ==========
  // 获取可兑换商品列表
  getExchangeItems: () => get('/exchange/items'),

  // 兑换商品
  exchangeItem: (data) => post('/exchange', data, { showLoading: true, loadingText: '兑换中...' }),

  // 用户兑换记录
  getExchangeHistory: (params) => get('/exchange/history', params),

  // ========== 管理端 ==========
  adminGetOrders: (params) => get('/admin/orders', params, { header: { 'X-Admin-Key': wx.getStorageSync('adminKey') || '' } }),
  adminGetRiders: () => get('/admin/riders', {}, { header: { 'X-Admin-Key': wx.getStorageSync('adminKey') || '' } }),
  adminAddRider: (data) => post('/admin/riders', data, { header: { 'X-Admin-Key': wx.getStorageSync('adminKey') || '' }, showLoading: true }),
  adminUpdateRider: (id, data) => put(`/admin/riders/${id}`, data, { header: { 'X-Admin-Key': wx.getStorageSync('adminKey') || '' } }),
  adminAssignOrder: (id, data) => post(`/admin/orders/${id}/assign`, data, { header: { 'X-Admin-Key': wx.getStorageSync('adminKey') || '' }, showLoading: true, loadingText: '派单中...' }),
  adminUpdateOrderStatus: (id, data) => put(`/admin/orders/${id}/status`, data, { header: { 'X-Admin-Key': wx.getStorageSync('adminKey') || '' } }),
  adminCompleteOrder: (id, data) => post(`/admin/orders/${id}/complete`, data, { header: { 'X-Admin-Key': wx.getStorageSync('adminKey') || '' }, showLoading: true, loadingText: '处理中...' })
};