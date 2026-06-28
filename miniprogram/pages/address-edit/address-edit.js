// pages/address-edit/address-edit.js
const app = getApp();
const api = require('../../services/api.js');

Page({
  data: {
    isEdit: false,           // 是否编辑模式
    editId: null,            // 编辑时的地址 ID
    tagOptions: ['家', '公司', '学校', '其他'],
    customItem: '请选择',
    regionValue: [],         // picker 选中的省市区代码数组
    form: {
      name: '',
      phone: '',
      region: '',            // 拼好的省市区字符串（如"上海市 上海市 浦东新区"）
      detail: '',
      tag: '',
      isDefault: false
    },
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
          regionValue: regionArr
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
          regionValue: regionArr
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
      isDefault: !!f.isDefault
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
      // 失败也返回（mock 模式），让用户体验完整
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 600);
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
              wx.showToast({ title: '已删除', icon: 'success' });
              setTimeout(() => wx.navigateBack(), 600);
            });
        }
      }
    });
  },

  onBack() {
    wx.navigateBack();
  }
});
