// services/mock.js
// 本地 Mock 数据，用于无后端环境下体验完整 UI 流程
// 配合 config.js 的 useMock 开关使用

const delay = (data, ms = 200) => new Promise(r => setTimeout(() => r({ code: 0, message: 'success', data }), ms));

// ==================== 品类 ====================
const CATEGORIES = [
  { code: 'phone',   name: '手机',    icon: '📱', color: '#DBEAFE', desc: 'iPhone / 华为 / 小米' },
  { code: 'clothes', name: '衣物',    icon: '👕', color: '#FCE7F3', desc: '旧衣 / 床单 / 鞋包' },
  { code: 'digital', name: '数码',    icon: '💻', color: '#E0E7FF', desc: '笔记本 / 平板 / 相机' },
  { code: 'home',    name: '家电',    icon: '🔌', color: '#FEE2E2', desc: '空调 / 冰箱 / 洗衣机' },
  { code: 'luxury',  name: '闲置包',  icon: '👜', color: '#F3E8FF', desc: '轻奢 / 设计师品牌' },
  { code: 'book',    name: '书籍',    icon: '📚', color: '#D1FAE5', desc: '教材 / 课外书 / 小说' },
  { code: 'metal',   name: '废品',    icon: '♻️', color: '#CFFAFE', desc: '纸壳 / 塑料 / 金属' }
];

// ==================== 字段配置 ====================
const CATEGORY_FIELDS = {
  phone: [
    { key: 'model', label: '品牌型号', type: 'text', required: false, placeholder: '如：iPhone 14 Pro' },
    { key: 'condition', label: '外观成色', type: 'select', required: false, options: ['99新', '95新', '9新', '8新'] },
    { key: 'capacity', label: '存储容量', type: 'text', required: false, placeholder: '如：256G' },
    { key: 'hasOriginal', label: '原装配件', type: 'switch', required: false, placeholder: '是否齐全' }
  ],
  clothes: [
    { key: 'types', label: '衣物类型', type: 'multi', required: false, options: ['冬装', '夏装', '运动鞋', '包帽', '床单被套'] },
    { key: 'weight', label: '预估重量(kg)', type: 'text', required: false, placeholder: '如：5' },
    { key: 'count', label: '件数', type: 'text', required: false, placeholder: '如：20 件' }
  ],
  digital: [
    { key: 'deviceType', label: '设备类型', type: 'select', required: false, options: ['笔记本', '平板', '相机', '耳机'] },
    { key: 'model', label: '品牌型号', type: 'text', required: false, placeholder: '如：MacBook Pro 13寸' }
  ],
  home: [
    { key: 'homeType', label: '家电类型', type: 'select', required: false, options: ['空调', '冰箱', '洗衣机', '小家电'] },
    { key: 'needInstall', label: '需要上门拆机', type: 'switch', required: false }
  ],
  book: [
    { key: 'bookType', label: '书籍类别', type: 'multi', required: false, options: ['教材', '课外书', '小说', '儿童读物'] },
    { key: 'count', label: '数量', type: 'text', required: false, placeholder: '如：23本' }
  ],
  metal: [
    { key: 'metalType', label: '废品类型', type: 'multi', required: false, options: ['纸壳', '塑料瓶', '金属', '玻璃'] },
    { key: 'weight', label: '预估重量(kg)', type: 'text', required: false, placeholder: '如：5' }
  ],
  luxury: [
    { key: 'brand', label: '品牌', type: 'text', required: false, placeholder: '如：Coach' },
    { key: 'year', label: '购买年份', type: 'text', required: false, placeholder: '如：2022' }
  ]
};

