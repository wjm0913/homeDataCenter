import { Badge, Card, Col, Descriptions, Row, Space, Statistic, Tabs, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../api/client';

interface OverviewPayload {
  clientsConnected: number;
  messageRate: number;
  subscriptionCount: number;
  sysInfo: Record<string, string>;
  history: { timestamp: number; count: number }[];
  connection: {
    host: string;
    port: number;
    username?: string;
    connected: boolean;
  };
}

const DashboardPage = () => {
  const [data, setData] = useState<OverviewPayload | null>(null);
  const load = async () => {
    const res = await api.get<OverviewPayload>('/api/overview');
    setData(res.data);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  const history = (data?.history ?? []).map((item) => ({
    ...item,
    label: dayjs(item.timestamp).format('HH:mm')
  }));

  const highlightInfo = [
    { label: 'Broker 版本', value: data?.sysInfo['$SYS/broker/version'] },
    { label: '运行时间', value: data?.sysInfo['$SYS/broker/uptime'] },
    { label: '消息存储', value: data?.sysInfo['$SYS/broker/messages/stored'] },
    { label: '系统时间', value: data?.sysInfo['$SYS/broker/time'] }
  ].filter((item) => item.value);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card className="glass-card" bordered={false}>
        <Typography.Title level={3} style={{ color: '#fff', marginBottom: 8 }}>
          Broker 总览
        </Typography.Title>
        <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Space size="large">
            <Badge status={data?.connection?.connected ? 'success' : 'error'} />
            <div>
              <Typography.Text style={{ color: '#b0c4ff' }}>
                {data?.connection?.connected ? '已连接陈工 MQTT' : '未连接'}
              </Typography.Text>
              <div style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>
                {data?.connection?.host}:{data?.connection?.port}
              </div>
            </div>
          </Space>
          <Tag color="geekblue" style={{ fontSize: 16, padding: '6px 16px' }}>
            用户 {data?.connection?.username || '未配置'}
          </Tag>
        </Space>
      </Card>

      <div className="stat-grid">
        <Card className="glass-card" bordered={false}>
          <Statistic title="在线客户端" value={data?.clientsConnected ?? 0} valueStyle={{ color: '#4ADE80' }} />
        </Card>
        <Card className="glass-card" bordered={false}>
          <Statistic
            title="消息速率 (条/秒)"
            value={data?.messageRate ?? 0}
            precision={3}
            valueStyle={{ color: '#60A5FA' }}
          />
        </Card>
        <Card className="glass-card" bordered={false}>
          <Statistic title="订阅数量" value={data?.subscriptionCount ?? 0} valueStyle={{ color: '#F472B6' }} />
        </Card>
      </div>

      <Card className="glass-card" bordered={false} title="最近 5 分钟消息趋势">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={history}>
            <XAxis dataKey="label" stroke="#94a3b8" />
            <YAxis allowDecimals={false} stroke="#94a3b8" />
            <Tooltip />
            <Line dataKey="count" stroke="#7dd3fc" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="glass-card" bordered={false} title="$SYS 即时信息">
        <Tabs
          items={[
            {
              key: 'focus',
              label: '关键信息',
              children: (
                <Row gutter={[16, 16]}>
                  {highlightInfo.map((item) => (
                    <Col span={12} key={item.label}>
                      <Card size="small" bordered={false} className="glass-card">
                        <Typography.Text type="secondary">{item.label}</Typography.Text>
                        <Typography.Paragraph style={{ marginBottom: 0 }}>{item.value}</Typography.Paragraph>
                      </Card>
                    </Col>
                  ))}
                  {highlightInfo.length === 0 && <Typography.Text>暂无数据</Typography.Text>}
                </Row>
              )
            },
            {
              key: 'all',
              label: '全部信息',
              children: (
                <div className="sys-list">
                  <Descriptions column={2} bordered size="small">
                    {Object.entries(data?.sysInfo || {}).map(([key, value]) => (
                      <Descriptions.Item key={key} label={key} span={2}>
                        {value}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                </div>
              )
            }
          ]}
        />
      </Card>
    </Space>
  );
};

export default DashboardPage;
