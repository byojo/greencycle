const api = require('../../services/api.js');
const { formatDate } = require('../../utils/format.js');
const { requirePrivacy } = require('../../utils/privacy.js');

Page({
  data: {
    currentTab: 0, // 0=回收工单, 1=配送任务
    orders: [],
    filteredOrders: [],
    deliveries: [],
    loading: true,
    currentFilter: 0,
    filters: [
      { value: 0, label: '全部' },
      { value: 2, label: '待回收' },
      { value: 3, label: '已取件' },
      { value: 4, label: '已完成' }
    ],
    statusMap: { 1: '待评估', 2: '待回收', 3: '已取件', 4: '已完成', 5: '已取消' },
    showComplete: false,
    completeOrderId: null,
    finalAmount: ''
  },

  onLoad() { this.loadData(); this.startLocationReport(); },
  onShow() { this.loadData(); this.startLocationReport(); },
  onHide() { this.stopLocationReport(); },
  onUnload() { this.stopLocationReport(); },
  onPullDownRefresh() { this.loadData().finally(() => wx.stopPullDownRefresh()); },

  // 切换 Tab
  onSwitchTab(e) {
    const tab = parseInt(e.currentTarget.dataset.tab);
    this.setData({ currentTab: tab });
    if (tab === 1 && this.data.deliveries.length === 0) {
      this.loadDeliveries();
    }
  },

  // 定时上报位置
  startLocationReport() {
    this.reportLocation();
    this._locationTimer = setInterval(() => this.reportLocation(), 30000);
  },

  stopLocationReport() {
    if (this._locationTimer) {
      clearInterval(this._locationTimer);
      this._locationTimer = null;
    }
  },

  async reportLocation() {
    try {
      // 隐私合规：上报位置前必须先获用户同意隐私协议
      await requirePrivacy();
      const res = await new Promise((resolve, reject) => {
        wx.getLocation({ type: 'gcj02', success: resolve, fail: reject });
      });
      await api.riderUpdateLocation(res.latitude, res.longitude);
    } catch (e) {}
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      await Promise.all([
        this.loadOrders(),
        this.loadDeliveries()
      ]);
      this.setData({ loading: false });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  async loadOrders() {
    try {
      const res = await api.riderGetOrders();
      const orders = (res.data.list || []).map(o => ({
        ...o,
        estimatedAtText: o.estimatedAt ? formatDate(o.estimatedAt, 'MM-DD HH:mm') : ''
      }));
      this.setData({ orders });
      this.applyFilter();
    } catch (err) {
      if (!err || err.statusCode !== 403) {
        wx.showToast({ title: err.message || '加载工单失败', icon: 'none' });
      }
    }
  },

  async loadDeliveries() {
    try {
      const res = await api.riderGetDeliveries({ silent: true });
      const deliveries = (res.data.list || []).map(d => ({
        ...d,
        completedAtText: d.completedAt ? formatDate(d.completedAt, 'MM-DD HH:mm') : ''
      }));
      this.setData({ deliveries });
    } catch (err) {
      // 非专员用户静默忽略
    }
  },

  onFilter(e) {
    this.setData({ currentFilter: e.currentTarget.dataset.value });
    this.applyFilter();
  },

  applyFilter() {
    const f = this.data.currentFilter;
    const filtered = f === 0 ? this.data.orders : this.data.orders.filter(o => o.status === f);
    this.setData({ filteredOrders: filtered });
  },

  async onPick(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认取件',
      content: '确认已上门取件？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.riderPickOrder(orderId);
            wx.showToast({ title: '已标记取件', icon: 'success' });
            this.loadOrders();
          } catch (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  onShowComplete(e) {
    this.setData({ showComplete: true, completeOrderId: e.currentTarget.dataset.id, finalAmount: '' });
  },

  closeComplete() { this.setData({ showComplete: false, completeOrderId: null }); },
  stopPropagation() {},

  onViewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` });
  },

  onAmountInput(e) { this.setData({ finalAmount: e.detail.value }); },

  async confirmComplete() {
    const amount = Math.round(parseFloat(this.data.finalAmount || 0) * 100);
    if (amount <= 0) { wx.showToast({ title: '请输入金额', icon: 'none' }); return; }
    try {
      await api.riderCompleteOrder(this.data.completeOrderId, { finalAmount: amount });
      wx.showToast({ title: '订单已完成', icon: 'success' });
      this.closeComplete();
      this.loadOrders();
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  async onCompleteDelivery(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认送达',
      content: '确认已将商品送达收货人？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.riderCompleteDelivery(id);
            wx.showToast({ title: '已确认送达', icon: 'success' });
            this.loadDeliveries();
          } catch (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  onPreviewPhoto(e) {
    const urls = e.currentTarget.dataset.urls.map(u => u.url);
    wx.previewImage({ current: e.currentTarget.dataset.current, urls });
  }
});
