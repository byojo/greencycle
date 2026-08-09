const api = require('../../services/api.js');

Page({
  data: {
    orders: [],
    loading: true,
    needKey: false,
    currentFilter: 0,
    filters: [
      { value: 0, label: '全部' },
      { value: 1, label: '待评估' },
      { value: 2, label: '已派单' },
      { value: 3, label: '已取件' },
      { value: 4, label: '已完成' },
      { value: 5, label: '已取消' }
    ],
    statusMap: { 1: '待评估', 2: '已派单', 3: '已取件', 4: '已完成', 5: '已取消' },
    showAssign: false,
    assignOrderId: null,
    riders: [],
    riderIndex: 0,
    showComplete: false,
    completeOrderId: null,
    finalAmount: ''
  },

  onLoad() {
    // 检查是否已配置 Admin Key
    if (!wx.getStorageSync('adminKey')) {
      this.setData({ needKey: true });
      this.inputAdminKey();
    } else {
      this.loadOrders();
    }
  },

  inputAdminKey() {
    wx.showModal({
      title: '管理密钥',
      content: '请输入 Admin Key',
      editable: true,
      placeholderText: 'c7b3f90c...',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.setStorageSync('adminKey', res.content.trim());
          this.setData({ needKey: false });
          this.loadOrders();
        } else {
          wx.navigateBack();
        }
      }
    });
  },

  onShow() {
    this.loadOrders();
  },

  onPullDownRefresh() {
    this.loadOrders().finally(() => wx.stopPullDownRefresh());
  },

  onFilter(e) {
    this.setData({ currentFilter: e.currentTarget.dataset.value, loading: true });
    this.loadOrders();
  },

  async loadOrders() {
    try {
      const params = {};
      if (this.data.currentFilter > 0) params.status = this.data.currentFilter;
      const res = await api.adminGetOrders(params);
      this.setData({ orders: res.data.list || [], loading: false });
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async onAssign(e) {
    const orderId = e.currentTarget.dataset.id;
    try {
      const res = await api.adminGetRiders();
      const riders = (res.data.list || []).filter(r => r.status === 1).map(r => ({
        id: r.id,
        label: `${r.name} · ${r.phone} · 评分${r.rating}`
      }));
      this.setData({ showAssign: true, assignOrderId: orderId, riders, riderIndex: 0 });
    } catch (err) {
      wx.showToast({ title: '获取回收专员列表失败', icon: 'none' });
    }
  },

  onRiderPick(e) {
    this.setData({ riderIndex: e.detail.value });
  },

  closeAssign() {
    this.setData({ showAssign: false, assignOrderId: null });
  },

  async confirmAssign() {
    const rider = this.data.riders[this.data.riderIndex];
    if (!rider) { wx.showToast({ title: '请选择回收专员', icon: 'none' }); return; }
    try {
      await api.adminAssignOrder(this.data.assignOrderId, { riderId: rider.id });
      wx.showToast({ title: '派单成功', icon: 'success' });
      this.closeAssign();
      this.loadOrders();
    } catch (err) {
      wx.showToast({ title: err.message || '派单失败', icon: 'none' });
    }
  },

  onUpdateStatus(e) {
    const orderId = e.currentTarget.dataset.id;
    const status = e.currentTarget.dataset.status;
    const text = status === 3 ? '确认标记为已取件？' : '确认取消订单？';
    wx.showModal({
      title: '提示',
      content: text,
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.adminUpdateOrderStatus(orderId, { status });
            wx.showToast({ title: '操作成功', icon: 'success' });
            this.loadOrders();
          } catch (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  onComplete(e) {
    this.setData({ showComplete: true, completeOrderId: e.currentTarget.dataset.id, finalAmount: '' });
  },

  closeComplete() {
    this.setData({ showComplete: false, completeOrderId: null });
  },

  onAmountInput(e) {
    this.setData({ finalAmount: e.detail.value });
  },

  async confirmComplete() {
    const amount = Math.round(parseFloat(this.data.finalAmount || 0) * 100);
    try {
      await api.adminCompleteOrder(this.data.completeOrderId, { finalAmount: amount });
      wx.showToast({ title: '订单已完成', icon: 'success' });
      this.closeComplete();
      this.loadOrders();
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  }
});
