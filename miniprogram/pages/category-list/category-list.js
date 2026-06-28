// pages/category-list/category-list.js
const app = getApp();
const api = require('../../services/api.js');
const { categoryName } = require('../../utils/format.js');

Page({
  data: {
    code: '',
    name: '',
    icon: '',
    bannerBg: '',
    bannerDesc: '',
    bannerHint: '',
    categoryShort: '',
    warnDesc: '贴身内衣、袜子、破损严重衣物、宠物接触过的物品',
    items: [],
    loading: true
  },

  onLoad(options) {
    const code = options.code || 'phone';
    this.setData({ code });
    this.loadCategoryDetail(code);
    this.loadItems(code);
  },

  async loadCategoryDetail(code) {
    const meta = this.getCategoryMeta(code);
    this.setData({
      name: meta.name,
      icon: meta.icon,
      bannerBg: meta.bannerBg,
      bannerDesc: meta.bannerDesc,
      bannerHint: meta.bannerHint,
      warnDesc: meta.warnDesc || this.data.warnDesc,
      categoryShort: meta.name.replace('回收', '')
    });
    try {
      const res = await api.getCategoryDetail(code);
      if (res.data && res.data.name) {
        this.setData({ name: res.data.name, icon: res.data.icon || meta.icon });
      }
      wx.setNavigationBarTitle({ title: meta.name });
    } catch (err) {
      wx.setNavigationBarTitle({ title: meta.name });
    }
  },

  async loadItems(code) {
    try {
      const res = await api.getCategoryDetail(code);
      this.setData({
        items: res.data.items || [],
        loading: false
      });
    } catch (err) {
      this.setData({
        items: this.getDefaultItems(code),
        loading: false
      });
    }
  },

  // 品类元信息
  getCategoryMeta(code) {
    const map = {
      phone: {
        name: '手机回收', icon: '📱',
        bannerBg: 'linear-gradient(135deg, #93C5FD 0%, #3B82F6 100%)',
        bannerDesc: '不限品牌 · 不限型号 · 当面转账',
        bannerHint: '📱 0邮费 · 30分钟上门',
        warnDesc: '非原装主板、严重进水、丢失账号密码的设备'
      },
      clothes: {
        name: '衣物回收', icon: '👕',
        bannerBg: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)',
        bannerDesc: '5kg起收 · 环保再生 · 山区捐赠双通道',
        bannerHint: '🎁 5kg起 · 免费上门回收',
        warnDesc: '贴身内衣、袜子、破损严重衣物、宠物接触过的物品'
      },
      digital: {
        name: '数码回收', icon: '💻',
        bannerBg: 'linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)',
        bannerDesc: '笔记本/平板/相机/耳机 · 隐私彻底清除',
        bannerHint: '💻 0邮费 · 专业清除数据',
        warnDesc: '无法开机、严重进水、丢失主要配件的设备'
      },
      home: {
        name: '家电回收', icon: '🔌',
        bannerBg: 'linear-gradient(135deg, #FCA5A5 0%, #EF4444 100%)',
        bannerDesc: '大件家电免费拆机 · 小家电当面评估',
        bannerHint: '🔧 大件免费拆机 · 当面转账',
        warnDesc: '商用设备、超过使用年限的家电'
      },
      luxury: {
        name: '闲置奢侈品', icon: '👜',
        bannerBg: 'linear-gradient(135deg, #C4B5FD 0%, #7C3AED 100%)',
        bannerDesc: '专业鉴定 · 隐私保护 · 当面转账',
        bannerHint: '👜 专业鉴定 · 严格保密',
        warnDesc: '假货、严重破损、来源不明的物品'
      },
      book: {
        name: '书籍回收', icon: '📚',
        bannerBg: 'linear-gradient(135deg, #6EE7B7 0%, #059669 100%)',
        bannerDesc: '5本起收 · 山区捐赠 · 环保再生',
        bannerHint: '📚 5本起 · 山区捐赠',
        warnDesc: '盗版书、破损严重的教材、有版权问题的期刊'
      },
      metal: {
        name: '废品回收', icon: '🥫',
        bannerBg: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)',
        bannerDesc: '纸壳/塑料瓶/金属 · 上门回收',
        bannerHint: '♻️ 10kg起 · 上门回收',
        warnDesc: '危险品（电池等）、厨余垃圾、其他污染废品'
      }
    };
    return map[code] || {
      name: categoryName(code), icon: '📦',
      bannerBg: 'linear-gradient(135deg, #93C5FD 0%, #3B82F6 100%)',
      bannerDesc: '上门当面评估',
      bannerHint: '⚡ 上门当面评估'
    };
  },

  // 兜底物品列表（4 项，2x2 网格展示）
  getDefaultItems(code) {
    const map = {
      phone: [
        { id: 1, name: 'iPhone 系列', desc: 'iPhone 6 ~ 16 Pro Max', icon: '📱' },
        { id: 2, name: '华为系列',   desc: 'Mate · P · Nova · 荣耀', icon: '📱' },
        { id: 3, name: '小米 / OPPO / vivo', desc: '含 Redmi · realme · iQOO', icon: '📱' },
        { id: 4, name: '其他品牌',   desc: '三星 · 一加 · 魅族', icon: '📱' }
      ],
      clothes: [
        { id: 1, name: '秋冬外套', desc: '羽绒服 · 大衣', icon: '🧥' },
        { id: 2, name: '上装',     desc: 'T恤 · 衬衫',    icon: '👕' },
        { id: 3, name: '裤装',     desc: '牛仔裤 · 休闲裤', icon: '👖' },
        { id: 4, name: '裙装',     desc: '连衣裙 · 半身裙', icon: '👗' }
      ],
      digital: [
        { id: 1, name: '笔记本',   desc: 'MacBook · ThinkPad', icon: '💻' },
        { id: 2, name: '平板',     desc: 'iPad · 安卓平板',  icon: '📱' },
        { id: 3, name: '相机',     desc: '单反 · 微单 · 镜头', icon: '📷' },
        { id: 4, name: '耳机 / 其他', desc: 'AirPods · 音箱', icon: '🎧' }
      ],
      home: [
        { id: 1, name: '空调', desc: '上门拆机',       icon: '❄️' },
        { id: 2, name: '冰箱 / 洗衣机', desc: '大型家电', icon: '🧊' },
        { id: 3, name: '小家电', desc: '电饭煲 · 微波炉 · 风扇', icon: '🔌' },
        { id: 4, name: '厨房电器', desc: '油烟机 · 灶具', icon: '🍳' }
      ],
      luxury: [
        { id: 1, name: '包包', desc: 'Coach · MK · 其他', icon: '👜' },
        { id: 2, name: '手表', desc: '智能手表 · 机械表', icon: '⌚' },
        { id: 3, name: '首饰', desc: '项链 · 戒指 · 耳环', icon: '💍' }
      ],
      book: [
        { id: 1, name: '教材教辅', desc: '5本起收',  icon: '📕' },
        { id: 2, name: '课外读物', desc: '小说 · 散文', icon: '📗' },
        { id: 3, name: '儿童读物', desc: '绘本 · 童话', icon: '📘' },
        { id: 4, name: '杂志期刊', desc: '过刊 · 旧刊', icon: '📙' }
      ],
      metal: [
        { id: 1, name: '纸壳',     desc: '纸箱 · 报纸',     icon: '📦' },
        { id: 2, name: '塑料瓶',   desc: 'PET · 可乐瓶',    icon: '🍶' },
        { id: 3, name: '金属',     desc: '易拉罐 · 铁皮',   icon: '🥫' },
        { id: 4, name: '旧衣物',   desc: '混合回收',         icon: '👕' }
      ]
    };
    return map[code] || [];
  },

  onItemTap(e) {
    const item = e.currentTarget.dataset.item;
    app.globalData.currentCategory = this.data.code;
    app.globalData.currentItem = item;

    wx.navigateTo({
      url: `/pages/photo-upload/photo-upload?code=${this.data.code}&itemId=${item.id}`
    });
  },

  onBack() {
    wx.navigateBack();
  },

  onRecords() {
    wx.navigateTo({ url: '/pages/order-list/order-list' });
  }
});
