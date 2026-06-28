// pages/order-track/order-track.js
const app = getApp();
const api = require('../../services/api.js');
const { formatDate, categoryName } = require('../../utils/format.js');

const CATEGORY_INFO = {
  phone:   { icon: '📱', name: '手机',     item: 'iPhone 14 Pro · 256G' },
  clothes: { icon: '👕', name: '衣物',     item: '旧衣物 · 8.5kg' },
  digital: { icon: '💻', name: '数码',     item: 'MacBook Pro · 13寸' },
  home:    { icon: '🔌', name: '家电',     item: '美的空调 · 1.5匹' },
  luxury:  { icon: '👜', name: '闲置包',   item: 'Coach 手提包' },
  book:    { icon: '📚', name: '书籍',     item: '旧书籍 · 23 本' },
  metal:   { icon: '🥫', name: '废品',     item: '纸壳 + 塑料瓶' }
};

// 4 步进度状态：已下单 / 已派单 / 上门中 / 已完成
// progress: 0 = 刚下单, 1 = 已派单, 2 = 上门中, 3 = 已完成
function buildTimeline(progress) {
  const steps = [
    { id: 1, step: 'STEP 1', title: '已下单',  time: '2026-06-28 13:42 · 系统' },
    { id: 2, step: 'STEP 2', title: '已派单',  time: '13:45 · 张师傅 已接单' },
    { id: 3, step: 'STEP 3', title: '上门中',  time: '14:22 · 距您 1.2km' },
    { id: 4, step: 'STEP 4', title: '已完成',  time: '环保处理 / 二次流通' }
  ];
  return steps.map((s, i) => {
    let status = 'pending';
    if (i < progress) status = 'done';
    else if (i === progress) status = 'active';
    return { ...s, status };
  });
}

Page({
  data: {
    orderId: '',
    orderNo: 'GC20260628001',
    catText: '手机 · iPhone 14 Pro',
    estimatedAt: '2026-06-28 14:00-16:00',
    rider: {
      name: '张师傅',
      avatar: '张',
      phone: '138 **** 8862',
      plate: '沪 A·8862',
      rating: '4.95'
    },
    eta: 8,
    distance: '1.2km',
    stateText: '🚴 骑手正在前往',
    etaTitle: '预计 14:30 到达',
    timeline: [],
    progress: 2,
    loading: true
  },

  onLoad(options) {
    const orderId = options.id || '';
    this.setData({ orderId });
    this.loadTrack(options);
  },

  async loadTrack(options) {
    // 1. 服务端加载
    if (this.data.orderId) {
      try {
        const res = await api.getOrderDetail(this.data.orderId);
        if (res && res.data) {
          this.renderFromServer(res.data);
          return;
        }
      } catch (err) {
        console.warn('加载订单详情失败', err);
      }
      try {
        const res2 = await api.getOrderTimeline(this.data.orderId);
        if (res2 && res2.data && res2.data.list) {
          this.renderFromTimeline(res2.data.list);
          return;
        }
      } catch (err) {
        console.warn('加载时间线失败', err);
      }
    }

    // 2. 兜底：根据 category + 默认进度
    const category = options.category || app.globalData.currentCategory || 'phone';
    const info = CATEGORY_INFO[category] || CATEGORY_INFO.phone;
    this.renderMock(category, info, this.data.progress);
  },

  renderFromServer(order) {
    const code = order.categoryCode || 'phone';
    const info = CATEGORY_INFO[code] || CATEGORY_INFO.phone;
    const progress = this.statusToProgress(order.status);
    const rider = order.rider || this.data.rider;

    this.setData({
      orderNo: order.orderNo || order.id || this.data.orderNo,
      catText: info.name + ' · ' + (order.itemName || info.item),
      estimatedAt: order.estimatedAt
        ? formatDate(order.estimatedAt, 'YYYY-MM-DD HH:mm')
        : this.data.estimatedAt,
      rider: {
        ...rider,
        avatar: rider.name ? rider.name.charAt(0) : '骑'
      },
      timeline: buildTimeline(progress),
      progress,
      stateText: this.getStateText(progress),
      etaTitle: this.getEtaTitle(progress),
      loading: false
    });
  },

  renderFromTimeline(list) {
    // 服务端返回的 list：按 progress 计算
    const progress = Math.min(Math.max((list || []).length - 1, 0), 3);
    this.setData({
      timeline: buildTimeline(progress),
      progress,
      stateText: this.getStateText(progress),
      etaTitle: this.getEtaTitle(progress),
      loading: false
    });
  },

  renderMock(category, info, progress) {
    this.setData({
      catText: info.name + ' · ' + info.item,
      timeline: buildTimeline(progress),
      progress,
      stateText: this.getStateText(progress),
      etaTitle: this.getEtaTitle(progress),
      loading: false
    });
  },

  statusToProgress(status) {
    // 1 待评估 / 2 已派单 / 3 已取件 / 4 已完成 / 5 已取消
    if (status === 5) return 0;
    if (status === 1) return 0;
    if (status === 2) return 1;
    if (status === 3) return 2;
    if (status === 4) return 3;
    return 2;
  },

  getStateText(progress) {
    if (progress === 0) return '⏳ 等待回收员接单';
    if (progress === 1) return '🚴 骑手已接单';
    if (progress === 2) return '🚴 骑手正在前往';
    if (progress === 3) return '✅ 订单已完成';
    return '🚴 骑手正在前往';
  },
  getEtaTitle(progress) {
    if (progress === 0) return '提交订单成功';
    if (progress === 1) return '回收员已接单';
    if (progress === 2) return '预计 14:30 到达';
    if (progress === 3) return '已为您完成回收';
    return '预计 14:30 到达';
  },

  onCall() {
    wx.makePhoneCall({ phoneNumber: '4000000000' });
  },
  onCallPhone() {
    wx.makePhoneCall({ phoneNumber: '13800138000' });
  },
  onChat() {
    if (typeof wx.openCustomerServiceChat === 'function') {
      wx.openCustomerServiceChat();
    } else {
      wx.showToast({ title: '客服功能开发中', icon: 'none' });
    }
  },
  onShareLocation() {
    wx.showToast({ title: '已发送位置', icon: 'success' });
  },
  onCancel() {
    wx.showModal({
      title: '取消订单',
      content: '确定要取消当前订单吗？',
      success: (res) => {
        if (res.confirm && this.data.orderId) {
          api.cancelOrder(this.data.orderId, '用户主动取消')
            .then(() => {
              wx.showToast({ title: '已取消' });
              setTimeout(() => wx.navigateBack(), 1500);
            })
            .catch(() => wx.showToast({ title: '取消失败', icon: 'none' }));
        }
      }
    });
  },
  onBack() {
    wx.navigateBack();
  }
});
