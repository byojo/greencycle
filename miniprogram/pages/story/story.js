// pages/story/story.js
const api = require('../../services/api.js');

Page({
  data: {
    tabs: [
      { key: 'all', label: '全部', active: true },
      { key: 'video', label: '视频' },
      { key: 'image', label: '图文' }
    ],
    currentTab: 'all',
    feature: null,
    list: [],
    loading: true
  },

  onLoad() {
    this.loadStories();
  },

  onShow() {
    // 同步底部 TabBar（story 是 tab 页，selected=3）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.loadStories();
  },

  async loadStories() {
    try {
      const res = await api.getStories({ size: 10 });
      const list = (res.data.list || []).map(item => ({
        ...item,
        viewText: this.fmtCount(item.viewCount || 0),
        likeText: this.fmtCount(item.likeCount || 0),
        commentText: this.fmtCount(item.commentCount || 2300),
        coverBg: this.coverBg(item.coverEmoji || item.type)
      }));
      this.setData({
        feature: list[0] ? {
          ...list[0],
          durationText: list[0].duration || '02:34',
          commentText: this.fmtCount(list[0].commentCount || 2300)
        } : null,
        list: list.slice(1),
        loading: false
      });
    } catch (err) {
      // 兜底 mock（与原型一致）
      const featureMock = {
        id: 1,
        title: '300 件旧衣改造的亲子礼服，背后是她对女儿的承诺',
        desc: '用 30 个家庭的旧衣物，做成亲子礼服。每一件衣服都值得被温柔告别...',
        viewText: '12.4w',
        likeText: '8.6w',
        commentText: '2.3k',
        author: '故事官阿琳',
        type: 'video',
        duration: '02:34',
        durationText: '02:34',
        coverEmoji: '👗',
        coverBg: 'linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 50%, #34D399 100%)'
      };
      this.setData({
        feature: featureMock,
        list: this.getMockList(),
        loading: false
      });
    }
  },

  getMockList() {
    return [
      {
        id: 2, title: 'iPhone 回收后的"第二人生"：拆解、检测、重生的全过程',
        desc: '跟随镜头走进我们合作的环保工厂，看一台手机的再生之旅...',
        viewText: '8.6w', likeText: '5.2w', timeText: '3天前',
        type: 'video', coverEmoji: '📱',
        coverBg: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)'
      },
      {
        id: 3, title: '女儿小学时的毛绒玩具，去向让人泪目',
        desc: '500 个旧玩偶，消毒、修复后送到了山区幼儿园，孩子们的笑脸比什么都值...',
        viewText: '5.1w', likeText: '3.8w', timeText: '5天前',
        type: 'image', coverEmoji: '🧸',
        coverBg: 'linear-gradient(135deg, #F9A8D4 0%, #F472B6 100%)'
      },
      {
        id: 4, title: '3 万本旧书，跨越 2000 公里，到达这所村小',
        desc: '用户@甜甜圈 一家三口整理了 3 年的旧书，我们全程直播送往云南...',
        viewText: '4.2w', likeText: '2.9w', timeText: '1周前',
        type: 'image', coverEmoji: '📚',
        coverBg: 'linear-gradient(135deg, #93C5FD 0%, #3B82F6 100%)'
      },
      {
        id: 5, title: '旧笔记本翻新记：送给乡村学校的编程课',
        desc: '翻新 200 台旧电脑，每台成本不到 200 元，让山里孩子也能学编程...',
        viewText: '3.8w', likeText: '2.6w', timeText: '2周前',
        type: 'video', coverEmoji: '💻',
        coverBg: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)'
      }
    ];
  },

  // 千/万单位格式化（WXML 不可用 .toFixed）
  fmtCount(num) {
    if (num === null || num === undefined) return '0';
    const n = Number(num);
    if (isNaN(n)) return '0';
    if (n >= 10000) {
      return (n / 10000).toFixed(1).replace(/\.0$/, '') + 'w';
    }
    if (n >= 1000) {
      return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return String(n);
  },

  // 根据 cover 推导背景渐变（WXML 不可做条件运算）
  coverBg(emojiOrType) {
    if (!emojiOrType) return 'linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 100%)';
    const map = {
      '👗': 'linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 50%, #34D399 100%)',
      '📱': 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
      '💻': 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
      '🧸': 'linear-gradient(135deg, #F9A8D4 0%, #F472B6 100%)',
      '📚': 'linear-gradient(135deg, #93C5FD 0%, #3B82F6 100%)'
    };
    return map[emojiOrType] || 'linear-gradient(135deg, #A7F3D0 0%, #6EE7B7 100%)';
  },

  onTabChange(e) {
    const key = e.currentTarget.dataset.key;
    const tabs = this.data.tabs.map(t => ({ ...t, active: t.key === key }));
    this.setData({ tabs, currentTab: key });
  },

  onPublish() {
    wx.showToast({ title: '发布功能开发中', icon: 'none' });
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({ title: '打开故事详情', icon: 'none' });
  },

  onShareAppMessage() {
    return {
      title: '纸飞机改造故事',
      path: '/pages/story/story'
    };
  }
});
