// pages/exchange/exchange.js
const app = getApp();
const api = require('../../services/api.js');

Page({
  data: {
    items: [],
    myPoints: 0,
    loading: true,
    selectedItem: null,
    showConfirm: false,
    addresses: [],
    selectedAddress: null,
    quantity: 1, // 当前兑换数量
    maxQuantity: 1 // 当前商品最大可兑换数量
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '积分商城' });
  },

  onShow() {
    // 检查是否有从地址页返回的选中地址
    if (app.globalData.selectedAddress) {
      this.setData({ selectedAddress: app.globalData.selectedAddress });
      app.globalData.selectedAddress = null;
    }
    this.loadData();
    this.loadAddresses();
  },

  async loadData() {
    try {
      this.setData({ loading: true });
      const [itemsRes, pointsRes] = await Promise.all([
        api.getExchangeItems(),
        api.getPoints()
      ]);
      const items = (itemsRes.data || []).map((item, index) => ({
        ...item,
        icon: this.getItemIcon(index),
        bgColor: this.getItemBgColor(index),
        imageError: false
      }));
      this.setData({
        items,
        myPoints: pointsRes.data?.balance || 0,
        loading: false
      });
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败，请下拉刷新', icon: 'none' });
    }
  },

  getItemIcon(index) {
    const icons = ['🛍', '🏅', '🌱', '🥤', '🪥'];
    return icons[index % icons.length];
  },

  getItemBgColor(index) {
    const colors = ['#ECFDF5', '#FEF3C7', '#D1FAE5', '#DBEAFE', '#FCE7F3'];
    return colors[index % colors.length];
  },

  onImageError(e) {
    const index = e.currentTarget.dataset.index;
    const items = this.data.items;
    if (items[index]) {
      items[index].imageError = true;
      this.setData({ items });
    }
  },

  async loadAddresses() {
    try {
      const res = await api.getAddresses();
      const list = res.data.list || [];
      // 如果已有选中地址（从地址页返回的），不覆盖
      if (!this.data.selectedAddress) {
        const defaultAddr = list.find(a => a.isDefault) || list[0];
        this.setData({ addresses: list, selectedAddress: defaultAddr });
      } else {
        this.setData({ addresses: list });
      }
    } catch (err) {
      this.setData({ addresses: [], selectedAddress: null });
    }
  },

  getMockItems() {
    return [
      { id: 1, name: '环保帆布袋', desc: '可循环使用的棉布购物袋', image: '', points: 200, stock: 100 },
      { id: 2, name: '碳中和徽章', desc: '绿循环官方认证碳中和徽章', image: '', points: 500, stock: 200 },
      { id: 3, name: '绿植种子套装', desc: '包含 3 种适合家养的绿植种子', image: '', points: 800, stock: 50 },
      { id: 4, name: '保温杯', desc: '不锈钢真空保温杯', image: '', points: 1500, stock: 30 },
      { id: 5, name: '电动牙刷', desc: '声波震动牙刷', image: '', points: 3000, stock: 20 }
    ];
  },

  onItemTap(e) {
    const item = e.currentTarget.dataset.item;
    if (item.stock <= 0) {
      wx.showToast({ title: '库存不足', icon: 'none' });
      return;
    }
    // 计算最大可兑换数量：min(剩余库存, 我的积分/单价, 限购-已兑次数)
    // 已兑次数前端不直接持锁，按 后端库存 + 积分上限 给一个乐观的本地最大值
    const pointsBudget = Math.floor(this.data.myPoints / (item.points || 1));
    const stockCap = item.stock;
    const maxQty = Math.max(1, Math.min(stockCap, pointsBudget || stockCap));
    this.setData({
      selectedItem: item,
      showConfirm: true,
      quantity: 1,
      maxQuantity: maxQty
    });
  },

  onCloseConfirm() {
    this.setData({ showConfirm: false, selectedItem: null, quantity: 1 });
  },

  // 数量加减
  onMinusQty() {
    const q = this.data.quantity;
    if (q > 1) {
      this.setData({ quantity: q - 1 });
    }
  },

  onPlusQty() {
    const q = this.data.quantity;
    const max = this.data.maxQuantity;
    if (q < max) {
      this.setData({ quantity: q + 1 });
    } else {
      wx.showToast({ title: `最多可兑换 ${max} 件`, icon: 'none' });
    }
  },

  onQtyInput(e) {
    const raw = parseInt(e.detail.value, 10);
    if (isNaN(raw) || raw < 1) {
      this.setData({ quantity: 1 });
      return;
    }
    const max = this.data.maxQuantity;
    if (raw > max) {
      wx.showToast({ title: `最多可兑换 ${max} 件`, icon: 'none' });
      this.setData({ quantity: max });
      return;
    }
    this.setData({ quantity: raw });
  },

  onSelectAddress() {
    // 跳转到地址页选择，选择后会通过 setData 回传
    wx.navigateTo({ url: '/pages/address/address?select=1' });
  },

  onExchange() {
    const { selectedItem, selectedAddress, myPoints, quantity } = this.data;
    if (!selectedAddress) {
      wx.showToast({ title: '请先选择收货地址', icon: 'none' });
      return;
    }
    const totalCost = selectedItem.points * quantity;
    if (myPoints < totalCost) {
      wx.showToast({ title: '积分不足', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认兑换',
      content: `确定用 ${totalCost} 积分兑换「${selectedItem.name}」× ${quantity} 件吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.exchangeItem({
              itemId: selectedItem.id,
              addressId: selectedAddress.id,
              quantity
            });
            this.onCloseConfirm();
            this.loadData();
            // 兑换成功提示
            wx.showModal({
              title: '🎉 兑换成功',
              content: `「${selectedItem.name}」× ${quantity} 件将在 7 个工作日内为您配送送达，请保持电话畅通，注意查收。`,
              showCancel: false,
              confirmText: '我知道了'
            });
          } catch (err) {
            wx.showToast({ title: err.message || '兑换失败', icon: 'none' });
          }
        }
      }
    });
  },

  onGoHistory() {
    wx.navigateTo({ url: '/pages/exchange-history/exchange-history' });
  },

  onBack() {
    wx.navigateBack();
  },

  formatNumber(num) {
    if (!num) return '0';
    return Number(num).toLocaleString('en-US');
  }
});
