// miniprogram/config.js
// 配置文件：API 地址

// 生产环境 API（已备案域名 sxyrgy.cn，已绑定微信云托管 golang-ox8i 服务）
const PROD_API = 'https://sxyrgy.cn/api/v1';
// 本地开发 API（需要本地跑后端时改为这个）
// const DEV_API = 'http://localhost:8080/api/v1';

const apiBase = PROD_API;

module.exports = {
  // ====== 基础配置 ======
  apiBase,

  // ====== 业务配置 ======
  appName: '叮当回收',
  appVersion: '1.0.0',

  // 上传 COS 桶配置（真实桶由后端环境变量配置并直传，前端仅透传 cdnDomain）
  cos: {
    bucket: 'greencycle-image-1255464850',
    region: 'ap-guangzhou',
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
