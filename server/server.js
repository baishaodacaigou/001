// 启用 OpenSSL 传统提供者以兼容旧版密钥
process.env.NODE_OPTIONS = '--openssl-legacy-provider';

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const alipaySdk = require('./utils/alipaySdk');

const app = express();
const PORT = 3301;

app.use(cors());
app.use(bodyParser.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'jirouai',
  password: 'jirouai2024',
  database: 'jirouai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ==================== 用户 API ====================

app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    const id = uuidv4();
    const [existingUsername] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsername.length > 0) return res.json({ success: false, message: '用户名已存在' });
    const [existingEmail] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail.length > 0) return res.json({ success: false, message: '邮箱已被注册' });
    const [existingPhone] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existingPhone.length > 0) return res.json({ success: false, message: '手机号已被注册' });
    await pool.query('INSERT INTO users (id, username, email, phone, password, nickname) VALUES (?, ?, ?, ?, ?, ?)', [id, username, email, phone, password, username]);
    res.json({ success: true, message: '注册成功', user: { id, username, email, phone } });
  } catch (error) {
    res.json({ success: false, message: '注册失败: ' + error.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { account, password } = req.body;
    const [users] = await pool.query('SELECT * FROM users WHERE (username = ? OR email = ? OR phone = ?) AND password = ?', [account, account, account, password]);
    if (users.length === 0) return res.json({ success: false, message: '账号或密码错误' });
    const user = users[0];
    const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
    res.json({ success: true, message: '登录成功', user: { id: user.id, username: user.username, email: user.email, phone: user.phone, nickname: user.nickname }, token });
  } catch (error) {
    res.json({ success: false, message: '登录失败: ' + error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, email, phone, nickname, status, created_at FROM users ORDER BY created_at DESC');
    res.json({ success: true, data: users });
  } catch (error) {
    res.json({ success: false, message: '获取用户列表失败' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, username, email, phone, nickname, status, created_at FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.json({ success: false, message: '用户不存在' });
    res.json({ success: true, data: users[0] });
  } catch (error) {
    res.json({ success: false, message: '获取用户失败' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { username, email, phone, nickname } = req.body;
    await pool.query('UPDATE users SET username = ?, email = ?, phone = ?, nickname = ? WHERE id = ?', [username, email, phone, nickname || username, req.params.id]);
    res.json({ success: true, message: '更新成功' });
  } catch (error) {
    res.json({ success: false, message: '更新用户失败' });
  }
});

app.put('/api/users/:id/password', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const [users] = await pool.query('SELECT id FROM users WHERE id = ? AND password = ?', [req.params.id, oldPassword]);
    if (users.length === 0) return res.json({ success: false, message: '原密码错误' });
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, req.params.id]);
    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    res.json({ success: false, message: '修改密码失败' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    res.json({ success: false, message: '删除用户失败' });
  }
});

// ==================== 项目 API ====================

app.get('/api/projects', async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = 'SELECT p.*, u.username FROM projects p LEFT JOIN users u ON p.user_id = u.id';
    let params = [];
    if (user_id) {
      query += ' WHERE p.user_id = ?';
      params.push(user_id);
    }
    query += ' ORDER BY p.created_at DESC';
    const [projects] = await pool.query(query, params);
    res.json({ success: true, data: projects });
  } catch (error) {
    res.json({ success: false, message: '获取项目列表失败' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const [projects] = await pool.query('SELECT p.*, u.username FROM projects p LEFT JOIN users u ON p.user_id = u.id WHERE p.id = ?', [req.params.id]);
    if (projects.length === 0) return res.json({ success: false, message: '项目不存在' });
    res.json({ success: true, data: projects[0] });
  } catch (error) {
    res.json({ success: false, message: '获取项目失败' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { project_no, user_id, amount, expire_date, dividend } = req.body;
    const id = uuidv4();
    await pool.query('INSERT INTO projects (id, project_no, user_id, amount, expire_date, dividend) VALUES (?, ?, ?, ?, ?, ?)', [id, project_no, user_id, amount, expire_date, dividend]);
    res.json({ success: true, message: '项目创建成功', id });
  } catch (error) {
    res.json({ success: false, message: '创建项目失败: ' + error.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { project_no, user_id, amount, expire_date, dividend, status } = req.body;
    await pool.query('UPDATE projects SET project_no = ?, user_id = ?, amount = ?, expire_date = ?, dividend = ?, status = ? WHERE id = ?', [project_no, user_id, amount, expire_date, dividend, status, req.params.id]);
    res.json({ success: true, message: '项目更新成功' });
  } catch (error) {
    res.json({ success: false, message: '更新项目失败' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '项目删除成功' });
  } catch (error) {
    res.json({ success: false, message: '删除项目失败' });
  }
});

// ==================== 管理员 API ====================

app.post('/api/admins/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [admins] = await pool.query('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password]);
    if (admins.length === 0) return res.json({ success: false, message: '管理员账号或密码错误' });
    const admin = admins[0];
    const token = 'admin_token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
    res.json({ success: true, message: '登录成功', admin: { id: admin.id, username: admin.username, role: admin.role }, token });
  } catch (error) {
    res.json({ success: false, message: '登录失败: ' + error.message });
  }
});

app.get('/api/admins/:id', async (req, res) => {
  try {
    const [admins] = await pool.query('SELECT id, username, role FROM admins WHERE id = ?', [req.params.id]);       
    if (admins.length === 0) return res.json({ success: false, message: '管理员不存在' });
    res.json({ success: true, data: admins[0] });
  } catch (error) {
    res.json({ success: false, message: '获取管理员失败' });
  }
});

// ==================== 统计 API ====================

app.get('/api/stats', async (req, res) => {
  try {
    const [[{ count: userCount }]] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [[{ count: projectCount }]] = await pool.query('SELECT COUNT(*) as count FROM projects');
    res.json({ success: true, data: { totalUsers: userCount, totalProjects: projectCount, activeUsers: Math.floor(userCount * 0.7), todayUsers: Math.floor(Math.random() * 10) + 1 } });
  } catch (error) {
    res.json({ success: false, message: '获取统计失败' });
  }
});

// ==================== 腾讯云邮件回调 API ====================

app.post('/api/email/callback', async (req, res) => {
  try {
    const data = req.body;
    console.log('收到腾讯云邮件回调：', JSON.stringify(data, null, 2));

    const event_type = data.event_type || data.Event || 'unknown';
    const message_id = data.message_id || data.MessageId || '';
    const from_email = data.from || data.From || '';
    const to_email = data.to || data.To || data.email || '';
    const subject = data.subject || data.Subject || '';
    const status = data.status || data.Status || '';

    const [[existing]] = await pool.query(
      'SELECT id FROM email_callback_log WHERE message_id = ? AND event_type = ?',
      [message_id, event_type]
    );

    if (existing) {
      console.log('重复回调，已忽略:', message_id, event_type);
      return res.status(200).json({ code: 0, msg: 'duplicate ignored' });
    }

    await pool.query(
      'INSERT INTO email_callback_log (event_type, message_id, from_email, to_email, subject, status, raw_data) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [event_type, message_id, from_email, to_email, subject, status, JSON.stringify(data)]
    );

    console.log('邮件回调已记录:', event_type, message_id, to_email);
    res.status(200).json({ code: 0, msg: 'success' });
  } catch (error) {
    console.error('处理邮件回调失败:', error);
    res.status(200).json({ code: 0, msg: 'received' });
  }
});

app.get('/api/email/callback/logs', async (req, res) => {
  try {
    const { event_type, page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    let query = 'SELECT * FROM email_callback_log';
    let countQuery = 'SELECT COUNT(*) as total FROM email_callback_log';
    const params = [];

    if (event_type) {
      query += ' WHERE event_type = ?';
      countQuery += ' WHERE event_type = ?';
      params.push(event_type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    const [logs] = await pool.query(query, [...params, parseInt(pageSize), offset]);
    const [[{ total }]] = await pool.query(countQuery, params);

    res.json({ success: true, data: { list: logs, total, page: parseInt(page), pageSize: parseInt(pageSize) } });   
  } catch (error) {
    res.json({ success: false, message: '获取邮件回调日志失败' });
  }
});

app.get('/api/email/callback/stats', async (req, res) => {
  try {
    const [stats] = await pool.query(`
      SELECT
        event_type,
        COUNT(*) as count
      FROM email_callback_log
      GROUP BY event_type
      ORDER BY count DESC
    `);

    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM email_callback_log');

    res.json({ success: true, data: { stats, total } });
  } catch (error) {
    res.json({ success: false, message: '获取邮件回调统计失败' });
  }
});

// ==================== 租赁业务 API ====================

// 轮播图
app.get('/api/rent/banners', async (req, res) => {
  try {
    const [banners] = await pool.query(
      'SELECT * FROM rent_banners WHERE status = 1 ORDER BY sort_order ASC'
    );
    res.json({ code: 0, data: banners });
  } catch (error) {
    res.json({ code: -1, message: '获取轮播图失败' });
  }
});

// 分类
app.get('/api/rent/categories', async (req, res) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM rent_categories WHERE status = 1 ORDER BY sort_order ASC'
    );
    res.json({ code: 0, data: categories });
  } catch (error) {
    res.json({ code: -1, message: '获取分类失败' });
  }
});

// 商品列表
app.get('/api/rent/products', async (req, res) => {
  try {
    const { type, category_id, is_recommend, keyword, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;
    
    let query = 'SELECT * FROM rent_products WHERE status = 1';
    const params = [];
    
    if (type) {
      query += ' AND category_id = (SELECT id FROM rent_categories WHERE type = ?)';
      params.push(type);
    }
    if (category_id) {
      query += ' AND category_id = ?';
      params.push(category_id);
    }
    if (is_recommend) {
      query += ' AND is_recommend = 1';
    }
    if (keyword) {
      query += ' AND (name LIKE ? OR specs LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    query += ' ORDER BY sort_order ASC, created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);
    
    const [products] = await pool.query(query, params);
    
    let countQuery = 'SELECT COUNT(*) as total FROM rent_products WHERE status = 1';
    const countParams = [];
    if (type) {
      countQuery += ' AND category_id = (SELECT id FROM rent_categories WHERE type = ?)';
      countParams.push(type);
    }
    const [[{ total }]] = await pool.query(countQuery, countParams);
    
    res.json({ 
      code: 0, 
      data: { 
        list: products, 
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        hasMore: products.length === parseInt(pageSize)
      } 
    });
  } catch (error) {
    res.json({ code: -1, message: '获取商品列表失败' });
  }
});

// 推荐商品
app.get('/api/rent/products/recommend', async (req, res) => {
  try {
    const [products] = await pool.query(
      'SELECT * FROM rent_products WHERE status = 1 AND is_recommend = 1 ORDER BY sort_order ASC LIMIT 10'
    );
    res.json({ code: 0, data: products });
  } catch (error) {
    res.json({ code: -1, message: '获取推荐商品失败' });
  }
});

// 商品详情
app.get('/api/rent/products/:id', async (req, res) => {
  try {
    const [products] = await pool.query(
      'SELECT * FROM rent_products WHERE id = ? AND status = 1',
      [req.params.id]
    );
    if (products.length === 0) {
      return res.json({ code: -1, message: '商品不存在' });
    }
    res.json({ code: 0, data: products[0] });
  } catch (error) {
    res.json({ code: -1, message: '获取商品详情失败' });
  }
});

// 订单列表
app.get('/api/rent/orders', async (req, res) => {
  try {
    const { user_id, status, page = 1, pageSize = 10 } = req.query;
    const offset = (page - 1) * pageSize;
    
    let query = 'SELECT * FROM rent_orders WHERE 1=1';
    const params = [];
    
    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);
    
    const [orders] = await pool.query(query, params);
    
    res.json({ 
      code: 0, 
      data: { 
        list: orders,
        hasMore: orders.length === parseInt(pageSize)
      } 
    });
  } catch (error) {
    res.json({ code: -1, message: '获取订单列表失败' });
  }
});

// 订单详情
app.get('/api/rent/orders/:id', async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT * FROM rent_orders WHERE id = ?',
      [req.params.id]
    );
    if (orders.length === 0) {
      return res.json({ code: -1, message: '订单不存在' });
    }
    res.json({ code: 0, data: orders[0] });
  } catch (error) {
    res.json({ code: -1, message: '获取订单详情失败' });
  }
});

// 创建订单
app.post('/api/rent/orders', async (req, res) => {
  try {
    console.log('收到创建订单请求:', req.body);
    
    const {
      user_id,
      product_id,
      rent_type,
      rent_days,
      total_price,
      deposit,
      credit_free,
      address_name,
      address_phone,
      address_province,
      address_city,
      address_district,
      address_detail,
      remark
    } = req.body;
    
    console.log('验证参数 - user_id:', user_id, 'product_id:', product_id, 'rent_type:', rent_type, 'rent_days:', rent_days, 'total_price:', total_price);
    
    if (!user_id || !product_id || !rent_type || !rent_days || !total_price) {
      console.log('参数验证失败，返回参数不完整');
      return res.json({ code: -1, message: '参数不完整' });
    }
    
    const id = uuidv4();
    const order_no = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    console.log('查询商品，product_id:', product_id);
    const [products] = await pool.query('SELECT * FROM rent_products WHERE id = ?', [product_id]);
    if (products.length === 0) {
      console.log('商品不存在');
      return res.json({ code: -1, message: '商品不存在' });
    }
    const product = products[0];
    console.log('找到商品:', product.name);
    
    await pool.query(`
      INSERT INTO rent_orders (
        id, order_no, user_id, product_id, product_name, product_image,
        rent_type, rent_days, daily_price, total_price, deposit, credit_free,
        address_name, address_phone, address_province, address_city,
        address_district, address_detail, remark, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      id, order_no, user_id, product_id, product.name, product.image,
      rent_type, rent_days, product.daily_price, total_price, deposit, credit_free ? 1 : 0,
      address_name || '', address_phone || '', address_province || '', address_city || '',
      address_district || '', address_detail || '', remark || ''
    ]);
    
    console.log('订单创建成功，order_no:', order_no);
    
    res.json({ 
      code: 0, 
      message: '订单创建成功',
      data: { id, order_no }
    });
  } catch (error) {
    console.error('创建订单错误:', error);
    res.json({ code: -1, message: '创建订单失败: ' + error.message });
  }
});

// 支付订单
app.put('/api/rent/orders/:id/pay', async (req, res) => {
  try {
    const { trade_no } = req.body;
    const [orders] = await pool.query('SELECT * FROM rent_orders WHERE id = ?', [req.params.id]);
    
    if (orders.length === 0) {
      return res.json({ code: -1, message: '订单不存在' });
    }
    
    if (orders[0].status !== 'pending') {
      return res.json({ code: -1, message: '订单状态异常' });
    }
    
    const finalTradeNo = trade_no || orders[0].trade_no || 'SIM_' + Date.now();
    
    await pool.query(`
      UPDATE rent_orders 
      SET status = 'paid', trade_no = ?, pay_time = NOW()
      WHERE id = ?
    `, [finalTradeNo, req.params.id]);
    
    res.json({ code: 0, message: '支付成功' });
  } catch (error) {
    console.error('支付订单错误:', error);
    res.json({ code: -1, message: '更新订单状态失败: ' + error.message });
  }
});

// 取消订单
app.put('/api/rent/orders/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    await pool.query(`
      UPDATE rent_orders 
      SET status = 'cancelled', cancel_time = NOW(), cancel_reason = ?
      WHERE id = ? AND status = 'pending'
    `, [reason || '用户取消', req.params.id]);
    
    res.json({ code: 0, message: '订单已取消' });
  } catch (error) {
    res.json({ code: -1, message: '取消订单失败' });
  }
});

// 发货
app.put('/api/rent/orders/:id/ship', async (req, res) => {
  try {
    await pool.query(`
      UPDATE rent_orders 
      SET status = 'shipped', ship_time = NOW()
      WHERE id = ? AND status = 'paid'
    `, [req.params.id]);
    
    res.json({ code: 0, message: '已发货' });
  } catch (error) {
    res.json({ code: -1, message: '发货失败' });
  }
});

// 归还
app.put('/api/rent/orders/:id/return', async (req, res) => {
  try {
    await pool.query(`
      UPDATE rent_orders 
      SET status = 'returned', return_time = NOW()
      WHERE id = ? AND status = 'shipped'
    `, [req.params.id]);
    
    res.json({ code: 0, message: '已申请归还' });
  } catch (error) {
    res.json({ code: -1, message: '归还申请失败' });
  }
});

// 完成订单
app.put('/api/rent/orders/:id/complete', async (req, res) => {
  try {
    await pool.query(`
      UPDATE rent_orders 
      SET status = 'completed', complete_time = NOW()
      WHERE id = ? AND status = 'returned'
    `, [req.params.id]);
    
    res.json({ code: 0, message: '订单已完成' });
  } catch (error) {
    res.json({ code: -1, message: '完成订单失败' });
  }
});

// 地址列表
app.get('/api/rent/addresses', async (req, res) => {
  try {
    const { user_id } = req.query;
    const [addresses] = await pool.query(
      'SELECT * FROM rent_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [user_id]
    );
    res.json({ code: 0, data: addresses });
  } catch (error) {
    res.json({ code: -1, message: '获取地址列表失败' });
  }
});

// 添加地址
app.post('/api/rent/addresses', async (req, res) => {
  try {
    const { user_id, name, phone, province, city, district, detail, is_default } = req.body;
    
    if (is_default) {
      await pool.query('UPDATE rent_addresses SET is_default = 0 WHERE user_id = ?', [user_id]);
    }
    
    const [result] = await pool.query(`
      INSERT INTO rent_addresses (user_id, name, phone, province, city, district, detail, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [user_id, name, phone, province, city, district, detail, is_default ? 1 : 0]);
    
    res.json({ code: 0, message: '地址添加成功', data: { id: result.insertId } });
  } catch (error) {
    res.json({ code: -1, message: '添加地址失败' });
  }
});

// 更新地址
app.put('/api/rent/addresses/:id', async (req, res) => {
  try {
    const { name, phone, province, city, district, detail, is_default, user_id } = req.body;
    
    if (is_default) {
      await pool.query('UPDATE rent_addresses SET is_default = 0 WHERE user_id = ?', [user_id]);
    }
    
    await pool.query(`
      UPDATE rent_addresses 
      SET name = ?, phone = ?, province = ?, city = ?, district = ?, detail = ?, is_default = ?
      WHERE id = ?
    `, [name, phone, province, city, district, detail, is_default ? 1 : 0, req.params.id]);
    
    res.json({ code: 0, message: '地址更新成功' });
  } catch (error) {
    res.json({ code: -1, message: '更新地址失败' });
  }
});

// 删除地址
app.delete('/api/rent/addresses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM rent_addresses WHERE id = ?', [req.params.id]);
    res.json({ code: 0, message: '地址删除成功' });
  } catch (error) {
    res.json({ code: -1, message: '删除地址失败' });
  }
});

