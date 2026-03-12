const app = getApp();

Page({
  data: {
    bannerList: [],
    categoryList: [],
    recommendList: [],
    loading: true,
    searchValue: '',
    refreshing: false
  },

  onLoad() {
    this.loadPageData();
  },

  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.loadPageData().then(() => {
      this.setData({ refreshing: false });
      my.stopPullDownRefresh();
    });
  },

  loadPageData() {
    return Promise.all([
      this.loadBanners(),
      this.loadCategories(),
      this.loadRecommendProducts()
    ]).then(() => {
      this.setData({ loading: false });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  loadBanners() {
    return new Promise((resolve) => {
      my.request({
        url: `${app.globalData.rentApiUrl}/banners`,
        method: 'GET',
        timeout: 10000,
        success: (res) => {
          if (res.data && res.data.code === 0) {
            this.setData({ bannerList: res.data.data });
          }
        },
        fail: () => {
          this.setData({
            bannerList: [
              { id: 1, image: '/images/banner1.png', url: '' },
              { id: 2, image: '/images/banner2.png', url: '' }
            ]
          });
        },
        complete: () => resolve()
      });
    });
  },

  loadCategories() {
    return new Promise((resolve) => {
      my.request({
        url: `${app.globalData.rentApiUrl}/categories`,
        method: 'GET',
        timeout: 10000,
        success: (res) => {
          if (res.data && res.data.code === 0) {
            this.setData({ categoryList: res.data.data });
          }
        },
        fail: () => {
          this.setData({
            categoryList: [
              { id: 1, name: 'GPU服务器', icon: '/images/gpu.png', type: 'gpu' },
              { id: 2, name: '电竞台式机', icon: '/images/pc.png', type: 'pc' },
              { id: 3, name: '笔记本电脑', icon: '/images/laptop.png', type: 'laptop' },
              { id: 4, name: '数码设备', icon: '/images/digital.png', type: 'digital' }
            ]
          });
        },
        complete: () => resolve()
      });
    });
  },

  loadRecommendProducts() {
    return new Promise((resolve) => {
      my.request({
        url: `${app.globalData.rentApiUrl}/products/recommend`,
        method: 'GET',
        timeout: 10000,
        success: (res) => {
          if (res.data && res.data.code === 0) {
            this.setData({ recommendList: res.data.data });
          }
        },
        fail: () => {
          this.setData({
            recommendList: [
              {
                id: '1',
                name: 'RTX 4090 GPU服务器',
                image: '/images/gpu.png',
                daily_price: 88,
                monthly_price: 2388,
                deposit: 5000,
                tags: ['信用免押', '即租即用']
              },
              {
                id: '2',
                name: 'i9-14900K 电竞主机',
                image: '/images/pc.png',
                daily_price: 68,
                monthly_price: 1888,
                deposit: 3000,
                tags: ['信用免押', '高性价比']
              },
              {
                id: '3',
                name: 'RTX 4080 游戏本',
                image: '/images/laptop.png',
                daily_price: 48,
                monthly_price: 1288,
                deposit: 2000,
                tags: ['信用免押', '便携办公']
              }
            ]
          });
        },
        complete: () => resolve()
      });
    });
  },

  onSearchInput(e) {
    this.setData({ searchValue: e.detail.value });
  },

  onSearch() {
    if (!this.data.searchValue.trim()) {
      my.showToast({ content: '请输入搜索内容', type: 'none' });
      return;
    }
    my.navigateTo({
      url: `/pages/category/category?keyword=${encodeURIComponent(this.data.searchValue)}`
    });
  },

  onSearchConfirm() {
    this.onSearch();
  },

  onBannerTap(e) {
    const { url } = e.currentTarget.dataset;
    if (url) {
      my.navigateTo({ url });
    }
  },

  onCategoryTap(e) {
    const { type } = e.currentTarget.dataset;
    if (type) {
      my.navigateTo({
        url: `/pages/category/category?type=${type}`
      });
    } else {
      my.navigateTo({
        url: '/pages/category/category'
      });
    }
  },

  onProductTap(e) {
    const { id } = e.currentTarget.dataset;
    my.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  }
});
