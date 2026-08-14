// pages/home/home.js
const app = getApp();
const api = require('../../services/api.js');
const { formatNumber, formatDate } = require('../../utils/format.js');
const { requirePrivacy } = require('../../utils/privacy.js');
const { reverseGeocode: reverseGeocodeUtil } = require('../../utils/geocoder.js');

Page({
  data: {
    userInfo: null,
    location: '定位中...',
    greeting: '',
    // 8 大品类顺序与原型一致：衣物 / 手机 / 数码 / 家电 / 书籍 / 废品 / 闲置包 / 全部
    // 废品图标由 ♻️ 改为 🥫（设计 token 规范）
    categories: [
      { code: 'clothes', name: '衣物',    icon: '👕', color: '#FEF3C7' },
      { code: 'phone',   name: '手机',    icon: '📱', color: '#DBEAFE' },
      { code: 'digital', name: '数码',    icon: '💻', color: '#E0E7FF' },
      { code: 'home',    name: '家电',    icon: '🔌', color: '#FEE2E2' },
      { code: 'book',    name: '书籍',    icon: '📚', color: '#D1FAE5' },
      { code: 'metal',   name: '废品',    icon: '🥫', color: '#FCE7F3' },
      { code: 'luxury',  name: '闲置包',  icon: '👜', color: '#F3E8FF' },
      { code: 'more',    name: '全部',    icon: '···', color: '#E5E7EB' }
    ],
    points: 0,
    carbonKg: 0,
    stories: [],
    searchKeyword: '',
    // 用户手动选择过地址后加锁，避免 onShow 自动定位把它覆盖
    locationLocked: false
  },

  onLoad() {
    this.initGreeting();
    // 数据加载移至 onShow，避免双重请求
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    this.loadUserInfo();
    this.loadPoints();
    this.loadStories();
  },

  onPullDownRefresh() {
    Promise.all([
      this.loadUserInfo(),
      this.loadPoints(),
      this.loadStories()
    ]).finally(() => wx.stopPullDownRefresh());
  },

  initGreeting() {
    const hour = new Date().getHours();
    let greeting = '早上好 ☀️';
    if (hour >= 11 && hour < 14) greeting = '中午好 🌞';
    else if (hour >= 14 && hour < 18) greeting = '下午好 ☕';
    else if (hour >= 18) greeting = '晚上好 🌙';
    this.setData({ greeting });
  },

  // 逆地理编码：经纬度 -> 城市/地址名（用于展示当前位置）
  async reverseGeocode(lat, lng, fallbackName, fallbackAddr) {
    const geo = await reverseGeocodeUtil(lat, lng);
    let label;
    if (geo) {
      label = (geo.city || geo.district || geo.address || '当前位置');
    } else {
      label = fallbackName || fallbackAddr || '当前位置';
    }
    this.setData({ location: label });
    return label;
  },

  // 进入页面自动定位（已授权则静默获取城市，未授权则显示“点击定位”）
  async loadLocation() {
    // 用户已手动选过地址，不再用 GPS 自动覆盖
    if (this.data.locationLocked) return;
    try {
      // 隐私合规：调 getLocation 前必须先获用户同意隐私协议
      await requirePrivacy();
      const { latitude, longitude } = await new Promise((resolve, reject) => {
        wx.getLocation({ type: 'gcj02', success: resolve, fail: reject });
      });
      // 用坐标反查城市名
      await this.reverseGeocode(latitude, longitude);
    } catch (err) {
      console.warn('定位失败', err);
      this.setData({ location: '点击定位' });
    }
  },

  // 点击位置：调起微信地图，触发授权确认 + 位置定位
  async onLocationTap() {
    try {
      // 隐私合规：调 chooseLocation 前必须先获用户同意隐私协议
      await requirePrivacy();
    } catch (e) {
      // 用户拒绝隐私协议 -> 引导去设置开启
      wx.showModal({
        title: '需要位置权限',
        content: '用于展示您所在城市并就近匹配回收专员，请在设置中开启位置权限',
        confirmText: '去设置',
        cancelText: '取消',
        success: (m) => { if (m.confirm) wx.openSetting(); }
      });
      return;
    }
    wx.chooseLocation({
      success: async (res) => {
        // res: { name, address, latitude, longitude } —— 用选点结果更新位置
        this.setData({ locationLocked: true });
        await this.reverseGeocode(res.latitude, res.longitude, res.name, res.address);
      },
      fail: (err) => {
        const msg = (err && err.errMsg) || '';
        // 用户拒绝授权 -> 引导去设置开启
        if (msg.indexOf('auth') >= 0 && msg.indexOf('deny') >= 0) {
          wx.showModal({
            title: '需要位置权限',
            content: '用于展示您所在城市并就近匹配回收专员，请在设置中开启位置权限',
            confirmText: '去设置',
            cancelText: '取消',
            success: (m) => { if (m.confirm) wx.openSetting(); }
          });
        }
        // 用户主动取消选择，不做处理
      }
    });
  },

  async loadUserInfo() {
    try {
      const res = await api.getUserInfo();
      const patch = { userInfo: res.data };
      // 仅当用户未手动选位时，用服务器城市兜底；否则保留手动选择的地址
      if (!this.data.locationLocked) {
        patch.location = res.data.city || '定位中...';
      }
      this.setData(patch);
      app.globalData.userInfo = res.data;
      wx.setStorageSync('userInfo', res.data);
      // 异步获取微信定位覆盖城市（已手动选位则跳过）
      if (!this.data.locationLocked) this.loadLocation();
    } catch (err) {
      console.warn('加载用户信息失败', err);
      if (!this.data.locationLocked) this.loadLocation();
    }
  },

  async loadPoints() {
    try {
      const res = await api.getPoints();
      const carbonKg = res.data.carbonKg || 0;
      // 1 棵树每年吸收 18kg 碳
      const treeCount = carbonKg > 18 ? (carbonKg / 18).toFixed(1) : '0';
      this.setData({
        points: res.data.balance || 0,
        carbonKg,
        treeCount
      });
    } catch (err) {
      console.warn('加载积分失败', err);
      this.setData({ treeCount: '0' });
    }
  },

  async loadStories() {
    try {
      const res = await api.getStories({ size: 3 });
      const list = (res.data.list || []).map((item, idx) => ({
        ...item,
        coverEmoji: ['🌳', '📚', '👜', '💻', '♻️'][idx % 5]
      }));
      this.setData({ stories: list });
    } catch (err) {
      console.warn('加载故事失败', err);
    }
  },

  // 点击分类
  onCategoryTap(e) {
    const code = e.currentTarget.dataset.code;
    if (code === 'more') {
      wx.navigateTo({ url: '/pages/pick-category/pick-category' });
      return;
    }
    app.globalData.currentCategory = code;
    wx.navigateTo({
      url: `/pages/category-list/category-list?code=${code}`
    });
  },

  // 搜索
  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  onSearchConfirm() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/category-list/category-list?keyword=${encodeURIComponent(keyword)}`
    });
  },

  // 加入我们
  onJoinUs() {
    wx.navigateTo({ url: '/pages/join-us/join-us' });
  },

  // 跳到故事页
  goStories() {
    wx.navigateTo({ url: '/pages/story/story' });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '叮当回收 - 让每一件旧物都值得被温柔对待',
      path: '/pages/home/home',
      imageUrl: ''
    };
  }
});