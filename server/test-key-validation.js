const crypto = require('crypto');
const alipayConfig = require('./config/alipay');

console.log('=== 支付宝密钥格式校验工具 ===\n');

// 检查私钥
console.log('1. 检查应用私钥格式：');
console.log('私钥长度:', alipayConfig.privateKey.length, '字符');
console.log('私钥开头:', alipayConfig.privateKey.substring(0, 30) + '...');
console.log('私钥结尾:', '...' + alipayConfig.privateKey.substring(alipayConfig.privateKey.length - 30));

// 格式化私钥为 PEM 格式
function formatPrivateKey(key) {
  if (key.includes('-----BEGIN')) {
    return key;
  }
  // 将私钥格式化为每行 64 个字符的标准格式
  const formattedKey = key.match(/.{1,64}/g).join('\n');
  return `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----`;
}

// 格式化公钥为 PEM 格式
function formatPublicKey(key) {
  if (key.includes('-----BEGIN')) {
    return key;
  }
  // 将公钥格式化为每行 64 个字符的标准格式
  const formattedKey = key.match(/.{1,64}/g).join('\n');
  return `-----BEGIN PUBLIC KEY-----\n${formattedKey}\n-----END PUBLIC KEY-----`;
}

const privateKeyPem = formatPrivateKey(alipayConfig.privateKey);
const publicKeyPem = formatPublicKey(alipayConfig.publicKey);

console.log('\n格式化后的私钥 PEM：');
console.log(privateKeyPem.substring(0, 100) + '...');

console.log('\n格式化后的公钥 PEM：');
console.log(publicKeyPem.substring(0, 100) + '...');

// 测试私钥是否可以被正确解析
console.log('\n2. 测试私钥解析：');
try {
  const privateKeyObj = crypto.createPrivateKey(privateKeyPem);
  console.log('✅ 私钥解析成功！(自动检测格式)');
} catch (error) {
  console.log('❌ 自动检测格式失败:', error.message);
  console.log('尝试不使用 PEM 头尾...');
  try {
    const privateKeyObj = crypto.createPrivateKey(Buffer.from(alipayConfig.privateKey, 'base64'));
    console.log('✅ 私钥解析成功！(Base64 解码)');
  } catch (error2) {
    console.log('❌ Base64 解码也失败:', error2.message);
  }
}

// 测试公钥是否可以被正确解析
console.log('\n3. 测试公钥解析：');
try {
  const publicKeyObj = crypto.createPublicKey({
    key: publicKeyPem,
    format: 'pem',
    type: 'spki'
  });
  console.log('✅ 公钥解析成功！');
} catch (error) {
  console.log('❌ 公钥解析失败:', error.message);
}

// 测试签名
console.log('\n4. 测试签名功能：');
try {
  const sign = crypto.createSign('RSA-SHA256');
  const testData = 'test_data_' + Date.now();
  sign.update(testData, 'utf8');
  const signature = sign.sign(privateKeyPem, 'base64');
  console.log('✅ 签名成功！签名结果:', signature.substring(0, 50) + '...');
  
  // 测试验签
  const verify = crypto.createVerify('RSA-SHA256');
  verify.update(testData, 'utf8');
  const isValid = verify.verify(publicKeyPem, signature, 'base64');
  if (isValid) {
    console.log('✅ 验签成功！签名验证通过！');
  } else {
    console.log('❌ 验签失败！签名验证不通过！');
  }
} catch (error) {
  console.log('❌ 签名失败:', error.message);
}

console.log('\n=== 校验完成 ===\n');

// 输出建议
console.log('💡 建议：');
console.log('1. 如果私钥/公钥解析失败，请从支付宝开放平台重新下载密钥文件');
console.log('2. 确保使用 PKCS#8 格式（-----BEGIN PRIVATE KEY-----）');
console.log('3. 不要手动修改密钥内容，直接复制粘贴');
console.log('4. 确保密钥文件没有多余的空格、换行或注释');
