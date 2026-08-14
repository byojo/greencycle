// pages/bind-phone/bind-phone.js
const app = getApp();
const api = require('../../services/api.js');

// 手机号脱敏：138****6688
function maskPhone(p) {
  if (!p || p.length < 7) return p || '';
  return p.slice(0, 3) + '****' + p.slice(7);
}

Page({
  data: {
    currentPhone: '',
    maskedPhone: '',
    manualPhone: '',
    loading: false
  },

  onLoad() {
    const phone = (app.globalData.userInfo && app.globalData.userInfo.phone) || '';
    this.setData({
      currentPhone: phone,
      maskedPhone: maskPhone(phone)
    });
  },

  // 微信一键授权绑定
  async onGetPhone(e) {
    const { code, errMsg } = e.detail;
    if (!code) {
      // 用户拒绝授权
      if (errMsg && errMsg.indexOf('deny') >= 0) {
        wx.showToast({ title: '已取消授权', icon: 'none' });
      } else {
        wx.showToast({ title: '授权失败，可手动填写', icon: 'none' });
      }
      return;
    }
    this._bind({ code });
  },

  onManualInput(e) {
    this.setData({ manualPhone: e.detail.value });
  },

  // 手动填写绑定
  onSaveManual() {
    const phone = (this.data.manualPhone || '').trim();
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的 11 位手机号', icon: 'none' });
      return;
    }
    this._bind({ phone });
  },

  async _bind(payload) {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      const res = await api.bindPhone(payload);
      const phone = (res.data && res.data.phone) || '';
      // 回写全局与本地登录态
      const userInfo = { ...(app.globalData.userInfo || {}), phone };
      app.globalData.userInfo = userInfo;
      wx.setStorageSync('userInfo', userInfo);
      wx.showToast({ title: '绑定成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 600);
    } catch (err) {
      wx.showToast({ title: err.message || '绑定失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onSkip() {
    wx.navigateBack();
  }
});
