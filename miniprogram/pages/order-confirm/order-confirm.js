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

  onShow() {
    // 从地址选择页返回时，接收选中的地址
    if (app.globalData.selectedAddress) {
      this.setData({ address: app.globalData.selectedAddress });
      app.globalData.selectedAddress = null;
    }
  },

  // 拼接完整的 CDN URL
  getFullUrl(key) {
    const config = require('../../config.js');
    const cdn = config.cos && config.cos.cdnDomain ? config.cos.cdnDomain : '';
    if (key && key.startsWith('http')) return key;
    return cdn ? `${cdn}/${key}` : key;
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
      wx.showToast({ title: '加载地址失败', icon: 'none' });
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

    // 请求订阅消息授权（用户同意后才能收到订单通知）
    try {
      await wx.requestSubscribeMessage({
        tmplIds: [
          'j4dcmYkCBav2QZ8OZQZZjK69Xu4IhUbd-iYt5UG1N-M',
          'C78o2a0-IRT5hDU520LrS7E29_CXyPLR3YdRa4PI6yI'
        ]
      });
    } catch (e) {
      // 用户拒绝订阅不影响下单流程
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...', mask: true });

    try {
      const pending = app.globalData.pendingOrder;
      const addr = this.data.address;
      const fullAddr = [addr.province, addr.city, addr.district, addr.detail].filter(Boolean).join('');
      const fd = pending.formData || {};
      const itemName = [
        this.data.info?.name || '',
        fd.model || fd.deviceType || fd.homeType || fd.bookType || fd.metalType || '',
        fd.condition || '',
        fd.weight ? fd.weight + 'kg' : ''
      ].filter(Boolean).join(' · ') || this.data.info.item;
      const res = await api.createOrder({
        categoryCode: pending.category,
        itemName,
        itemDesc: this.data.info.desc,
        photoKeys: pending.photoKeys,
        formData: JSON.stringify(pending.formData || {}),
        estimatedAt: this.buildEstimateTime(),
        pickupAddr: fullAddr || addr.detail,
        pickupLat: addr.lat,
        pickupLng: addr.lng,
        remark: this.data.remark
      });

      app.globalData.pendingOrder = null;

      wx.redirectTo({
        url: `/pages/order-success/order-success?id=${res.data.orderId || res.data.id}`
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
