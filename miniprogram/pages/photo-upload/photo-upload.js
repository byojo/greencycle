// pages/photo-upload/photo-upload.js
const app = getApp();
const api = require('../../services/api.js');
const { uploadImages } = require('../../services/upload.js');
const { categoryName } = require('../../utils/format.js');

// 品类图标（废品 ♻️ → 🥫，与 design-tokens 一致）
const CATEGORY_ICONS = {
  phone: '📱', clothes: '👕', digital: '💻', home: '🔌',
  luxury: '👜', book: '📚', metal: '🥫'
};

const CATEGORY_BG = {
  phone:   'linear-gradient(135deg, #DBEAFE, #BFDBFE)',
  clothes: 'linear-gradient(135deg, #FCE7F3, #FBCFE8)',
  digital: 'linear-gradient(135deg, #E0E7FF, #C7D2FE)',
  home:    'linear-gradient(135deg, #FEE2E2, #FECACA)',
  luxury:  'linear-gradient(135deg, #F3E8FF, #E9D5FF)',
  book:    'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
  metal:   'linear-gradient(135deg, #FCE7F3, #FBCFE8)'
};

// 品类切换 tab（顺序与 prototype 一致：衣物 / 手机 / 数码 / 家电 / 书籍 / 废品 / 闲置包）
const CATEGORY_TABS = [
  { code: 'clothes', name: '衣物',   icon: '👕' },
  { code: 'phone',   name: '手机',   icon: '📱' },
  { code: 'digital', name: '数码',   icon: '💻' },
  { code: 'home',    name: '家电',   icon: '🔌' },
  { code: 'book',    name: '书籍',   icon: '📚' },
  { code: 'metal',   name: '废品',   icon: '🥫' },
  { code: 'luxury',  name: '闲置包', icon: '👜' }
];

