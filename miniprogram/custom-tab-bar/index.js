// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    color: '#9CA3AF',
    selectedColor: '#07C160',
    list: [
      {
        pagePath: '/pages/home/home',
        text: '首页',
        icon: '⌂'
      },
      {
        pagePath: '/pages/photo-upload/photo-upload',
        text: '下单',
        icon: '+',
        isFab: true
      },
      {
        pagePath: '/pages/profile/profile',
        text: '我的',
        icon: '◉'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const index = e.currentTarget.dataset.index;
      const url = this.data.list[index].pagePath;
      wx.switchTab({ url });
      this.setData({ selected: index });
    }
  }
})
