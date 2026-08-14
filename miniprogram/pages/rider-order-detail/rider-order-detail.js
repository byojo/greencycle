// pages/rider-order-detail/rider-order-detail.js
const api = require('../../services/api.js');
const { formatDate } = require('../../utils/format.js');

// 专员视角状态
const STATUS_CONFIG = {
  1: { text: '待评估', bg: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)' },
  2: { text: '待回收', bg: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' },
  3: { text: '已取件', bg: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
  4: { text: '已完成', bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
  5: { text: '已取消', bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }
};

Page({
  data: {
    orderId: '',
    loading: true,
    order: null,
    status: 0,
    statusText: '',
    statusBarBg: '',
    estimatedAtText: '',
    showComplete: false,
    finalAmount: ''
  },

  onLoad(options) {
    this.setData({ orderId: options.id || '' });
    this.loadDetail();
  },

  async loadDetail() {
    this.setData({ loading: true });
    try {
      const res = await api.riderGetOrderDetail(this.data.orderId);
      if (res && res.data) {
        this.render(res.data);
      } else {
        throw new Error('工单数据为空');
      }
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  render(order) {
    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG[1];
    this.setData({
      order,
      status: order.status,
      statusText: cfg.text,
      statusBarBg: cfg.bg,
      estimatedAtText: order.estimatedAt ? formatDate(order.estimatedAt, 'YYYY-MM-DD HH:mm') : ''
    });
  },

  // 点击地图/导航：唤起系统地图前往取件点
  onNavigate() {
    const o = this.data.order;
    if (!o || !o.pickupLat || !o.pickupLng) {
      wx.showToast({ title: '该工单暂无定位信息', icon: 'none' });
      return;
    }
    wx.openLocation({
      latitude: o.pickupLat,
      longitude: o.pickupLng,
      name: '回收地址',
      address: o.pickupAddr || '',
      scale: 16,
      fail: () => wx.showToast({ title: '打开地图失败', icon: 'none' })
    });
  },

  // 联系客户
  onCallCustomer() {
    const phone = this.data.order && this.data.order.customerPhone;
    if (!phone) {
      wx.showToast({ title: '暂无客户电话', icon: 'none' });
      return;
    }
    wx.makePhoneCall({ phoneNumber: String(phone), fail: () => {} });
  },

  onPick() {
    wx.showModal({
      title: '确认取件',
      content: '确认已上门取件？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.riderPickOrder(this.data.orderId);
            wx.showToast({ title: '已标记取件', icon: 'success' });
            this.loadDetail();
          } catch (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  onShowComplete() {
    this.setData({ showComplete: true, finalAmount: '' });
  },
  closeComplete() { this.setData({ showComplete: false }); },
  onAmountInput(e) { this.setData({ finalAmount: e.detail.value }); },

  async confirmComplete() {
    const amount = Math.round(parseFloat(this.data.finalAmount || 0) * 100);
    if (amount <= 0) { wx.showToast({ title: '请输入金额', icon: 'none' }); return; }
    try {
      await api.riderCompleteOrder(this.data.orderId, { finalAmount: amount });
      wx.showToast({ title: '订单已完成', icon: 'success' });
      this.closeComplete();
      this.loadDetail();
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  onPreviewPhoto(e) {
    const urls = (this.data.order.images || []).map(p => p.url || p);
    wx.previewImage({ current: e.currentTarget.dataset.url, urls });
  },

  onBack() { wx.navigateBack(); }
});
