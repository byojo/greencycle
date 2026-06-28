// pages/order-success/order-success.js
const app = getApp();
const api = require('../../services/api.js');
const { formatDate, categoryName } = require('../../utils/format.js');

Page({
  data: {
    orderId: '',
    orderNo: '',
    category: '',
    categoryName: '',
    estimatedAt: '',
    loading: true
  },

  onLoad(options) {
    const orderId = options.id || '';
    const category = app.globalData.currentCategory || 'phone';

    this.setData({
      orderId,
      category,
      categoryName: categoryName(category),
      estimatedAt: this.formatEstimate()
    });

    if (orderId) {
      this.loadOrderDetail(orderId);
    } else {
      this.setData({ loading: false });
    }
  },

  formatEstimate() {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    return formatDate(now, 'MM-DD HH:mm');
  },

  async loadOrderDetail(id) {
    try {
      const res = await api.getOrderDetail(id);
      const order = res.data || {};
      this.setData({
        orderNo: order.orderNo || order.id || '',
        category: order.categoryCode || this.data.category,
        categoryName: categoryName(order.categoryCode || this.data.category),
        estimatedAt: order.estimatedAt
          ? formatDate(order.estimatedAt, 'MM-DD HH:mm')
          : this.data.estimatedAt,
        loading: false
      });
    } catch (err) {
      console.warn('加载订单详情失败', err);
      this.setData({ loading: false });
    }
  },

  onViewOrder() {
    wx.redirectTo({
      url: `/pages/order-detail/order-detail?id=${this.data.orderId || ''}&category=${this.data.category}`
    });
  },

  onGoHome() {
    wx.switchTab({ url: '/pages/home/home' });
  },

  onShareAppMessage() {
    return {
      title: '我刚刚在纸飞机回收了闲置物品，你也来试试吧！',
      path: '/pages/home/home'
    };
  }
});
