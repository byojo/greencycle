// pages/profile/profile.js
const app = getApp();
const api = require('../../services/api.js');

Page({
  data: {
    avatarText: '林',
    nickname: '绿友',
    vipLevel: '绿V1',
    orderDesc: '已回收 0 次',
    verified: true,
    points: 0,
    pointsText: '0',
    carbonKg: 0,
    carbonText: '0.0',
    orderCount: 0,
    orderCountText: '0',
    inUse: 0,
    inUseText: '0',
    addressCount: 0,
    addressCountText: '0',
    version: '1.0.0'
  },

  onLoad() {
    this.loadUserInfo();
  },

  onShow() {
    // 同步底部 TabBar（profile 是 tab 页，selected=4）
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
    this.loadUserInfo();
  },

  onPullDownRefresh() {
    this.loadUserInfo().finally(() => wx.stopPullDownRefresh());
  },

  async loadUserInfo() {
    try {
      const res = await api.getUserInfo();
      const u = res.data;
      const points = u.points || 0;
      const carbonKg = u.carbonKg || 0;
      const orderCount = u.orderCount || 0;
      const inUse = u.inUseCount || 0;
      this.setData({
        avatarText: u.avatar || (u.nickname ? u.nickname.charAt(0) : '林'),
        nickname: u.nickname || '绿友',
        vipLevel: '绿V' + (u.level || 1),
        orderDesc: '已回收 ' + orderCount + ' 次',
        verified: u.verified !== false,
        points,
        pointsText: this.formatNumber(points),
        carbonKg,
        carbonText: this.formatNumber(carbonKg, 1),
        orderCount,
        orderCountText: String(orderCount),
        inUse,
        inUseText: String(inUse),
        addressCount: u.addressCount || 0,
        addressCountText: String(u.addressCount || 0)
      });
      app.globalData.userInfo = u;
    } catch (err) {
      // 使用 mock 数据（与原型一致）
      this.setData({
        avatarText: '林',
        nickname: '林小满',
        vipLevel: '绿V2',
        orderDesc: '已回收 12 次',
        verified: true,
        points: 1286,
        pointsText: '1,286',
        carbonKg: 12.6,
        carbonText: '12.6',
        orderCount: 12,
        orderCountText: '12',
        inUse: 0,
        inUseText: '0',
        addressCount: 2,
        addressCountText: '2'
      });
    }
  },

  // 千分位格式化（WXML 不可用 .toFixed）
  formatNumber(num, decimals = 0) {
    if (num === null || num === undefined) return '0';
    const n = Number(num);
    if (isNaN(n)) return '0';
    return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
  },

  showSetting() {
    wx.showActionSheet({
      itemList: ['账户与安全', '消息通知', '清除缓存', '退出登录'],
      success: (res) => {
        if (res.tapIndex === 3) {
          this.onLogout();
        } else if (res.tapIndex === 2) {
          wx.showToast({ title: '清理完成', icon: 'success' });
        } else {
          wx.showToast({ title: '功能开发中', icon: 'none' });
        }
      }
    });
  },

  // 各种跳转
  goOrders() { wx.navigateTo({ url: '/pages/order-list/order-list' }); },
  goAddresses() { wx.navigateTo({ url: '/pages/address/address' }); },
  goPoints() { wx.navigateTo({ url: '/pages/points/points' }); },
  goInvite() { wx.navigateTo({ url: '/pages/invite/invite' }); },
  goService() {
    // 优先尝试官方客服会话，失败后退到 modal
    if (wx.openCustomerServiceChat) {
      wx.openCustomerServiceChat({
        extParam: { from: 'profile' },
        fail: () => {
          this.showCustomerServiceModal();
        }
      });
    } else {
      this.showCustomerServiceModal();
    }
  },
  showCustomerServiceModal() {
    wx.showModal({
      title: '联系客服',
      content: '📞 客服电话：400-888-0000\n🕐 工作日 9:00-21:00\n💬 在线咨询：点击右上角客服按钮\n📧 邮箱：help@sxyrgy.cn',
      confirmText: '拨打客服',
      cancelText: '我知道了',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({ phoneNumber: '4008880000', fail: () => {
            wx.showToast({ title: '拨号失败，请手动拨打', icon: 'none' });
          }});
        }
      }
    });
  },
  goSettings() { wx.navigateTo({ url: '/pages/settings/settings' }); },
  goAbout() {
    wx.showModal({
      title: '纸飞机',
      content: '让每一件旧物，都值得被温柔对待 ✈️\n\nv' + this.data.version,
      showCancel: false
    });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '纸飞机 - 让每一件旧物都值得被温柔对待',
      path: '/pages/home/home'
    };
  }
});
