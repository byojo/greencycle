const api = require('../../services/api.js');

Page({
  data: {
    records: [],
    loading: true,
    currentFilter: 0,
    filters: [
      { value: 0, label: '全部' },
      { value: 1, label: '待发货' },
      { value: 2, label: '配送中' },
      { value: 3, label: '已完成' },
      { value: 4, label: '已取消' }
    ],
    statusMap: { 1: '待发货', 2: '配送中', 3: '已完成', 4: '已取消' },
    statusColor: { 1: '#F59E0B', 2: '#3B82F6', 3: '#10B981', 4: '#9CA3AF' },
    riders: [],
    showAssign: false,
    assignRecordId: null
  },

  onLoad() {
    if (!wx.getStorageSync('adminKey')) {
      this.promptAdminKey();
    } else {
      this.loadData();
    }
  },

  onShow() {
    if (wx.getStorageSync('adminKey')) {
      this.loadData();
    }
  },

  onPullDownRefresh() {
    this.loadData().finally(() => wx.stopPullDownRefresh());
  },

  promptAdminKey() {
    wx.showModal({
      title: '管理员验证',
      content: '请输入管理密钥',
      editable: true,
      placeholderText: 'Admin Key',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.setStorageSync('adminKey', res.content);
          this.loadData();
        } else {
          wx.navigateBack();
        }
      }
    });
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const [exchangeRes, ridersRes] = await Promise.all([
        api.adminGetExchanges({ status: this.data.currentFilter }),
        api.adminGetRiders()
      ]);
      const records = (exchangeRes.data.list || []).map(r => ({
        ...r,
        createdAtText: this.formatDate(r.createdAt),
        shippedAtText: r.shippedAt ? this.formatDate(r.shippedAt) : '',
        completedAtText: r.completedAt ? this.formatDate(r.completedAt) : ''
      }));
      this.setData({
        records,
        riders: ridersRes.data.list || [],
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      if (err.statusCode === 403) {
        wx.removeStorageSync('adminKey');
        this.promptAdminKey();
      } else {
        wx.showToast({ title: err.message || '加载失败', icon: 'none' });
      }
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },

  onFilter(e) {
    this.setData({ currentFilter: e.currentTarget.dataset.value });
    this.loadData();
  },

  onAssign(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ showAssign: true, assignRecordId: id });
  },

  closeAssign() {
    this.setData({ showAssign: false, assignRecordId: null });
  },

  stopPropagation() {},

  selectRider(e) {
    const riderId = e.currentTarget.dataset.id;
    const riderName = e.currentTarget.dataset.name;
    wx.showModal({
      title: '确认分配',
      content: `确定分配「${riderName}」负责此配送任务？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.adminAssignExchange(this.data.assignRecordId, { riderId });
            wx.showToast({ title: '已分配', icon: 'success' });
            this.closeAssign();
            this.loadData();
          } catch (err) {
            wx.showToast({ title: err.message || '分配失败', icon: 'none' });
          }
        }
      }
    });
  },

  onCancel(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认取消',
      content: '确定取消此兑换工单？取消后积分将原路退回。',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.adminCancelExchange(id);
            wx.showToast({ title: '已取消', icon: 'success' });
            this.loadData();
          } catch (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  onBack() {
    wx.navigateBack();
  }
});
