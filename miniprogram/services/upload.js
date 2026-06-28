// services/upload.js
// 图片上传服务

/**
 * 上传图片到腾讯云 COS（通过临时签名直传）
 * @param {string} tempFilePath - 微信临时文件路径
 * @returns {Promise<string>} 上传后的 CDN URL
 */
function uploadImage(tempFilePath) {
  return new Promise((resolve, reject) => {
    const api = require('./api.js');

    // 1. 获取上传签名
    api.getUploadSign({
      ext: tempFilePath.split('.').pop() || 'jpg'
    }).then(signRes => {
      const { url, key } = signRes.data;

      // 2. 上传到 COS（预签名 URL 已在 query string 包含凭证）
      wx.uploadFile({
        url: url,
        filePath: tempFilePath,
        name: 'file',
        success: (res) => {
          if (res.statusCode === 200 || res.statusCode === 204) {
            resolve(key);  // 返回图片 key，由业务层拼接 CDN 域名
          } else {
            reject(new Error('上传失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    }).catch(reject);
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