#!/bin/bash
cd /var/www/api
export NODE_OPTIONS="--openssl-legacy-provider"
nohup node server.js > /var/log/api.log 2>&1 &
echo "服务已启动"
