const https = require('https');
const querystring = require('querystring');
const crypto = require('crypto');
const alipayConfig = require('../config/alipay');

class AlipaySdk {
  constructor(config) {
    this.appId = config.appId;
    this.privateKey = config.privateKey;
    this.alipayPublicKey = config.publicKey;
    this.gatewayUrl = config.gatewayUrl;
  }

  /**
   * 使用 Node.js 原生 crypto 模块进行签名
   */
  sign(params) {
    const sortedParams = Object.keys(params)
      .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const sign = crypto.createSign('RSA-SHA256');
    sign.update(sortedParams, 'utf8');
    sign.end();
    
    return sign.sign(this.privateKey, 'base64');
  }

  async request(method, bizContent, otherParams = {}) {
    const params = {
      app_id: this.appId,
      method: method,
      format: 'JSON',
      charset: 'utf-8',
      sign_type: 'RSA2',
      timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
      version: '1.0',
      ...otherParams
    };

    if (bizContent) {
      params.biz_content = JSON.stringify(bizContent);
    }

    params.sign = this.sign(params);

    const postData = querystring.stringify(params);
    console.log('请求支付宝 API:', method);

    return new Promise((resolve, reject) => {
      const url = new URL(this.gatewayUrl);
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
          'Content-Length': Buffer.byteLength(postData, 'utf8')
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          console.log('支付宝 API 响应:', data.substring(0, 500));
          try {
            const result = JSON.parse(data);
            const responseKey = method.replace(/\./g, '_') + '_response';
            if (result[responseKey]) {
              resolve(result[responseKey]);
            } else {
              reject(new Error('支付宝响应格式错误：' + data));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', (e) => {
        reject(e);
      });

      req.write(postData, 'utf8');
      req.end();
    });
  }

  async getUserId(authCode) {
    try {
      const result = await this.request('alipay.system.oauth.token', null, {
        grant_type: 'authorization_code',
        code: authCode
      });

      if (result.access_token) {
        const userId = result.user_id || result.open_id;
        if (userId) {
          return {
            success: true,
            userId: userId,
            accessToken: result.access_token
          };
        }
      }
      
      return {
        success: false,
        message: result.sub_msg || result.msg || '获取用户 ID 失败'
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
      const result = await this.request('zhima.credit.score.get', {
        product_code: productCode,
        transaction_id: 'zhima_' + Date.now() + '_' + Math.random().toString(36).substr(2, 12)
      }, {
        app_auth_token: accessToken
      });

      if (result.code === '10000') {
        return {
          success: true,
          score: parseInt(result.score) || 0
        };
      } else {
        return {
          success: false,
          message: result.sub_msg || result.msg || '获取芝麻信用分失败'
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
        out_trade_no: orderNo,
        total_amount: totalAmount.toFixed(2),
        subject: subject,
        body: body || subject
      };
      
      if (buyerOpenId) {
        bizContent.buyer_open_id = buyerOpenId;
      }
      
      const result = await this.request('alipay.trade.create', bizContent);

      if (result.code === '10000') {
        return {
          success: true,
          tradeNo: result.trade_no,
          outTradeNo: result.out_trade_no
        };
      } else {
        return {
          success: false,
          message: result.sub_msg || result.msg || '创建订单失败'
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
      const result = await this.request('alipay.trade.query', {
        out_trade_no: outTradeNo
      });

      if (result.code === '10000') {
        return {
          success: true,
          tradeStatus: result.trade_status,
          tradeNo: result.trade_no,
          outTradeNo: result.out_trade_no
        };
      } else {
        return {
          success: false,
          message: result.sub_msg || result.msg || '查询订单失败'
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
      const result = await this.request('alipay.trade.close', {
        out_trade_no: outTradeNo
      });

      if (result.code === '10000') {
        return {
          success: true,
          tradeNo: result.trade_no,
          outTradeNo: result.out_trade_no
        };
      } else {
        return {
          success: false,
          message: result.sub_msg || result.msg || '关闭订单失败'
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
      const result = await this.request('alipay.trade.refund', {
        out_trade_no: outTradeNo,
        refund_amount: refundAmount.toFixed(2),
        refund_reason: refundReason
      });

      if (result.code === '10000') {
        return {
          success: true,
          tradeNo: result.trade_no,
          outTradeNo: result.out_trade_no,
          refundFee: result.refund_fee
        };
      } else {
        return {
          success: false,
          message: result.sub_msg || result.msg || '退款失败'
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
module.exports = new AlipaySdk(config);
