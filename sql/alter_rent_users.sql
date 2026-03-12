ALTER TABLE rent_users ADD COLUMN alipay_user_id VARCHAR(100) COMMENT '支付宝用户ID';
CREATE INDEX idx_alipay_user_id ON rent_users (alipay_user_id);
