// miniprogram/config.js
// 配置文件：根据运行环境自动切换 API 地址

// 开发环境 API（本地调试）
const DEV_API = 'http://localhost:8080/api/v1';
// 生产环境 API（微信云托管）
const PROD_API = 'https://golang-ox8i-275614-7-1448098353.sh.run.tcloudbase.com/api/v1';

// 根据小程序运行环境自动切换
let envVersion = 'release';
try {
  envVersion = wx.getAccountInfoSync().miniProgram.envVersion;
} catch (e) {}

const apiBase = envVersion === 'develop' ? DEV_API : PROD_API;

module.exports = {
  // ====== 基础配置 ======
  apiBase,
  envVersion,

  // ====== 业务配置 ======
  appName: '纸飞机',
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
  useMock: false,
  enableConsole: envVersion === 'develop'
};
