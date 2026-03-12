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
    hasMore: true
  },

  onLoad(options) {
    if (options.status) {
      this.setData({ currentTab: options.status });
    }
    this.loadOrders();
  },

  onShow() {
    this.loadOrders();
  },

  onPullDownRefresh() {
    this.setData({ page: 1, hasMore: true });
    this.loadOrders().then(() => {
      my.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
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
      const userId = app.globalData.userInfo && app.globalData.userInfo.id;
      my.request({
        url: `${app.globalData.rentApiUrl}/orders`,
        method: 'GET',
        data: {
          user_id: userId,
          status: this.data.currentTab,
          page: this.data.page,
          pageSize: this.data.pageSize
        },
        success: (res) => {
          if (res.data.code === 0) {
            this.setData({ 
              orderList: res.data.data.list,
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
    
    const userId = app.globalData.userInfo && app.globalData.userInfo.id;
    my.request({
      url: `${app.globalData.rentApiUrl}/orders`,
      method: 'GET',
      data: {
        user_id: userId,
        status: this.data.currentTab,
        page: this.data.page,
        pageSize: this.data.pageSize
      },
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({ 
            orderList: [...this.data.orderList, ...res.data.data.list],
            hasMore: res.data.data.hasMore
          });
        }
      }
    });
  },

  getMockOrders() {
    return [
      {
        id: 'ORD2024010001',
        order_no: 'ORD2024010001',
        product_name: 'RTX 4090 GPU服务器',
        product_image: '/images/gpu.png',
        status: 'pending',
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
      url: `/pages/detail/detail?id=${id}`
    });
  },

  onPayTap(e) {
    const { id } = e.currentTarget.dataset;
    this.processPayment(id);
  },

  processPayment(orderId) {
    my.showLoading({ content: '正在支付...' });

    my.request({
      url: `${app.globalData.rentApiUrl}/orders/${orderId}/pay`,
      method: 'PUT',
      data: { trade_no: 'TRADE_' + Date.now() },
      success: (res) => {
        my.hideLoading();
        if (res.data.code === 0) {
          my.tradePay({
            tradeNO: 'TRADE_' + Date.now(),
            success: (payRes) => {
              if (payRes.resultCode === '9000') {
                my.showToast({ content: '支付成功', type: 'success' });
                this.loadOrders();
              } else {
                my.showToast({ content: '支付失败', type: 'none' });
              }
            }
          });
        }
      },
      fail: () => {
        my.hideLoading();
        my.showToast({ content: '网络错误', type: 'none' });
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
    my.request({
      url: `${app.globalData.rentApiUrl}/orders/${orderId}/cancel`,
      method: 'PUT',
      data: { reason: '用户取消' },
      success: (res) => {
        if (res.data.code === 0) {
          my.showToast({ content: '订单已取消', type: 'success' });
          this.loadOrders();
        } else {
          my.showToast({ content: res.data.message || '取消失败', type: 'none' });
        }
      }
    });
  },

  onReturnTap(e) {
    const { id } = e.currentTarget.dataset;
    my.request({
      url: `${app.globalData.rentApiUrl}/orders/${id}/return`,
      method: 'PUT',
      success: (res) => {
        if (res.data.code === 0) {
          my.showToast({ content: '已申请归还', type: 'success' });
          this.loadOrders();
        }
      }
    });
  },

  getStatusText(status) {
    const statusMap = {
      pending: '待支付',
      paid: '待发货',
      shipped: '待归还',
      returned: '已归还',
      completed: '已完成',
      cancelled: '已取消'
    };
    return statusMap[status] || '未知状态';
  }
});
