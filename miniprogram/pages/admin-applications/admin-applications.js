const api = require('../../services/api.js');
const { formatDate } = require('../../utils/format.js');

Page({
  data: {
    apps: [],
    filteredApps: [],
    loading: true,
    currentFilter: -1,
    filters: [
      { value: -1, label: '全部' },
      { value: 0, label: '待处理' },
      { value: 1, label: '已通过' },
      { value: 2, label: '已拒绝' }
    ],
    statusMap: { 0: '待处理', 1: '已通过', 2: '已拒绝' }
  },

  onLoad() {
    wx.removeStorageSync('adminKey');
    this.inputAdminKey();
  },

  inputAdminKey() {
    wx.showModal({
      title: '管理密钥',
      content: '请输入 Admin Key',
      editable: true,
      placeholderText: '请输入管理密钥',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.setStorageSync('adminKey', res.content.trim());
          this.loadApps();
        } else {
          wx.navigateBack();
        }
      }
    });
  },

  onShow() { if (wx.getStorageSync('adminKey')) this.loadApps(); },
  onPullDownRefresh() { this.loadApps().finally(() => wx.stopPullDownRefresh()); },

  async loadApps() {
    try {
      const res = await api.adminGetApplications({});
      const apps = (res.data.list || []).map(a => ({
        ...a,
        createdAtText: a.createdAt ? formatDate(a.createdAt, 'YYYY-MM-DD HH:mm') : ''
      }));
      this.setData({ apps, loading: false });
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
    const filtered = f === -1 ? this.data.apps : this.data.apps.filter(a => a.status === f);
    this.setData({ filteredApps: filtered });
  },

  onApprove(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '通过申请',
      content: '通过后将自动创建回收专员，确认？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.adminApproveApplication(id, { action: 'approve' });
            wx.showToast({ title: '已通过，专员已创建', icon: 'success' });
            this.loadApps();
          } catch (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  onReject(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '拒绝申请',
      content: '确认拒绝该申请？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.adminApproveApplication(id, { action: 'reject' });
            wx.showToast({ title: '已拒绝', icon: 'success' });
            this.loadApps();
          } catch (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  }
});
