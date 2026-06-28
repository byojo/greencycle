// services/request.js
// 微信小程序网络请求封装

const config = require('../config.js');
const API_BASE = config.apiBase;
const USE_MOCK = config.useMock;
const { matchRoute } = require('./mock.js');
const ERROR_MESSAGES = {
  400: '请求参数错误',
  401: '未登录或登录已过期',
  403: '没有权限',
  404: '资源不存在',
  500: '服务器开小差了',
  502: '网关错误',
  503: '服务暂不可用',
  504: '请求超时'
};

/**
 * 发起网络请求
 * @param {Object} options
 * @param {string} options.url - 接口路径
 * @param {string} options.method - GET/POST/PUT/DELETE
 * @param {Object} options.data - 请求数据
 * @param {boolean} options.showLoading - 是否显示 loading
 * @param {string} options.loadingText - loading 文字
 * @param {boolean} options.silent - 静默模式（不弹错误）
 */
function request(options) {
  // Mock 模式：跳过真实请求，直接返回 mock 数据
  if (USE_MOCK) {
    return mockRequest(options);
  }

  return new Promise((resolve, reject) => {
    const app = getApp();
    const token = app.globalData.token || wx.getStorageSync('token');

    // loading 处理
    if (options.showLoading) {
      wx.showLoading({
        title: options.loadingText || '加载中...',
        mask: true
      });
    }

    wx.request({
      url: API_BASE + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      timeout: options.timeout || 15000,
      success: async (res) => {
        const { statusCode, data } = res;

        // HTTP 层错误
        if (statusCode !== 200) {
          const msg = ERROR_MESSAGES[statusCode] || `请求失败 (${statusCode})`;
          if (!options.silent) {
            wx.showToast({ title: msg, icon: 'none' });
          }
          reject({ statusCode, message: msg, data });
          return;
        }

        // 业务层错误
        if (data.code !== 0) {
          // 401 token 失效
          if (data.code === 401) {
            await handleUnauthorized();
            // 重新发起请求
            try {
              const retryRes = await request({ ...options, silent: true });
              resolve(retryRes);
            } catch (err) {
              reject(err);
            }
            return;
          }

          if (!options.silent) {
            wx.showToast({ title: data.message || '操作失败', icon: 'none' });
          }
          reject(data);
          return;
        }

        resolve(data);
      },
      fail: (err) => {
        if (!options.silent) {
          wx.showToast({ title: '网络异常', icon: 'none' });
        }
        reject({ message: '网络异常', error: err });
      },
      complete: () => {
        if (options.showLoading) {
          wx.hideLoading();
        }
      }
    });
  });
}

// Mock 请求处理
async function mockRequest(options) {
  const method = (options.method || 'GET').toUpperCase();
  const url = options.url;
  const matched = matchRoute(method, url);

  if (options.showLoading) {
    wx.showLoading({ title: options.loadingText || '加载中...', mask: true });
  }

  // 模拟网络延迟
  await new Promise(r => setTimeout(r, 150));

  if (options.showLoading) {
    wx.hideLoading();
  }

  if (!matched) {
    console.warn(`[Mock] 未匹配的路由: ${method} ${url}`);
    return Promise.reject({ code: 404, message: `Mock 路由不存在: ${url}` });
  }

  const result = await matched.handler(matched.params);
  // console.log(`[Mock] ${method} ${url} =>`, result);
  return result;
}

// token 失效处理
async function handleUnauthorized() {
  const app = getApp();
  app.globalData.token = '';
  wx.removeStorageSync('token');

  // 静默重新登录
  try {
    await app.login();
  } catch (e) {
    wx.showModal({
      title: '登录已过期',
      content: '请重新登录',
      showCancel: false,
      success: () => {
        wx.reLaunch({ url: '/pages/home/home' });
      }
    });
  }
}

module.exports = {
  request,
  get: (url, data, options = {}) => request({ url, method: 'GET', data, ...options }),
  post: (url, data, options = {}) => request({ url, method: 'POST', data, ...options }),
  put: (url, data, options = {}) => request({ url, method: 'PUT', data, ...options }),
  delete: (url, data, options = {}) => request({ url, method: 'DELETE', data, ...options })
};