import {
  ApiOutlined,
  CloudOutlined,
  DashboardOutlined,
  ExperimentOutlined,
  NodeIndexOutlined,
  SettingOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Layout, Menu, type MenuProps, theme } from 'antd';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import AclPage from './pages/ACL';
import ClientsPage from './pages/Clients';
import ConfigPage from './pages/Config';
import ControlPage from './pages/Control';
import DashboardPage from './pages/Dashboard';
import PublishPage from './pages/Publish';
import SubscribePage from './pages/Subscribe';
import TopicsPage from './pages/Topics';
import UsersPage from './pages/Users';

const routes: MenuProps['items'] = [
  { key: '/dashboard', label: '仪表盘', icon: <DashboardOutlined /> },
  { key: '/clients', label: '客户端', icon: <TeamOutlined /> },
  { key: '/topics', label: '主题', icon: <NodeIndexOutlined /> },
  { key: '/subscribe', label: '订阅', icon: <ExperimentOutlined /> },
  { key: '/publish', label: '发布', icon: <CloudOutlined /> },
  { key: '/users', label: '用户', icon: <UserOutlined /> },
  { key: '/acl', label: '权限', icon: <ApiOutlined /> },
  { key: '/config', label: '配置', icon: <SettingOutlined /> },
  { key: '/control', label: '控制', icon: <ThunderboltOutlined /> }
];

const { Header, Sider, Content } = Layout;

const AppShell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  theme.useToken();

  return (
    <Layout className="app-frame">
      <Sider collapsible className="app-sider" width={220}>
        <div style={{ padding: 16, color: '#fff', fontWeight: 600, letterSpacing: 1 }}>MQTT 管理</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={routes}
          onClick={(item) => navigate(item.key)}
        />
      </Sider>
      <Layout>
        <Header className="app-header" style={{ paddingLeft: 24, fontSize: 16 }}>
          Mosquitto 管理台
        </Header>
        <Content className="app-content">
          <div className="app-content-inner">
            <Routes>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/clients" element={<ClientsPage />} />
              <Route path="/topics" element={<TopicsPage />} />
              <Route path="/subscribe" element={<SubscribePage />} />
              <Route path="/publish" element={<PublishPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/acl" element={<AclPage />} />
              <Route path="/config" element={<ConfigPage />} />
              <Route path="/control" element={<ControlPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

const App = () => (
  <BrowserRouter>
    <AppShell />
  </BrowserRouter>
);

export default App;
