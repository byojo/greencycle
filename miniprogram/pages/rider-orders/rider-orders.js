const api = require('../../services/api.js');
const { formatDate } = require('../../utils/format.js');
const { requirePrivacy } = require('../../utils/privacy.js');

function pad2(n) { return String(n).padStart(2, '0'); }

// 当前月字符串 YYYY-MM
function currentMonthStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

// 月份标签，如 2026-07 -> "26年07月"
function formatMonthLabel(yyyymm) {
  const [y, m] = yyyymm.split('-').map(Number);
  return `${String(y).slice(2)}年${pad2(m)}月`;
}

// 上一月字符串，如 2026-01 -> 2025-12
function getPrevMonth(yyyymm) {
  const [y, m] = yyyymm.split('-').map(Number);
  let ny = y, nm = m - 1;
  if (nm === 0) { nm = 12; ny -= 1; }
  return `${ny}-${pad2(nm)}`;
}

Page({
  data: {
    currentTab: 0, // 0=回收工单, 1=配送任务
    orders: [],
    filteredOrders: [],
    deliveries: [],
    loading: true,
    currentFilter: 0,
    filters: [
      { value: 0, label: '全部' },
      { value: 2, label: '待回收' },
      { value: 3, label: '已取件' },
      { value: 4, label: '已完成' }
    ],
    statusMap: { 1: '待评估', 2: '待回收', 3: '已取件', 4: '已完成', 5: '已取消' },
    showComplete: false,
    completeOrderId: null,
    finalAmount: '',
    // 月份筛选：默认当前月，支持逐月往前加载
    monthCursor: '',     // 当前已加载到的最早月份 YYYY-MM
    prevMonthLabel: '',   // 上一月按钮文案（如 "26年07月"）
    canLoadPrev: false,   // 是否还能继续加载更早月份
    reachedEnd: false,    // 已无更早工单
    loadingPrev: false
  },

  onLoad() {
    this._currentMonth = currentMonthStr();
    this.loadData();
    this.startLocationReport();
  },
  onShow() { this.loadData(); this.startLocationReport(); },
  onHide() { this.stopLocationReport(); },
  onUnload() { this.stopLocationReport(); },
  onPullDownRefresh() { this.loadData().finally(() => wx.stopPullDownRefresh()); },

  // 切换 Tab
  onSwitchTab(e) {
    const tab = parseInt(e.currentTarget.dataset.tab);
    this.setData({ currentTab: tab });
    if (tab === 1 && this.data.deliveries.length === 0) {
      this.loadDeliveries();
    }
  },

  // 定时上报位置
  startLocationReport() {
    this.reportLocation();
    this._locationTimer = setInterval(() => this.reportLocation(), 30000);
  },

  stopLocationReport() {
    if (this._locationTimer) {
      clearInterval(this._locationTimer);
      this._locationTimer = null;
    }
  },

  async reportLocation() {
    try {
      // 隐私合规：上报位置前必须先获用户同意隐私协议
      await requirePrivacy();
      const res = await new Promise((resolve, reject) => {
        wx.getLocation({ type: 'gcj02', success: resolve, fail: reject });
      });
      await api.riderUpdateLocation(res.latitude, res.longitude);
    } catch (e) {}
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      await Promise.all([
        this.loadOrders(this._currentMonth, false),
        this.loadDeliveries()
      ]);
      this.setData({ loading: false });
    } catch (err) {
      this.setData({ loading: false });
    }
  },

  // 加载某月工单。append=true 时追加到已有列表（用于"查看上一月"）
  async loadOrders(month, append) {
    try {
      const res = await api.riderGetOrders({ month });
      const list = (res.data.list || []).map(o => ({
        ...o,
        estimatedAtText: o.estimatedAt ? formatDate(o.estimatedAt, 'YYYY-MM-DD HH:mm') : ''
      }));

      let orders;
      if (append) {
        orders = this.data.orders.concat(list);
      } else {
        orders = list;
      }

      const prev = getPrevMonth(month);
      // 追加上一月后若该月无数据，则不再提供更早入口
      const canLoadPrev = append ? list.length > 0 : true;
      const reachedEnd = append && list.length === 0;

      this.setData({
        orders,
        monthCursor: month,
        prevMonthLabel: formatMonthLabel(prev),
        canLoadPrev,
        reachedEnd,
        loadingPrev: false
      });
      this.applyFilter();
    } catch (err) {
      this.setData({ loadingPrev: false });
      if (!err || err.statusCode !== 403) {
        wx.showToast({ title: err.message || '加载工单失败', icon: 'none' });
      }
    }
  },

  // 轻按查看上一月工单
  async onViewPrevMonth() {
    if (this.data.loadingPrev || !this.data.canLoadPrev) return;
    const prev = getPrevMonth(this.data.monthCursor);
    this.setData({ loadingPrev: true });
    await this.loadOrders(prev, true);
  },

  async loadDeliveries() {
    try {
      const res = await api.riderGetDeliveries({ silent: true });
      const deliveries = (res.data.list || []).map(d => ({
        ...d,
        completedAtText: d.completedAt ? formatDate(d.completedAt, 'MM-DD HH:mm') : ''
      }));
      this.setData({ deliveries });
    } catch (err) {
      // 非专员用户静默忽略
    }
  },

  onFilter(e) {
    this.setData({ currentFilter: e.currentTarget.dataset.value });
    this.applyFilter();
  },

  applyFilter() {
    const f = this.data.currentFilter;
    const filtered = f === 0 ? this.data.orders : this.data.orders.filter(o => o.status === f);
    this.setData({ filteredOrders: filtered });
  },

  async onPick(e) {
    const orderId = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认取件',
      content: '确认已上门取件？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.riderPickOrder(orderId);
            wx.showToast({ title: '已标记取件', icon: 'success' });
            this.loadOrders(this._currentMonth, false);
          } catch (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  onShowComplete(e) {
    this.setData({ showComplete: true, completeOrderId: e.currentTarget.dataset.id, finalAmount: '' });
  },

  closeComplete() { this.setData({ showComplete: false, completeOrderId: null }); },
  stopPropagation() {},

  onViewDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/rider-order-detail/rider-order-detail?id=${id}` });
  },

  onViewDelivery(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/rider-delivery-detail/rider-delivery-detail?id=${id}` });
  },

  // 点击导航：唤起系统地图前往取件/收货点
  onNavigate(e) {
    const { lat, lng, addr } = e.currentTarget.dataset;
    if (!lat || !lng) {
      wx.showToast({ title: '该订单暂无定位信息', icon: 'none' });
      return;
    }
    wx.openLocation({
      latitude: Number(lat),
      longitude: Number(lng),
      name: '回收地址',
      address: addr || '',
      scale: 16,
      fail: () => wx.showToast({ title: '打开地图失败', icon: 'none' })
    });
  },

  onAmountInput(e) { this.setData({ finalAmount: e.detail.value }); },

  async confirmComplete() {
    const amount = Math.round(parseFloat(this.data.finalAmount || 0) * 100);
    if (amount <= 0) { wx.showToast({ title: '请输入金额', icon: 'none' }); return; }
    try {
      await api.riderCompleteOrder(this.data.completeOrderId, { finalAmount: amount });
      wx.showToast({ title: '订单已完成', icon: 'success' });
      this.closeComplete();
      this.loadOrders(this._currentMonth, false);
    } catch (err) {
      wx.showToast({ title: err.message || '操作失败', icon: 'none' });
    }
  },

  async onCompleteDelivery(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认送达',
      content: '确认已将商品送达收货人？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.riderCompleteDelivery(id);
            wx.showToast({ title: '已确认送达', icon: 'success' });
            this.loadDeliveries();
          } catch (err) {
            wx.showToast({ title: err.message || '操作失败', icon: 'none' });
          }
        }
      }
    });
  },

  onPreviewPhoto(e) {
    const urls = e.currentTarget.dataset.urls.map(u => u.url);
    wx.previewImage({ current: e.currentTarget.dataset.current, urls });
  }
});
