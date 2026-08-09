const api = require('../../services/api.js');

Page({
  data: {
    riders: [],
    loading: true,
    showAdd: false,
    form: { name: '', phone: '' }
  },

  onLoad() {
    if (!wx.getStorageSync('adminKey')) {
      this.inputAdminKey();
    } else {
      this.loadRiders();
    }
  },
  onShow() { if (wx.getStorageSync('adminKey')) this.loadRiders(); },
  onPullDownRefresh() { this.loadRiders().finally(() => wx.stopPullDownRefresh()); },

  inputAdminKey() {
    wx.showModal({
      title: '管理密钥',
      content: '请输入 Admin Key',
      editable: true,
      placeholderText: '请输入管理密钥',
      success: (res) => {
        if (res.confirm && res.content) {
          wx.setStorageSync('adminKey', res.content.trim());
          this.loadRiders();
        } else {
          wx.navigateBack();
        }
      }
    });
  },

  checkAdminError(err) {
    if (err && (err.code === 403 || (err.message && err.message.includes('无管理权限')))) {
      wx.removeStorageSync('adminKey');
      this.inputAdminKey();
      return true;
    }
    return false;
  },

  async loadRiders() {
    try {
      const res = await api.adminGetRiders();
      this.setData({ riders: res.data.list || [], loading: false });
    } catch (err) {
      if (!this.checkAdminError(err)) {
        wx.showToast({ title: err.message || '加载失败', icon: 'none' });
      }
      this.setData({ loading: false });
    }
  },

  onShowAdd() {
    this.setData({ showAdd: true, form: { name: '', phone: '' } });
  },

  closeAdd() { this.setData({ showAdd: false }); },

  stopPropagation() {},

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  async confirmAdd() {
    const { name, phone } = this.data.form;
    if (!name.trim() || !phone.trim()) {
      wx.showToast({ title: '姓名和手机号必填', icon: 'none' });
      return;
    }
    try {
      await api.adminAddRider({ name: name.trim(), phone: phone.trim() });
      wx.showToast({ title: '添加成功', icon: 'success' });
      this.closeAdd();
      this.loadRiders();
    } catch (err) {
      wx.showToast({ title: err.message || '添加失败', icon: 'none' });
    }
  },

  onToggleStatus(e) {
    const id = e.currentTarget.dataset.id;
    const currentStatus = e.currentTarget.dataset.status;
    const newStatus = currentStatus === 1 ? 0 : 1;
    const text = currentStatus === 1 ? '确认设为离职？' : '确认复职？';
    wx.showModal({
      title: '提示',
      content: text,
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.adminUpdateRider(id, { status: newStatus });
            wx.showToast({ title: '操作成功', icon: 'success' });
            this.loadRiders();
          } catch (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  }
});
