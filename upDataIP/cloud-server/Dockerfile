FROM node:18-alpine

# 安装nginx
RUN apk add --no-cache nginx

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# 确保nginx配置目录存在
RUN mkdir -p /etc/nginx/conf.d

# 添加启动脚本
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80 3000

CMD ["/start.sh"] 