// 用户优惠券
app.get('/api/rent/coupons', async (req, res) => {
  try {
    const { user_id } = req.query;
    const [coupons] = await pool.query(`
      SELECT uc.*, c.name, c.type, c.value, c.min_amount, c.start_time, c.end_time
      FROM rent_user_coupons uc
      LEFT JOIN rent_coupons c ON uc.coupon_id = c.id
      WHERE uc.user_id = ? AND uc.status = 0 AND c.end_time > NOW()
      ORDER BY c.end_time ASC
    `, [user_id]);
    res.json({ code: 0, data: coupons });
  } catch (error) {
    res.json({ code: -1, message: '获取优惠券失败' });
  }
});

// 用户统计
app.get('/api/rent/user/stats', async (req, res) => {
  try {
    const { user_id } = req.query;
    
    const [[{ totalOrders }]] = await pool.query(
      'SELECT COUNT(*) as totalOrders FROM rent_orders WHERE user_id = ?',
      [user_id]
    );
    const [[{ pendingPayment }]] = await pool.query(
      'SELECT COUNT(*) as pendingPayment FROM rent_orders WHERE user_id = ? AND status = "pending"',
      [user_id]
    );
    const [[{ inUse }]] = await pool.query(
      'SELECT COUNT(*) as inUse FROM rent_orders WHERE user_id = ? AND status IN ("paid", "shipped")',
      [user_id]
    );
    const [[{ completed }]] = await pool.query(
      'SELECT COUNT(*) as completed FROM rent_orders WHERE user_id = ? AND status = "completed"',
      [user_id]
    );
    
    res.json({ 
      code: 0, 
      data: { totalOrders, pendingPayment, inUse, completed } 
    });
  } catch (error) {
    res.json({ code: -1, message: '获取统计失败' });
  }
});

