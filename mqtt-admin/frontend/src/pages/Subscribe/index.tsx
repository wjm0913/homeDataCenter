import { Button, Card, Form, Input, List, Space, Tag } from 'antd';
import { useState } from 'react';
import { useTopicStream } from '../../hooks/useTopicStream';

const SubscribePage = () => {
  const [topics, setTopics] = useState<string[]>([]);
  const [form] = Form.useForm();
  const { messages, clear } = useTopicStream(topics);

  const onFinish = ({ topic }: { topic: string }) => {
    const value = topic.trim();
    if (value && !topics.includes(value)) {
      setTopics([...topics, value]);
      form.resetFields();
    }
  };

  const removeTopic = (topic: string) => {
    setTopics(topics.filter((item) => item !== topic));
  };

  return (
    <Card title="实时订阅" extra={<Button onClick={clear}>清空消息</Button>}>
      <Form layout="inline" onFinish={onFinish} style={{ marginBottom: 16 }} form={form}>
        <Form.Item name="topic" rules={[{ required: true, message: '请输入主题' }]}>
          <Input placeholder="sensor/+/temperature" allowClear />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            订阅
          </Button>
        </Form.Item>
      </Form>

      <Space wrap style={{ marginBottom: 16 }}>
        {topics.map((topic) => (
          <Tag key={topic} closable onClose={() => removeTopic(topic)}>
            {topic}
          </Tag>
        ))}
        {topics.length === 0 && <span>暂无订阅主题</span>}
      </Space>

      <List
        bordered
        dataSource={messages}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={`${item.topic} - ${new Date(item.timestamp).toLocaleTimeString()}`}
              description={<pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{formatPayload(item.payload)}</pre>}
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

function formatPayload(payload: string) {
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
}

export default SubscribePage;
