// app.js
const api = require('./services/api.js');
const config = require('./config.js');

App({
  globalData: {
    userInfo: null,
    token: '',
    currentCategory: 'phone',
    apiBase: config.apiBase,
    useMock: config.useMock,
    systemInfo: null
  },

  onLaunch() {
    // 获取系统信息
    this.getSystemInfo();

    // 检查更新
    this.checkUpdate();

    // 恢复登录态
    this.restoreLogin();

    // 获取全局配置
    this.fetchConfig();
  },

  onShow() {
    // 小程序回到前台
  },

  onError(err) {
    console.error('[App Error]', err);
    // 上报错误日志
  },

  // 获取系统信息
  getSystemInfo() {
    try {
      const windowInfo = wx.getWindowInfo();
      const deviceInfo = wx.getDeviceInfo();
      const appBaseInfo = wx.getAppBaseInfo();
      this.globalData.systemInfo = {
        ...windowInfo,
        ...deviceInfo,
        ...appBaseInfo,
        statusBarHeight: windowInfo.statusBarHeight || 20
      };
    } catch (e) {
      this.globalData.systemInfo = wx.getSystemInfoSync();
    }
  },

  // 检查更新
  checkUpdate() {
    if (!wx.getUpdateManager) return;
    const updateManager = wx.getUpdateManager();
    updateManager.onCheckForUpdate(() => {});
    updateManager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已就绪，是否立即重启？',
        success: (res) => {
          if (res.confirm) updateManager.applyUpdate();
        }
      });
    });
  },

  // 恢复登录态
  restoreLogin() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
    }
  },

  // 微信登录
  async login() {
    try {
      // 1. wx.login 获取 code
      const { code } = await this.wxLogin();

      // 2. 调服务端登录接口，换取 token
      const res = await api.login(code);
      const { token, user } = res.data;

      this.globalData.token = token;
      this.globalData.userInfo = user;

      wx.setStorageSync('token', token);
      wx.setStorageSync('userInfo', user);

      return token;
    } catch (err) {
      console.error('登录失败', err);
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      throw err;
    }
  },

  // 封装 wx.login 为 Promise
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: resolve,
        fail: reject
      });
    });
  },

  // 退出登录
  logout() {
    this.globalData.token = '';
    this.globalData.userInfo = null;
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.reLaunch({ url: '/pages/home/home' });
  },

  // 获取全局配置
  async fetchConfig() {
    try {
      const res = await api.getConfig();
      // 缓存配置
      wx.setStorageSync('appConfig', res.data);
    } catch (err) {
      console.warn('获取配置失败', err);
    }
  }
});