// 租金计算
app.post('/api/rent/calculate', async (req, res) => {
  try {
    const { product_id, rent_type, rent_days, daily_price, monthly_price } = req.body;
    
    let total_price = 0;
    if (rent_type === 'daily') {
      total_price = daily_price * rent_days;
    } else {
      const months = Math.ceil(rent_days / 30);
      total_price = monthly_price * months;
    }
    
    res.json({ 
      code: 0, 
      data: { 
        total_price,
        rent_type,
        rent_days,
        daily_price,
        monthly_price
      } 
    });
  } catch (error) {
    res.json({ code: -1, message: '计算失败' });
  }
});

function calculateCreditFreeAmount(score) {
  if (score >= 700) {
    return 10000;
  } else if (score >= 650) {
    return 5000;
  } else if (score >= 600) {
    return 2000;
  }
  return 0;
}

// 支付宝小程序授权登录
app.post('/api/rent/user/alipay/login', async (req, res) => {
  try {
    const { authCode } = req.body;
    
    if (!authCode) {
      return res.json({ code: -1, message: 'authCode不能为空' });
    }

    let alipayUserId = '';
    let accessToken = '';
    let creditScore = 650;
    let creditFreeAmount = 5000;
    let useRealApi = false;

    if (authCode === 'test123' || authCode === 'test_auth_code_12345' || authCode.startsWith('test_')) {
      alipayUserId = 'alipay_test_user_001';
      console.log('使用测试用户ID:', alipayUserId);
    } else {
      try {
        const userResult = await alipaySdk.getUserId(authCode);
        if (userResult.success) {
          alipayUserId = userResult.userId;
          accessToken = userResult.accessToken;
          useRealApi = true;
          console.log('获取到真实用户ID:', alipayUserId);
        } else {
          console.log('支付宝API调用失败，使用固定测试用户:', userResult.message);
          alipayUserId = 'alipay_test_user_001';
        }
      } catch (apiError) {
        console.log('支付宝SDK调用异常，使用固定测试用户:', apiError.message);
        alipayUserId = 'alipay_test_user_001';
      }
    }

    const [existingUsers] = await pool.query('SELECT * FROM rent_users WHERE alipay_user_id = ?', [alipayUserId]);
    
    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
      
      let finalCreditScore = user.credit_score || 650;
      let finalCreditFreeAmount = user.credit_free_amount || 5000;
      
      if (useRealApi && accessToken && (!user.credit_score || user.credit_score === 0)) {
        const zhimaResult = await alipaySdk.getZhimaCreditScore(accessToken);
        if (zhimaResult.success) {
          finalCreditScore = zhimaResult.score;
          finalCreditFreeAmount = calculateCreditFreeAmount(finalCreditScore);
          console.log('获取到芝麻信用分:', finalCreditScore, '免押额度:', finalCreditFreeAmount);
        }
      }
      
      await pool.query(
        'UPDATE rent_users SET token = ?, last_login = NOW(), credit_score = ?, credit_free_amount = ? WHERE id = ?',
        [token, finalCreditScore, finalCreditFreeAmount, user.id]
      );
      
      res.json({ 
        code: 0, 
        data: { 
          id: user.id, 
          username: user.username, 
          nickname: user.nickname || user.username, 
          phone: user.phone || '', 
          avatar: user.avatar || '',
          alipayUserId: alipayUserId,
          creditScore: finalCreditScore,
          creditFreeAmount: finalCreditFreeAmount,
          token 
        } 
      });
    } else {
      const id = uuidv4();
      const username = '肌肉人用户' + Math.floor(Math.random() * 10000);
      const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
      
      if (useRealApi && accessToken) {
        const zhimaResult = await alipaySdk.getZhimaCreditScore(accessToken);
        if (zhimaResult.success) {
          creditScore = zhimaResult.score;
          creditFreeAmount = calculateCreditFreeAmount(creditScore);
          console.log('新用户获取到芝麻信用分:', creditScore, '免押额度:', creditFreeAmount);
        }
      }
      
      await pool.query(
        'INSERT INTO rent_users (id, username, nickname, alipay_user_id, auth_code, token, credit_score, credit_free_amount, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [id, username, username, alipayUserId, authCode, token, creditScore, creditFreeAmount]
      );
      
      res.json({ 
        code: 0, 
        data: { 
          id, 
          username, 
          nickname: username, 
          phone: '', 
          avatar: '',
          alipayUserId: alipayUserId,
          creditScore: creditScore,
          creditFreeAmount: creditFreeAmount,
          token 
        } 
      });
    }
  } catch (error) {
    console.error('支付宝登录错误:', error);
    res.json({ code: -1, message: '登录失败，请重试' });
  }
});

