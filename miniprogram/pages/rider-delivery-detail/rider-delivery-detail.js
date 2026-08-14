// pages/rider-delivery-detail/rider-delivery-detail.js
const api = require('../../services/api.js');
const { formatDate } = require('../../utils/format.js');

// 专员视角配送状态（积分兑换商品配送）
const STATUS_CONFIG = {
  1: { text: '待发货', bg: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)' },
  2: { text: '配送中', bg: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' },
  3: { text: '已送达', bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
  4: { text: '已取消', bg: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }
};

Page({
  data: {
    recordId: '',
    loading: true,
    record: null,
    status: 0,
    statusText: '',
    statusBarBg: '',
    createdAtText: '',
    shippedAtText: '',
    completedAtText: ''
  },

  onLoad(options) {
    this.setData({ recordId: options.id || '' });
    this.loadDetail();
  },

  async loadDetail() {
    this.setData({ loading: true });
    try {
      const res = await api.riderGetDeliveryDetail(this.data.recordId);
      if (res && res.data) {
        this.render(res.data);
      } else {
        throw new Error('配送工单数据为空');
      }
    } catch (err) {
      wx.showToast({ title: err.message || '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  render(record) {
    const cfg = STATUS_CONFIG[record.status] || STATUS_CONFIG[1];
    this.setData({
      record,
      status: record.status,
      statusText: cfg.text,
      statusBarBg: cfg.bg,
      createdAtText: record.createdAt ? formatDate(record.createdAt, 'YYYY-MM-DD HH:mm') : '',
      shippedAtText: record.shippedAt ? formatDate(record.shippedAt, 'YYYY-MM-DD HH:mm') : '',
      completedAtText: record.completedAt ? formatDate(record.completedAt, 'YYYY-MM-DD HH:mm') : ''
    });
  },

  // 点击地图/导航：唤起系统地图前往收货点
  onNavigate() {
    const r = this.data.record;
    if (!r || !r.deliveryLat || !r.deliveryLng) {
      wx.showToast({ title: '该工单暂无定位信息', icon: 'none' });
      return;
    }
    wx.openLocation({
      latitude: Number(r.deliveryLat),
      longitude: Number(r.deliveryLng),
      name: '收货地址',
      address: r.deliveryAddr || '',
      scale: 16,
      fail: () => wx.showToast({ title: '打开地图失败', icon: 'none' })
    });
  },

  // 联系收货人
  onCallCustomer() {
    const phone = this.data.record && this.data.record.deliveryPhone;
    if (!phone) {
      wx.showToast({ title: '暂无收货人电话', icon: 'none' });
      return;
    }
    wx.makePhoneCall({ phoneNumber: String(phone), fail: () => {} });
  },

  onComplete() {
    wx.showModal({
      title: '确认送达',
      content: '确认已将商品送达收货人？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.riderCompleteDelivery(this.data.recordId);
            wx.showToast({ title: '已确认送达', icon: 'success' });
            this.loadDetail();
          } catch (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  onPreviewPhoto(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.previewImage({ current: url, urls: [url] });
  },

  onBack() { wx.navigateBack(); }
});
