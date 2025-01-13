## HI,NI HAO。

---
## 首先解决动态ip的问题

---
#### 阿里云服务器：cloud-server

---
#### 自家库房的服务器：dynamic-server

---
## 方案文字描述
    1、dynamic-server部署一套node服务，他每次都向cloud-server服务器发送一个post请求。
    2、cloud-server服务接受到请求之后再req获取dynamic-server的ip，发现和原ip不一致后进行nginx更新操作。
    3、cloud-server已安装nginx，访问cloud-server通过nginx全部代理到了dynamic-server上。
---
## cloud-server 代码

---
#### 目录结构
```text
cloud-server/
    ├── Dockerfile/
    ├── index.js
    ├── logs.json
    ├── nginx.conf.template
    ├── supervisord.conf
    ├── package.json
```
---
##### Dockerfile 文件
    # 使用 Node 版本 (Alpine)
    FROM node:20-alpine
    
    # 1. 替换阿里云镜像源
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
---

##### index.js

```JavaScript
import express from 'express';
import fs from 'fs-extra';
import { exec } from 'child_process';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

// 为了在 ES Module 模式下获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// 日志文件存放路径
const LOG_FILE_PATH = path.join(__dirname, 'logs.json');

// 记录最新 dynamic-server IP
let currentDynamicIP = null;

/**
 * 初始化日志文件（若不存在则创建空数组）
 */
async function initLogs() {
    try {
        if (!(await fs.pathExists(LOG_FILE_PATH))) {
            await fs.writeJSON(LOG_FILE_PATH, []);
            console.log('初始化 logs.json 成功');
        } else {
            // 检查文件是否为空或内容不合法
            const content = await fs.readFile(LOG_FILE_PATH, 'utf-8');
            if (!content.trim()) {
                await fs.writeJSON(LOG_FILE_PATH, []);
                console.log('logs.json 内容为空，已初始化为 []');
            } else {
                // 验证 JSON 是否有效
                try {
                    JSON.parse(content);
                    console.log('logs.json 已存在且内容有效');
                } catch (parseError) {
                    await fs.writeJSON(LOG_FILE_PATH, []);
                    console.log('logs.json 内容无效，已重新初始化为 []');
                }
            }
        }
    } catch (error) {
        console.error('初始化日志文件失败:', error);
    }
}

/**
 * 写入一条日志（示例：记录时间 + IP）
 */
async function writeLog(newIp) {
    try {
        const logs = await fs.readJSON(LOG_FILE_PATH);
        const now = new Date();
        const record = {
            timestamp: now.toLocaleString(), // 年月日时分秒
            ip: newIp
        };
        logs.push(record);
        await fs.writeJSON(LOG_FILE_PATH, logs, { spaces: 2 });
        console.log(`已记录日志: ${JSON.stringify(record)}`);
    } catch (error) {
        console.error('写入日志失败:', error);
    }
}

/**
 * 正常化 IP 地址，去掉 IPv6 映射前缀 ::ffff:
 */
function normalizeIp(ip) {
    if (ip.startsWith('::ffff:')) {
        return ip.replace('::ffff:', '');
    }
    return ip;
}

/**
 * 使用 EJS 模板，生成新的 nginx.conf，并重载
 */
async function generateNginxConfAndReload(ip) {
    try {
        const sanitizedIp = normalizeIp(ip);
        
        // 1. 读取模板
        const templatePath = path.join(__dirname, 'nginx.conf.template');
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        
        // 2. 使用 EJS 渲染，传入 sanitizedIp
        const renderedConf = ejs.render(templateContent, {
            dynamicIp: sanitizedIp
        });
        
        // 3. 写入 /etc/nginx/nginx.conf
        await fs.writeFile('/etc/nginx/nginx.conf', renderedConf);
        console.log('已更新 /etc/nginx/nginx.conf');
        
        // 4. 重载 Nginx
        await new Promise((resolve, reject) => {
            exec('nginx -s reload', (error, stdout, stderr) => {
                if (error) {
                    console.error('Nginx reload 失败:', error);
                    return reject(error);
                }
                console.log('Nginx reload 成功:', stdout || stderr);
                resolve(true);
            });
        });
        
        console.log(`[Nginx] 已更新配置并重载，IP => ${sanitizedIp}`);
    } catch (err) {
        console.error('[Nginx] 生成配置或重载时出错:', err);
    }
}

// 初始化日志文件
initLogs();

/**
 * 接收 dynamic-server 上报的 IP (改用 GET, 自行从header/IP获取)
 */
app.get('/update-ip', async (req, res) => {
    // 优先从 x-forwarded-for / x-real-ip 获取客户端 IP
    const newIp =
        req.headers['x-forwarded-for'] ||
        req.headers['x-real-ip'] ||
        req.ip;
    
    if (!newIp) {
        return res.status(400).json({ message: '无法获取 IP' });
    }
    
    console.log(`接收到 dynamic-server 上报 IP-=-=-=-=-=-=--=-=-=-=-==--=-==-=--=-==-=-: ${newIp}`);
    
    // 正常化 IP
    const sanitizedIp = normalizeIp(newIp);
    
    // 如果 IP 变化，则写日志 + 生成 nginx.conf + reload
    if (sanitizedIp !== currentDynamicIP) {
        console.log(`IP 变化: ${currentDynamicIP} => ${sanitizedIp}`);
        currentDynamicIP = sanitizedIp;
        
        // 写入日志
        await writeLog(sanitizedIp);
        
        // 生成新的 Nginx 配置并重载
        await generateNginxConfAndReload(sanitizedIp);
        
        return res.json({ message: 'IP updated and nginx reloaded' });
    } else {
        console.log('IP 未变化，无需更新');
        return res.json({ message: 'IP not changed' });
    }
});

/**
 * 查看日志接口
 */
app.get('/logs', async (req, res) => {
    try {
        const logs = await fs.readJSON(LOG_FILE_PATH);
        res.json(logs);
    } catch (error) {
        console.error('读取日志失败:', error);
        res.status(500).json({ message: 'Failed to read logs' });
    }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`cloud-server is running on port ${PORT}`);
});
```
---
##### nginx.conf.template (ejs模版)

    user  nginx;
    worker_processes  auto;
    
    error_log  /var/log/nginx/error.log warn;
    # 注意启动路径
    pid        /var/run/nginx/nginx.pid;
    
    events {
    worker_connections 1024;
    }
    
    http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
        sendfile        on;
        keepalive_timeout  65;
    
        server {
            listen 80;
            location / {
                proxy_pass http://<%= dynamicIp %>:xxxxx; # 替换自己的端口
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }
        }
    }
