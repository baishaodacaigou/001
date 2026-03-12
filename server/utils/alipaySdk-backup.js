const AlipaySdk = require('alipay-sdk').AlipaySdk;
const alipayConfig = require('../config/alipay');

class AlipaySdkWrapper {
  constructor(config) {
    this.appId = config.appId;
    this.gatewayUrl = config.gatewayUrl;
    
    // 格式化密钥为 PEM 格式
    this.privateKey = this.formatPrivateKey(config.privateKey);
    this.alipayPublicKey = this.formatPublicKey(config.publicKey);
    
    this.sdk = new AlipaySdk({
      appId: config.appId,
      privateKey: this.privateKey,
      alipayPublicKey: this.alipayPublicKey,
      gateway: config.gatewayUrl
    });
  }

  formatPrivateKey(key) {
    if (key.includes('-----BEGIN')) {
      return key;
    }
    // 将私钥格式化为每行 64 个字符的标准格式
    const formattedKey = key.match(/.{1,64}/g).join('\n');
    return `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----`;
  }

  formatPublicKey(key) {
    if (key.includes('-----BEGIN')) {
      return key;
    }
    // 将公钥格式化为每行 64 个字符的标准格式
    const formattedKey = key.match(/.{1,64}/g).join('\n');
    return `-----BEGIN PUBLIC KEY-----\n${formattedKey}\n-----END PUBLIC KEY-----`;
  }

  async getUserId(authCode) {
    try {
      const result = await this.sdk.exec('alipay.system.oauth.token', {
        grantType: 'authorization_code',
        code: authCode
      });

      if (result.accessToken) {
        const userId = result.userId || result.openId;
        if (userId) {
          return {
            success: true,
            userId: userId,
            accessToken: result.accessToken
          };
        }
      }
      
      return {
        success: false,
        message: result.subMsg || result.msg || '获取用户 ID 失败'
      };
    } catch (error) {
      console.error('调用支付宝获取用户 ID 失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  async getZhimaCreditScore(accessToken, productCode = 'w1010100000000002733') {
    try {
      const result = await this.sdk.exec('zhima.credit.score.get', {
        productCode: productCode,
        transactionId: 'zhima_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12)
      }, {
        appAuthToken: accessToken
      });

      if (result.code === '10000') {
        return {
          success: true,
          score: parseInt(result.score) || 0
        };
      } else {
        return {
          success: false,
          message: result.subMsg || result.msg || '获取芝麻信用分失败'
        };
      }
    } catch (error) {
      console.error('调用支付宝获取芝麻信用分失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  async createTradeOrder(orderNo, subject, totalAmount, body = '', buyerOpenId = '') {
    try {
      const bizContent = {
        outTradeNo: orderNo,
        totalAmount: totalAmount.toFixed(2),
        subject: subject,
        body: body || subject
      };
      
      if (buyerOpenId) {
        bizContent.buyerOpenId = buyerOpenId;
      }
      
      const result = await this.sdk.exec('alipay.trade.create', bizContent);

      console.log('创建支付宝订单响应:', result);

      if (result.code === '10000') {
        return {
          success: true,
          tradeNo: result.tradeNo,
          outTradeNo: result.outTradeNo
        };
      } else {
        return {
          success: false,
          message: result.subMsg || result.msg || '创建订单失败'
        };
      }
    } catch (error) {
      console.error('调用支付宝创建订单失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  async queryTradeOrder(outTradeNo) {
    try {
      const result = await this.sdk.exec('alipay.trade.query', {
        outTradeNo: outTradeNo
      });

      if (result.code === '10000') {
        return {
          success: true,
          tradeStatus: result.tradeStatus,
          tradeNo: result.tradeNo,
          outTradeNo: result.outTradeNo
        };
      } else {
        return {
          success: false,
          message: result.subMsg || result.msg || '查询订单失败'
        };
      }
    } catch (error) {
      console.error('调用支付宝查询订单失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  async closeTradeOrder(outTradeNo) {
    try {
      const result = await this.sdk.exec('alipay.trade.close', {
        outTradeNo: outTradeNo
      });

      if (result.code === '10000') {
        return {
          success: true,
          tradeNo: result.tradeNo,
          outTradeNo: result.outTradeNo
        };
      } else {
        return {
          success: false,
          message: result.subMsg || result.msg || '关闭订单失败'
        };
      }
    } catch (error) {
      console.error('调用支付宝关闭订单失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  async refundTradeOrder(outTradeNo, refundAmount, refundReason = '正常退款') {
    try {
      const result = await this.sdk.exec('alipay.trade.refund', {
        outTradeNo: outTradeNo,
        refundAmount: refundAmount.toFixed(2),
        refundReason: refundReason
      });

      if (result.code === '10000') {
        return {
          success: true,
          tradeNo: result.tradeNo,
          outTradeNo: result.outTradeNo,
          refundFee: result.refundFee
        };
      } else {
        return {
          success: false,
          message: result.subMsg || result.msg || '退款失败'
        };
      }
    } catch (error) {
      console.error('调用支付宝退款失败:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

const useSandbox = alipayConfig.useSandbox || false;
const config = useSandbox ? {
  ...alipayConfig.sandbox
} : {
  appId: alipayConfig.appId,
  privateKey: alipayConfig.privateKey,
  publicKey: alipayConfig.publicKey,
  gatewayUrl: alipayConfig.gatewayUrl
};

console.log('使用' + (useSandbox ? '沙箱' : '生产') + '环境');
module.exports = new AlipaySdkWrapper(config);
