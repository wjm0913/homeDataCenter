import { Button, Card, Form, Input, InputNumber, message, Switch } from 'antd';
import api from '../../api/client';

const PublishPage = () => {
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      await api.post('/api/publish', {
        topic: values.topic,
        payload: values.payload,
        qos: values.qos,
        retain: values.retain
      });
      message.success('Message sent');
      form.resetFields(['payload']);
    } catch (error: any) {
      message.error(error.message);
    }
  };

  return (
    <Card title="发布消息">
      <Form layout="vertical" form={form} initialValues={{ qos: 0, retain: false }} onFinish={onFinish}>
        <Form.Item label="主题" name="topic" rules={[{ required: true }]}> <Input /> </Form.Item>
        <Form.Item label="消息体" name="payload" rules={[{ required: true }]}>
          <Input.TextArea rows={6} placeholder='{"temperature":25}' />
        </Form.Item>
        <Form.Item label="QoS" name="qos">
          <InputNumber min={0} max={2} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="保留消息" name="retain" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            发布
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default PublishPage;
