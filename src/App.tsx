import React from 'react';
import { Layout, Tabs, Typography, Space, Button, Dropdown, MenuProps, Switch, Tooltip } from 'antd';
import { useSelector } from 'react-redux';
import Interviewee from '@/pages/Interviewee';
import Interviewer from '@/pages/Interviewer';
import { RootState, setActiveTab, resetSession, setSession, setDarkMode } from './store';
import { useAppDispatch } from './store/hooks';
import { persistor } from './store';

const { Header, Content, Footer } = Layout;

export default function App() {
  const activeTab = useSelector((s: RootState) => s.ui.activeTab);
  const dispatch = useAppDispatch();

  const handleNewInterview = () => {
    // Reset only the session to allow a new candidate to start
    dispatch(resetSession());
    dispatch(setSession({ interviewStage: 'idle', currentCandidateId: undefined, currentQuestionIndex: 0, currentQuestionExpiresAt: undefined, paused: false }));
    dispatch(setActiveTab('interviewee'));
  };

  const handleLogout = async () => {
    // Clear all persisted data and reload the app
    await persistor.purge();
    window.location.reload();
  };

  const menuItems: MenuProps['items'] = [
    { key: 'new', label: 'Start New Interview', onClick: handleNewInterview },
    { type: 'divider' },
    { key: 'logout', label: 'Logout (Clear Local Data)', danger: true, onClick: handleLogout },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography.Title level={3} style={{ color: 'white', margin: 0 }}>Crisp — AI Interview Assistant</Typography.Title>
        <Space>
          <Tooltip title="Toggle Dark Mode">
            <Switch
              checkedChildren="Dark"
              unCheckedChildren="Light"
              onChange={(val) => dispatch(setDarkMode(val))}
            />
          </Tooltip>
          <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
            <Button>Menu</Button>
          </Dropdown>
        </Space>
      </Header>
      <Content style={{ padding: 24, background: '#f5f7fb' }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key: string) => dispatch(setActiveTab(key as 'interviewee' | 'interviewer'))}
          items={[
            {
              key: 'interviewee',
              label: 'Interviewee',
              children: <Interviewee />,
            },
            {
              key: 'interviewer',
              label: 'Interviewer',
              children: <Interviewer />,
            },
          ]}
        />
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Built with ❤️ for Swipe — {new Date().getFullYear()}
      </Footer>
    </Layout>
  );
}
