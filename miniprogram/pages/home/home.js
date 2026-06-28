// pages/home/home.js
const app = getApp();
const api = require('../../services/api.js');
const { formatNumber, formatDate } = require('../../utils/format.js');

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
    searchKeyword: ''
  },

  onLoad() {
    this.initGreeting();
    this.loadUserInfo();
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

  // 获取微信定位并解析城市名
  async loadLocation() {
    try {
      const { latitude, longitude } = await wx.getLocation({ type: 'gcj02' });
      const res = await wx.request({
        url: `https://apis.map.qq.com/ws/geocoder/v1/`,
        data: {
          location: `${latitude},${longitude}`,
          key: 'SVSBZ-RGUCB-ZQTUS-NZRUU-4U6WZ-CQFQD'
        }
      });
      const city = res.data?.result?.ad_info?.city || '未定位';
      this.setData({ location: city });
    } catch (err) {
      console.warn('定位失败', err);
      this.setData({ location: '定位失败' });
    }
  },

  async loadUserInfo() {
    try {
      const res = await api.getUserInfo();
      this.setData({
        userInfo: res.data,
        location: res.data.city || '定位中...'
      });
      app.globalData.userInfo = res.data;
      wx.setStorageSync('userInfo', res.data);
      // 异步获取微信定位覆盖城市
      this.loadLocation();
    } catch (err) {
      console.warn('加载用户信息失败', err);
      this.loadLocation();
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
      wx.switchTab({ url: '/pages/pick-category/pick-category' });
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
    wx.switchTab({ url: '/pages/story/story' });
  },

  // 分享
  onShareAppMessage() {
    return {
      title: '纸飞机 - 让每一件旧物都值得被温柔对待',
      path: '/pages/home/home',
      imageUrl: ''
    };
  }
});