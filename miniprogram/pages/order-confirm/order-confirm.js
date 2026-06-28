// pages/order-confirm/order-confirm.js
const app = getApp();
const api = require('../../services/api.js');
const { formatDate, categoryName } = require('../../utils/format.js');

const TIME_SLOTS = [
  { start: '10:00', end: '12:00', label: '上午' },
  { start: '14:00', end: '16:00', label: '下午' },
  { start: '16:00', end: '18:00', label: '傍晚' },
  { start: '18:00', end: '20:00', label: '晚上' }
];

const CATEGORY_INFO = {
  phone: {
    icon: '📱',
    name: '手机',
    item: 'iPhone 14 Pro · 256G',
    desc: '深空黑 · 95新 · 国行',
    bg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)'
  },
  clothes: {
    icon: '👕',
    name: '衣物',
    item: '旧衣物 · 8.5kg',
    desc: '冬装 · 夏装 · 已分类打包',
    bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)'
  },
  digital: {
    icon: '💻',
    name: '数码',
    item: 'MacBook Pro · 13寸',
    desc: '95新 · 已使用 2 年',
    bg: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)'
  },
  home: {
    icon: '🔌',
    name: '家电',
    item: '美的空调 · 1.5匹',
    desc: '95新 · 需上门拆机',
    bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)'
  },
  luxury: {
    icon: '👜',
    name: '闲置包',
    item: 'Coach 手提包',
    desc: '9成新 · 2022 年购买',
    bg: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)'
  },
  book: {
    icon: '📚',
    name: '书籍',
    item: '旧书籍 · 23 本',
    desc: '教材 · 课外读物',
    bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)'
  },
  metal: {
    icon: '🥫',
    name: '废品',
    item: '纸壳 + 塑料瓶',
    desc: '预估重量 5kg',
    bg: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)'
  }
};

Page({
  data: {
    category: '',
    info: null,
    photos: [],
    address: null,
    dateLabel: '',
    timeLabel: '',
    selectedDate: '',
    selectedTime: '',
    remark: '',
    quantity: '1 件',
    submitting: false
  },

  onLoad(options) {
    const pending = app.globalData.pendingOrder;
    if (!pending) {
      wx.showToast({ title: '订单数据缺失', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1500);
      return;
    }

    const category = pending.category || 'phone';
    const info = CATEGORY_INFO[category] || CATEGORY_INFO.phone;
    const photos = (pending.photoKeys || []).map(key => ({
      url: this.getFullUrl(key)
    }));

    this.setData({
      category,
      info,
      photos,
      quantity: pending.quantity || '1 件'
    });

    this.initDateTime();
    this.loadDefaultAddress();
  },

  // 拼接完整的 CDN URL
  getFullUrl(key) {
    const cdn = 'https://cdn.greencycle.com';
    return key && key.startsWith('http') ? key : `${cdn}/${key}`;
  },

  initDateTime() {
    const today = new Date();
    const todayLabel = `今天（${formatDate(today, 'MM-DD')}）`;
    const defaultTime = TIME_SLOTS[1];  // 默认下午

    this.setData({
      selectedDate: todayLabel,
      dateLabel: todayLabel,
      selectedTime: defaultTime.label,
      timeLabel: `${defaultTime.start}-${defaultTime.end}`
    });
  },

  async loadDefaultAddress() {
    try {
      const res = await api.getAddresses();
      const list = res.data.list || [];
      const defaultAddr = list.find(a => a.isDefault) || list[0];
      if (defaultAddr) {
        this.setData({ address: defaultAddr });
      }
    } catch (err) {
      // mock 数据兜底
      this.setData({
        address: {
          name: '林小满',
          phone: '138****6688',
          fullAddr: '上海市浦东新区张江高科 · 博云路 2 号 28 楼'
        }
      });
    }
  },

  onChooseAddress() {
    wx.navigateTo({ url: '/pages/address/address?select=1' });
  },

  onChooseTime() {
    this.showTimePicker();
  },

  showTimePicker() {
    const items = TIME_SLOTS.map((t, i) => `${i + 1}. ${t.label}（${t.start}-${t.end}）`);
    wx.showActionSheet({
      itemList: items,
      success: (res) => {
        const t = TIME_SLOTS[res.tapIndex];
        this.setData({
          selectedTime: t.label,
          timeLabel: `${t.start}-${t.end}`
        });
      }
    });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  async onSubmit() {
    if (this.data.submitting) return;

    if (!this.data.address) {
      wx.showToast({ title: '请选择回收地址', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...', mask: true });

    try {
      const pending = app.globalData.pendingOrder;
      const res = await api.createOrder({
        categoryCode: pending.category,
        itemName: this.data.info.item,
        itemDesc: this.data.info.desc,
        photoKeys: pending.photoKeys,
        formData: JSON.stringify(pending.formData || {}),
        estimatedAt: this.buildEstimateTime(),
        pickupAddr: this.data.address.fullAddr || this.data.address.detail,
        pickupLat: this.data.address.lat,
        pickupLng: this.data.address.lng,
        remark: this.data.remark
      });

      app.globalData.pendingOrder = null;

      wx.redirectTo({
        url: `/pages/order-success/order-success?id=${res.data.orderId}`
      });
    } catch (err) {
      console.error('创建订单失败', err);
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
      wx.hideLoading();
    }
  },

  buildEstimateTime() {
    const now = new Date();
    if (this.data.selectedDate.includes('今天')) {
      const t = this.data.timeLabel.split('-')[0];
      const parts = t.split(':');
      now.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
    } else {
      now.setDate(now.getDate() + 1);
      const t = this.data.timeLabel.split('-')[0];
      const parts = t.split(':');
      now.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
    }
    return formatDate(now, 'YYYY-MM-DD HH:mm:ss');
  },

  onBack() {
    wx.navigateBack();
  }
});