// ==================== 故事 ====================
const STORIES = [
  {
    id: 1,
    title: '30 部旧手机，他用 3 个月拼出一台时光放映机',
    cover: 'https://img.ixintu.com/upload/jpg/20210522/29f9d81c0fec24af57a3e4fec45f5a09_85471_800_800.jpg!ys',
    summary: '一位深圳硬件工程师，把邻居家的旧手机回收后，拆解主板拼装出一台老式幻灯片放映机。',
    viewCount: 12800,
    likeCount: 6800,
    commentCount: 2300,
    author: '故事官阿琳',
    type: 'video',
    duration: '02:34',
    coverEmoji: '👗',
    publishedAt: '2026-06-20'
  },
  {
    id: 2,
    title: '500 斤旧书，变成 12 所乡村小学的图书角',
    cover: 'https://img.ixintu.com/upload/jpg/20210522/30bb9f20d97f97a3a7d2c7a8c97b9c52_72295_800_800.jpg!ys',
    summary: '一个北京的大学生社团，把回收的旧书分类消毒后，捐给了云南山区的孩子们。',
    viewCount: 8900,
    likeCount: 4200,
    commentCount: 890,
    author: '大学生社团',
    type: 'image',
    coverEmoji: '📚',
    publishedAt: '2026-06-15'
  },
  {
    id: 3,
    title: '她把妈妈留下的旧旗袍，改成了女儿的汉服',
    cover: 'https://img.ixintu.com/upload/jpg/20210522/c1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6_12345_800_800.jpg!ys',
    summary: '上海一位年轻妈妈用 3 周时间，把妈妈留下的旧旗袍改成了女儿的汉服，留住了两代人的记忆。',
    viewCount: 15600,
    likeCount: 8200,
    commentCount: 1500,
    author: '阿满妈妈',
    type: 'image',
    coverEmoji: '🧸',
    publishedAt: '2026-06-10'
  },
  {
    id: 4,
    title: '1 台报废洗衣机，被他改造成家庭鱼菜共生系统',
    cover: 'https://img.ixintu.com/upload/jpg/20210522/xx9d81c0fec24af57a3e4fec45f5a09_85471_800_800.jpg!ys',
    summary: '杭州一位退休工程师，把自家报废的洗衣机改造成了鱼菜共生装置，养鱼种菜两不误。',
    viewCount: 6700,
    likeCount: 3500,
    commentCount: 420,
    author: '退休工程师老李',
    type: 'video',
    duration: '04:12',
    coverEmoji: '💻',
    publishedAt: '2026-06-05'
  },
  {
    id: 5,
    title: '1000 个旧瓶盖，组成了上海外滩的夜景马赛克',
    cover: 'https://img.ixintu.com/upload/jpg/20210522/yy9d81c0fec24af57a3e4fec45f5a09_85471_800_800.jpg!ys',
    summary: '上海一位艺术家，用 3 个月时间收集了 1000 个旧瓶盖，拼成了外滩夜景的马赛克壁画。',
    viewCount: 9300,
    likeCount: 5100,
    commentCount: 780,
    author: '艺术家小林',
    type: 'image',
    coverEmoji: '👗',
    publishedAt: '2026-05-30'
  }
];

// ==================== 订单 ====================
const MOCK_ORDERS = [
  {
    id: 'GC20260620001',
    categoryCode: 'phone',
    categoryName: '手机',
    itemName: 'iPhone 12 · 95新',
    status: 4,
    statusText: '已完成',
    formData: { model: 'iPhone 12', condition: '95新' },
    remark: '屏幕有轻微划痕',
    photos: [],
    points: 25,
    carbonKg: 8.5,
    createdAt: '2026-06-20 14:30',
    date: '06-20',
    time: '14:30'
  },
  {
    id: 'GC20260615002',
    categoryCode: 'clothes',
    categoryName: '衣物',
    itemName: '旧衣物 · 8kg',
    status: 4,
    statusText: '已完成',
    formData: { types: ['冬装', '运动鞋'], weight: '8', count: '15' },
    remark: '',
    photos: [],
    points: 12,
    carbonKg: 3.2,
    createdAt: '2026-06-15 10:15',
    date: '06-15',
    time: '10:15'
  },
  {
    id: 'GC20260610003',
    categoryCode: 'book',
    categoryName: '书籍',
    itemName: '旧书籍 · 23本',
    status: 4,
    statusText: '已完成',
    formData: { bookType: ['小说'], count: '23' },
    remark: '',
    photos: [],
    points: 8,
    carbonKg: 1.8,
    createdAt: '2026-06-10 16:45',
    date: '06-10',
    time: '16:45'
  }
];

// 进行中订单
const MOCK_PENDING_ORDERS = [
  {
    id: 'GC20260628001',
    categoryCode: 'digital',
    categoryName: '数码',
    itemName: 'MacBook Pro 2019',
    status: 2,
    statusText: '已派单',
    formData: { deviceType: '笔记本', model: 'MacBook Pro 2019' },
    remark: '电池有些鼓包',
    photos: [],
    riderName: '张师傅',
    riderPhone: '138****6688',
    createdAt: '2026-06-28 11:20',
    date: '06-28',
    time: '11:20'
  }
];

