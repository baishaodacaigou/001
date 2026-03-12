App({
  globalData: {
    userInfo: null,
    baseUrl: 'https://www.jirouai.com',
    rentApiUrl: 'https://www.jirouai.com/api/rent',
    creditScore: 0,
    creditFreeAmount: 0
  },

  onLaunch() {
    this.checkLoginStatus();
    this.getSystemInfo();
  },

  checkLoginStatus() {
    try {
      const userInfoRes = my.getStorageSync({ key: 'userInfo' });
      const tokenRes = my.getStorageSync({ key: 'token' });
      const creditScoreRes = my.getStorageSync({ key: 'creditScore' });
      
      const userInfo = userInfoRes && userInfoRes.success ? userInfoRes.data : userInfoRes;
      const token = tokenRes && tokenRes.success ? tokenRes.data : tokenRes;
      const creditScore = creditScoreRes && creditScoreRes.success ? creditScoreRes.data : creditScoreRes;
      
      if (userInfo && token) {
        this.globalData.userInfo = userInfo;
      }
      if (creditScore) {
        this.globalData.creditScore = creditScore;
      }
    } catch (e) {
      console.log('检查登录状态失败:', e);
    }
  },

  getSystemInfo() {
    my.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res;
      }
    });
  },

  login() {
    return new Promise((resolve, reject) => {
      my.getAuthCode({
        scopes: ['auth_user', 'auth_zhima'],
        success: (authRes) => {
          console.log('获取authCode成功:', authRes.authCode);
          this.loginWithAuthCode(authRes.authCode, resolve, reject);
        },
        fail: (err) => {
          console.warn('芝麻信用授权失败，尝试仅用户授权:', err);
          my.getAuthCode({
            scopes: ['auth_user'],
            success: (authRes2) => {
              console.log('获取authCode成功（仅用户授权）:', authRes2.authCode);
              this.loginWithAuthCode(authRes2.authCode, resolve, reject);
            },
            fail: (err2) => {
              console.error('获取authCode失败:', err2);
              my.hideLoading();
              my.showToast({ 
                content: '授权失败：' + (err2.errorMessage || '请重新尝试'), 
                type: 'none' 
              });
              reject(err2);
            }
          });
        }
      });
    });
  },

  loginWithAuthCode(authCode, resolve, reject) {
    my.request({
      url: `${this.globalData.rentApiUrl}/user/alipay/login`,
      method: 'POST',
      data: { authCode: authCode },
      timeout: 15000,
      success: (res) => {
        if (res.data && res.data.code === 0 && res.data.data) {
          const userData = res.data.data;
          my.setStorageSync({ key: 'token', data: userData.token });
          this.getOpenUserInfo(userData, resolve, reject);
        } else {
          my.hideLoading();
          my.showToast({ 
            content: '登录失败：' + (res.data.message || '服务器错误'), 
            type: 'none' 
          });
          reject(new Error(res.data.message || '登录失败'));
        }
      },
      fail: (err) => {
        console.error('登录请求失败:', err);
        my.hideLoading();
        my.showToast({ 
          content: '网络错误：' + (err.errorMessage || '请检查网络'), 
          type: 'none' 
        });
        reject(err);
      }
    });
  },

  getOpenUserInfo(userData, resolve, reject) {
    my.getOpenUserInfo({
      success: (openRes) => {
        console.log('获取用户公开信息成功:', openRes);
        let openUserInfo = {};
        try {
          const response = typeof openRes === 'string' ? JSON.parse(openRes) : openRes;
          openUserInfo = response.response || response;
        } catch (e) {
          openUserInfo = {};
        }
        
        const userInfo = {
          ...userData,
          avatar: openUserInfo.avatar || userData.avatar || '',
          nickName: openUserInfo.nickName || openUserInfo.nickname || userData.nickname || '用户',
          nickname: openUserInfo.nickName || openUserInfo.nickname || userData.nickname || '用户',
          gender: openUserInfo.gender === 'm' ? '男' : openUserInfo.gender === 'f' ? '女' : '未知',
          province: openUserInfo.province || '',
          city: openUserInfo.city || ''
        };
        
        this.finalizeLogin(userInfo, resolve, reject);
      },
      fail: (err) => {
        console.log('获取用户公开信息失败，使用默认信息:', err);
        const userInfo = {
          ...userData,
          nickName: userData.nickname || '用户',
          nickname: userData.nickname || '用户',
          gender: '未知',
          province: '',
          city: ''
        };
        this.finalizeLogin(userInfo, resolve, reject);
      }
    });
  },

  finalizeLogin(userInfo, resolve, reject) {
    try {
      const creditScore = userInfo.creditScore || 650;
      const creditFreeAmount = userInfo.creditFreeAmount || this.calculateCreditFreeAmount(creditScore);
      
      this.globalData.creditScore = creditScore;
      this.globalData.creditFreeAmount = creditFreeAmount;
      my.setStorageSync({ key: 'creditScore', data: creditScore });
      
      const finalUserInfo = {
        ...userInfo,
        creditScore: creditScore,
        creditFreeAmount: creditFreeAmount
      };
      
      this.globalData.userInfo = finalUserInfo;
      my.setStorageSync({ key: 'userInfo', data: finalUserInfo });
      
      resolve(finalUserInfo);
    } catch (error) {
      console.error('登录完成失败:', error);
      my.hideLoading();
      my.showToast({ content: '登录异常，请重试', type: 'none' });
      reject(error);
    }
  },

  calculateCreditFreeAmount(score) {
    if (score >= 700) {
      return 10000;
    } else if (score >= 650) {
      return 5000;
    } else if (score >= 600) {
      return 2000;
    }
    return 0;
  },

  logout() {
    this.globalData.userInfo = null;
    this.globalData.creditScore = 0;
    this.globalData.creditFreeAmount = 0;
    my.removeStorageSync({ key: 'userInfo' });
    my.removeStorageSync({ key: 'token' });
    my.removeStorageSync({ key: 'creditScore' });
  },

  checkSession() {
    return new Promise((resolve) => {
      const tokenRes = my.getStorageSync({ key: 'token' });
      const token = tokenRes && tokenRes.success ? tokenRes.data : tokenRes;
      if (!token) {
        resolve(false);
        return;
      }
      my.request({
        url: `${this.globalData.rentApiUrl}/user/check-session`,
        method: 'GET',
        data: { token: token },
        timeout: 10000,
        success: (res) => {
          resolve(res.data.code === 0 && res.data.data && res.data.data.valid);
        },
        fail: () => {
          resolve(false);
        }
      });
    });
  }
});