---
##### supervisord (进程管理工具，可以不使用他)
    [supervisord]
    nodaemon=true
    
    [program:nginx]
    command=nginx -g "daemon off;"
    autorestart=true
    stderr_logfile=/var/log/nginx.err.log
    stdout_logfile=/var/log/nginx.out.log
    
    [program:node]
    command=npm start
    autorestart=true
    stderr_logfile=/var/log/node.err.log
    stdout_logfile=/var/log/node.out.log
---
#### package.json
```text
{
  "name": "cloud-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ejs": "^3.1.9",
    "fs-extra": "^11.1.1"
  }
}
```

## dynamic-server 代码
    使用 pm2 启动的。后续会在这个服务器搭建k8s docker。等clcd流程
---
##### 目录结构
```text
dynamic-server/
    ├── index.js
    ├── package.json
```
---
##### index.js

```JavaScript
import axios from 'axios';
import express from 'express';

const app = express();
const port = xxxx;

// 云服务器的地址
const CLOUD_SERVER_URL = 'http://xxxxxxxxxx:xxxxxx/update-ip';

// 添加测试接口
app.get('/test', (req, res) => {
    res.json({
        message: '这是来自 dynamic-server 的测试响应',
        timestamp: new Date().toISOString(),
        serverInfo: {
            type: 'dynamic-server',
            port: port
        }
    });
});

// 定期发送IP更新请求
async function sendIPUpdate() {
    try {
        const response = await axios.get(CLOUD_SERVER_URL);
        console.log('IP更新请求已发送:', response.data);
    } catch (error) {
        console.error('发送IP更新请求失败:', error.message);
    }
}

// 每5分钟发送一次更新
setInterval(sendIPUpdate, 60 * 1000);

// 启动时立即发送一次
sendIPUpdate();

app.listen(port, () => {
    console.log(`程序运行在${port}`);
});
```
---

##### package.json
```text
{
  "name": "dynamic-server",
  "version": "1.0.0",
  "main": "app.js",
  "type": "module",
  "dependencies": {
    "express": "^4.17.1",
    "axios": "^0.21.1"
  }
}

```

---
- 解决域名问题
- 解决 https 证书问题
- 解决 云服务器 cloud-server 上部署问题
- 搭建阿里云镜像仓库
- dynamic-server 服务器 docker 安装问题
- dynamic-server 防火墙问题
---



