// index.js
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

// 日志文件存放路径（如果不用数据库）
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