Page({
  data: {
    category: 'phone',
    categoryName: '手机回收',
    categoryIcon: '📱',
    categoryBg: CATEGORY_BG.phone,
    categoryTabs: CATEGORY_TABS,
    photos: [],
    maxPhotos: 9,
    fields: [],          // 动态字段
    formData: {},
    remark: '',
    submitting: false
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  onLoad(options) {
    const code = options.code || app.globalData.currentCategory || 'phone';
    this.applyCategory(code);
    this.loadFields(code);
    wx.setNavigationBarTitle({ title: '上传物品照片' });
  },

  // 切换品类：更新 cat-card + 重新加载字段
  applyCategory(code) {
    if (!CATEGORY_ICONS[code]) code = 'phone';
    this.setData({
      category: code,
      categoryName: categoryName(code),
      categoryIcon: CATEGORY_ICONS[code],
      categoryBg: CATEGORY_BG[code],
      formData: {},
      photos: []
    });
    app.globalData.currentCategory = code;
  },

  // tab strip 点击
  onSwitchCategory(e) {
    const code = e.currentTarget.dataset.code;
    if (!code || code === this.data.category) return;
    this.applyCategory(code);
    this.loadFields(code);
  },

  async loadFields(code) {
    try {
      const res = await api.getCategoryFields(code);
      this.setData({ fields: this.decorateFields(this.normalizeFields(res.data.fields || [])) });
    } catch (err) {
      this.setData({ fields: this.decorateFields(this.getDefaultFields(code)) });
    }
  },

  // 将 API 返回的 snake_case 字段映射为小程序用的 camelCase
  normalizeFields(fields) {
    return fields.map(f => {
      let options = [];
      if (f.optionsJSON) {
        try { options = JSON.parse(f.optionsJSON); } catch (e) {}
      }
      return {
        key:      f.fieldKey,
        label:    f.fieldLabel,
        type:     f.fieldType,
        required: !!f.required,
        options,
        placeholder: f.placeholder || '',
        icon:     f.fieldIcon || '',
        sort:     f.sort || 0
      };
    });
  },

  decorateFields(fields) {
    return fields.map(f => {
      if (f.type === 'multi') {
        const current = this.data.formData[f.key] || [];
        f._options = (f.options || []).map(opt => ({
          label: opt,
          selected: current.indexOf(opt) >= 0
        }));
      }
      return f;
    });
  },

  // 默认字段（按 prototype 1:1）
  getDefaultFields(code) {
    const map = {
      phone: [
        { key: 'model',     label: '品牌型号', icon: '📱', type: 'text',   required: false, placeholder: '如：iPhone 14 Pro / 华为Mate60' },
        { key: 'condition', label: '外观成色', icon: '✨', type: 'select', required: false, options: ['99新', '95新', '9新', '8新'] },
        { key: 'capacity',  label: '存储容量', icon: '💾', type: 'text',   required: false, placeholder: '如：256G' }
      ],
      clothes: [
        { key: 'types',  label: '主要类型', icon: '👕', type: 'multi', required: false, options: ['冬装', '夏装', '运动鞋', '包帽', '床单被套'] },
        { key: 'weight', label: '预估重量', icon: '⚖️', type: 'text',  required: false, placeholder: '如：8.5（kg）' },
        { key: 'count',  label: '件数',     icon: '🔢', type: 'text',  required: false, placeholder: '如：20 件' }
      ],
      digital: [
        { key: 'deviceType', label: '设备类型', icon: '💻', type: 'select', required: false, options: ['笔记本', '平板', '相机', '耳机'] },
        { key: 'model',      label: '品牌型号', icon: '🏷️', type: 'text',  required: false, placeholder: '如：MacBook Pro 13寸 / iPad Air' },
        { key: 'age',        label: '购买年限', icon: '📅', type: 'text',  required: false, placeholder: '如：2年' }
      ],
      home: [
        { key: 'homeType',    label: '家电类型', icon: '🔌', type: 'select', required: false, options: ['空调', '冰箱', '洗衣机', '小家电'] },
        { key: 'model',       label: '品牌型号', icon: '🏷️', type: 'text',  required: false, placeholder: '如：格力1.5匹 / 海尔双开门' },
        { key: 'needInstall', label: '上门拆机',             type: 'switch', required: false, placeholder: '需要上门拆机' }
      ],
      book: [
        { key: 'bookType', label: '类别', icon: '📚', type: 'multi', required: false, options: ['教材', '课外书', '小说', '儿童读物'] },
        { key: 'count',    label: '数量', icon: '🔢', type: 'text',  required: false, placeholder: '如：23本' }
      ],
      metal: [
        { key: 'metalType', label: '废品类型', icon: '🥫', type: 'multi', required: false, options: ['纸壳', '塑料瓶', '金属', '玻璃'] },
        { key: 'weight',    label: '预估重量', icon: '⚖️', type: 'text',  required: false, placeholder: '如：5（kg）' }
      ],
      luxury: [
        { key: 'brand', label: '品牌',     icon: '🏷️', type: 'text',  required: false, placeholder: '如：Coach / Michael Kors' },
        { key: 'year',  label: '购买年份', icon: '📅', type: 'text',  required: false, placeholder: '如：2022' }
      ]
    };
    return map[code] || [];
  },

  onChoosePhoto() {
    const remaining = this.data.maxPhotos - this.data.photos.length;
    if (remaining <= 0) {
      wx.showToast({ title: `最多 ${this.data.maxPhotos} 张`, icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const newPhotos = res.tempFiles.map(f => ({
          tempPath: f.tempFilePath,
          size: f.size
        }));
        this.setData({
          photos: [...this.data.photos, ...newPhotos]
        });
      },
      fail: (err) => {
        if (err.errMsg && !err.errMsg.includes('cancel')) {
          wx.showToast({ title: '选择图片失败', icon: 'none' });
        }
      }
    });
  },

  onRemovePhoto(e) {
    const index = e.currentTarget.dataset.index;
    const photos = [...this.data.photos];
    photos.splice(index, 1);
    this.setData({ photos });
  },

  onPreviewPhoto(e) {
    const index = e.currentTarget.dataset.index;
    const urls = this.data.photos.map(p => p.tempPath);
    wx.previewImage({
      current: urls[index],
      urls: urls
    });
  },

  onFieldInput(e) {
    const key = e.currentTarget.dataset.key;
    const value = e.detail.value;
    this.setData({ [`formData.${key}`]: value });
  },

  onSelectChip(e) {
    const key = e.currentTarget.dataset.key;
    const value = e.currentTarget.dataset.value;
    const fields = [...this.data.fields];
    const idx = fields.findIndex(f => f.key === key);
    if (idx < 0) return;
    const field = fields[idx];

    if (field.type === 'multi') {
      const current = this.data.formData[key] || [];
      const i = current.indexOf(value);
      if (i >= 0) {
        current.splice(i, 1);
      } else {
        current.push(value);
      }
      field._options = (field.options || []).map(opt => ({
        label: opt,
        selected: current.indexOf(opt) >= 0
      }));
      fields[idx] = field;
      this.setData({
        [`formData.${key}`]: [...current],
        fields
      });
    } else {
      this.setData({ [`formData.${key}`]: value });
    }
  },

  onSwitchChange(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [`formData.${key}`]: e.detail.value });
  },

  onShowExamples() {
    wx.showModal({
      title: '📷 上传示例',
      content: '请拍摄：\n1. 物品正面照\n2. 物品侧面照\n3. 细节（磕碰/划痕）\n\n建议光线充足，避免模糊遮挡。',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  validateForm() {
    for (const f of this.data.fields) {
      if (f.required && !this.data.formData[f.key]) {
        wx.showToast({ title: `请填写${f.label}`, icon: 'none' });
        return false;
      }
    }
    if (this.data.photos.length === 0) {
      wx.showToast({ title: '请至少上传一张照片', icon: 'none' });
      return false;
    }
    return true;
  },

  async onSubmit() {
    if (this.submitting) return;
    if (!this.validateForm()) return;

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...', mask: true });

    try {
      const tempPaths = this.data.photos.map(p => p.tempPath);
      const photoKeys = await uploadImages(tempPaths);

      app.globalData.pendingOrder = {
        category: this.data.category,
        photoKeys,
        formData: this.data.formData,
        remark: this.data.remark || ''
      };

      wx.redirectTo({
        url: '/pages/order-confirm/order-confirm'
      });
    } catch (err) {
      console.error('提交失败', err);
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
      wx.hideLoading();
    }
  },

  onBack() {
    wx.navigateBack();
  }
});
