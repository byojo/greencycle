// pages/exchange-history/exchange-history.js
const api = require('../../services/api.js');

Page({
  data: {
    records: [],
    loading: true,
    page: 1,
    hasMore: true,
    statusMap: {
      1: '待发货',
      2: '已发货',
      3: '已完成',
      4: '已取消'
    }
  },

  onLoad() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true, records: [] });
    this.loadData().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading && !this.data.loadError) {
      this.loadData();
    }
  },

  async loadData() {
    if (this.data.loading === false && !this.data.hasMore) return;
    this.setData({ loading: true, loadError: false });

    try {
      const res = await api.getExchangeHistory({ page: this.data.page, size: 20 });
      const records = (res.data.list || []).map(r => ({
        ...r,
        createdAtText: this.formatDate(r.createdAt)
      }));
      const total = res.data.total || 0;
      const allRecords = this.data.page === 1 ? records : [...this.data.records, ...records];

      this.setData({
        records: allRecords,
        loading: false,
        loadError: false,
        hasMore: allRecords.length < total,
        page: this.data.page + 1
      });
    } catch (err) {
      console.warn('加载兑换记录失败', err);
      this.setData({ loading: false, loadError: true });
    }
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
});
