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
    if (this.data.hasMore && !this.data.loading) {
      this.loadData();
    }
  },

  async loadData() {
    if (this.data.loading === false && !this.data.hasMore) return;
    this.setData({ loading: true });

    try {
      const res = await api.getExchangeHistory({ page: this.data.page, size: 20 });
      const records = res.data.list || [];
      const total = res.data.total || 0;
      const allRecords = this.data.page === 1 ? records : [...this.data.records, ...records];

      this.setData({
        records: allRecords,
        loading: false,
        hasMore: allRecords.length < total,
        page: this.data.page + 1
      });
    } catch (err) {
      console.warn('加载兑换记录失败', err);
      this.setData({ loading: false });
    }
  }
});