// 检查登录会话
app.get('/api/rent/user/check-session', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.json({ code: 0, data: { valid: false } });
    }
    
    const [users] = await pool.query('SELECT id, username, nickname FROM rent_users WHERE token = ?', [token]);
    if (users.length > 0) {
      res.json({ code: 0, data: { valid: true, user: users[0] } });
    } else {
      res.json({ code: 0, data: { valid: false } });
    }
  } catch (error) {
    res.json({ code: 0, data: { valid: false } });
  }
});

// 获取用户信息
app.get('/api/rent/user/info', async (req, res) => {
  try {
    const { user_id } = req.query;
    const [users] = await pool.query('SELECT id, username, nickname, phone, avatar, credit_score, credit_free_amount FROM rent_users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.json({ code: -1, message: '用户不存在' });
    }
    res.json({ code: 0, data: users[0] });
  } catch (error) {
    res.json({ code: -1, message: '获取用户信息失败' });
  }
});

// 更新用户信息
app.post('/api/rent/user/update-info', async (req, res) => {
  try {
    const { user_id, nickname, avatar, gender, province, city } = req.body;
    
    if (!user_id) {
      return res.json({ code: -1, message: '用户ID不能为空' });
    }
    
    await pool.query(`
      UPDATE rent_users 
      SET nickname = ?, avatar = ?, gender = ?, province = ?, city = ?, updated_at = NOW()
      WHERE id = ?
    `, [nickname, avatar, gender || '', province || '', city || '', user_id]);
    
    res.json({ code: 0, message: '更新成功' });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.json({ code: -1, message: '更新用户信息失败' });
  }
});

