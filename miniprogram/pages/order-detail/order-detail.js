// pages/order-detail/order-detail.js
const app = getApp();
const api = require('../../services/api.js');
const { formatDate, formatMoney, categoryName, orderStatusText } = require('../../utils/format.js');

// 8 大品类详情
const CATEGORY_DETAIL = {
  phone:   { icon: '📱', name: '手机',
    item: 'iPhone 14 Pro · 256G', desc: '深空黑 · 95新 · 国行',
    attrs: ['深空黑', '95新', '国行', '256G'],
    bg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)' },
  clothes: { icon: '👕', name: '衣物',
    item: '旧衣物 · 8.5kg', desc: '冬装 · 夏装 · 已分类打包',
    attrs: ['8.5kg', '已分类'],
    bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' },
  digital: { icon: '💻', name: '数码',
    item: 'MacBook Pro · 13寸', desc: '95新 · 已使用 2 年',
    attrs: ['13寸', '95新', '2022年购入'],
    bg: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)' },
  home:    { icon: '🔌', name: '家电',
    item: '美的空调 · 1.5匹', desc: '95新 · 需上门拆机',
    attrs: ['1.5匹', '95新', '需拆机'],
    bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)' },
  luxury:  { icon: '👜', name: '闲置包',
    item: 'Coach 手提包', desc: '9成新 · 2022 年购买',
    attrs: ['Coach', '9成新'],
    bg: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)' },
  book:    { icon: '📚', name: '书籍',
    item: '旧书籍 · 23 本', desc: '教材 · 课外读物',
    attrs: ['23本', '已消毒'],
    bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)' },
  metal:   { icon: '🥫', name: '废品',
    item: '纸壳 + 塑料瓶', desc: '预估重量 5kg',
    attrs: ['5kg', '可回收'],
    bg: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)' }
};

// 5 种 status 对应的视觉
const STATUS_CONFIG = {
  1: { text: '待评估',  icon: '⏳',
    bg: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)' },
  2: { text: '已派单',  icon: '🚴',
    bg: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' },
  3: { text: '已取件',  icon: '📦',
    bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
  4: { text: '已完成',  icon: '✓',
    bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
  5: { text: '已取消',  icon: '✕',
    bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }
};

const MOCK_ORDER_DATA = {
  clothes: { amount: 8000,    id: 'GC20260625001', cat: '衣物 · 旧衣物 8.5kg',     status: 4,
    time: '2026-06-25 11:35', completedAt: '2026-06-25 11:35' },
  book:    { amount: 12000,   id: 'GC20260620002', cat: '书籍 · 旧书籍 23本',      status: 4,
    time: '2026-06-20 16:40', completedAt: '2026-06-20 16:40' },
  digital: { amount: 450000,  id: 'GC20260528003', cat: '数码 · MacBook Pro 13寸', status: 4,
    time: '2026-05-28 10:30', completedAt: '2026-05-28 10:30' },
  luxury:  { amount: 120000,  id: 'GC20260512004', cat: '闲置包 · Coach 手提包',   status: 4,
    time: '2026-05-12 15:05', completedAt: '2026-05-12 15:05' },
  phone:   { amount: 280000,  id: 'GC20260422005', cat: '手机 · 华为 P50 Pro',     status: 4,
    time: '2026-04-22 15:55', completedAt: '2026-04-22 15:55' }
};

Page({
  data: {
    orderId: '',
    category: 'phone',
    status: 4,
    statusText: '',
    statusIcon: '✓',
    statusBarBg: '',
    info: null,
    photos: [],
    amount: 0,
    amountText: '',
    priceText: '',
    orderNo: '',
    catText: '',
    createdAt: '',
    completedAt: '',
    pickupAt: '',
    pickupAddr: '',
    cancelReason: '',
    rider: {
      name: '张师傅',
      phone: '138****8862',
      distance: '1.2km',
      dispatchedAt: ''
    },
    carbonKg: '1.8',
    carbonPoints: 128,
    treeCount: '0.1',
    againText: '再次回收',
    loading: true
  },

  onLoad(options) {
    this.setData({ orderId: options.id || '' });
    this.loadOrder(options);
  },

  async loadOrder(options) {
    // 1. 有 orderId 且非 mock：从服务端加载
    if (this.data.orderId && !this.data.orderId.startsWith('mock_')) {
      try {
        const res = await api.getOrderDetail(this.data.orderId);
        if (res && res.data) {
          this.renderFromServer(res.data);
          return;
        }
      } catch (err) {
        console.warn('加载订单详情失败', err);
      }
    }

    // 2. 兜底：mock 数据
    const category = options.category || app.globalData.currentCategory || 'phone';
    this.renderFromMock(category, MOCK_ORDER_DATA[category]);
  },

  renderFromServer(order) {
    const category = order.categoryCode || 'phone';
    const detail = CATEGORY_DETAIL[category] || CATEGORY_DETAIL.phone;
    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG[1];
    const carbon = this.computeCarbon(category, order.finalAmount || 0);

    this.setData({
      category,
      status: order.status,
      statusText: order.statusText || cfg.text,
      statusIcon: cfg.icon,
      statusBarBg: cfg.bg,
      info: detail,
      photos: order.photoKeys || [],
      amount: order.finalAmount || 0,
      amountText: order.status === 4 ? formatMoney(order.finalAmount) + ' 已到账' : '',
      priceText: order.status === 4 ? '¥' + (Math.round((order.finalAmount || 0) / 100)).toLocaleString() : '',
      orderNo: order.orderNo || order.id || '',
      catText: categoryName(category) + ' · ' + (order.itemName || detail.item),
      createdAt: order.createdAt ? formatDate(order.createdAt, 'YYYY-MM-DD HH:mm') : '',
      completedAt: order.completedAt ? formatDate(order.completedAt, 'YYYY-MM-DD HH:mm') : '',
      pickupAt: order.pickupAt ? formatDate(order.pickupAt, 'YYYY-MM-DD HH:mm') : '',
      pickupAddr: order.pickupAddr || '上海市浦东新区张江高科 · 博云路 2 号',
      cancelReason: order.cancelReason || '',
      rider: order.rider || this.data.rider,
      carbonKg: carbon.kg,
      carbonPoints: carbon.points,
      treeCount: carbon.trees,
      againText: '再次回收',
      loading: false
    });
  },

  renderFromMock(category, data) {
    const detail = CATEGORY_DETAIL[category] || CATEGORY_DETAIL.phone;
    const cfg = STATUS_CONFIG[data.status] || STATUS_CONFIG[4];
    const carbon = this.computeCarbon(category, data.amount);

    this.setData({
      category,
      status: data.status,
      statusText: cfg.text,
      statusIcon: cfg.icon,
      statusBarBg: cfg.bg,
      info: detail,
      photos: [],
      amount: data.amount,
      amountText: data.status === 4
        ? `¥ ${(data.amount / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')} 已到账`
        : '',
      priceText: data.status === 4
        ? '¥' + Math.round(data.amount / 100).toLocaleString()
        : '',
      orderNo: data.id,
      catText: data.cat,
      createdAt: data.time,
      completedAt: data.completedAt,
      pickupAt: '',
      pickupAddr: '上海市浦东新区张江高科 · 博云路 2 号',
      carbonKg: carbon.kg,
      carbonPoints: carbon.points,
      treeCount: carbon.trees,
      againText: '再次回收',
      loading: false
    });
  },

  // 简单碳积分计算（金额 / 100 → 积分；kg = 积分 / 70）
  computeCarbon(category, amount) {
    const points = Math.round(amount / 100) || 100;
    const kg = (points / 70).toFixed(1);
    const trees = (points / 1280).toFixed(2);
    return { points, kg, trees };
  },

  onContact() {
    if (typeof wx.openCustomerServiceChat === 'function') {
      wx.openCustomerServiceChat();
    } else {
      wx.showToast({ title: '联系客服开发中', icon: 'none' });
    }
  },

  onApplyAfterSale() {
    wx.showModal({
      title: '申请售后',
      content: '请描述您遇到的问题',
      editable: true,
      placeholderText: '请输入问题描述',
      success: (res) => {
        if (res.confirm && res.content && this.data.orderId) {
          api.applyAfterSale(this.data.orderId, { reason: res.content })
            .then(() => wx.showToast({ title: '已提交' }))
            .catch(() => wx.showToast({ title: '提交失败', icon: 'none' }));
        }
      }
    });
  },

  onAgain() {
    app.globalData.currentCategory = this.data.category;
    wx.navigateTo({ url: '/pages/photo-upload/photo-upload' });
  },

  onTrack() {
    wx.navigateTo({ url: `/pages/order-track/order-track?id=${this.data.orderId}` });
  },

  onCert() {
    wx.showToast({ title: '环保证书开发中', icon: 'none' });
  },

  onBack() {
    wx.navigateBack();
  }
});
