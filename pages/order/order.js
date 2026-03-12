const app = getApp();

Page({
  data: {
    currentTab: 'all',
    tabs: [
      { key: 'all', name: '全部' },
      { key: 'pending', name: '待支付' },
      { key: 'paid', name: '待发货' },
      { key: 'shipped', name: '待归还' },
      { key: 'completed', name: '已完成' }
    ],
    orderList: [],
    loading: true,
    page: 1,
    pageSize: 10,
    hasMore: true,
    isLoggedIn: false
  },

  onLoad(options) {
    if (options.status) {
      this.setData({ currentTab: options.status });
    }
  },

  onShow() {
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    if (app.globalData.userInfo) {
      this.setData({ isLoggedIn: true });
      this.loadOrders();
    } else {
      this.setData({ 
        isLoggedIn: false,
        loading: false,
        orderList: []
      });
    }
  },

  onPullDownRefresh() {
    if (!this.data.isLoggedIn) {
      my.stopPullDownRefresh();
      return;
    }
    this.setData({ page: 1, hasMore: true });
    this.loadOrders().then(() => {
      my.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading && this.data.isLoggedIn) {
      this.loadMore();
    }
  },

  onTabChange(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({ 
      currentTab: key, 
      page: 1, 
      hasMore: true,
      orderList: []
    });
    this.loadOrders();
  },

  loadOrders() {
    this.setData({ loading: true });
    
    return new Promise((resolve) => {
      my.request({
        url: `${app.globalData.rentApiUrl}/orders`,
        method: 'GET',
        data: {
          user_id: app.globalData.userInfo && app.globalData.userInfo.id,
          status: this.data.currentTab,
          page: this.data.page,
          pageSize: this.data.pageSize
        },
        timeout: 10000,
        success: (res) => {
          if (res.data && res.data.code === 0) {
            const orders = res.data.data.list.map(order => ({
              ...order,
              statusText: this.getStatusText(order.status)
            }));
            this.setData({ 
              orderList: orders,
              hasMore: res.data.data.hasMore
            });
          }
        },
        fail: () => {
          this.setData({
            orderList: this.getMockOrders()
          });
        },
        complete: () => {
          this.setData({ loading: false });
          resolve();
        }
      });
    });
  },

  loadMore() {
    this.setData({ page: this.data.page + 1 });
    
    my.request({
      url: `${app.globalData.rentApiUrl}/orders`,
      method: 'GET',
      data: {
        user_id: app.globalData.userInfo && app.globalData.userInfo.id,
        status: this.data.currentTab,
        page: this.data.page,
        pageSize: this.data.pageSize
      },
      timeout: 10000,
      success: (res) => {
        if (res.data && res.data.code === 0) {
          const orders = res.data.data.list.map(order => ({
            ...order,
            statusText: this.getStatusText(order.status)
          }));
          this.setData({ 
            orderList: [...this.data.orderList, ...orders],
            hasMore: res.data.data.hasMore
          });
        }
      }
    });
  },

  getStatusText(status) {
    const statusMap = {
      'pending': '待支付',
      'paid': '待发货',
      'shipped': '待归还',
      'returned': '已归还',
      'completed': '已完成',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  },

  getMockOrders() {
    return [
      {
        id: 'ORD2024010001',
        order_no: 'ORD2024010001',
        product_name: 'RTX 4090 GPU服务器',
        product_image: '/images/gpu.png',
        status: 'pending',
        statusText: '待支付',
        total_price: 2640,
        deposit: 0,
        rent_days: 30,
        created_at: '2024-01-15 14:30:00'
      },
      {
        id: 'ORD2024010002',
        order_no: 'ORD2024010002',
        product_name: 'i9-14900K 电竞主机',
        product_image: '/images/pc.png',
        status: 'paid',
        statusText: '待发货',
        total_price: 1888,
        deposit: 0,
        rent_days: 30,
        created_at: '2024-01-14 10:20:00'
      }
    ].filter(item => {
      if (this.data.currentTab === 'all') return true;
      return item.status === this.data.currentTab;
    });
  },

  onOrderTap(e) {
    const { id } = e.currentTarget.dataset;
    my.navigateTo({
      url: `/pages/order/detail?id=${id}`
    });
  },

  onPayTap(e) {
    const { id, orderno } = e.currentTarget.dataset;
    this.goToPayment(id, orderno);
  },

  goToPayment(orderId, orderNo) {
    my.showLoading({ content: '创建支付订单...' });
    my.request({
      url: `${app.globalData.rentApiUrl}/payment/create`,
      method: 'POST',
      data: { order_id: orderId },
      timeout: 10000,
      success: (res) => {
        my.hideLoading();
        if (res.data && res.data.code === 0) {
          const payParams = res.data.data;
          this.processPayment(payParams);
        } else {
          my.showToast({
            content: res.data.message || '创建支付订单失败',
            type: 'none'
          });
        }
      },
      fail: () => {
        my.hideLoading();
        my.showToast({
          content: '网络错误，请稍后重试',
          type: 'none'
        });
      }
    });
  },

  processPayment(payParams) {
    my.tradePay({
      ...payParams,
      success: (res) => {
        if (res.resultCode === '9000') {
          my.showToast({
            content: '支付成功',
            type: 'success',
            duration: 2000
          });
          setTimeout(() => {
            this.loadOrders();
          }, 2000);
        } else if (res.resultCode === '6001') {
          my.showToast({
            content: '您已取消支付',
            type: 'none',
            duration: 3000
          });
        } else {
          my.showToast({
            content: `支付失败：${res.resultCode}`,
            type: 'none',
            duration: 3000
          });
        }
      },
      fail: (err) => {
        my.showToast({
          content: '支付失败，请稍后重试',
          type: 'none',
          duration: 3000
        });
      }
    });
  },

  onCancelTap(e) {
    const { id } = e.currentTarget.dataset;
    
    my.confirm({
      title: '确认取消',
      content: '确定要取消此订单吗？',
      success: (res) => {
        if (res.confirm) {
          this.cancelOrder(id);
        }
      }
    });
  },

  cancelOrder(orderId) {
    my.showLoading({ content: '取消中...' });
    my.request({
      url: `${app.globalData.rentApiUrl}/orders/${orderId}/cancel`,
      method: 'PUT',
      data: { reason: '用户取消' },
      timeout: 10000,
      success: (res) => {
        my.hideLoading();
        if (res.data && res.data.code === 0) {
          my.showToast({ content: '订单已取消', type: 'success' });
          this.loadOrders();
        } else {
          my.showToast({ content: res.data.message || '取消失败', type: 'none' });
        }
      },
      fail: () => {
        my.hideLoading();
        my.showToast({ content: '网络错误', type: 'none' });
      }
    });
  },

  onReturnTap(e) {
    const { id } = e.currentTarget.dataset;
    
    my.confirm({
      title: '申请归还',
      content: '确定要申请归还设备吗？',
      success: (res) => {
        if (res.confirm) {
          this.processReturn(id);
        }
      }
    });
  },

  processReturn(orderId) {
    my.showLoading({ content: '提交中...' });
    my.request({
      url: `${app.globalData.rentApiUrl}/orders/${orderId}/return`,
      method: 'PUT',
      timeout: 10000,
      success: (res) => {
        my.hideLoading();
        if (res.data && res.data.code === 0) {
          my.showToast({ content: '已申请归还', type: 'success' });
          this.loadOrders();
        } else {
          my.showToast({ content: res.data.message || '申请失败', type: 'none' });
        }
      },
      fail: () => {
        my.hideLoading();
        my.showToast({ content: '网络错误', type: 'none' });
      }
    });
  },

  onLoginTap() {
    my.switchTab({ url: '/pages/mine/mine' });
  },

  goShopping() {
    my.switchTab({ url: '/pages/index/index' });
  }
});
