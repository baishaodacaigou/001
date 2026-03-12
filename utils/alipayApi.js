const AlipayAPI = {
  basic: {
    'my.canIUse': '判断当前小程序版本是否支持指定API、组件、参数',
    'my.env': '获取小程序运行环境',
    'my.getSystemInfo': '获取系统信息(品牌、型号、系统版本等)',
    'my.getSystemInfoSync': '同步获取系统信息',
    'my.getDeviceInfo': '获取设备信息',
    'my.getApp': '获取当前小程序实例',
    'my.getCurrentPages': '获取当前页面栈'
  },

  navigation: {
    'my.navigateTo': '保留当前页面跳转到新页面',
    'my.navigateBack': '关闭当前页面返回上一页',
    'my.redirectTo': '关闭当前页面跳转到新页面',
    'my.reLaunch': '关闭所有页面打开新页面',
    'my.switchTab': '跳转到tabBar页面',
    'my.setNavigationBar': '设置导航栏样式'
  },

  ui: {
    'my.showToast': '显示消息提示框',
    'my.hideToast': '隐藏消息提示框',
    'my.showLoading': '显示加载提示框',
    'my.hideLoading': '隐藏加载提示框',
    'my.showModal': '显示模态对话框',
    'my.showActionSheet': '显示操作菜单',
    'my.setTabBarStyle': '设置tabBar样式',
    'my.setTabBarItem': '设置tabBar某项内容',
    'my.setTabBarBadge': '设置tabBar红点',
    'my.removeTabBarBadge': '移除tabBar红点'
  },

  network: {
    'my.request': '发起网络请求',
    'my.uploadFile': '上传文件',
    'my.downloadFile': '下载文件',
    'my.connectSocket': '创建WebSocket连接',
    'my.onSocketOpen': '监听WebSocket打开',
    'my.onSocketMessage': '监听WebSocket消息',
    'my.sendSocketMessage': '发送WebSocket消息',
    'my.closeSocket': '关闭WebSocket连接'
  },

  user: {
    'my.getAuthCode': '获取授权码(用于登录)',
    'my.getOpenUserInfo': '获取用户公开信息',
    'my.getPhoneNumber': '获取用户手机号',
    'my.authorize': '提前向用户发起授权请求'
  },

  payment: {
    'my.tradePay': '发起支付(支付宝支付)'
  },

  storage: {
    'my.setStorage': '异步存储数据',
    'my.setStorageSync': '同步存储数据',
    'my.getStorage': '异步获取存储数据',
    'my.getStorageSync': '同步获取存储数据',
    'my.removeStorage': '异步删除存储数据',
    'my.removeStorageSync': '同步删除存储数据',
    'my.clearStorage': '清空本地存储'
  },

  media: {
    'my.chooseImage': '选择图片',
    'my.previewImage': '预览图片',
    'my.saveImage': '保存图片到相册',
    'my.compressImage': '压缩图片',
    'my.chooseVideo': '选择视频',
    'my.saveVideoToPhotosAlbum': '保存视频到相册'
  },

  location: {
    'my.getLocation': '获取当前位置',
    'my.chooseLocation': '打开地图选择位置',
    'my.openLocation': '打开地图查看位置'
  },

  device: {
    'my.scan': '扫码',
    'my.getClipboard': '获取剪贴板内容',
    'my.setClipboard': '设置剪贴板内容',
    'my.makePhoneCall': '拨打电话',
    'my.vibrate': '振动',
    'my.getNetworkType': '获取网络类型',
    'my.onNetworkStatusChange': '监听网络状态变化'
  },

  interaction: {
    'my.pageScrollTo': '页面滚动到指定位置',
    'my.onPullDownRefresh': '监听下拉刷新',
    'my.stopPullDownRefresh': '停止下拉刷新'
  },

  zhima: {
    'my.getZhimaCreditScore': '获取芝麻信用分(前端API)',
    'zhima.credit.pe.user.privilege.query': '芝麻特权准入咨询(后端API)',
    'zhima.credit.pe.user.privilege.sync': '芝麻特权核销/返还/更新扩展信息(后端API)',
    'zhima.merchant.creditservice.create': '商户创建信用服务(后端API)',
    'zhima.merchant.creditservice.query': '查询信用服务版本详情(后端API)',
    'zhima.merchant.creditservice.modify': '商户修改信用服务版本(后端API)',
    'zhima.merchant.creditservice.logo.upload': '上传商户logo图片(后端API)',
    'zhima.merchant.creditservice.approve.notify': '信用服务审核通知(MsgAPI)',
    'alipay.system.oauth.token': '换取授权访问令牌(后端API)',
    'alipay.open.auth.userauth.relationship.query': '校验授权关系(后端API)',
    'alipay.user.info.share': '配合支付宝会员授权接口查询授权信息(后端API)',
    'alipay.open.auth.userauth.cancelled': '用户授权取消消息(MsgAPI)',
    'alipay.user.delauth.detail.query': '查询7天内解除授权的用户(后端API)',
    'alipay.user.account.basic.info.query': '账户信息基础查询(后端API)'
  }
};

const CommonExamples = {
  login: `
my.getAuthCode({
  scopes: ['auth_user'],
  success: (res) => {
    console.log('授权码:', res.authCode);
  }
});`,

  request: `
my.request({
  url: 'https://www.jirouai.com/api/rent/products',
  method: 'GET',
  data: {},
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  success: (res) => {
    console.log('返回数据:', res.data);
  },
  fail: (err) => {
    console.error('请求失败:', err);
  }
});`,

  payment: `
my.tradePay({
  tradeNO: '订单号',
  success: (res) => {
    console.log('支付结果:', res.resultCode);
    if (res.resultCode === '9000') {
      console.log('支付成功');
    } else if (res.resultCode === '6001') {
      console.log('用户取消');
    } else if (res.resultCode === '4000') {
      console.log('订单已支付');
    }
  },
  fail: (err) => {
    console.error('支付失败:', err);
  }
});`,

  getUserInfo: `
my.getOpenUserInfo({
  success: (res) => {
    console.log('用户信息:', res);
    let userInfo = {};
    try {
      const response = typeof res === 'string' ? JSON.parse(res) : res;
      userInfo = response.response || response;
    } catch (e) {
      userInfo = {};
    }
    console.log('昵称:', userInfo.nickName || userInfo.nickname);
    console.log('头像:', userInfo.avatar);
  },
  fail: (err) => {
    console.error('获取用户信息失败:', err);
  }
});`,

  getZhimaScore: `
my.getZhimaCreditScore({
  success: (res) => {
    const creditScore = res.creditScore || res.score || 0;
    console.log('芝麻信用分:', creditScore);
  },
  fail: (err) => {
    console.error('获取芝麻信用分失败:', err);
  }
});`,

  showToast: `
my.showToast({
  type: 'success',
  content: '操作成功',
  duration: 2000
});`,

  navigate: `
my.navigateTo({
  url: '/pages/detail/detail?id=123'
});`,

  storage: `
my.setStorageSync('userInfo', { id: 1, name: '用户' });
const userInfo = my.getStorageSync('userInfo');`,

  creditFreeRule: `
function calculateCreditFreeAmount(score) {
  if (score >= 700) {
    return 10000;
  } else if (score >= 650) {
    return 5000;
  } else if (score >= 600) {
    return 2000;
  }
  return 0;
}`
};

module.exports = {
  AlipayAPI,
  CommonExamples
};
