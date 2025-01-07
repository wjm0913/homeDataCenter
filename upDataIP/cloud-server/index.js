import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec } from 'child_process';
import fs from 'fs/promises';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config();

const app = express();
app.use(express.json());

const NGINX_CONF_PATH = '/etc/nginx/conf.d/dynamic-proxy.conf';
const CURRENT_IP_PATH = '/app/current_ip.txt'; // 保存当前IP的文件
const TARGET_PORT = process.env.TARGET_PORT || 3000;

// 读取当前IP
async function getCurrentIP() {
    try {
        const ip = await fs.readFile(CURRENT_IP_PATH, 'utf-8');
        return ip.trim();
    } catch (error) {
        return null; // 文件不存在或读取失败
    }
}

// 保存新IP
async function saveCurrentIP(ip) {
    await fs.writeFile(CURRENT_IP_PATH, ip);
}

async function updateNginxConfig(clientIP) {
    const nginxConfig = `
server {
    listen 80 default_server;

    location / {
        proxy_pass http://${clientIP}:${TARGET_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}`;

    try {
        await fs.writeFile(NGINX_CONF_PATH, nginxConfig);
        await execAsync('nginx -t');
        await execAsync('nginx -s reload');
        await saveCurrentIP(clientIP); // 保存新IP
        console.log('Nginx配置已更新并重新加载');
        return true;
    } catch (error) {
        console.error('更新Nginx配置失败:', error);
        return false;
    }
}

app.post('/update-proxy', async (req, res) => {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log('收到来自IP的更新:', clientIP);
    
    try {
        const currentIP = await getCurrentIP();
        
        // 如果IP没有变化，直接返回成功
        if (currentIP === clientIP) {
            console.log('IP未发生变化，跳过更新');
            return res.json({ success: true, ip: clientIP, updated: false });
        }

        const success = await updateNginxConfig(clientIP);
        if (success) {
            res.json({ success: true, ip: clientIP, updated: true });
        } else {
            res.status(500).json({ error: 'Nginx配置更新失败' });
        }
    } catch (error) {
        console.error('处理更新请求失败:', error);
        res.status(500).json({ error: '服务器内部错误' });
    }
});

app.listen(3000, () => {
    console.log('服务器运行在端口3000');
}); 