// miniprogram/config.js
// 配置文件：API 地址

// 生产环境 API（微信云托管）
// 生产环境 API（微信云托管域名，已备案，备案完成后改为 api.sxyrgy.cn）
const PROD_API = 'https://golang-ox8i-275614-7-1448098353.sh.run.tcloudbase.com/api/v1';
// 本地开发 API（需要本地跑后端时改为这个）
// const DEV_API = 'http://localhost:8080/api/v1';

const apiBase = PROD_API;

module.exports = {
  // ====== 基础配置 ======
  apiBase,

  // ====== 业务配置 ======
  appName: '叮当回收',
  appVersion: '1.0.0',

  // 上传 COS 桶配置
  cos: {
    bucket: 'greencycle-1258888888',
    region: 'ap-shanghai',
    prefix: 'orders/',
    cdnDomain: ''
  },

  // 客服配置
  customerService: {
    phone: '15249019944',
    workTime: '工作日 9:00-21:00'
  },

  // 邀请活动
  invite: {
    pointsPerInvite: 50,
    domain: 'https://sxyrgy.cn'
  },

  // ====== 开关 ======
  useMock: false,
  enableConsole: true
};
