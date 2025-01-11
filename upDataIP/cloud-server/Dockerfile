# 使用较新的 Node 版本 (Alpine)
FROM node:20-alpine

# 1. 替换阿里云镜像源（国内环境常见操作）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 2. 安装 Nginx 和 Supervisor
RUN apk update && apk add --no-cache nginx supervisor

# 3. 删除默认站点配置（可选）
RUN rm -rf /etc/nginx/conf.d/default.conf

# 4. 创建工作目录
WORKDIR /app

# 5. 拷贝 package.json 并安装依赖
COPY package.json ./

RUN npm config set registry https://registry.npmmirror.com

RUN npm install

# 6. 拷贝源代码(包括 index.js / nginx.conf.template / logs.json 等)
COPY . .

# 7. 初始化 logs.json
RUN echo '[]' > /app/logs.json

# 8. 拷贝 Supervisor 配置文件
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 9. 设置 Nginx 配置文件权限
RUN chmod 644 /etc/nginx/nginx.conf

# 10. 暴露 80 (Nginx) 和 3000 (Node)
EXPOSE 80
EXPOSE 3000

# 11. 启动 Supervisor，管理 Nginx 和 Node.js
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
