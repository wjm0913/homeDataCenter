import { Button, Card, Form, Input, message, Modal, Popconfirm, Table } from 'antd';
import { useEffect, useState } from 'react';
import api from '../../api/client';

interface UserRecord {
  username: string;
  hash: string;
}

const UsersPage = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    const res = await api.get<UserRecord[]>('/api/users');
    setUsers(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    try {
      const values = await form.validateFields();
      await api.post('/api/users', values);
      message.success('用户创建成功');
      setOpen(false);
      form.resetFields();
      load();
    } catch (error: any) {
      if (error.message) message.error(error.message);
    }
  };

  const remove = async (username: string) => {
    await api.delete(`/api/users/${username}`);
    message.success('用户已删除');
    load();
  };

  return (
    <Card title="用户管理" extra={<Button onClick={() => setOpen(true)}>新增用户</Button>}>
      <Table
        rowKey="username"
        dataSource={users}
        columns={[
          { title: '用户名', dataIndex: 'username' },
          { title: '密码哈希', dataIndex: 'hash', ellipsis: true },
          {
            title: '操作',
            render: (_, record) => (
              <Popconfirm title="确认删除该用户？" onConfirm={() => remove(record.username)}>
                <Button danger size="small">
                  删除
                </Button>
              </Popconfirm>
            )
          }
        ]}
      />

      <Modal
        title="新增用户"
        open={open}
        onOk={submit}
        onCancel={() => setOpen(false)}
        okText="保存"
      >
        <Form layout="vertical" form={form}>
          <Form.Item label="用户名" name="username" rules={[{ required: true }]}> <Input /> </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true }]}> <Input.Password /> </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UsersPage;