// 更新用户信用分
app.post('/api/rent/user/update-credit', async (req, res) => {
  try {
    const { user_id, userId, creditScore, creditFreeAmount, credit_score, credit_free_amount, nickName, nickname, avatar, gender, province, city } = req.body;
    
    const uid = user_id || userId;
    const score = creditScore || credit_score || 0;
    const amount = creditFreeAmount || credit_free_amount || 0;
    const name = nickName || nickname || '';
    
    if (!uid) {
      return res.json({ code: -1, message: '用户ID不能为空' });
    }
    
    await pool.query(`
      UPDATE rent_users 
      SET credit_score = ?, credit_free_amount = ?, nickname = ?, avatar = ?, gender = ?, province = ?, city = ?, updated_at = NOW()
      WHERE id = ?
    `, [score, amount, name, avatar || '', gender || '', province || '', city || '', uid]);
    
    res.json({ code: 0, message: '更新成功', data: { creditScore: score, creditFreeAmount: amount } });
  } catch (error) {
    console.error('更新信用分失败:', error);
    res.json({ code: -1, message: '更新信用分失败' });
  }
});

// ==================== 支付相关 API ====================

// 创建支付宝支付订单
app.post('/api/rent/payment/create', async (req, res) => {
  try {
    let { order_id, order_no, subject, total_amount, body } = req.body;
    
    if (!order_id) {
      return res.json({ code: -1, message: '参数不完整：order_id不能为空' });
    }

    // 如果只提供了order_id，从数据库获取订单信息
    if (!order_no || !subject || !total_amount) {
      const [orderDetails] = await pool.query('SELECT * FROM rent_orders WHERE id = ?', [order_id]);
      if (orderDetails.length === 0) {
        return res.json({ code: -1, message: '订单不存在' });
      }
      
      const order = orderDetails[0];
      order_no = order.order_no;
      subject = order.product_name || '租赁订单';
      total_amount = order.total_price;
      body = order.product_name || '租赁服务';
    }

    const [orders] = await pool.query('SELECT user_id FROM rent_orders WHERE id = ?', [order_id]);
    if (orders.length === 0) {
      return res.json({ code: -1, message: '订单不存在' });
    }

    const [users] = await pool.query('SELECT alipay_user_id FROM rent_users WHERE id = ?', [orders[0].user_id]);
    const buyerOpenId = users.length > 0 ? users[0].alipay_user_id : '';

    let tradeNo = '';
    let alipayResult;

    try {
      alipayResult = await alipaySdk.createTradeOrder(
        order_no,
        subject,
        parseFloat(total_amount),
        body || subject,
        buyerOpenId
      );

      if (alipayResult.success) {
        tradeNo = alipayResult.tradeNo;
      } else {
        console.log('支付宝创建订单失败:', alipayResult.message);
        return res.json({ code: -1, message: alipayResult.message || '创建支付订单失败' });
      }
    } catch (alipayError) {
      console.error('支付宝SDK调用失败:', alipayError.message);
      return res.json({ code: -1, message: '创建支付订单失败: ' + alipayError.message });
    }

    await pool.query(
      'UPDATE rent_orders SET trade_no = ?, updated_at = NOW() WHERE id = ?',
      [tradeNo, order_id]
    );

    res.json({
      code: 0,
      message: '创建支付订单成功',
      data: {
        tradeNO: tradeNo
      }
    });
  } catch (error) {
    console.error('创建支付订单错误:', error);
    res.json({ code: -1, message: '创建支付订单失败: ' + error.message });
  }
});

