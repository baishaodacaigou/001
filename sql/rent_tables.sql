-- 租赁业务数据库表结构

-- 商品分类表
CREATE TABLE IF NOT EXISTS rent_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL COMMENT '分类名称',
  type VARCHAR(20) NOT NULL COMMENT '分类类型: gpu/pc/laptop/digital',
  icon VARCHAR(255) COMMENT '分类图标',
  sort_order INT DEFAULT 0 COMMENT '排序',
  status TINYINT DEFAULT 1 COMMENT '状态: 1启用 0禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租赁商品分类表';

-- 商品表
CREATE TABLE IF NOT EXISTS rent_products (
  id VARCHAR(36) PRIMARY KEY,
  category_id INT NOT NULL COMMENT '分类ID',
  name VARCHAR(100) NOT NULL COMMENT '商品名称',
  image VARCHAR(255) COMMENT '商品图片',
  images TEXT COMMENT '商品图片列表JSON',
  specs VARCHAR(500) COMMENT '规格参数',
  description TEXT COMMENT '商品描述',
  daily_price DECIMAL(10,2) NOT NULL COMMENT '日租价格',
  monthly_price DECIMAL(10,2) COMMENT '月租价格',
  deposit DECIMAL(10,2) NOT NULL COMMENT '押金金额',
  stock INT DEFAULT 0 COMMENT '库存数量',
  sales INT DEFAULT 0 COMMENT '销量',
  tags VARCHAR(255) COMMENT '标签JSON数组',
  features TEXT COMMENT '服务保障JSON数组',
  status TINYINT DEFAULT 1 COMMENT '状态: 1上架 0下架',
  is_recommend TINYINT DEFAULT 0 COMMENT '是否推荐',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租赁商品表';

-- 订单表
CREATE TABLE IF NOT EXISTS rent_orders (
  id VARCHAR(36) PRIMARY KEY,
  order_no VARCHAR(32) NOT NULL COMMENT '订单编号',
  user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
  product_id VARCHAR(36) NOT NULL COMMENT '商品ID',
  product_name VARCHAR(100) COMMENT '商品名称',
  product_image VARCHAR(255) COMMENT '商品图片',
  rent_type VARCHAR(20) NOT NULL COMMENT '租赁类型: daily/monthly',
  rent_days INT NOT NULL COMMENT '租赁天数',
  start_date DATE COMMENT '开始日期',
  end_date DATE COMMENT '结束日期',
  daily_price DECIMAL(10,2) COMMENT '日租单价',
  total_price DECIMAL(10,2) NOT NULL COMMENT '租金总计',
  deposit DECIMAL(10,2) DEFAULT 0 COMMENT '押金金额',
  deposit_status TINYINT DEFAULT 0 COMMENT '押金状态: 0未支付 1已支付 2已退还',
  credit_free TINYINT DEFAULT 0 COMMENT '是否信用免押: 0否 1是',
  status VARCHAR(20) DEFAULT 'pending' COMMENT '订单状态: pending/paid/shipped/returned/completed/cancelled',
  trade_no VARCHAR(64) COMMENT '支付宝交易号',
  pay_time DATETIME COMMENT '支付时间',
  ship_time DATETIME COMMENT '发货时间',
  return_time DATETIME COMMENT '归还时间',
  complete_time DATETIME COMMENT '完成时间',
  cancel_time DATETIME COMMENT '取消时间',
  cancel_reason VARCHAR(255) COMMENT '取消原因',
  address_name VARCHAR(50) COMMENT '收货人姓名',
  address_phone VARCHAR(20) COMMENT '收货人电话',
  address_province VARCHAR(50) COMMENT '省份',
  address_city VARCHAR(50) COMMENT '城市',
  address_district VARCHAR(50) COMMENT '区县',
  address_detail VARCHAR(255) COMMENT '详细地址',
  remark VARCHAR(255) COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_order_no (order_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租赁订单表';

-- 用户押金表
CREATE TABLE IF NOT EXISTS rent_deposits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
  order_id VARCHAR(36) COMMENT '订单ID',
  amount DECIMAL(10,2) NOT NULL COMMENT '押金金额',
  type VARCHAR(20) NOT NULL COMMENT '类型: pay/refund',
  status TINYINT DEFAULT 0 COMMENT '状态: 0待处理 1已完成 2已取消',
  trade_no VARCHAR(64) COMMENT '交易号',
  remark VARCHAR(255) COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户押金记录表';

-- 优惠券表
CREATE TABLE IF NOT EXISTS rent_coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL COMMENT '优惠券名称',
  type VARCHAR(20) NOT NULL COMMENT '类型: discount/reduce',
  value DECIMAL(10,2) NOT NULL COMMENT '优惠金额/折扣',
  min_amount DECIMAL(10,2) DEFAULT 0 COMMENT '最低消费金额',
  total_count INT DEFAULT 0 COMMENT '发放总量',
  used_count INT DEFAULT 0 COMMENT '已使用数量',
  start_time DATETIME COMMENT '生效时间',
  end_time DATETIME COMMENT '失效时间',
  status TINYINT DEFAULT 1 COMMENT '状态: 1启用 0禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='优惠券表';

-- 用户优惠券表
CREATE TABLE IF NOT EXISTS rent_user_coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
  coupon_id INT NOT NULL COMMENT '优惠券ID',
  order_id VARCHAR(36) COMMENT '使用的订单ID',
  status TINYINT DEFAULT 0 COMMENT '状态: 0未使用 1已使用 2已过期',
  use_time DATETIME COMMENT '使用时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户优惠券表';

-- 收货地址表
CREATE TABLE IF NOT EXISTS rent_addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
  name VARCHAR(50) NOT NULL COMMENT '收货人姓名',
  phone VARCHAR(20) NOT NULL COMMENT '联系电话',
  province VARCHAR(50) COMMENT '省份',
  city VARCHAR(50) COMMENT '城市',
  district VARCHAR(50) COMMENT '区县',
  detail VARCHAR(255) NOT NULL COMMENT '详细地址',
  is_default TINYINT DEFAULT 0 COMMENT '是否默认地址',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收货地址表';

-- 轮播图表
CREATE TABLE IF NOT EXISTS rent_banners (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image VARCHAR(255) NOT NULL COMMENT '图片地址',
  title VARCHAR(100) COMMENT '标题',
  url VARCHAR(255) COMMENT '跳转链接',
  sort_order INT DEFAULT 0 COMMENT '排序',
  status TINYINT DEFAULT 1 COMMENT '状态: 1启用 0禁用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='轮播图表';

-- 插入初始分类数据
INSERT INTO rent_categories (name, type, icon, sort_order) VALUES
('GPU服务器', 'gpu', '/images/gpu.png', 1),
('电竞台式机', 'pc', '/images/pc.png', 2),
('笔记本电脑', 'laptop', '/images/laptop.png', 3),
('数码设备', 'digital', '/images/digital.png', 4);

-- 插入示例商品数据
INSERT INTO rent_products (id, category_id, name, image, specs, description, daily_price, monthly_price, deposit, stock, tags, features, is_recommend) VALUES
(UUID(), 1, 'RTX 4090 GPU服务器', '/images/gpu.png', 'RTX 4090 24GB / 64GB内存 / 2TB NVMe SSD', '高性能GPU服务器，适用于AI训练、深度学习、渲染等场景。配备顶级RTX 4090显卡，24GB显存。', 88.00, 2388.00, 5000.00, 10, '["信用免押", "即租即用", "高性能"]', '["24小时技术支持", "免费上门安装", "全程维护保障"]', 1),
(UUID(), 1, 'RTX 4080 GPU服务器', '/images/gpu.png', 'RTX 4080 16GB / 32GB内存 / 1TB NVMe SSD', '性价比GPU服务器，适合中等规模AI训练和渲染任务。', 68.00, 1888.00, 4000.00, 15, '["信用免押", "高性价比"]', '["24小时技术支持", "远程协助"]', 1),
(UUID(), 2, 'i9-14900K 电竞主机', '/images/pc.png', 'i9-14900K / RTX 4080 / 32GB / 1TB SSD', '顶级电竞主机，畅玩3A大作，专业设计渲染。', 68.00, 1888.00, 3000.00, 20, '["信用免押", "高性价比"]', '["预装游戏平台", "外设配套"]', 1),
(UUID(), 2, 'i7-14700K 游戏主机', '/images/pc.png', 'i7-14700K / RTX 4070 / 16GB / 512GB SSD', '主流游戏主机，性价比之选。', 48.00, 1288.00, 2500.00, 25, '["信用免押"]', '["预装游戏平台"]', 1),
(UUID(), 3, 'RTX 4080 游戏本', '/images/laptop.png', 'i9-13900HX / RTX 4080 / 32GB / 1TB SSD', '顶级游戏笔记本，便携与性能兼顾。', 48.00, 1288.00, 2000.00, 15, '["信用免押", "便携办公"]', '["预装Office", "保修服务"]', 1),
(UUID(), 3, 'RTX 4070 游戏本', '/images/laptop.png', 'i7-13700H / RTX 4070 / 16GB / 512GB SSD', '主流游戏笔记本，满足日常游戏和办公需求。', 38.00, 988.00, 1500.00, 20, '["信用免押"]', '["预装Office"]', 1),
(UUID(), 4, 'iPhone 15 Pro Max', '/images/digital.png', '256GB / 钛金属原色', '最新款iPhone，A17 Pro芯片，钛金属机身。', 18.00, 488.00, 1000.00, 30, '["信用免押", "热门"]', '["原装配件", "碎屏险"]', 1),
(UUID(), 4, 'iPad Pro 12.9寸', '/images/digital.png', 'M2芯片 / 256GB / WiFi版', '顶级平板电脑，专业创作利器。', 15.00, 388.00, 800.00, 25, '["信用免押"]', '["Apple Pencil配套"]', 1);

-- 插入轮播图数据
INSERT INTO rent_banners (image, title, url, sort_order) VALUES
('/images/banner.png', 'GPU服务器租赁', '/pages/category/category?type=gpu', 1),
('/images/banner.png', '信用免押 最高免50000', '', 2);
