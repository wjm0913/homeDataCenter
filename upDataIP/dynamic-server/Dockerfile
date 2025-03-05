# 使用较新的 Node 版本 (Alpine)
FROM node:20-alpine

# 1. 替换阿里云镜像源（国内环境常见操作）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 2. 创建工作目录
WORKDIR /app

# 3. 拷贝 package.json 并安装依赖
COPY package.json ./
RUN npm config set registry https://registry.npmmirror.com
RUN npm install

# 4. 拷贝源代码
COPY . .

# 5. 暴露端口 3001
EXPOSE 3001

# 6. 启动应用
CMD ["node", "index.js"]


#  docker build -t dynamic-server:latest .
#  docker run -d --name cloud-server    -p 3001:3001    dynamic-server:latest
