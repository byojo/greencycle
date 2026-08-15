// pages/login/login.js
const app = getApp();

Page({
  data: {
    agreed: false  // 合规：默认未勾选，必须用户主动点击
  },

  onShow() {
    // 同步底部 TabBar（login 不是 tab 页，selected 无意义但调用安全）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  onToggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  async onLogin() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先勾选用户协议和隐私政策', icon: 'none' });
      return;
    }
    try {
      wx.showLoading({ title: '登录中...', mask: true });
      // app.login() 内部用 wx.login() 拿 code 调后端换 token
      // 不再依赖废弃的 getUserInfo 拿头像昵称（基础库 2.21+ 已废弃）
      await app.login();
      wx.hideLoading();
      wx.showToast({ title: '登录成功', icon: 'success' });

      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
      } else {
        wx.switchTab({ url: '/pages/home/home' });
      }
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
  },

  // 可选：用户登录后单独选择头像（不阻塞主流程）
  onChooseAvatar(e) {
    if (e && e.detail && e.detail.avatarUrl) {
      const user = app.globalData.userInfo || {};
      app.globalData.userInfo = {
        ...user,
        avatarUrl: e.detail.avatarUrl
      };
      wx.setStorageSync('userInfo', app.globalData.userInfo);
    }
  },

  onSkip() {
    wx.switchTab({ url: '/pages/home/home' });
  },

  onUserAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '《叮当回收用户协议》规定了您使用本服务时的权利与义务。完整条款见：https://sxyrgy.cn/privacy',
      showCancel: false
    });
  },

  onPrivacyPolicy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们依据《隐私保护指引》收集并使用你的信息（位置、手机号、订单与图片等）。完整条款见：https://sxyrgy.cn/privacy',
      showCancel: false
    });
  }
});
