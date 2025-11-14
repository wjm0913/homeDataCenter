import { Button, Card, message } from 'antd';
import api from '../../api/client';

const ControlPage = () => {
  const restart = async () => {
    try {
      await api.post('/api/restart', {});
      message.success('Broker restart triggered');
    } catch (error: any) {
      message.error(error.message);
    }
  };

  return (
    <Card title="系统控制">
      <Button danger type="primary" onClick={restart}>
        重启 Mosquitto 容器
      </Button>
    </Card>
  );
};

export default ControlPage;
