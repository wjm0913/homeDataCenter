import { Button, Card, Table } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import api from '../../api/client';

interface ClientInfo {
  clientId: string;
  username?: string;
  address?: string;
  state?: string;
  lastSeen: number;
}

const ClientsPage = () => {
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await api.get<ClientInfo[]>('/api/clients').finally(() => setLoading(false));
    setClients(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Card title="在线客户端" extra={<Button onClick={load}>刷新</Button>}>
      <Table
        rowKey="clientId"
        loading={loading}
        dataSource={clients}
        columns={[
          { title: '客户端 ID', dataIndex: 'clientId' },
          { title: '用户名', dataIndex: 'username' },
          { title: 'IP 地址', dataIndex: 'address' },
          {
            title: '状态',
            dataIndex: 'state',
            render: (value: string) => (value === '1' ? '在线' : '离线')
          },
          {
            title: '最后活动时间',
            dataIndex: 'lastSeen',
            render: (value: number) => dayjs(value).format('YYYY-MM-DD HH:mm:ss')
          }
        ]}
      />
    </Card>
  );
};

export default ClientsPage;
