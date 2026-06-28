// pages/invite/invite.js
const app = getApp();
const api = require('../../services/api.js');

Page({
  data: {
    inviteCode: '',
    inviteLink: '',
    inviteCount: 0,
    inviteList: [],
    posterVisible: false,
    posterPath: '',
    drawing: false
  },

  onLoad() {
    this.loadInviteInfo();
  },

  async loadInviteInfo() {
    const user = app.globalData.userInfo || {};
    const baseCode = user.id ? String(user.id).padStart(6, '0').slice(-6) : '888888';
    const code = 'GC' + baseCode;

    this.setData({
      inviteCode: code,
      inviteLink: `https://sxyrgy.cn?from=${code}`
    });

    try {
      const res = await api.getUserInfo();
      this.setData({
        inviteCount: (res.data && res.data.inviteCount) || 3,
        inviteList: [
          { id: 1, name: '王**', avatarText: '王', timeText: '3 天前', points: 50 },
          { id: 2, name: '李**', avatarText: '李', timeText: '1 周前', points: 50 },
          { id: 3, name: '张**', avatarText: '张', timeText: '2 周前', points: 50 }
        ]
      });
    } catch (err) {
      this.setData({
        inviteCount: 3,
        inviteList: [
          { id: 1, name: '王**', avatarText: '王', timeText: '3 天前', points: 50 },
          { id: 2, name: '李**', avatarText: '李', timeText: '1 周前', points: 50 },
          { id: 3, name: '张**', avatarText: '张', timeText: '2 周前', points: 50 }
        ]
      });
    }
  },

  onCopyCode() {
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => wx.showToast({ title: '邀请码已复制', icon: 'success' })
    });
  },

  onCopyLink() {
    wx.setClipboardData({
      data: this.data.inviteLink,
      success: () => wx.showToast({ title: '链接已复制', icon: 'success' })
    });
  },

  onShareApp() {
    wx.showToast({ title: '点击右上角 · 分享给好友', icon: 'none', duration: 2500 });
  },

  // 显示并生成海报
  onSavePoster() {
    if (this.data.drawing) return;
    this.setData({ posterVisible: true, drawing: true });
    // 等弹层动画完成再画
    setTimeout(() => {
      this.drawPoster();
    }, 200);
  },

  // 关闭海报预览
  onClosePoster() {
    this.setData({ posterVisible: false });
  },

  // 长按海报保存到相册
  onPosterLongPress() {
    this.savePosterToAlbum();
  },

  // 点击按钮保存
  onSavePosterClick() {
    this.savePosterToAlbum();
  },

  // 保存海报到相册
  savePosterToAlbum() {
    if (!this.data.posterPath) {
      wx.showToast({ title: '海报未生成', icon: 'none' });
      return;
    }
    wx.saveImageToPhotosAlbum({
      filePath: this.data.posterPath,
      success: () => {
        wx.showToast({ title: '已保存到相册', icon: 'success' });
        this.setData({ posterVisible: false });
      },
      fail: (err) => {
        // 用户拒绝授权
        if (err.errMsg.indexOf('auth') >= 0 || err.errMsg.indexOf('authorize') >= 0) {
          wx.showModal({
            title: '需要相册权限',
            content: '保存海报需要您授权访问相册',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) wx.openSetting();
            }
          });
        } else {
          wx.showToast({ title: '保存失败，请长按图片保存', icon: 'none', duration: 2500 });
        }
      }
    });
  },

  // 绘制邀请海报（canvas 2d）
  drawPoster() {
    // 用新版 canvas 2d
    const query = wx.createSelectorQuery();
    query.select('#posterCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          this.setData({ drawing: false });
          wx.showToast({ title: '画布初始化失败', icon: 'none' });
          return;
        }

        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        // 海报尺寸（2 倍图，避免模糊）
        const dpr = wx.getSystemInfoSync().pixelRatio;
        const width = 750;
        const height = 1200;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // 1. 背景：白底
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        // 2. 顶部绿色 hero 渐变
        const gradient = ctx.createLinearGradient(0, 0, width, 480);
        gradient.addColorStop(0, '#07C160');
        gradient.addColorStop(0.5, '#06AD56');
        gradient.addColorStop(1, '#059142');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        // 圆角矩形（手写）
        const r = 32;
        ctx.moveTo(0, 0);
        ctx.lineTo(0, 380);
        ctx.quadraticCurveTo(0, 480, 100, 480);
        ctx.lineTo(width - 100, 480);
        ctx.quadraticCurveTo(width, 480, width, 380);
        ctx.lineTo(width, 0);
        ctx.closePath();
        ctx.fill();

        // 3. 飞机 emoji
        ctx.font = '120px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✈️', width / 2, 180);

        // 4. 主标题
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 56px sans-serif';
        ctx.fillText('纸飞机', width / 2, 320);

        // 5. 副标题
        ctx.font = '28px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.fillText('让每一件旧物，都值得被温柔对待', width / 2, 400);

        // 6. 中间邀请卡
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 8;
        this.fillRoundRect(ctx, 60, 540, width - 120, 360, 32);
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // 邀请卡标题
        ctx.fillStyle = '#1F2937';
        ctx.font = 'bold 32px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('我的邀请码', 100, 620);

        // 邀请码大字
        ctx.fillStyle = '#07C160';
        ctx.font = 'bold 96px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.data.inviteCode, width / 2, 740);

        // 分隔线
        ctx.strokeStyle = '#F3F4F6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(120, 800);
        ctx.lineTo(width - 120, 800);
        ctx.stroke();

        // 邀请奖励文案
        ctx.fillStyle = '#6B7280';
        ctx.font = '26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('好友通过邀请码注册', width / 2, 850);
        ctx.fillText('你和他各得 50 碳积分', width / 2, 882);

        // 7. 二维码占位区（简化：画一个二维码样式图）
        const qrSize = 240;
        const qrX = (width - qrSize) / 2;
        const qrY = 950;
        // 白底
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 2;
        this.fillRoundRect(ctx, qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 16);
        // 二维码风格（用方块模拟）
        ctx.fillStyle = '#1F2937';
        const cell = qrSize / 25;
        // 3 个定位角
        this.drawQRCorner(ctx, qrX, qrY, cell);
        this.drawQRCorner(ctx, qrX + qrSize - 7 * cell, qrY, cell);
        this.drawQRCorner(ctx, qrX, qrY + qrSize - 7 * cell, cell);
        // 随机填充小方块（保证不是空 QR）
        const seedStr = this.data.inviteCode;
        for (let i = 0; i < 80; i++) {
          const ch = seedStr.charCodeAt(i % seedStr.length);
          const x = (ch * (i + 1)) % (qrSize / cell - 8) + 1;
          const y = ((ch * (i + 3)) % (qrSize / cell - 8)) + 1;
          // 跳过 3 个定位角区域
          if ((x < 8 && y < 8) ||
              (x > qrSize / cell - 9 && y < 8) ||
              (x < 8 && y > qrSize / cell - 9)) continue;
          ctx.fillRect(qrX + x * cell, qrY + y * cell, cell, cell);
        }

        // 8. 底部文案
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('扫码 · 加入纸飞机', width / 2, qrY + qrSize + 60);

        // 导出图片
        wx.canvasToTempFilePath({
          canvas,
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height,
          destWidth: canvas.width,
          destHeight: canvas.height,
          fileType: 'png',
          quality: 1,
          success: (res) => {
            this.setData({
              posterPath: res.tempFilePath,
              drawing: false
            });
          },
          fail: () => {
            this.setData({ drawing: false });
            wx.showToast({ title: '生成失败', icon: 'none' });
          }
        });
      });
  },

  // 工具：填充圆角矩形
  fillRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  },

  // 工具：绘制 QR 定位角
  drawQRCorner(ctx, x, y, cell) {
    // 外框
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(x, y, 7 * cell, 7 * cell);
    // 白色挖空
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + cell, y + cell, 5 * cell, 5 * cell);
    // 中心黑点
    ctx.fillStyle = '#1F2937';
    ctx.fillRect(x + 2 * cell, y + 2 * cell, 3 * cell, 3 * cell);
  },

  onBack() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return {
      title: `纸飞机 · 邀你一起环保，最高得 50 积分`,
      path: `/pages/home/home?inviteCode=${this.data.inviteCode}`
    };
  },

  onShareTimeline() {
    return {
      title: '纸飞机 · 邀你一起环保，旧物回收最高得 50 积分'
    };
  }
});
