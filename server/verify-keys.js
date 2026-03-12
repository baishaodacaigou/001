const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const alipayConfig = require('./config/alipay');

console.log('=== 支付宝密钥格式验证工具 ===\n');

// 读取密钥文件
const keyDir = 'C:/Users/Administrator/Documents/支付宝开放平台密钥工具/密钥 20260311083022';

let appPrivateKey = '';
let alipayPublicKey = '';

try {
  const files = fs.readdirSync(keyDir);
  console.log('找到的文件：', files);
  
  for (const file of files) {
    const filePath = path.join(keyDir, file);
    const content = fs.readFileSync(filePath, 'utf8').trim();
    
    if (file.includes('应用私钥')) {
      appPrivateKey = content;
      console.log(`\n✅ 读取应用私钥：${file}`);
    } else if (file.includes('alipayPublicKey')) {
      alipayPublicKey = content;
      console.log(`\n✅ 读取支付宝公钥：${file}`);
    }
  }
} catch (error) {
  console.log('无法读取密钥文件，使用配置文件中的密钥');
  appPrivateKey = alipayConfig.privateKey;
  alipayPublicKey = alipayConfig.publicKey;
}

// 验证私钥格式
console.log('\n=== 验证应用私钥 ===');
console.log('私钥长度:', appPrivateKey.length, '字符');
console.log('私钥开头:', appPrivateKey.substring(0, 30) + '...');
console.log('私钥结尾:', '...' + appPrivateKey.substring(appPrivateKey.length - 30));
console.log('是否包含 PEM 头:', appPrivateKey.includes('-----BEGIN'));

// 尝试解析私钥
try {
  const privateKeyObj = crypto.createPrivateKey(appPrivateKey);
  console.log('✅ 私钥解析成功！');
  
  // 导出为 PEM 格式查看
  const exportedKey = privateKeyObj.export({
    format: 'pem',
    type: 'pkcs8'
  });
  console.log('\n标准 PKCS#8 格式：');
  console.log(exportedKey.substring(0, 100) + '...');
} catch (error) {
  console.log('❌ 私钥解析失败:', error.message);
  console.log('\n尝试使用 OpenSSL Legacy 模式...');
  console.log('启动 Node.js 时添加：--openssl-legacy-provider');
}

// 验证公钥格式
console.log('\n=== 验证支付宝公钥 ===');
console.log('公钥长度:', alipayPublicKey.length, '字符');
console.log('公钥开头:', alipayPublicKey.substring(0, 30) + '...');
console.log('公钥结尾:', '...' + alipayPublicKey.substring(alipayPublicKey.length - 30));
console.log('是否包含 PEM 头:', alipayPublicKey.includes('-----BEGIN'));

try {
  const publicKeyObj = crypto.createPublicKey(alipayPublicKey);
  console.log('✅ 公钥解析成功！');
  
  // 导出为 PEM 格式查看
  const exportedKey = publicKeyObj.export({
    format: 'pem',
    type: 'spki'
  });
  console.log('\n标准 X.509 格式：');
  console.log(exportedKey.substring(0, 100) + '...');
} catch (error) {
  console.log('❌ 公钥解析失败:', error.message);
}

// 测试签名和验签
console.log('\n=== 测试签名和验签 ===');
try {
  const privateKeyObj = crypto.createPrivateKey(appPrivateKey);
  const publicKeyObj = crypto.createPublicKey(alipayPublicKey);
  
  const testData = 'test_data_' + Date.now();
  
  // 签名
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(testData, 'utf8');
  sign.end();
  const signature = sign.sign(privateKeyObj, 'base64');
  console.log('✅ 签名成功！');
  console.log('签名结果:', signature.substring(0, 50) + '...');
  
  // 验签
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(testData, 'utf8');
  verify.end();
  const isValid = verify.verify(publicKeyObj, signature, 'base64');
  
  if (isValid) {
    console.log('✅ 验签成功！签名验证通过！');
  } else {
    console.log('❌ 验签失败！签名验证不通过！');
  }
} catch (error) {
  console.log('❌ 签名/验签测试失败:', error.message);
}

console.log('\n=== 验证完成 ===\n');

// 输出建议
console.log('💡 建议：');
console.log('1. 如果私钥/公钥解析失败，请确保密钥格式正确');
console.log('2. PKCS#8 格式私钥：-----BEGIN PRIVATE KEY-----');
console.log('3. X.509 格式公钥：-----BEGIN PUBLIC KEY-----');
console.log('4. 如果 OpenSSL 3.x 不兼容，请使用 --openssl-legacy-provider 启动');
console.log('5. 确保密钥文件没有多余的空格、换行或特殊字符');
