const app = getApp();

Page({
  data: {
    productId: null,
    productInfo: null,
    specificationList: [],
    selectSku: {},
    rentType: 'daily',
    rentDays: 30,
    minDays: 1,
    maxDays: 365,
    totalPrice: 0,
    depositAmount: 0,
    creditFree: false,
    loading: true,
    creditScore: 0,
    creditFreeAmount: 0
  },

  onLoad(options) {
    this.setData({ productId: options.id });
    this.loadProductDetail();
    this.checkCreditStatus();
  },

  loadProductDetail() {
    my.request({
      url: `${app.globalData.rentApiUrl}/products/${this.data.productId}`,
      method: 'GET',
      timeout: 10000,
      success: (res) => {
        if (res.data && res.data.code === 0) {
          const productInfo = res.data.data;
          const specificationList = this.parseSpecifications(productInfo);
          const selectSku = this.getDefaultSku(specificationList);
          
          this.setData({ 
            productInfo: productInfo,
            specificationList: specificationList,
            selectSku: selectSku,
            loading: false
          });
          this.calculatePrice();
        }
      },
      fail: () => {
        const mockProduct = {
          id: this.data.productId,
          name: 'RTX 4090 GPU服务器',
          images: ['/images/gpu.png', '/images/gpu.png'],
          specs: 'RTX 4090 24GB / 64GB内存 / 2TB NVMe SSD',
          description: '高性能GPU服务器，适用于AI训练、深度学习、渲染等场景。',
          daily_price: 88,
          monthly_price: 2388,
          deposit: 5000,
          tags: ['信用免押', '即租即用', '高性能'],
          features: ['24小时技术支持', '免费上门安装', '全程维护保障']
        };
        const specificationList = [
          {
            title: '显卡型号',
            key: 'gpu',
            list: [
              { name: 'RTX 4090', multiple: 1.5 },
              { name: 'RTX 4080', multiple: 1.2 },
              { name: 'RTX 4070', multiple: 1 }
            ]
          },
          {
            title: '内存容量',
            key: 'memory',
            list: [
              { name: '32GB', multiple: 1 },
              { name: '64GB', multiple: 1.2 },
              { name: '128GB', multiple: 1.5 }
            ]
          }
        ];
        const selectSku = this.getDefaultSku(specificationList);
        
        this.setData({ 
          productInfo: mockProduct,
          specificationList: specificationList,
          selectSku: selectSku,
          loading: false
        });
        this.calculatePrice();
      }
    });
  },

  parseSpecifications(product) {
    if (product.specificationList) {
      return product.specificationList;
    }
    return [];
  },

  getDefaultSku(specificationList) {
    const selectSku = {};
    if (specificationList && specificationList.length > 0) {
      specificationList.forEach((item) => {
        if (item.list && item.list.length > 0) {
          selectSku[item.key] = item.list[0];
        }
      });
    }
    return selectSku;
  },

  checkCreditStatus() {
    const creditScore = app.globalData.creditScore || 0;
    const creditFreeAmount = app.globalData.creditFreeAmount || 0;
    const userInfo = app.globalData.userInfo;
    
    this.setData({
      creditScore: userInfo && userInfo.creditScore ? userInfo.creditScore : creditScore,
      creditFreeAmount: userInfo && userInfo.creditFreeAmount ? userInfo.creditFreeAmount : creditFreeAmount,
      creditFree: (userInfo && userInfo.creditScore >= 650) || creditScore >= 650
    });
  },

  onSkuTap(e) {
    const { specification } = e.currentTarget.dataset;
    const { selectSku } = this.data;
    
    const newSku = {
      ...selectSku,
      [specification.key]: specification.specification
    };
    
    this.setData({ selectSku: newSku });
    this.calculatePrice();
  },

  onRentTypeChange(e) {
    this.setData({ rentType: e.detail.value });
    this.calculatePrice();
  },

  onDaysChange(e) {
    const days = parseInt(e.detail.value) || 1;
    this.setData({ rentDays: Math.max(this.data.minDays, Math.min(this.data.maxDays, days)) });
    this.calculatePrice();
  },

  onDaysStep(e) {
    const { type } = e.currentTarget.dataset;
    let days = this.data.rentDays;
    if (type === 'minus') {
      days = Math.max(this.data.minDays, days - 1);
    } else {
      days = Math.min(this.data.maxDays, days + 1);
    }
    this.setData({ rentDays: days });
    this.calculatePrice();
  },

  calculatePrice() {
    const { productInfo, rentType, rentDays, selectSku } = this.data;
    if (!productInfo) return;

    let basePrice = productInfo.daily_price;
    let multiple = 1;
    
    Object.keys(selectSku).forEach((key) => {
      if (selectSku[key] && selectSku[key].multiple) {
        multiple = multiple * selectSku[key].multiple;
      }
    });

    let totalPrice = 0;
    if (rentType === 'daily') {
      totalPrice = basePrice * multiple * rentDays;
    } else {
      const months = Math.ceil(rentDays / 30);
      totalPrice = productInfo.monthly_price * multiple * months;
    }

    const depositAmount = this.data.creditFree ? 0 : productInfo.deposit;

    this.setData({ 
      totalPrice: Math.round(totalPrice * 100) / 100,
      depositAmount: depositAmount
    });
  },

  onRentNow() {
    if (!app.globalData.userInfo) {
      my.confirm({
        title: '提示',
        content: '请先登录后再进行租赁',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            my.switchTab({ url: '/pages/mine/mine' });
          }
        }
      });
      return;
    }
    this.processRent();
  },

  processRent() {
    const { productInfo, rentType, rentDays, totalPrice, depositAmount, selectSku } = this.data;
    
    const skuNames = [];
    Object.keys(selectSku).forEach((key) => {
      if (selectSku[key]) {
        skuNames.push(selectSku[key].name);
      }
    });
    const skuText = skuNames.join(' / ');

    console.log('创建订单 - 用户信息:', app.globalData.userInfo);
    console.log('创建订单 - 商品信息:', productInfo);
    
    const requestData = {
      user_id: app.globalData.userInfo && app.globalData.userInfo.id,
      product_id: productInfo && productInfo.id,
      rent_type: rentType,
      rent_days: rentDays,
      total_price: totalPrice,
      deposit: depositAmount,
      credit_free: this.data.creditFree,
      sku_info: skuText
    };
    
    console.log('创建订单 - 发送数据:', requestData);

    my.showLoading({ content: '正在创建订单...' });

    my.request({
      url: `${app.globalData.rentApiUrl}/orders`,
      method: 'POST',
      data: requestData,
      timeout: 15000,
      success: (res) => {
        my.hideLoading();
        console.log('创建订单响应:', res);
        if (res.data && res.data.code === 0) {
          this.goToPayment(res.data.data);
        } else {
          my.showToast({ content: res.data.message || '创建订单失败', type: 'none' });
        }
      },
      fail: (err) => {
        my.hideLoading();
        console.error('创建订单失败:', err);
        my.showToast({ content: '网络错误，请重试', type: 'none' });
      }
    });
  },

  goToPayment(orderInfo) {
    my.showLoading({ content: '正在创建支付订单...' });

    my.request({
      url: `${app.globalData.rentApiUrl}/payment/create`,
      method: 'POST',
      data: {
        order_id: orderInfo.id,
        order_no: orderInfo.order_no,
        subject: 'Rent Order',
        total_amount: this.data.totalPrice,
        body: 'Rent Service'
      },
      timeout: 15000,
      success: (res) => {
        my.hideLoading();
        if (res.data && res.data.code === 0) {
          this.processPayment(orderInfo, res.data.data);
        } else {
          my.showToast({ content: res.data.message || '创建支付订单失败', type: 'none' });
        }
      },
      fail: (err) => {
        my.hideLoading();
        console.error('创建支付订单失败:', err);
        my.showToast({ content: '网络错误，请重试', type: 'none' });
      }
    });
  },

  processPayment(orderInfo, payParams) {
    my.tradePay({
      ...payParams,
      success: (res) => {
        console.log('支付结果:', res);
        if (res.resultCode === '9000') {
          my.showToast({ content: '支付成功', type: 'success', duration: 2000 });
          setTimeout(() => {
            my.redirectTo({
              url: `/pages/order/order?id=${orderInfo.id}`
            });
          }, 2000);
        } else if (res.resultCode === '6001') {
          my.showToast({ content: '您已取消支付，可在订单中重新支付', type: 'none', duration: 3000 });
        } else if (res.resultCode === '4000') {
          my.showToast({ content: '订单已支付', type: 'none', duration: 2000 });
          setTimeout(() => {
            my.redirectTo({
              url: `/pages/order/order?id=${orderInfo.id}`
            });
          }, 2000);
        } else {
          my.showToast({ content: '支付失败: ' + (res.resultCode || '未知错误'), type: 'none', duration: 3000 });
        }
      },
      fail: (err) => {
        console.error('调起支付失败:', err);
        my.showToast({ content: '调起支付失败', type: 'none', duration: 3000 });
      }
    });
  },

  updateOrderStatus(orderId, status) {
    my.request({
      url: `${app.globalData.rentApiUrl}/orders/${orderId}/${status === 'cancelled' ? 'cancel' : 'pay'}`,
      method: 'PUT',
      timeout: 10000
    });
  },

  onShareAppMessage() {
    const { productInfo } = this.data;
    return {
      title: productInfo ? productInfo.name : '肌肉人AI租赁',
      desc: '信用免押，即租即用',
      path: `/pages/detail/detail?id=${this.data.productId}`
    };
  }
});
