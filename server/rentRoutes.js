const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

module.exports = (pool) => {
  
  // ==================== 轮播图 API ====================
  
  router.get('/banners', async (req, res) => {
    try {
      const [banners] = await pool.query(
        'SELECT * FROM rent_banners WHERE status = 1 ORDER BY sort_order ASC'
      );
      res.json({ code: 0, data: banners });
    } catch (error) {
      res.json({ code: -1, message: '获取轮播图失败' });
    }
  });

  // ==================== 分类 API ====================
  
  router.get('/categories', async (req, res) => {
    try {
      const [categories] = await pool.query(
        'SELECT * FROM rent_categories WHERE status = 1 ORDER BY sort_order ASC'
      );
      res.json({ code: 0, data: categories });
    } catch (error) {
      res.json({ code: -1, message: '获取分类失败' });
    }
  });

  // ==================== 商品 API ====================
  
  router.get('/products', async (req, res) => {
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
          pageSize: parseInt(pageSize)
        } 
      });
    } catch (error) {
      res.json({ code: -1, message: '获取商品列表失败' });
    }
  });

  router.get('/products/recommend', async (req, res) => {
    try {
      const [products] = await pool.query(
        'SELECT * FROM rent_products WHERE status = 1 AND is_recommend = 1 ORDER BY sort_order ASC LIMIT 10'
      );
      res.json({ code: 0, data: products });
    } catch (error) {
      res.json({ code: -1, message: '获取推荐商品失败' });
    }
  });

  router.get('/products/:id', async (req, res) => {
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

  // ==================== 订单 API ====================
  
  router.get('/orders', async (req, res) => {
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

  router.get('/orders/:id', async (req, res) => {
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

  router.post('/orders', async (req, res) => {
    try {
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
      
      const id = uuidv4();
      const order_no = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
      
      const [products] = await pool.query('SELECT * FROM rent_products WHERE id = ?', [product_id]);
      if (products.length === 0) {
        return res.json({ code: -1, message: '商品不存在' });
      }
      const product = products[0];
      
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
        address_name, address_phone, address_province, address_city,
        address_district, address_detail, remark
      ]);
      
      res.json({ 
        code: 0, 
        message: '订单创建成功',
        data: { id, order_no }
      });
    } catch (error) {
      res.json({ code: -1, message: '创建订单失败: ' + error.message });
    }
  });

  router.put('/orders/:id/pay', async (req, res) => {
    try {
      const { trade_no } = req.body;
      await pool.query(`
        UPDATE rent_orders 
        SET status = 'paid', trade_no = ?, pay_time = NOW()
        WHERE id = ? AND status = 'pending'
      `, [trade_no, req.params.id]);
      
      res.json({ code: 0, message: '支付成功' });
    } catch (error) {
      res.json({ code: -1, message: '更新订单状态失败' });
    }
  });

  router.put('/orders/:id/cancel', async (req, res) => {
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

  router.put('/orders/:id/ship', async (req, res) => {
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

  router.put('/orders/:id/return', async (req, res) => {
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

  router.put('/orders/:id/complete', async (req, res) => {
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

  // ==================== 地址 API ====================
  
  router.get('/addresses', async (req, res) => {
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

  router.post('/addresses', async (req, res) => {
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

  router.put('/addresses/:id', async (req, res) => {
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

  router.delete('/addresses/:id', async (req, res) => {
    try {
      await pool.query('DELETE FROM rent_addresses WHERE id = ?', [req.params.id]);
      res.json({ code: 0, message: '地址删除成功' });
    } catch (error) {
      res.json({ code: -1, message: '删除地址失败' });
    }
  });

  // ==================== 优惠券 API ====================
  
  router.get('/coupons', async (req, res) => {
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

  // ==================== 用户统计 API ====================
  
  router.get('/user/stats', async (req, res) => {
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

  // ==================== 租金计算 API (对接 GLM-5) ====================
  
  router.post('/calculate', async (req, res) => {
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

  return router;
};