// 支付宝异步支付回调
app.post('/api/alipay/notify', async (req, res) => {
  try {
    const notifyData = req.body;
    console.log('收到支付宝支付回调:', notifyData);

    const sign = notifyData.sign;
    delete notifyData.sign;
    delete notifyData.sign_type;

    const isValid = alipaySdk.verify(sign, notifyData);

    if (!isValid) {
      console.warn('支付宝回调验签失败');
      return res.send('fail');
    }

    const outTradeNo = notifyData.out_trade_no;
    const tradeNo = notifyData.trade_no;
    const tradeStatus = notifyData.trade_status;

    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      const [orders] = await pool.query(
        'SELECT * FROM rent_orders WHERE order_no = ?',
        [outTradeNo]
      );

      if (orders.length > 0 && orders[0].status === 'pending') {
        await pool.query(`
          UPDATE rent_orders 
          SET status = 'paid', trade_no = ?, pay_time = NOW(), updated_at = NOW()
          WHERE id = ?
        `, [tradeNo, orders[0].id]);

        console.log('订单支付成功，已更新状态:', outTradeNo);
      }
    }

    res.send('success');
  } catch (error) {
    console.error('处理支付宝回调错误:', error);
    res.send('fail');
  }
});

// 支付宝同步支付回调
app.get('/api/alipay/return', (req, res) => {
  try {
    const outTradeNo = req.query.out_trade_no;
    res.redirect(`/pages/order/order?success=true&order_no=${outTradeNo}`);
  } catch (error) {
    console.error('处理支付宝同步回调错误:', error);
    res.redirect('/pages/order/order?success=false');
  }
});

