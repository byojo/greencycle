const api = require('../../services/api.js');
const { formatDate } = require('../../utils/format.js');

Page({
  data: {
    orders: [],
    filteredOrders: [],
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

  onLoad() { this.loadOrders(); this.startLocationReport(); },
  onShow() { this.loadOrders(); this.startLocationReport(); },
  onHide() { this.stopLocationReport(); },
  onUnload() { this.stopLocationReport(); },
  onPullDownRefresh() { this.loadOrders().finally(() => wx.stopPullDownRefresh()); },

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
      const res = await new Promise((resolve, reject) => {
        wx.getLocation({ type: 'gcj02', success: resolve, fail: reject });
      });
      await api.riderUpdateLocation(res.latitude, res.longitude);
    } catch (e) {}
  },

  async loadOrders() {
    try {
      const res = await api.riderGetOrders();
      const orders = (res.data.list || []).map(o => ({
        ...o,
        estimatedAtText: o.estimatedAt ? formatDate(o.estimatedAt, 'MM-DD HH:mm') : ''
      }));
      this.setData({ orders, loading: false });
      this.applyFilter();
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
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

  onPreviewPhoto(e) {
    const urls = e.currentTarget.dataset.urls.map(u => u.url);
    wx.previewImage({ current: e.currentTarget.dataset.current, urls });
  }
});
