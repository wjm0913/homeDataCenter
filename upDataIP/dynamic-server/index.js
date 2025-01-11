import axios from 'axios';
import express from 'express';

const app = express();
const port = 3001;

// 云服务器的地址
const CLOUD_SERVER_URL = 'http://8.155.39.35:3000/update-ip';

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
    console.log(`Dynamic server running on port ${port}`);
    console.log(`Test endpoint available at: http://localhost:${port}/test`);
});
