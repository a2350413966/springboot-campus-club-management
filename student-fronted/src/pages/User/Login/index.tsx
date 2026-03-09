import Footer from '@/components/Footer';
import { userLoginUsingPost } from '@/services/backend/userController';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { useEmotionCss } from '@ant-design/use-emotion-css';
import { Helmet, history, useModel } from '@umijs/max';
import { message, Tabs } from 'antd';
import React, { useState } from 'react';
import { Link } from 'umi';
import Settings from '../../../../config/defaultSettings';

const Login: React.FC = () => {
  const [type, setType] = useState<string>('account');
  const { initialState, setInitialState } = useModel('@@initialState');
  const containerClassName = useEmotionCss(() => {
    return {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      background: 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #ede9fe 100%)',
      backgroundSize: '100% 100%',
    };
  });

  const handleSubmit = async (values: API.UserLoginRequest) => {
    try {
      const res = await userLoginUsingPost({ ...values });
      message.success('登录成功，欢迎回来！');
      setInitialState({
        ...initialState,
        currentUser: res.data,
      });
      const urlParams = new URL(window.location.href).searchParams;
      const redirectTarget = urlParams.get('redirect') || '/';
      // 如果 redirect 指向管理页面，但当前登录的用户不是 admin，则直接回首页
      const userRole = res.data?.userRole;
      const safeRedirect =
        redirectTarget.startsWith('/admin') && userRole !== 'admin'
          ? '/'
          : redirectTarget;
      history.push(safeRedirect);
      return;
    } catch (error: any) {
      message.error(`登录失败，${error.message}`);
    }
  };

  return (
    <div className={containerClassName}>
      <Helmet>
        <title>{'登录'} - {Settings.title}</title>
      </Helmet>
      <div style={{ flex: '1', padding: '32px 0' }}>
        <LoginForm
          contentStyle={{ minWidth: 280, maxWidth: '75vw' }}
          logo={<img alt="logo" style={{ height: '100%' }} src="/logo.svg" />}
          title="校园社团管理系统"
          subTitle="连接你我，共建精彩校园生活"
          initialValues={{ autoLogin: true }}
          onFinish={async (values) => {
            await handleSubmit(values as API.UserLoginRequest);
          }}
        >
          <Tabs
            activeKey={type}
            onChange={setType}
            centered
            items={[{ key: 'account', label: '账号密码登录' }]}
          />
          {type === 'account' && (
            <>
              <ProFormText
                name="userAccount"
                fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
                placeholder="请输入学号 / 账号"
                rules={[{ required: true, message: '账号是必填项！' }]}
              />
              <ProFormText.Password
                name="userPassword"
                fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
                placeholder="请输入密码"
                rules={[{ required: true, message: '密码是必填项！' }]}
              />
            </>
          )}
          <div style={{ marginBottom: 24, textAlign: 'right' }}>
            <Link to="/user/register">还没有账号？立即注册</Link>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};
export default Login;
