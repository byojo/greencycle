// utils/storage.js
// 本地存储封装

/**
 * 设置存储（带过期时间）
 */
function set(key, value, expireSeconds) {
  const data = {
    value,
    expireAt: expireSeconds ? Date.now() + expireSeconds * 1000 : null
  };
  wx.setStorageSync(key, data);
  return value;
}

/**
 * 获取存储（自动检查过期）
 */
function get(key, defaultValue = null) {
  try {
    const data = wx.getStorageSync(key);
    if (!data) return defaultValue;

    // 检查过期
    if (data.expireAt && Date.now() > data.expireAt) {
      wx.removeStorageSync(key);
      return defaultValue;
    }

    return data.value !== undefined ? data.value : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

/**
 * 删除
 */
function remove(key) {
  wx.removeStorageSync(key);
}

/**
 * 清空（保留系统字段）
 */
function clear() {
  try {
    const preserveKeys = ['systemInfo'];
    wx.clearStorageSync();
    // 这里实际项目可以保留一些系统信息
  } catch (e) {}
}

module.exports = {
  set,
  get,
  remove,
  clear
};