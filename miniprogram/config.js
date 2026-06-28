// miniprogram/config.js
// 配置文件：切换环境时只改这里
module.exports = {
  // ====== 基础配置 ======
  // 后端 API 地址（微信云托管）
  apiBase: 'https://golang-ox8i-275614-7-1448098353.sh.run.tcloudbase.com/v1',

  // ====== 业务配置 ======
  appName: '纸飞机',
  appVersion: '1.0.0',

  // 上传 COS 桶配置
  cos: {
    bucket: 'greencycle-1258888888',
    region: 'ap-shanghai',
    prefix: 'orders/'
  },

  // 客服配置
  customerService: {
    phone: '400-888-0000',
    workTime: '工作日 9:00-21:00',
    email: 'help@sxyrgy.cn'
  },

  // 邀请活动
  invite: {
    pointsPerInvite: 50,
    domain: 'https://sxyrgy.cn'
  },

  // ====== 开关 ======
  useMock: true,        // 开发时开启 mock，无后端也能跑
  enableConsole: true   // 是否打印调试日志
};
