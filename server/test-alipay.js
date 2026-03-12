const AlipaySdk = require('alipay-sdk');
console.log('AlipaySdk type:', typeof AlipaySdk);
console.log('AlipaySdk:', AlipaySdk);
if (AlipaySdk && AlipaySdk.default) {
  console.log('AlipaySdk.default:', AlipaySdk.default);
}
