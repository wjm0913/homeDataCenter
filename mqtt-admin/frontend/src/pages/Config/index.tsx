import { Button, Card, Form, Input, List, message, Space } from 'antd';
import { useEffect, useState } from 'react';
import api from '../../api/client';

const ConfigPage = () => {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [form] = Form.useForm();

  const load = async () => {
    const res = await api.get<Record<string, string>>('/api/conf');
    setConfig(res.data);
    form.setFieldsValue(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const onFinish = async (values: Record<string, string>) => {
    try {
      const payload = { ...config, ...values };
      await api.post('/api/conf', payload);
      message.success('Configuration saved');
      setConfig(payload);
    } catch (error: any) {
      message.error(error.message);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title="编辑 mosquitto.conf">
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item label="listener" name="listener">
            <Input placeholder="1883" />
          </Form.Item>
          <Form.Item label="allow_anonymous" name="allow_anonymous">
            <Input placeholder="false" />
          </Form.Item>
          <Form.Item label="password_file" name="password_file">
            <Input placeholder="/mosquitto/config/pwfile" />
          </Form.Item>
          <Form.Item label="acl_file" name="acl_file">
            <Input placeholder="/mosquitto/config/aclfile" />
          </Form.Item>
          <Form.Item label="protocol" name="protocol">
            <Input placeholder="mqtt" />
          </Form.Item>
          <Form.Item label="listener_websockets" name="listener_websockets">
            <Input placeholder="9001" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="配置项概览">
        <List
          dataSource={Object.entries(config)}
          renderItem={([key, value]) => (
            <List.Item>
              <strong style={{ width: 200 }}>{key}</strong>
              <span>{value}</span>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
};

export default ConfigPage;