// ==================== Mock 路由 ====================
const mockRouter = {
  // 鉴权
  'POST /auth/login': () => delay({
    token: 'mock_token_' + Date.now(),
    user: {
      id: 10086,
      nickname: '环保达人',
      avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKvNxk/132',
      phone: '138****6688',
      city: '深圳市'
    }
  }),

  // 用户
  'GET /user/info': () => delay({
    id: 10086,
    nickname: '环保达人',
    avatar: 'https://thirdwx.qlogo.cn/mmopen/vi_32/Q0j4TwGTfTKvNxk/132',
    phone: '138****6688',
    city: '深圳市',
    points: 1250,
    carbonKg: 86.5,
    treeCount: 4
  }),

  // 品类
  'GET /categories': () => delay({ list: CATEGORIES }),

  'GET /categories/:code': (params) => {
    const cat = CATEGORIES.find(c => c.code === params.code);
    return delay(cat || null);
  },

  'GET /categories/:code/fields': (params) => delay({ fields: CATEGORY_FIELDS[params.code] || [] }),

  // 订单
  'POST /orders': () => delay({ id: 'GC' + Date.now() }),

  'GET /orders': () => delay({ list: MOCK_ORDERS, total: MOCK_ORDERS.length }),

  'GET /orders/pending': () => delay({ list: MOCK_PENDING_ORDERS }),

  'GET /orders/:id': (params) => {
    const all = [...MOCK_ORDERS, ...MOCK_PENDING_ORDERS];
    const order = all.find(o => o.id === params.id) || MOCK_ORDERS[0];
    return delay({
      ...order,
      address: {
        name: '张三',
        phone: '138****6688',
        detail: '广东省深圳市南山区科技园 8 栋 2 单元 1801'
      },
      timeline: [
        { time: order.createdAt, status: '订单已创建' },
        { time: '2026-06-28 11:30', status: '骑手已接单' },
        { time: '待更新', status: '上门评估' },
        { time: '待更新', status: '完成回收' }
      ]
    });
  },

  'POST /orders/:id/cancel': () => delay({ success: true }),

  'GET /orders/:id/timeline': (params) => delay({
    list: [
      { time: '2026-06-28 11:20', status: '订单已创建' },
      { time: '2026-06-28 11:30', status: '骑手已接单' },
      { time: '待更新', status: '上门评估' },
      { time: '待更新', status: '完成回收' }
    ]
  }),

  'POST /orders/:id/after-sale': () => delay({ success: true }),

  'GET /stories/:id': (params) => {
    const story = STORIES.find(s => s.id == params.id) || STORIES[0];
    return delay({ ...story, content: '这里是故事的完整内容...' });
  },

  // 积分
  'GET /points': () => delay({
    balance: 1250,
    carbonKg: 86.5,
    treeCount: 4,
    thisMonth: 145
  }),

  'GET /points/history': () => delay({
    list: [
      { id: 1, time: '2026-06-20 15:00', type: '回收奖励', desc: '回收 iPhone 12', amount: 25 },
      { id: 2, time: '2026-06-15 11:00', type: '回收奖励', desc: '回收旧衣物 15 件', amount: 12 },
      { id: 3, time: '2026-06-10 17:00', type: '回收奖励', desc: '回收旧书 23 本', amount: 8 },
      { id: 4, time: '2026-06-01 09:00', type: '签到奖励', desc: '每日签到', amount: 5 }
    ]
  }),

  // 地址
  'GET /user/addresses': () => delay({
    list: [
      { id: 1, name: '张三', phone: '138****6688', detail: '广东省深圳市南山区科技园 8 栋 2 单元 1801', isDefault: true },
      { id: 2, name: '李四', phone: '139****1234', detail: '广东省深圳市福田区华强北 1 栋 502', isDefault: false }
    ]
  }),

  'POST /user/addresses': () => delay({ id: Date.now(), success: true }),
  'PUT /user/addresses/:id': () => delay({ success: true }),
  'DELETE /user/addresses/:id': () => delay({ success: true }),

  // 故事
  'GET /stories': (params) => {
    const size = parseInt(params.size) || 5;
    return delay({ list: STORIES.slice(0, size), total: STORIES.length });
  },

  // 上传
  'POST /upload/sign': () => delay({
    tmpSecretId: 'mock-secret-id',
    tmpSecretKey: 'mock-secret-key',
    sessionToken: 'mock-token',
    startTime: Date.now(),
    expiredTime: Date.now() + 30 * 60 * 1000,
    key: 'order-images/mock-' + Date.now() + '.jpg',
    url: 'https://mock-cos.example.com/upload'
  }),

  // 配置
  'GET /config': () => delay({
    enableMock: true,
    version: '1.0.0',
    notice: '当前为 Mock 模式，所有数据均为演示数据。'
  })
};

// 简单路径匹配
function matchRoute(method, url) {
  const key = `${method} ${url.split('?')[0]}`;

  // 精确匹配
  if (mockRouter[key]) {
    return { handler: mockRouter[key], params: {} };
  }

  // 带参数的路径匹配
  for (const routeKey of Object.keys(mockRouter)) {
    const [routeMethod, routePath] = routeKey.split(' ');
    if (routeMethod !== method) continue;
    if (!routePath.includes(':')) continue;

    const routeParts = routePath.split('/');
    const urlParts = url.split('?')[0].split('/');

    if (routeParts.length !== urlParts.length) continue;

    const params = {};
    let match = true;
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        params[routeParts[i].slice(1)] = urlParts[i];
      } else if (routeParts[i] !== urlParts[i]) {
        match = false;
        break;
      }
    }

    if (match) {
      return { handler: mockRouter[routeKey], params };
    }
  }

  return null;
}

module.exports = { matchRoute };
