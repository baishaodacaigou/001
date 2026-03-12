/**
 * 支付宝密钥配置文件
 * 贴合支付宝官方标准：RFC5208(PKCS#8)私钥 / RFC5280(X.509)公钥
 * 配置项参考：https://opendocs.alipay.com/common/055l5k
 */
module.exports = {
  // 小程序真实 AppID（官方要求：与开放平台完全一致）
  appId: '2021006136652946',
  // 应用私钥：PKCS#8 格式（RFC5208），直接复制原始文件内容，保留首尾标识
  privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCrxbeLLFBUSbTY0RgrVWFRfw/l5fC3oWa04tsVstYWy0hEEflzbw+Qk0o7hr3TZS+zlCEf0FiUW6I7kotDuOa1bUyiqs409pGM5vSs5ZL0YOQcIPZYoUe+SK/1MsuxSzeNvCCLKju43fPIShR0obP/NZ4sp1226FWOGozNNBnn0JCs0P/lQlAVi2WqZ7BnKn820jxWiPrp1nPVgGOuLM6hgkBVYhlWQq7gGLP3mUm0gSeWyH2bjP1aEsmjkz/mvgbqjEt4vddnNC7fJVzvoko7tWvpRA/Jlt2GwnYYWwQ8EjYIPolkyaQLb5Jh9F4qFhf0H8HcgPyfO1c1fi18ZoHTAgMBAAECggEAEptBLX8oWGj/gPjtUExYVVaZJ0MIFywRjwh/yNLtY9yzQEReLAXcvsFlqhsHVu3AA9FS4TpVTgS7Bw7xrO1LeF2Vjo1H9u66h3PBDzVy/Ku+KdncNW+K8O64uKu+6r6GDwFQ2SJDA9xu+sQjgRq+/6cUMiwS96wlEFaJ5/R71eNREHFjPjk3tdsuZvYlQGmM5J8XDKM+6ALpDOLuMmmlOOdG0kWYbxt+y3Hlv/jelqASei526sz7beywrc+1Pdc8YIJSFD0vLPY/Lzu+/Ds6JjHgfeVIoM1BTS1kYPlbuIPa996UyVvJQ+x9njd8Z48SxGt0TRZJv+Wl3MWcvqKEMQKBgQDnuK4AhpXQuB17yrEOcHwBsY/RzQ1sg65B+Dj5JdPknQYxeOqU4cBUSEAMxSyHGoL+aPsw/h+38mODK/tDDEiELZq0HuQiqJe6gMehjPJqM2B52i5eMvsARekUv7fmbGXqfF2M0H5uJ8ZAPoMChd9G4pWaSKUOYLnXbpAw8G/7WwKBgQC9xQ9tcXs0NdZ7fBeO3fNbSsS3yliziHVBfH2mRiTtPkXnWqqy/Cy/YxBAtxKM42PZsL441/6EqPzSVNEI80CHU7o3OiSXNHsOcRWjJy2SThLbNEWsLQ+wl/wNIS8naHsEjShBo5lnvJRivLxzlaoFaXMMnsO0CMvLWL6w/Tj06QKBgQCOiwnm4uOoGIpyi1Ztln6CIDNjkSsv1LVOeZ66jS2S1ZFov4Q2f8TrU+KquGRS29k3HWdgVQM4CdBzcYvIS/cT8GXZZaNbOrDTlsK3O1goQmCXtMKPSfcjzN272NAM3CO5ojV+GQedRbRr8shuteGK3nm/Be8bMB9CSg5DPLT2PwKBgCFuCoa0HAkZhtwgAyJm1Qz7AeaCndearVVI8fWNm8mzU6sq3LFFHTjl4aIU3g61rAxYR1pKKosCHe+Lg3t5Jp/wTviVpIaCdz8XCsHAEBYa7NVywudO1Nm+HGfPtbfSfwFRQIs3n7mXjehK6UPPVLE5X0wU19LqTcRXsNgK87KpAoGBAL73ufuup/8p6d9cYuxWdKiAaeSBmZvJTtz+8k0KyfoDjThLppTz1QjfGpVFYM65D3iVdMOaL4Cv77io8nXjejHGprS5n10P4kqSBhziaFEgK/3vdQS2OmBbrSqPEap+V2iR1lLYdQlppeNZMvayPa3jBF7iXthJkwNspOfGIUQr
-----END PRIVATE KEY-----`,
  // 支付宝公钥：X.509 格式（RFC5280），开放平台生成，直接复制原始文件内容
  alipayPublicKey: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAg10H/e3V8/vU+Gl46nvY0w8hYVUVoCNz17PMqfhMdfB/W6q9vcb2bZQRDycp2AYBPsihfHYyEP+CpSHsdfU4oC5bvWCYZMiCGfdYPWihM+VtaByh9muwAa260xA7VUtj4uKBtkGJKVVAMZI9kIcJzldEA6vOeZfjGH5ioLOixEXVTIfWobcSt26688Nej20VX3uJz7Pshizkbp6Hsn+NqrtCj8T/XdfkA3SE1Lqg4DrD7EHSSe4darztAyalCjq4WwTj2zio2FpV46MUR+fx1puH3sqOYC/HiTIW9jTTHVF2zztpyHPXtapoL0hQvA1EKhHivPH4cEQByXlocajbAQIDAQAB
-----END PUBLIC KEY-----`,
  // 官方强制要求：RSA2(SHA256)，不可修改为 RSA
  signType: 'RSA2',
  // 支付宝官方网关（正式环境，按文档要求填写）
  gatewayUrl: 'https://openapi.alipay.com/gateway.do',
  // 官方要求：字符编码统一为 UTF-8
  charset: 'UTF-8',
  // 接口超时时间（官方建议：30000ms）
  timeout: 30000,
  // 芝麻信用分接口官方版本
  zhimaVersion: '1.0',
  // 回调地址
  notifyUrl: 'https://www.jirouai.com/api/rent/pay/notify',
  returnUrl: 'https://www.jirouai.com/api/rent/pay/return',
  // 沙箱环境配置（可选）
  sandbox: {
    appId: '2021006156677973',
    privateKey: '',
    alipayPublicKey: '',
    gatewayUrl: 'https://openapi-sandbox.dl.alipaydev.com/gateway.do',
    notifyUrl: 'https://www.jirouai.com/api/rent/pay/notify',
    returnUrl: 'https://www.jirouai.com/api/rent/pay/return'
  }
};
