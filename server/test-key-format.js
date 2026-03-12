const crypto = require('crypto');
const alipayConfig = require('./config/alipay');

console.log('测试私钥格式...\n');

// 格式化私钥
function formatPrivateKey(key) {
  if (key.includes('-----BEGIN')) {
    return key;
  }
  // 将私钥格式化为每行 64 个字符的标准格式
  const formattedKey = key.match(/.{1,64}/g).join('\n');
  return `-----BEGIN RSA PRIVATE KEY-----\n${formattedKey}\n-----END RSA PRIVATE KEY-----`;
}

// 格式化公钥
function formatPublicKey(key) {
  if (key.includes('-----BEGIN')) {
    return key;
  }
  // 将公钥格式化为每行 64 个字符的标准格式
  const formattedKey = key.match(/.{1,64}/g).join('\n');
  return `-----BEGIN PUBLIC KEY-----\n${formattedKey}\n-----END PUBLIC KEY-----`;
}

const privateKey = formatPrivateKey(alipayConfig.privateKey);
const publicKey = formatPublicKey(alipayConfig.publicKey);

console.log('格式化后的私钥：');
console.log(privateKey);
console.log('\n格式化后的公钥：');
console.log(publicKey);

// 测试私钥是否可以被正确解析
try {
  const privateKeyObj = crypto.createPrivateKey({
    key: privateKey,
    format: 'pem',
    type: 'pkcs1'
  });
  console.log('\n✅ 私钥解析成功！');
} catch (error) {
  console.log('\n❌ 私钥解析失败:', error.message);
}

// 测试公钥是否可以被正确解析
try {
  const publicKeyObj = crypto.createPublicKey({
    key: publicKey,
    format: 'pem',
    type: 'spki'
  });
  console.log('✅ 公钥解析成功！');
} catch (error) {
  console.log('❌ 公钥解析失败:', error.message);
}

// 测试签名
try {
  const sign = crypto.createSign('RSA-SHA256');
  const testData = 'test_data';
  sign.update(testData, 'utf8');
  const signature = sign.sign(privateKey, 'base64');
  console.log('✅ 签名成功！签名结果:', signature.substring(0, 50) + '...');
} catch (error) {
  console.log('❌ 签名失败:', error.message);
}
