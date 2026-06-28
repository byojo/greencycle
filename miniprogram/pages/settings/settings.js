// pages/settings/settings.js
const app = getApp();
const api = require('../../services/api.js');

Page({
  data: {
    phoneText: '',
    verified: false,
    verifiedText: '未认证',
    pushOrder: true,
    pushNews: false,
    pushActivity: true,
    cacheText: '0 KB',
    version: '1.0.0',
    hasUpdate: false,
    updateText: '已是最新'
  },

  onLoad() {
    this.loadSettings();
  },

  onShow() {
    this.loadCacheSize();
  },

  async loadSettings() {
    try {
      const res = await api.getUserInfo();
      const u = res.data;
      this.setData({
        phoneText: u.phone ? this.maskPhone(u.phone) : '未绑定',
        verified: u.verified === true,
        verifiedText: u.verified === true ? '已认证' : '未认证',
        version: u.version || '1.0.0'
      });
    } catch (err) {
      // mock 数据
      this.setData({
        phoneText: '138****8888',
        verified: true,
        verifiedText: '已认证'
      });
    }

    // 从本地缓存读取推送设置
    const settings = wx.getStorageSync('settings') || {};
    this.setData({
      pushOrder: settings.pushOrder !== false,
      pushNews: settings.pushNews === true,
      pushActivity: settings.pushActivity !== false
    });
  },

  loadCacheSize() {
    try {
      const res = wx.getStorageInfoSync();
      const kb = (res.currentSize || 0);
      this.setData({
        cacheText: kb < 1024 ? kb + ' KB' : (kb / 1024).toFixed(1) + ' MB'
      });
    } catch (err) {
      this.setData({ cacheText: '0 KB' });
    }
  },

  maskPhone(phone) {
    if (!phone || phone.length < 7) return phone;
    return phone.slice(0, 3) + '****' + phone.slice(-4);
  },

  onBack() {
    wx.navigateBack();
  },

  onPhone() {
    wx.showModal({
      title: '修改手机号',
      content: '更换手机号功能开发中\n请联系客服协助',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  onWechat() {
    wx.showModal({
      title: '微信账号',
      content: '当前已绑定微信账号\n如需解绑请联系客服',
      showCancel: false
    });
  },

  onRealname() {
    if (this.data.verified) {
      wx.showModal({
        title: '实名认证',
        content: '已通过实名认证 ✓',
        showCancel: false
      });
    } else {
      wx.showModal({
        title: '实名认证',
        content: '通过实名认证后将获得更多权益',
        confirmText: '去认证',
        success: (res) => {
          if (res.confirm) {
            wx.showToast({ title: '功能开发中', icon: 'none' });
          }
        }
      });
    }
  },

  onTogglePush(e) {
    const key = e.currentTarget.dataset.key;
    const value = e.detail.value;
    this.setData({ [key]: value });
    const settings = wx.getStorageSync('settings') || {};
    settings[key] = value;
    wx.setStorageSync('settings', settings);
    wx.showToast({ title: '已保存', icon: 'success' });
  },

  onLanguage() {
    wx.showActionSheet({
      itemList: ['简体中文', '繁體中文', 'English'],
      success: (res) => {
        if (res.tapIndex !== 0) {
          wx.showToast({ title: '暂不支持', icon: 'none' });
        }
      }
    });
  },

  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除缓存吗？\n（含历史图片、临时文件）',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '清理中...' });
          setTimeout(() => {
            wx.hideLoading();
            wx.showToast({ title: '清理完成', icon: 'success' });
            this.loadCacheSize();
          }, 800);
        }
      }
    });
  },

  onAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '请前往「纸飞机」官方查看完整协议\n\nhttps://sxyrgy.cn/agreement',
      showCancel: false
    });
  },

  onPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '请前往「纸飞机」官方查看完整隐私政策\n\nhttps://sxyrgy.cn/privacy',
      showCancel: false
    });
  },

  onAbout() {
    wx.showModal({
      title: '纸飞机 ✈️',
      content: '让每一件旧物，都值得被温柔对待\n\nv' + this.data.version + '\n\n微信小程序版',
      showCancel: false
    });
  },

  onCheckUpdate() {
    wx.showLoading({ title: '检查中...' });
    setTimeout(() => {
      wx.hideLoading();
      if (this.data.hasUpdate) {
        wx.showModal({
          title: '有新版本',
          content: '是否前往更新？',
          success: (res) => {
            if (res.confirm) {
              wx.showToast({ title: '暂未上架新版本', icon: 'none' });
            }
          }
        });
      } else {
        wx.showToast({ title: '已是最新版本', icon: 'success' });
      }
    }, 600);
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？\n退出后仍可查看历史订单',
      confirmText: '退出',
      cancelText: '取消',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          app.logout();
        }
      }
    });
  }
});
