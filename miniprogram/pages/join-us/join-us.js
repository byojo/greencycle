// pages/join-us/join-us.js
const api = require('../../services/api.js');

Page({
  data: {
    name: '',
    phone: '',
    district: '',
    remark: '',
    submitting: false
  },

  onInput(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({ [key]: e.detail.value });
  },

  validate() {
    if (!this.data.name.trim()) {
      wx.showToast({ title: '请输入姓名', icon: 'none' });
      return false;
    }
    if (!this.data.phone.trim() || !/^1\d{10}$/.test(this.data.phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return false;
    }
    return true;
  },

  async onSubmit() {
    if (this.submitting) return;
    if (!this.validate()) return;

    this.setData({ submitting: true });
    try {
      await api.submitPartnerApply({
        name: this.data.name.trim(),
        phone: this.data.phone.trim(),
        district: this.data.district.trim(),
        remark: this.data.remark.trim()
      });
      wx.showToast({ title: '提交成功，我们会尽快联系您', icon: 'none', duration: 3000 });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (err) {
      wx.showToast({ title: err.message || '提交失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
