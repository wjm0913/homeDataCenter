import axios from 'axios';
import nodeCron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const CLOUD_SERVER_URL = process.env.CLOUD_SERVER_URL;

async function updateIP() {
    try {
        const response = await axios.post(`${CLOUD_SERVER_URL}/update-proxy`, {}, {
            timeout: 5000
        });
        
        if (response.status === 200) {
            console.log('心跳发送成功');
            return;
        }
    } catch (error) {
        console.error('更新失败:', error.message);
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
}

nodeCron.schedule('*/5 * * * *', updateIP);
updateIP(); 