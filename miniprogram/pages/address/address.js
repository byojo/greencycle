// pages/address/address.js
const app = getApp();
const api = require('../../services/api.js');

Page({
  data: {
    list: [],
    selectMode: false,
    managing: false,
    manageText: '管理',
    loading: true
  },

  onLoad(options) {
    this.setData({ selectMode: options.select === '1' });
    this.loadList();
  },

  onShow() {
    // 同步底部 TabBar（address 不是 tab 页，但保留为安全兜底）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.loadList();
  },

  async loadList() {
    try {
      const res = await api.getAddresses();
      this.setData({
        list: res.data.list || [],
        loading: false
      });
    } catch (err) {
      // mock
      this.setData({
        list: [
          {
            id: 1, name: '林小满', phone: '138****6688',
            province: '上海市', city: '上海市', district: '浦东新区',
            detail: '张江高科 · 博云路 2 号 28 楼',
            isDefault: true,
            tag: '家'
          },
          {
            id: 2, name: '林小满', phone: '139****1234',
            province: '上海市', city: '上海市', district: '徐汇区',
            detail: '漕河泾开发区 · 古美路 1582 号',
            isDefault: false,
            tag: '公司'
          }
        ],
        loading: false
      });
    }
  },

  onSelect(e) {
    if (!this.data.selectMode) return;
    const addr = e.currentTarget.dataset.addr;
    const pages = getCurrentPages();
    const prev = pages[pages.length - 2];
    if (prev) {
      prev.setData({ address: addr, selectedAddress: addr });
      wx.navigateBack();
    }
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/address-edit/address-edit' });
  },

  onEdit(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/address-edit/address-edit?id=${id}` });
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除地址',
      content: '确定要删除该地址吗？删除后不可恢复。',
      success: (res) => {
        if (res.confirm) {
          api.deleteAddress(id)
            .then(() => {
              wx.showToast({ title: '已删除' });
              this.loadList();
            })
            .catch(() => wx.showToast({ title: '删除失败', icon: 'none' }));
        }
      }
    });
  },

  onSetDefault(e) {
    const id = e.currentTarget.dataset.id;
    api.updateAddress(id, { isDefault: true })
      .then(() => {
        wx.showToast({ title: '已设为默认', icon: 'success' });
        this.loadList();
      })
      .catch(() => wx.showToast({ title: '设置失败', icon: 'none' }));
  },

  onManage() {
    const managing = !this.data.managing;
    this.setData({
      managing,
      manageText: managing ? '完成' : '管理'
    });
  },

  goBack() {
    wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/profile/profile' }) });
  }
});
