// pages/order-confirm/order-confirm.js
const app = getApp();
const api = require('../../services/api.js');
const { formatDate, categoryName } = require('../../utils/format.js');

// 时段定义（含开始分钟数，用于过滤今日过期时段）
const TIME_SLOTS = [
  { start: '10:00', end: '12:00', label: '上午', startMinutes: 10 * 60 },
  { start: '14:00', end: '16:00', label: '下午', startMinutes: 14 * 60 },
  { start: '16:00', end: '18:00', label: '傍晚', startMinutes: 16 * 60 },
  { start: '18:00', end: '20:00', label: '晚上', startMinutes: 18 * 60 }
];

// 可选日期范围：今天 + 后两天 = 未来三天
const DATE_OPTIONS = [
  { offset: 0, key: 'today',    name: '今天' },
  { offset: 1, key: 'tomorrow', name: '明天' },
  { offset: 2, key: 'dayAfter', name: '后天' }
];

// 选时段时的最少缓冲分钟数（防止用户选"马上"的、给回收员准备时间）
const BOOKING_BUFFER_MINUTES = 30;

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
    // 预约时间相关（新结构：由 dateOffset/slotIndex 计算）
    dateOffset: 0,
    dateLabel: '',
    slotIndex: 1,
    slotLabel: '',
    timeLabel: '',
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
    // 从地址选择页返回时，接收选中的地址（联系电话直接取自地址，无需单独输入）
    if (app.globalData.selectedAddress) {
      const addr = app.globalData.selectedAddress;
      this.setData({ address: addr });
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

  // 构造 3 天的日期项（含 "今天（08-14）" 形式的展示标签）
  buildDateOptions() {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return DATE_OPTIONS.map((opt) => {
      const d = new Date(now);
      d.setDate(d.getDate() + opt.offset);
      return {
        ...opt,
        label: `${opt.name}（${formatDate(d, 'MM-DD')}）`,
        dateObj: d
      };
    });
  },

  // 构造某一天的可用时段列表（今日会过滤掉当前时间之前的时段）
  buildSlotOptions(offset) {
    const isToday = offset === 0;
    const now = new Date();
    const minStart = now.getHours() * 60 + now.getMinutes() + BOOKING_BUFFER_MINUTES;
    return TIME_SLOTS
      .map((s, i) => ({ ...s, index: i }))
      .filter((s) => !isToday || s.startMinutes >= minStart);
  },

  initDateTime() {
    const dateOpts = this.buildDateOptions();
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    // 默认选今天；若今日已无可用时段，自动跳到明天
    let pickDate = 0;
    const todaySlots = TIME_SLOTS
      .map((s, i) => ({ ...s, index: i }))
      .filter((s) => s.startMinutes >= nowMin + BOOKING_BUFFER_MINUTES);

    if (todaySlots.length === 0) {
      pickDate = 1;
    }

    // 选时段：今日选最近可用时段（>= now+30min）；非今日默认下午
    let pickSlot = 1;
    if (pickDate === 0) {
      const firstAvail = todaySlots.find((s) => s.startMinutes >= nowMin + BOOKING_BUFFER_MINUTES);
      if (firstAvail) pickSlot = firstAvail.index;
    }

    const dateOpt = dateOpts[pickDate];
    const slotOpt = TIME_SLOTS[pickSlot];

    this.setData({
      dateOffset: pickDate,
      dateLabel: dateOpt.label,
      slotIndex: pickSlot,
      slotLabel: slotOpt.label,
      timeLabel: `${slotOpt.start}-${slotOpt.end}`
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

  // 两步选：先选日期（今天/明天/后天），再选时段（今日已过期时段自动过滤）
  showTimePicker() {
    const dateOpts = this.buildDateOptions();
    const dateItems = dateOpts.map((d) => d.label);

    wx.showActionSheet({
      itemList: dateItems,
      success: (dRes) => {
        const pickedDate = dateOpts[dRes.tapIndex];
        const slotOpts = this.buildSlotOptions(pickedDate.offset);
        if (slotOpts.length === 0) {
          wx.showToast({ title: '该日已无可预约时段，请选其他日期', icon: 'none' });
          return;
        }
        const slotItems = slotOpts.map((s) => `${s.label}（${s.start}-${s.end}）`);
        wx.showActionSheet({
          itemList: slotItems,
          success: (sRes) => {
            const pickedSlot = slotOpts[sRes.tapIndex];
            this.setData({
              dateOffset: pickedDate.offset,
              dateLabel: pickedDate.label,
              slotIndex: pickedSlot.index,
              slotLabel: pickedSlot.label,
              timeLabel: `${pickedSlot.start}-${pickedSlot.end}`
            });
          },
          fail: () => {
            // 用户在时段选择这步取消选点，不动数据
          }
        });
      },
      fail: () => {
        // 用户在日期选择这步取消选点，不动数据
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

    // 联系电话直接取自地址，地址手机号与地址本身同为必填项
    const phone = (this.data.address.phone || '').trim();
    if (!phone) {
      wx.showToast({ title: '该地址未填写手机号，请补全或更换地址', icon: 'none' });
      return;
    }
    if (!/^[\d\s+\-]{7,20}$/.test(phone)) {
      wx.showToast({ title: '该地址手机号格式不正确，请修改地址', icon: 'none' });
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
        pickupName: (addr.name || '').trim(),
        pickupPhone: phone,
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
    // 用 dateOffset（0=今天/1=明天/2=后天）+ slotIndex 精确还原预约时间
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + this.data.dateOffset);
    const slot = TIME_SLOTS[this.data.slotIndex];
    const [h, m] = slot.start.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return formatDate(d, 'YYYY-MM-DD HH:mm:ss');
  },

  onBack() {
    wx.navigateBack();
  }
});