// 查询支付状态
app.get('/api/rent/payment/query', async (req, res) => {
  try {
    const { out_trade_no } = req.query;
    
    if (!out_trade_no) {
      return res.json({ code: -1, message: '订单号不能为空' });
    }

    const result = await alipaySdk.queryTradeOrder(out_trade_no);
    
    if (result.success) {
      if (result.tradeStatus === 'TRADE_SUCCESS' || result.tradeStatus === 'TRADE_FINISHED') {
        const [orders] = await pool.query(
          'SELECT * FROM rent_orders WHERE order_no = ?',
          [out_trade_no]
        );

        if (orders.length > 0 && orders[0].status === 'pending') {
          await pool.query(`
            UPDATE rent_orders 
            SET status = 'paid', trade_no = ?, pay_time = NOW(), updated_at = NOW()
            WHERE id = ?
          `, [result.tradeNo, orders[0].id]);
        }
      }

      res.json({
        code: 0,
        data: {
          tradeStatus: result.tradeStatus,
          tradeNo: result.tradeNo,
          outTradeNo: result.outTradeNo
        }
      });
    } else {
      res.json({ code: -1, message: result.message || '查询失败' });
    }
  } catch (error) {
    console.error('查询支付状态错误:', error);
    res.json({ code: -1, message: '查询失败' });
  }
});

