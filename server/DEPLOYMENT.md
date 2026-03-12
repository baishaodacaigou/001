# 肌肉人AI租赁 - 部署说明

## 支付宝配置

1. 打开 `server/config/alipay.js` 文件
2. 填入你的支付宝应用信息：

```javascript
module.exports = {
  appId: '你的支付宝应用ID', // 从支付宝开放平台获取
  privateKey: `-----BEGIN RSA PRIVATE KEY-----
你的应用私钥
-----END RSA PRIVATE KEY-----`,
  publicKey: `-----BEGIN PUBLIC KEY-----
支付宝公钥
-----END PUBLIC KEY-----`,
  gatewayUrl: 'https://openapi.alipay.com/gateway.do',
  notifyUrl: 'https://www.jirouai.com/api/alipay/notify',
  returnUrl: 'https://www.jirouai.com/api/alipay/return'
};
```

## 获取支付宝应用信息

### 1. 登录支付宝开放平台
访问：https://open.alipay.com/

### 2. 创建小程序应用
- 进入控制台 -> 小程序
- 创建应用并获取 AppID

### 3. 设置接口加签方式
- 使用 RSA2 签名方式
- 生成应用私钥和公钥
- 将应用公钥上传到支付宝开放平台
- 获取支付宝公钥

### 4. 开通产品
- 开通"小程序获取会员信息"
- 开通"芝麻信用"相关产品（需要申请）

## 部署步骤

1. 上传所有 server 文件到云服务器
2. 安装依赖：`npm install`
3. 配置支付宝密钥
4. 启动服务：`node server.js` 或使用 PM2

## 功能说明

### 用户登录流程
1. 前端调用 `my.getAuthCode` 获取授权码（同时请求用户信息和芝麻信用授权）
2. 后端使用授权码调用支付宝API换取真实用户ID
3. 如果是新用户，尝试获取芝麻信用分
4. 返回用户信息和信用分

### 降级方案
- 如果支付宝API调用失败，自动使用MD5哈希authCode作为临时用户ID
- 如果芝麻信用授权失败，默认使用650分
- 如果芝麻信用获取失败，使用用户已保存的信用分或默认650分
