// pages/points/points.js
const app = getApp();
const api = require('../../services/api.js');
const { relativeTime } = require('../../utils/format.js');

Page({
  data: {
    balance: 0,
    balanceText: '0',
    carbonKg: 0,
    carbonKgText: '0',
    treeCount: 0,
    tabs: [
      { key: 'all', label: '全部', active: true },
      { key: 'in', label: '收入' },
      { key: 'out', label: '支出' }
    ],
    currentTab: 'all',
    logs: [],
    loading: true
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    // 同步底部 TabBar
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().finally(() => wx.stopPullDownRefresh());
  },

  async loadData() {
    try {
      const [pointsRes, historyRes] = await Promise.all([
        api.getPoints(),
        api.getPointsHistory({ page: 1, size: 30 })
      ]);

      const data = pointsRes.data;
      const balance = data.balance || 0;
      const carbonKg = data.carbonKg || 0;
      const logs = (historyRes.data.list || []).map(l => ({
        ...l,
        timeText: relativeTime(l.createdAt),
        isPositive: l.amount > 0,
        iconText: l.amount > 0 ? '+' : '−',
        deltaText: (l.amount > 0 ? '+' : '') + l.amount
      }));

      this.setData({
        balance,
        balanceText: this.formatNumber(balance),
        carbonKg,
        carbonKgText: this.formatNumber(carbonKg, 1),
        treeCount: data.treeCount || 0,
        logs,
        loading: false
      });
    } catch (err) {
      // 兜底 mock（与原型一致）
      const balance = 1286;
      const carbonKg = 12.6;
      this.setData({
        balance,
        balanceText: this.formatNumber(balance),
        carbonKg,
        carbonKgText: this.formatNumber(carbonKg, 1),
        treeCount: 3,
        logs: this.getMockLogs(),
        loading: false
      });
    }
  },

  getMockLogs() {
    return [
      { id: 1, title: '回收 iPhone 14 Pro', timeText: '2026-06-28', amount: 128, isPositive: true, iconText: '+', deltaText: '+128' },
      { id: 2, title: '每日签到奖励', timeText: '2026-06-28 09:15', amount: 5, isPositive: true, iconText: '+', deltaText: '+5' },
      { id: 3, title: '兑换 · 帆布袋 × 1', timeText: '2026-06-25', amount: 200, isPositive: false, iconText: '−', deltaText: '-200' },
      { id: 4, title: '回收 旧衣物 8kg', timeText: '2026-06-20', amount: 80, isPositive: true, iconText: '+', deltaText: '+80' },
      { id: 5, title: '种树公益奖励', timeText: '2026-06-15', amount: 500, isPositive: true, iconText: '+', deltaText: '+500' }
    ];
  },

  // 千分位格式化（WXML 不可用 .toFixed）
  formatNumber(num, decimals = 0) {
    if (num === null || num === undefined) return '0';
    const n = Number(num);
    if (isNaN(n)) return '0';
    return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
  },

  onTabChange(e) {
    const key = e.currentTarget.dataset.key;
    const tabs = this.data.tabs.map(t => ({ ...t, active: t.key === key }));
    this.setData({ tabs, currentTab: key });
  },

  onSignIn() {
    api.signIn()
      .then(() => {
        wx.showToast({ title: '签到成功 +5', icon: 'success' });
        this.loadData();
      })
      .catch(err => {
        if (err && err.code === 400) {
          wx.showToast({ title: '今日已签到', icon: 'none' });
        } else {
          wx.showToast({ title: '签到失败', icon: 'none' });
        }
      });
  },

  onWithdraw() {
    if (this.data.balance <= 0) {
      wx.showToast({ title: '暂无可提现积分', icon: 'none' });
      return;
    }
    wx.showToast({ title: '提现功能开发中', icon: 'none' });
  },

  onExchange() {
    wx.showToast({ title: '兑换商城开发中', icon: 'none' });
  },

  onRule() {
    wx.showModal({
      title: '碳积分规则',
      content: '1. 完成回收获得积分\n2. 每日签到 +5 积分\n3. 积分可兑换商品/提现\n4. 邀请好友有奖励',
      showCancel: false
    });
  },

  goBack() {
    wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/profile/profile' }) });
  },

  onShareAppMessage() {
    return {
      title: '我的碳积分，让旧物循环起来',
      path: '/pages/points/points'
    };
  }
});
