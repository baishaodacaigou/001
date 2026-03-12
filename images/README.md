# 图片资源文件夹

此文件夹用于存放小程序所需的图片资源。

## 已提供的 SVG 图标（占位）

当前已提供 SVG 格式的 TabBar 图标占位文件：
- `home.svg` / `home-active.svg` - 首页图标
- `category.svg` / `category-active.svg` - 分类图标
- `order.svg` / `order-active.svg` - 订单图标
- `mine.svg` / `mine-active.svg` - 我的图标

**注意**：支付宝小程序 TabBar 需要 PNG 格式图片，请将 SVG 转换为 PNG 或使用自己的图标。

## 需要添加的图片

### TabBar 图标 (PNG格式，81x81 px)
- home.png (首页图标 - 未选中，灰色 #999999)
- home-active.png (首页图标 - 选中，蓝色 #1E90FF)
- category.png (分类图标 - 未选中)
- category-active.png (分类图标 - 选中)
- order.png (订单图标 - 未选中)
- order-active.png (订单图标 - 选中)
- mine.png (我的图标 - 未选中)
- mine-active.png (我的图标 - 选中)

### 商品图片 (750x750 px)
- gpu.png - GPU服务器图片
- pc.png - 电竞台式机图片
- laptop.png - 笔记本电脑图片
- digital.png - 数码设备图片
- banner.png - 轮播图图片

### 功能图标 (64x64 px)
- search.png - 搜索图标
- notice.png - 公告图标
- credit.png - 信用免押图标
- delivery.png - 发货图标
- service.png - 服务图标
- check.png - 勾选图标

### 订单状态图标 (64x64 px)
- order-pending.png - 待支付
- order-paid.png - 待发货
- order-shipped.png - 待归还
- order-completed.png - 已完成
- empty-order.png - 空订单

### 用户相关
- default-avatar.png - 默认头像 (120x120 px)
- settings.png - 设置图标 (48x48 px)
- zhima.png - 芝麻信用图标 (32x32 px)

### 菜单图标 (48x48 px)
- icon-deposit.png - 我的押金
- icon-coupon.png - 优惠券
- icon-record.png - 租赁记录
- icon-address.png - 收货地址
- icon-service.png - 在线客服
- icon-about.png - 关于我们

### 其他
- empty.png - 空状态图片 (200x200 px)

## 图片设计规范

1. **TabBar 图标**：建议使用线性图标风格，未选中状态灰色(#999999)，选中状态蓝色(#1E90FF)
2. **商品图片**：建议使用白色背景，商品居中展示
3. **功能图标**：建议使用简洁的线性图标，颜色与主题色保持一致
4. **图片格式**：推荐使用 PNG 格式，支持透明背景

## 快速替换方案

1. 可以使用在线工具将 SVG 转换为 PNG：
   - https://cloudconvert.com/svg-to-png
   - https://convertio.co/zh/svg-png/

2. 或者使用设计工具（如 Figma、Sketch）导出 PNG 格式
