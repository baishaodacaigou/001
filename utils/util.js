const app = getApp();

const util = {
  baseUrl: '',
  glm5BaseUrl: '',

  init() {
    this.baseUrl = app.globalData.baseUrl;
    this.glm5BaseUrl = app.globalData.glma5BaseUrl;
  },

  request(options) {
    if (!this.baseUrl) this.init();

    return new Promise((resolve, reject) => {
      my.request({
        url: options.url.startsWith('http') ? options.url : `${this.baseUrl}${options.url}`,
        method: options.method || 'GET',
        data: options.data || {},
        headers: {
          'Content-Type': 'application/json',
          'Authorization': my.getStorageSync({ key: 'token' }) || ''
        },
        success: (res) => {
          if (res.data.code === 0) {
            resolve(res.data);
          } else if (res.data.code === 401) {
            my.removeStorageSync({ key: 'token' });
            my.removeStorageSync({ key: 'userInfo' });
            app.globalData.userInfo = null;
            reject(new Error('登录已过期'));
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  glm5Request(options) {
    if (!this.glm5BaseUrl) this.init();

    return new Promise((resolve, reject) => {
      my.request({
        url: `${this.glm5BaseUrl}${options.url}`,
        method: options.method || 'POST',
        data: options.data || {},
        headers: {
          'Content-Type': 'application/json'
        },
        success: (res) => {
          resolve(res.data);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  },

  calculateRentPrice(params) {
    return this.glm5Request({
      url: '/rent/calculate',
      method: 'POST',
      data: {
        productId: params.productId,
        rentType: params.rentType,
        rentDays: params.rentDays,
        dailyPrice: params.dailyPrice,
        monthlyPrice: params.monthlyPrice
      }
    });
  },

  formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) return '';
    
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  formatMoney(amount, decimals = 2) {
    if (amount === null || amount === undefined) return '0.00';
    const num = parseFloat(amount);
    if (isNaN(num)) return '0.00';
    return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  formatPrice(price) {
    return this.formatMoney(price);
  },

  calculateDays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  },

  debounce(fn, delay = 300) {
    let timer = null;
    return function(...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  },

  throttle(fn, delay = 300) {
    let lastTime = 0;
    return function(...args) {
      const now = Date.now();
      if (now - lastTime >= delay) {
        lastTime = now;
        fn.apply(this, args);
      }
    };
  },

  showToast(content, type = 'none', duration = 2000) {
    my.showToast({
      content,
      type,
      duration
    });
  },

  showLoading(content = '加载中...') {
    my.showLoading({ content });
  },

  hideLoading() {
    my.hideLoading();
  },

  showConfirm(title, content) {
    return new Promise((resolve) => {
      my.confirm({
        title,
        content,
        success: (res) => {
          resolve(res.confirm);
        },
        fail: () => {
          resolve(false);
        }
      });
    });
  },

  checkLogin() {
    return !!app.globalData.userInfo;
  },

  navigateTo(url) {
    my.navigateTo({ url });
  },

  redirectTo(url) {
    my.redirectTo({ url });
  },

  switchTab(url) {
    my.switchTab({ url });
  },

  goBack(delta = 1) {
    my.navigateBack({ delta });
  },

  getStorage(key) {
    return my.getStorageSync({ key }) || null;
  },

  setStorage(key, data) {
    my.setStorageSync({ key, data });
  },

  removeStorage(key) {
    my.removeStorageSync({ key });
  },

  getImageUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${this.baseUrl}${path}`;
  },

  validatePhone(phone) {
    return /^1[3-9]\d{9}$/.test(phone);
  },

  validateIdCard(idCard) {
    return /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard);
  },

  getOrderStatusText(status) {
    const statusMap = {
      pending: '待支付',
      paid: '待发货',
      shipped: '待归还',
      returned: '已归还',
      completed: '已完成',
      cancelled: '已取消'
    };
    return statusMap[status] || '未知状态';
  },

  getOrderStatusClass(status) {
    const classMap = {
      pending: 'status-pending',
      paid: 'status-paid',
      shipped: 'status-shipped',
      returned: 'status-returned',
      completed: 'status-completed',
      cancelled: 'status-cancelled'
    };
    return classMap[status] || '';
  }
};

module.exports = util;
