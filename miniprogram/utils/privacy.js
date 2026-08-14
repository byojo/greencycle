// utils/privacy.js
// 微信隐私协议合规封装：自 2023-08-30 起，调用 wx.getLocation / wx.chooseLocation 等
// 隐私接口前，必须先让用户同意《小程序隐私保护指引》。
// 基础库 >= 2.32.3 支持 wx.getPrivacySetting / wx.requirePrivacyAuthorize（本项目已是 2.32.3）。
//
// 用法：在任意隐私接口调用前 `await requirePrivacy()`
//   - 用户已同意 / 无需授权：直接 resolve，业务继续
//   - 用户首次使用：调起系统隐私授权弹窗，点「同意」后 resolve
//   - 用户拒绝：reject（业务侧应优雅降级，不再反复弹窗）

let _authorized = false; // 本次会话已同意
let _denied = false;     // 本次会话已拒绝（避免反复弹窗骚扰）

function requirePrivacy() {
  return new Promise((resolve, reject) => {
    // 已确认状态直接复用
    if (_authorized) { resolve(); return; }
    if (_denied) { reject(new Error('PRIVACY_DENIED')); return; }

    // 基础库不支持隐私接口，降级放行
    if (!wx.getPrivacySetting || !wx.requirePrivacyAuthorize) {
      _authorized = true;
      resolve();
      return;
    }

    wx.getPrivacySetting({
      success(res) {
        // needAuthorization=false：用户已同意或无需授权
        if (!res.needAuthorization) {
          _authorized = true;
          resolve();
          return;
        }
        // 调起系统隐私授权弹窗
        wx.requirePrivacyAuthorize({
          success: () => { _authorized = true; resolve(); },
          fail: () => { _denied = true; reject(new Error('PRIVACY_DENIED')); }
        });
      },
      fail: () => {
        // 查询失败也降级放行，避免阻断核心业务
        _authorized = true;
        resolve();
      }
    });
  });
}

// 重置状态（如用户去设置页重新授权后回到小程序可调用，一般无需手动调用）
function resetPrivacy() {
  _authorized = false;
  _denied = false;
}

module.exports = { requirePrivacy, resetPrivacy };
