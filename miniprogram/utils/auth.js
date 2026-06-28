// utils/auth.js
// 鉴权工具

/**
 * 检查是否已登录，未登录则跳转登录
 * @returns {boolean}
 */
function checkLogin() {
  const app = getApp();
  if (!app.globalData.token) {
    wx.navigateTo({
      url: '/pages/login/login'
    });
    return false;
  }
  return true;
}

/**
 * 获取当前 token
 */
function getToken() {
  const app = getApp();
  return app.globalData.token || wx.getStorageSync('token');
}

/**
 * 获取当前用户 ID
 */
function getUserId() {
  const user = wx.getStorageSync('userInfo');
  return user ? user.id : 0;
}

/**
 * 同步登录（静默）
 */
async function silentLogin() {
  const app = getApp();
  if (app.globalData.token) return app.globalData.token;

  try {
    return await app.login();
  } catch (e) {
    return null;
  }
}

module.exports = {
  checkLogin,
  getToken,
  getUserId,
  silentLogin
};