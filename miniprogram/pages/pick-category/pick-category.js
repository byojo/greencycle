// pages/pick-category/pick-category.js
const app = getApp();
const api = require('../../services/api.js');

Page({
  data: {
    categories: [],     // 8 大品类，按 prototype 顺序：衣物 / 手机 / 数码 / 家电 / 书籍 / 废品 / 闲置包 / 全部
    recentItems: [],    // 最近回收历史（最多 5 条）
    loading: true
  },

  onLoad() {
    this.loadCategories();
    this.loadRecent();
  },

  onShow() {},

  async loadCategories() {
    // 接口失败兜底（与原型 1:1 对齐的 8 大品类 · 废品图标为 🥫）
    const fallback = [
      { code: 'clothes', name: '衣物',   icon: '👕', tagline: '5kg起',   bgLight: '#FEF3C7' },
      { code: 'phone',   name: '手机',   icon: '📱', tagline: '高价',     bgLight: '#DBEAFE' },
      { code: 'digital', name: '数码',   icon: '💻', tagline: '笔记本',   bgLight: '#E0E7FF' },
      { code: 'home',    name: '家电',   icon: '🔌', tagline: '上门拆',   bgLight: '#FEE2E2' },
      { code: 'book',    name: '书籍',   icon: '📚', tagline: '公益',     bgLight: '#D1FAE5' },
      { code: 'metal',   name: '废品',   icon: '🥫', tagline: '环保',     bgLight: '#FCE7F3' },
      { code: 'luxury',  name: '闲置包', icon: '👜', tagline: '鉴定',     bgLight: '#F3E8FF' },
      { code: 'more',    name: '全部',   icon: '···', tagline: '敬请期待', bgLight: '#E5E7EB' }
    ];

    try {
      const res = await api.getCategories();
      // 优先使用接口数据，但若缺字段则补齐
      const list = (res.data.list || []).map((it, i) => Object.assign(
        { bgLight: fallback[i] ? fallback[i].bgLight : '#E5E7EB' },
        it
      ));
      // 若接口只返回部分品类，剩余用 fallback 补齐
      const merged = list.length >= 8 ? list : fallback;
      this.setData({ categories: merged, loading: false });
    } catch (err) {
      this.setData({ categories: fallback, loading: false });
    }
  },

  loadRecent() {
    // 从本地读取最近回收的品类（多个）
    const recents = wx.getStorageSync('recentCategories') || [];
    if (!Array.isArray(recents) || recents.length === 0) {
      this.setData({ recentItems: [] });
      return;
    }
    // 用 fallback 数据补全 icon/name
    const map = {
      phone:   { name: 'iPhone 14 Pro', icon: '📱' },
      clothes: { name: '旧衣物',         icon: '👕' },
      digital: { name: '数码产品',       icon: '💻' },
      home:    { name: '家电',           icon: '🔌' },
      book:    { name: '旧书籍',         icon: '📚' },
      metal:   { name: '废品',           icon: '🥫' },
      luxury:  { name: '闲置包',         icon: '👜' }
    };
    const items = recents.slice(0, 5).map(code => ({
      code,
      icon: (map[code] || { icon: '📦' }).icon,
      name: (map[code] || { name: code }).name
    }));
    this.setData({ recentItems: items });
  },

  onCategoryTap(e) {
    const code = e.currentTarget.dataset.code;

    if (code === 'more') {
      wx.showToast({ title: '更多品类开发中', icon: 'none' });
      return;
    }

    app.globalData.currentCategory = code;

    // 记录最近（去重，最多 5 条）
    const recents = wx.getStorageSync('recentCategories') || [];
    const filtered = recents.filter(c => c !== code);
    filtered.unshift(code);
    wx.setStorageSync('recentCategories', filtered.slice(0, 5));

    wx.navigateTo({
      url: `/pages/category-list/category-list?code=${code}`
    });
  },

  onRecentTap(e) {
    const code = e.currentTarget.dataset.code;
    if (!code || code === 'more') return;
    app.globalData.currentCategory = code;
    wx.navigateTo({
      url: `/pages/category-list/category-list?code=${code}`
    });
  },

  onContact() {
    wx.openCustomerServiceChat();
  }
});
