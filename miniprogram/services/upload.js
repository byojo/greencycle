// services/upload.js
// 图片上传服务（后端直传模式）

/**
 * 上传单张图片到 COS（后端中转）
 * @param {string} tempFilePath - 微信临时文件路径
 * @returns {Promise<string>} 上传后的 CDN URL
 */
function uploadImage(tempFilePath) {
  return new Promise((resolve, reject) => {
    // 1. 先读取文件为 base64
    wx.getFileSystemManager().readFile({
      filePath: tempFilePath,
      encoding: 'base64',
      success: (res) => {
        const ext = tempFilePath.split('.').pop() || 'jpg';
        const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
        const mime = mimeMap[ext] || 'image/jpeg';
        const base64Content = `data:${mime};base64,${res.data}`;

        // 2. 发给后端，后端上传到 COS
        const api = require('./api.js');
        api.getUploadSign({
          ext: ext,
          content: base64Content
        }).then(signRes => {
          if (signRes.code === 0) {
            resolve(signRes.data.fullUrl || signRes.data.key);
          } else {
            reject(new Error(signRes.message || '上传失败'));
          }
        }).catch(err => {
          reject(new Error(err.message || '上传请求失败'));
        });
      },
      fail: (err) => {
        reject(new Error('读取图片文件失败: ' + (err.errMsg || '')));
      }
    });
  });
}

/**
 * 批量上传图片
 * @param {string[]} tempFilePaths
 * @returns {Promise<string[]>}
 */
async function uploadImages(tempFilePaths) {
  const tasks = tempFilePaths.map(p => uploadImage(p));
  return Promise.all(tasks);
}

module.exports = {
  uploadImage,
  uploadImages
};
