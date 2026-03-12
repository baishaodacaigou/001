const app = getApp();

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    creditScore: 0,
    creditFreeAmount: 0,
    stats: {
      totalOrders: 0,
      pendingPayment: 0,
      inUse: 0,
      completed: 0
    },
    menuList: [
      { icon: '/images/icon-record.png', title: '租赁记录', desc: '历史租赁订单', url: '/pages/order/order' }
    ]
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
    if (this.data.isLoggedIn) {
      this.loadUserStats();
    }
  },

  checkLoginStatus() {
    try {
      const userInfo = app.globalData.userInfo;
      const creditScore = app.globalData.creditScore;
      const creditFreeAmount = app.globalData.creditFreeAmount;
      
      if (userInfo) {
        this.setData({ 
          userInfo: userInfo,
          isLoggedIn: true,
          creditScore: userInfo.creditScore || creditScore || 0,
          creditFreeAmount: userInfo.creditFreeAmount || creditFreeAmount || 0
        });
      }
    } catch (e) {
      console.log('检查登录状态失败:', e);
    }
  },

  loadUserStats() {
    const userId = this.data.userInfo && this.data.userInfo.id;
    if (!userId) return;
    
    my.request({
      url: `${app.globalData.rentApiUrl}/user/stats`,
      method: 'GET',
      data: { user_id: userId },
      timeout: 10000,
      success: (res) => {
        if (res.data && res.data.code === 0) {
          this.setData({ stats: res.data.data });
        }
      },
      fail: (err) => {
        console.log('获取用户统计失败:', err);
        this.setData({
          stats: {
            totalOrders: 0,
            pendingPayment: 0,
            inUse: 0,
            completed: 0
          }
        });
      }
    });
  },

  handleLogin() {
    my.showLoading({ content: '登录中...', delay: 0 });
    
    const loginTimeout = setTimeout(() => {
      my.hideLoading();
      my.showToast({ 
        content: '登录超时，请重试', 
        type: 'none' 
      });
    }, 20000);
    
    app.login().then((userInfo) => {
      clearTimeout(loginTimeout);
      my.hideLoading();
      
      this.setData({ 
        userInfo: userInfo,
        isLoggedIn: true,
        creditScore: userInfo.creditScore || 0,
        creditFreeAmount: userInfo.creditFreeAmount || 0
      });
      
      this.loadUserStats();
      
      my.showToast({ 
        content: '登录成功', 
        type: 'success' 
      });
    }).catch((err) => {
      clearTimeout(loginTimeout);
      my.hideLoading();
      console.error('登录失败:', err);
    });
  },

  onMenuTap(e) {
    const { url } = e.currentTarget.dataset;
    
    if (url) {
      my.navigateTo({ url });
    }
  },

  onOrderTap(e) {
    const { status } = e.currentTarget.dataset;
    my.navigateTo({
      url: `/pages/order/order?status=${status}`
    });
  },

  onLogoutTap() {
    my.confirm({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
          this.setData({ 
            userInfo: null,
            isLoggedIn: false,
            creditScore: 0,
            creditFreeAmount: 0,
            stats: {
              totalOrders: 0,
              pendingPayment: 0,
              inUse: 0,
              completed: 0
            }
          });
          my.showToast({ content: '已退出登录', type: 'success' });
        }
      }
    });
  }
});
