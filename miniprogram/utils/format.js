// utils/format.js
// 格式化工具

/**
 * 格式化金额（分 → 元）
 * @param {number} cents - 金额（分）
 * @returns {string} "¥ 123.45"
 */
function formatMoney(cents) {
  if (cents === null || cents === undefined) return '¥ 0.00';
  const yuan = (cents / 100).toFixed(2);
  return `¥ ${yuan}`;
}

/**
 * 格式化金额（不带符号）
 */
function formatNumber(cents) {
  if (cents === null || cents === undefined) return '0.00';
  return (cents / 100).toFixed(2);
}

/**
 * 格式化日期
 * @param {Date|string|number} date
 * @param {string} fmt - 'YYYY-MM-DD HH:mm:ss'
 */
function formatDate(date, fmt = 'YYYY-MM-DD HH:mm:ss') {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const pad = (n) => n < 10 ? '0' + n : n;
  return fmt
    .replace('YYYY', d.getFullYear())
    .replace('MM', pad(d.getMonth() + 1))
    .replace('DD', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()));
}

/**
 * 相对时间（如：刚刚 / 5 分钟前 / 昨天）
 */
function relativeTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const diff = Date.now() - d.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return '刚刚';
  if (diff < hour) return Math.floor(diff / minute) + ' 分钟前';
  if (diff < day) return Math.floor(diff / hour) + ' 小时前';
  if (diff < 2 * day) return '昨天';
  if (diff < 7 * day) return Math.floor(diff / day) + ' 天前';
  return formatDate(d, 'YYYY-MM-DD');
}

/**
 * 隐藏手机号中间四位
 */
function maskPhone(phone) {
  if (!phone || phone.length < 11) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(7);
}

/**
 * 品类名称映射
 */
const CATEGORY_NAMES = {
  phone: '手机',
  clothes: '衣物',
  digital: '数码',
  home: '家电',
  luxury: '闲置包',
  book: '书籍',
  metal: '废品'
};

function categoryName(code) {
  return CATEGORY_NAMES[code] || '其他';
}

/**
 * 订单状态文案
 */
const ORDER_STATUS_TEXT = {
  1: '待评估',
  2: '已派单',
  3: '已取件',
  4: '已完成',
  5: '已取消'
};

function orderStatusText(status) {
  return ORDER_STATUS_TEXT[status] || '未知';
}

/**
 * 防抖
 */
function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * 节流
 */
function throttle(fn, delay = 300) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn.apply(this, args);
    }
  };
}

module.exports = {
  formatMoney,
  formatNumber,
  formatDate,
  relativeTime,
  maskPhone,
  categoryName,
  orderStatusText,
  debounce,
  throttle
};