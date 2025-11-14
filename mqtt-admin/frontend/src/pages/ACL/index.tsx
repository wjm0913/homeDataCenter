import { Button, Card, Form, Input, message, Select, Space, Table } from 'antd';
import { useEffect, useState } from 'react';
import api from '../../api/client';

interface AclEntry {
  user: string;
  topic: string;
  access: 'read' | 'write' | 'readwrite' | 'deny';
}

const AclPage = () => {
  const [entries, setEntries] = useState<AclEntry[]>([]);
  const [form] = Form.useForm();

  const load = async () => {
    const res = await api.get<AclEntry[]>('/api/acl');
    setEntries(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (next: AclEntry[]) => {
    await api.post('/api/acl', { entries: next });
    setEntries(next);
    message.success('ACL saved');
  };

  const addEntry = async () => {
    const newEntry = await form.validateFields();
    await save([...entries, newEntry]);
    form.resetFields();
  };

  const remove = async (idx: number) => {
    const next = entries.filter((_, index) => index !== idx);
    await save(next);
  };

  return (
    <Card title="权限管理">
      <Form layout="inline" form={form} style={{ marginBottom: 16 }}>
        <Form.Item name="user" rules={[{ required: true }]}> <Input placeholder="用户名" /> </Form.Item>
        <Form.Item name="topic" rules={[{ required: true }]}> <Input placeholder="home/#" /> </Form.Item>
        <Form.Item name="access" initialValue="read">
          <Select style={{ width: 140 }}
            options={[
              { value: 'read', label: '只读' },
              { value: 'write', label: '只写' },
              { value: 'readwrite', label: '读写' },
              { value: 'deny', label: '拒绝' }
            ]}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={addEntry}>添加</Button>
        </Form.Item>
      </Form>

      <Table
        rowKey={(record, idx) => `${record.user}-${record.topic}-${idx}`}
        dataSource={entries}
        columns={[
          { title: '用户', dataIndex: 'user' },
          { title: '主题/模式', dataIndex: 'topic' },
          { title: '权限', dataIndex: 'access' },
          {
            title: '操作',
            render: (_, __, idx) => (
              <Space>
                <Button danger size="small" onClick={() => remove(idx!)}>
                  删除
                </Button>
              </Space>
            )
          }
        ]}
      />
    </Card>
  );
};

export default AclPage;