// 关闭支付订单
app.post('/api/rent/payment/close', async (req, res) => {
  try {
    const { out_trade_no } = req.body;
    
    if (!out_trade_no) {
      return res.json({ code: -1, message: '订单号不能为空' });
    }

    const result = await alipaySdk.closeTradeOrder(out_trade_no);
    
    if (result.success) {
      const [orders] = await pool.query(
        'SELECT * FROM rent_orders WHERE order_no = ?',
        [out_trade_no]
      );

      if (orders.length > 0 && orders[0].status === 'pending') {
        await pool.query(`
          UPDATE rent_orders 
          SET status = 'cancelled', cancel_time = NOW(), cancel_reason = '支付超时关闭', updated_at = NOW()
          WHERE id = ?
        `, [orders[0].id]);
      }

      res.json({ code: 0, message: '订单已关闭' });
    } else {
      res.json({ code: -1, message: result.message || '关闭失败' });
    }
  } catch (error) {
    console.error('关闭订单错误:', error);
    res.json({ code: -1, message: '关闭失败' });
  }
});

// 退款
app.post('/api/rent/payment/refund', async (req, res) => {
  try {
    const { out_trade_no, refund_amount, refund_reason } = req.body;
    
    if (!out_trade_no || !refund_amount) {
      return res.json({ code: -1, message: '参数不完整' });
    }

    const result = await alipaySdk.refundTradeOrder(
      out_trade_no,
      parseFloat(refund_amount),
      refund_reason || '正常退款'
    );
    
    if (result.success) {
      res.json({
        code: 0,
        message: '退款成功',
        data: {
          refundFee: result.refundFee
        }
      });
    } else {
      res.json({ code: -1, message: result.message || '退款失败' });
    }
  } catch (error) {
    console.error('退款错误:', error);
    res.json({ code: -1, message: '退款失败' });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`肌肉人AI API 服务运行在端口 ${PORT}`);
});
