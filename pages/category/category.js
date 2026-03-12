const app = getApp();

Page({
  data: {
    currentTab: 'gpu',
    tabs: [
      { key: 'gpu', name: 'GPU服务器' },
      { key: 'pc', name: '电竞台式机' },
      { key: 'laptop', name: '笔记本' },
      { key: 'digital', name: '数码设备' }
    ],
    productList: [],
    loading: true,
    keyword: ''
  },

  onLoad(options) {
    if (options.type) {
      this.setData({ currentTab: options.type });
    }
    if (options.keyword) {
      this.setData({ keyword: decodeURIComponent(options.keyword) });
    }
    this.loadProducts();
  },

  onTabChange(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({ currentTab: key, loading: true });
    this.loadProducts();
  },

  loadProducts() {
    const { currentTab, keyword } = this.data;
    
    my.request({
      url: `${app.globalData.rentApiUrl}/products`,
      method: 'GET',
      data: {
        type: currentTab,
        keyword: keyword
      },
      success: (res) => {
        if (res.data.code === 0) {
          this.setData({ 
            productList: res.data.data.list,
            loading: false
          });
        }
      },
      fail: () => {
        this.setData({ 
          productList: this.getMockProducts(currentTab),
          loading: false
        });
      }
    });
  },

  getMockProducts(type) {
    const mockData = {
      gpu: [
        { id: '1', name: 'RTX 4090 GPU服务器', image: '/images/gpu.png', daily_price: 88, monthly_price: 2388, deposit: 5000, specs: 'RTX 4090 24GB / 64GB内存 / 2TB NVMe', tags: '["信用免押", "即租即用"]' },
        { id: '2', name: 'RTX 4080 GPU服务器', image: '/images/gpu.png', daily_price: 68, monthly_price: 1888, deposit: 4000, specs: 'RTX 4080 16GB / 32GB内存 / 1TB NVMe', tags: '["信用免押"]' },
      ],
      pc: [
        { id: '3', name: 'i9-14900K 电竞主机', image: '/images/pc.png', daily_price: 68, monthly_price: 1888, deposit: 3000, specs: 'i9-14900K / RTX 4080 / 32GB / 1TB', tags: '["信用免押", "高性价比"]' },
        { id: '4', name: 'i7-14700K 游戏主机', image: '/images/pc.png', daily_price: 48, monthly_price: 1288, deposit: 2500, specs: 'i7-14700K / RTX 4070 / 16GB / 512GB', tags: '["信用免押"]' },
      ],
      laptop: [
        { id: '5', name: 'RTX 4080 游戏本', image: '/images/laptop.png', daily_price: 48, monthly_price: 1288, deposit: 2000, specs: 'i9-13900HX / RTX 4080 / 32GB / 1TB', tags: '["信用免押", "便携办公"]' },
        { id: '6', name: 'RTX 4070 游戏本', image: '/images/laptop.png', daily_price: 38, monthly_price: 988, deposit: 1500, specs: 'i7-13700H / RTX 4070 / 16GB / 512GB', tags: '["信用免押"]' },
      ],
      digital: [
        { id: '7', name: 'iPhone 15 Pro Max', image: '/images/digital.png', daily_price: 18, monthly_price: 488, deposit: 1000, specs: '256GB / 钛金属原色', tags: '["信用免押", "热门"]' },
        { id: '8', name: 'iPad Pro 12.9寸', image: '/images/digital.png', daily_price: 15, monthly_price: 388, deposit: 800, specs: 'M2芯片 / 256GB / WiFi版', tags: '["信用免押"]' },
      ]
    };
    return mockData[type] || [];
  },

  onProductTap(e) {
    const { id } = e.currentTarget.dataset;
    my.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  }
});
