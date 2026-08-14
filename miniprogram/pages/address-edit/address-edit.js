// pages/address-edit/address-edit.js
const app = getApp();
const api = require('../../services/api.js');
const { reverseGeocode } = require('../../utils/geocoder.js');
const { requirePrivacy } = require('../../utils/privacy.js');

Page({
  data: {
    isEdit: false,
    editId: null,
    tagOptions: ['家', '公司', '学校', '其他'],
    customItem: '请选择',
    regionValue: [],
    form: {
      name: '',
      phone: '',
      region: '',
      detail: '',
      tag: '',
      isDefault: false
    },
    lat: 0,
    lng: 0,
    locationText: '',
    submitting: false
  },

  onLoad(options) {
    // 编辑模式：URL 传 id，从 mock 列表找
    if (options.id) {
      this.setData({ isEdit: true, editId: options.id });
      this.loadAddress(options.id);
      wx.setNavigationBarTitle({ title: '编辑地址' });
    } else {
      wx.setNavigationBarTitle({ title: '新增地址' });
    }
  },

  async loadAddress(id) {
    try {
      const res = await api.getAddresses();
      const list = res.data.list || [];
      const addr = list.find(a => String(a.id) === String(id));
      if (addr) {
        const regionArr = [addr.province, addr.city, addr.district].filter(Boolean);
        this.setData({
          form: {
            name: addr.name || '',
            phone: addr.phone || '',
            region: regionArr.join(' '),
            detail: addr.detail || '',
            tag: addr.tag || '',
            isDefault: !!addr.isDefault
          },
          regionValue: regionArr,
          lat: addr.lat || 0,
          lng: addr.lng || 0,
          locationText: (addr.lat && addr.lng) ? '已定位' : ''
        });
      }
    } catch (err) {
      // 兜底：用本地的 mock 数据找
      const mockList = [
        { id: 1, name: '林小满', phone: '138****6688', province: '上海市', city: '上海市', district: '浦东新区', detail: '张江高科 · 博云路 2 号 28 楼', isDefault: true, tag: '家' },
        { id: 2, name: '林小满', phone: '139****1234', province: '上海市', city: '上海市', district: '徐汇区', detail: '漕河泾开发区 · 古美路 1582 号', isDefault: false, tag: '公司' }
      ];
      const addr = mockList.find(a => String(a.id) === String(id));
      if (addr) {
        const regionArr = [addr.province, addr.city, addr.district].filter(Boolean);
        this.setData({
          form: {
            name: addr.name || '',
            phone: addr.phone || '',
            region: regionArr.join(' '),
            detail: addr.detail || '',
            tag: addr.tag || '',
            isDefault: !!addr.isDefault
          },
          regionValue: regionArr,
          lat: addr.lat || 0,
          lng: addr.lng || 0,
          locationText: (addr.lat && addr.lng) ? '已定位' : ''
        });
      }
    }
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  // 省市区 picker 选中
  onRegionChange(e) {
    const value = e.detail.value;  // ['上海市', '上海市', '浦东新区']
    const code = e.detail.code;    // ['31', '3101', '310115']
    const region = (value || []).join(' ');
    this.setData({
      'form.region': region,
      regionValue: value,
      regionCode: code
    });
  },

  onSwitchChange(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onTagSelect(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({ 'form.tag': tag });
  },

  async onChooseLocation() {
    // 隐私合规：chooseLocation 前必须先征得用户同意隐私协议
    try {
      await requirePrivacy();
    } catch (e) {
      wx.showToast({ title: '需要位置授权', icon: 'none' });
      return;
    }
    try {
      const res = await new Promise((resolve, reject) => {
        wx.chooseLocation({ success: resolve, fail: reject });
      });
      // 先把经纬度、地图显示文本写回（即使后续逆编码失败也不影响用户保存当前位置）
      this.setData({
        lat: res.latitude,
        lng: res.longitude,
        locationText: res.address || res.name || '已定位'
      });
      // 用经纬度反查省市区，自动写入 picker 显示（"省 / 市 / 区"）
      const geo = await reverseGeocode(res.latitude, res.longitude);
      if (geo && (geo.province || geo.city || geo.district)) {
        const regionValue = [];
        const regionParts = [];
        if (geo.province) { regionValue.push(geo.province); regionParts.push(geo.province); }
        if (geo.city) { regionValue.push(geo.city); regionParts.push(geo.city); }
        if (geo.district) { regionValue.push(geo.district); regionParts.push(geo.district); }
        const fill = {};
        fill['form.region'] = regionParts.join(' ');
        fill.regionValue = regionValue;
        // 把详细的"街道 + 门牌号"（如"街门口上街20号"）覆盖到 form.detail（地址编辑页只关心门牌号部分）
        if (geo.street) {
          fill['form.detail'] = geo.street;
        }
        this.setData(fill);
      } else {
        // 逆地理编码失败时不再覆盖 detail（保留用户已输入/已填的）
        wx.showToast({ title: '未能识别省市区，请手动补填', icon: 'none' });
      }
    } catch (err) {
      const msg = (err && (err.errMsg || err.message)) || '';
      // 用户取消选点
      if (msg.indexOf('cancel') >= 0) return;
      wx.showToast({ title: '未选择位置', icon: 'none' });
    }
  },

  validate() {
    const f = this.data.form;
    if (!f.name || f.name.length < 2) {
      wx.showToast({ title: '请输入正确的姓名', icon: 'none' });
      return false;
    }
    if (!f.phone || !/^1[3-9]\d{9}$/.test(f.phone.replace(/[*\s]/g, ''))) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return false;
    }
    if (!f.region) {
      wx.showToast({ title: '请填写省市区', icon: 'none' });
      return false;
    }
    if (!f.detail || f.detail.length < 5) {
      wx.showToast({ title: '详细地址至少 5 个字', icon: 'none' });
      return false;
    }
    return true;
  },

  async onSave() {
    if (!this.validate()) return;
    if (this.data.submitting) return;
    this.setData({ submitting: true });
    wx.showLoading({ title: '保存中...', mask: true });

    const f = this.data.form;
    // 拆分省市区（粗略按空格拆分）
    const parts = (f.region || '').split(/\s+/);
    const payload = {
      name: f.name,
      phone: f.phone,
      province: parts[0] || '',
      city: parts[1] || parts[0] || '',
      district: parts[2] || '',
      detail: f.detail,
      tag: f.tag || '',
      isDefault: !!f.isDefault,
      lat: this.data.lat,
      lng: this.data.lng
    };

    try {
      if (this.data.isEdit) {
        await api.updateAddress(this.data.editId, payload);
      } else {
        await api.addAddress(payload);
      }
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 600);
    } catch (err) {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({ title: err.message || '保存失败', icon: 'none' });
    }
  },

  onDelete() {
    if (!this.data.isEdit) return;
    wx.showModal({
      title: '删除地址',
      content: '确定要删除该地址吗？删除后不可恢复。',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          api.deleteAddress(this.data.editId)
            .then(() => {
              wx.showToast({ title: '已删除', icon: 'success' });
              setTimeout(() => wx.navigateBack(), 600);
            })
            .catch(() => {
              wx.showToast({ title: '删除失败', icon: 'none' });
            });
        }
      }
    });
  },

  onBack() {
    wx.navigateBack();
  }
});
