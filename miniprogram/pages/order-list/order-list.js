// pages/order-list/order-list.js
const app = getApp();
const api = require('../../services/api.js');
const { formatDate, categoryName, orderStatusText } = require('../../utils/format.js');

// 8 大品类（颜色对齐 design-tokens.md）
const CATEGORY_INFO = {
  phone:   { icon: '📱', bg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)' },
  clothes: { icon: '👕', bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)' },
  digital: { icon: '💻', bg: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)' },
  home:    { icon: '🔌', bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)' },
  luxury:  { icon: '👜', bg: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)' },
  book:    { icon: '📚', bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)' },
  metal:   { icon: '🥫', bg: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)' }
};

const STATUS_COLORS = {
  1: '#6B7280',
  2: '#2563EB',
  3: '#F59E0B',
  4: '#07C160',
  5: '#DC2626'
};

Page({
  data: {
    status: 0,            // 0:全部 1:进行中 4:已完成 5:已取消
    orders: [],
    groupedOrders: [],
    loading: true
  },

  onLoad() {
    this.loadOrders();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    this.loadOrders();
  },

  onPullDownRefresh() {
    this.loadOrders().finally(() => wx.stopPullDownRefresh());
  },

  async loadOrders() {
    try {
      const params = { page: 1, size: 50 };
      if (this.data.status > 0) params.status = this.data.status;
      const res = await api.getOrders(params);

      const list = (res.data.list || []);
      const enriched = list.map(o => this.enrichOrder(o));

      const grouped = this.groupByMonth(enriched);

      this.setData({
        orders: enriched,
        groupedOrders: grouped,
        loading: false
      });
    } catch (err) {
      console.warn('加载订单失败', err);
      this.setData({
        loading: false,
        groupedOrders: this.getMockGroupedOrders()
      });
    }
  },

  // 字段补全：categoryCode (不是 category)、状态文本/颜色、品类图标/背景
  enrichOrder(o) {
    const info = CATEGORY_INFO[o.categoryCode] || CATEGORY_INFO.phone;
    const code = o.categoryCode;
    const status = o.status;

    return {
      ...o,
      icon: info.icon,
      bg: info.bg,
      categoryName: categoryName(code),
      statusText: status ? orderStatusText(status) : '',
      statusColor: status ? (STATUS_COLORS[status] || '#6B7280') : '#6B7280',
      // 解析日期
      date: o.date || (o.createdAt ? this.formatDateShort(o.createdAt) : ''),
      time: o.time || (o.createdAt ? this.formatTimeShort(o.createdAt) : ''),
      // itemName 兜底
      itemName: o.itemName || this.guessItemName(code)
    };
  },

  guessItemName(code) {
    const map = {
      phone: '手机 · 闲置设备',
      clothes: '衣物 · 旧衣回收',
      digital: '数码 · 笔记本',
      home: '家电 · 家用电器',
      luxury: '闲置包 · Coach',
      book: '书籍 · 旧书',
      metal: '废品 · 纸壳'
    };
    return map[code] || '回收物品';
  },

  formatDateShort(date) {
    return formatDate(date, 'MM-DD');
  },
  formatTimeShort(date) {
    return formatDate(date, 'HH:mm');
  },

  // 按月分组
  groupByMonth(list) {
    const map = {};
    list.forEach(o => {
      const date = o.createdAt || o.estimatedAt || '';
      const monthKey = date.slice(0, 7);   // 2026-06
      if (!map[monthKey]) {
        map[monthKey] = {
          month: monthKey,
          monthLabel: this.formatMonthLabel(monthKey),
          list: []
        };
      }
      map[monthKey].list.push(o);
    });
    return Object.values(map).sort((a, b) => b.month.localeCompare(a.month));
  },

  // 月份中文："2026 年 6 月"
  formatMonthLabel(monthKey) {
    if (!monthKey || monthKey.length < 7) return '';
    const parts = monthKey.split('-');
    return `${parts[0]} 年 ${Number(parts[1])} 月`;
  },

  // 兜底 mock 数据
  getMockGroupedOrders() {
    const list = [
      { id: 'm1', categoryCode: 'clothes', itemName: '旧衣物 · 8.5kg',
        icon: '👕', bg: CATEGORY_INFO.clothes.bg,
        categoryName: '衣物', date: '06-25', time: '11:00',
        status: 4, statusText: '已完成', statusColor: STATUS_COLORS[4],
        createdAt: '2026-06-25 11:00:00' },
      { id: 'm2', categoryCode: 'book', itemName: '旧书籍 · 23本',
        icon: '📚', bg: CATEGORY_INFO.book.bg,
        categoryName: '书籍', date: '06-20', time: '16:20',
        status: 4, statusText: '已完成', statusColor: STATUS_COLORS[4],
        createdAt: '2026-06-20 16:20:00' },
      { id: 'm3', categoryCode: 'digital', itemName: 'MacBook Pro · 13寸',
        icon: '💻', bg: CATEGORY_INFO.digital.bg,
        categoryName: '数码', date: '05-28', time: '10:15',
        status: 4, statusText: '已完成', statusColor: STATUS_COLORS[4],
        createdAt: '2026-05-28 10:15:00' },
      { id: 'm4', categoryCode: 'luxury', itemName: '闲置包 · Coach',
        icon: '👜', bg: CATEGORY_INFO.luxury.bg,
        categoryName: '闲置包', date: '05-12', time: '14:50',
        status: 4, statusText: '已完成', statusColor: STATUS_COLORS[4],
        createdAt: '2026-05-12 14:50:00' },
      { id: 'm5', categoryCode: 'phone', itemName: '华为 P50 Pro · 256G',
        icon: '📱', bg: CATEGORY_INFO.phone.bg,
        categoryName: '手机', date: '04-22', time: '15:40',
        status: 4, statusText: '已完成', statusColor: STATUS_COLORS[4],
        createdAt: '2026-04-22 15:40:00' }
    ];
    return this.groupByMonth(list);
  },

  onStatusChange(e) {
    const status = parseInt(e.currentTarget.dataset.status);
    this.setData({ status, loading: true });
    this.loadOrders();
  },

  onOrderTap(e) {
    const orderId = String(e.currentTarget.dataset.id || '');
    const category = e.currentTarget.dataset.category;
    if (orderId && !orderId.startsWith('m')) {
      wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${orderId}` });
    } else {
      wx.navigateTo({ url: `/pages/order-detail/order-detail?category=${category}&mock=1` });
    }
  },

  onFilter() {
    wx.showToast({ title: '筛选功能开发中', icon: 'none' });
  },

  onMore() {
    wx.showToast({ title: '更早订单开发中', icon: 'none' });
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/home' });
  },

  onBack() {
    wx.navigateBack();
  }
});
