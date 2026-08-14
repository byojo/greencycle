// utils/geocoder.js
// 腾讯地图逆地理编码封装（lat/lng → 省市区/详细地址）
// 复用 home.js 的 key，避免在每个页面重复硬编码。
//
// 注意：此接口需要在小程序公众平台 → 开发管理 → 接口设置 里声明
// "wx.getLocation / chooseLocation" 之后才能调用（参见 docs/location-permission-application.md）

const TX_MAP_KEY = 'SVSBZ-RGUCB-ZQTUS-NZRUU-4U6WZ-CQFQD';

/**
 * 经纬度逆地理编码
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<{
 *   province: string,
 *   city: string,
 *   district: string,
 *   address: string,         // 包含省市区的完整地址字符串
 *   street: string,          // 街道 + 门牌号（不含省市县）
 *   raw: object
 * }|null>}
 */
function reverseGeocode(lat, lng) {
  return new Promise((resolve) => {
    if (lat == null || lng == null) {
      resolve(null);
      return;
    }
    wx.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      data: {
        location: `${lat},${lng}`,
        key: TX_MAP_KEY
      },
      success: (res) => {
        const r = res.data && res.data.result;
        const ac = (r && r.address_component) || {};
        const province = ac.province || '';
        const city = ac.city || '';
        const district = ac.district || '';
        const address = (r && r.address) || '';
        // 拼接"街道+门牌号"，用作详细地址（不含省市县）
        const street = [ac.street || '', ac.street_number ? ac.street_number : '']
          .filter(Boolean)
          .map((s) => s.replace(/\s+/g, ''))
          .join('')
          .replace(/(省|市|区|县)$/g, '');
        resolve({
          province,
          city,
          district,
          street,
          address,
          raw: r
        });
      },
      fail: () => {
        resolve(null);
      }
    });
  });
}

module.exports = {
  reverseGeocode
};
