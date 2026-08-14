// pages/profile/profile.js
const app = getApp();
const api = require('../../services/api.js');
const upload = require('../../services/upload.js');

Page({
  data: {
    avatarText: '林',
    nickname: '绿友',
    vipLevel: '绿V1',
    orderDesc: '已回收 0 次',
    verified: true,
    isAdmin: false,
    isRider: false,
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
    version: '1.0.0',
    // 昵称编辑弹层
    editingNick: false,
    nickInput: ''
  },

  onLoad() {
    // 初始化加载移至 onShow，避免双重请求
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
        avatarUrl: (u.avatar && u.avatar.startsWith('http')) ? u.avatar : '',
        avatarText: (u.avatar && u.avatar.startsWith('http')) ? '' : (u.nickname ? u.nickname.charAt(0) : '林'),
        nickname: u.nickname || '绿友',
        vipLevel: '绿V' + (u.level || 1),
        orderDesc: '已回收 ' + orderCount + ' 次',
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
      // 检查是否管理员
      this.checkAdmin();
    } catch (err) {
      this.setData({ loading: false });
      wx.showToast({ title: '加载失败，请下拉刷新', icon: 'none' });
    }
  },

  // 选择头像（微信官方能力：button open-type=chooseAvatar）
  async onChooseAvatar(e) {
    const tempPath = e && e.detail && e.detail.avatarUrl;
    if (!tempPath) return;
    try {
      wx.showLoading({ title: '上传中...', mask: true });
      // 1. 上传临时头像到 COS，拿回 CDN URL
      const url = await upload.uploadImage(tempPath);
      // 2. 调后端保存头像 URL
      await api.updateProfile({ avatar: url });
      // 3. 更新本地展示与缓存
      this.setData({ avatarUrl: url, avatarText: '' });
      const cached = app.globalData.userInfo || {};
      app.globalData.userInfo = { ...cached, avatar: url };
      wx.setStorageSync('userInfo', app.globalData.userInfo);
      wx.hideLoading();
      wx.showToast({ title: '头像已更新', icon: 'success' });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '头像上传失败', icon: 'none' });
    }
  },

  // 打开昵称编辑弹层
  onEditNickname() {
    const current = (this.data.nickname && this.data.nickname !== '绿友') ? this.data.nickname : '';
    this.setData({ editingNick: true, nickInput: current });
  },

  onNickInput(e) {
    this.setData({ nickInput: e.detail.value });
  },

  // 保存昵称
  async saveNickname() {
    const nick = (this.data.nickInput || '').trim();
    if (!nick) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }
    if (nick.length > 32) {
      wx.showToast({ title: '昵称过长（最多 32 字）', icon: 'none' });
      return;
    }
    try {
      wx.showLoading({ title: '保存中...', mask: true });
      await api.updateProfile({ nickname: nick });
      this.setData({ nickname: nick, editingNick: false });
      const cached = app.globalData.userInfo || {};
      app.globalData.userInfo = { ...cached, nickname: nick };
      wx.setStorageSync('userInfo', app.globalData.userInfo);
      wx.hideLoading();
      wx.showToast({ title: '已保存', icon: 'success' });
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  cancelEditNick() {
    this.setData({ editingNick: false });
  },

  // 阻止弹层内点击事件冒泡到遮罩
  stopPropagation() {},

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
  goExchange() { wx.navigateTo({ url: '/pages/exchange/exchange' }); },
  goInvite() { wx.navigateTo({ url: '/pages/invite/invite' }); },
  goAdminOrders() { wx.navigateTo({ url: '/pages/admin-orders/admin-orders' }); },
  goAdminRiders() { wx.navigateTo({ url: '/pages/admin-riders/admin-riders' }); },
  goRiderOrders() { wx.navigateTo({ url: '/pages/rider-orders/rider-orders' }); },
  goAdminApplications() { wx.navigateTo({ url: '/pages/admin-applications/admin-applications' }); },
  goAdminExchange() { wx.navigateTo({ url: '/pages/admin-exchange/admin-exchange' }); },

  async checkAdmin() {
    try {
      const res = await api.isAdmin();
      this.setData({ 
        isAdmin: res.data.isAdmin || false, 
        isRider: res.data.isRider || false 
      });
    } catch (e) {}
  },
  goService() {
    // 优先尝试官方客服会话，失败后退到 modal
    if (wx.openCustomerServiceChat) {
      wx.openCustomerServiceChat({
        extInfo: { corpId: '' },
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
      content: '📞 客服电话：15249019944\n🕐 工作日 9:00-21:00\n💬 在线咨询：点击右上角客服按钮',
      confirmText: '拨打客服',
      cancelText: '我知道了',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({ phoneNumber: '15249019944', fail: () => {
            wx.showToast({ title: '拨号失败，请手动拨打', icon: 'none' });
          }});
        }
      }
    });
  },
  goSettings() { wx.navigateTo({ url: '/pages/settings/settings' }); },
  goAbout() {
    wx.showModal({
      title: '叮当回收',
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
      title: '叮当回收 - 让每一件旧物都值得被温柔对待',
      path: '/pages/home/home'
    };
  }
});
