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
  const [type, setType] = useState<string>('student');
  const { initialState, setInitialState } = useModel('@@initialState');
  const isStudent = type === 'student';

  const containerClassName = useEmotionCss(() => {
    return {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      transition: 'background 0.5s ease',
      background: isStudent
        ? 'linear-gradient(135deg, #e0f2fe 0%, #dbeafe 50%, #ede9fe 100%)'
        : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      backgroundSize: '100% 100%',
    };
  });

  const handleSubmit = async (values: API.UserLoginRequest) => {
    try {
      const res = await userLoginUsingPost({ ...values });
      const userRole = res.data?.userRole;

      if (type === 'admin' && userRole !== 'admin') {
        message.warning('当前账号无管理权限，已为您跳转至集市首页');
      } else {
        message.success('登录成功，欢迎回来！');
      }

      setInitialState({
        ...initialState,
        currentUser: res.data,
      });

      const urlParams = new URL(window.location.href).searchParams;
      const redirectTarget = urlParams.get('redirect') || '/';
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
        <title>{isStudent ? '登录 - 校园社团集市' : '管理后台 - 校园社团管理系统'}</title>
      </Helmet>
      <div style={{ flex: '1', padding: '12vh 0 32px' }}>
        <LoginForm
          contentStyle={{ minWidth: 280, maxWidth: '75vw' }}
          logo={<img alt="logo" style={{ height: '100%' }} src="/logo.svg" />}
          title={isStudent ? "校园社团集市" : "校园社团管理系统"}
          subTitle={isStudent ? "发现你的热爱，结识志同道合的朋友" : "专业、稳定的系统管理控制台"}
          initialValues={{ autoLogin: true }}
          onFinish={async (values) => {
            await handleSubmit(values as API.UserLoginRequest);
          }}
        >
          <Tabs
            activeKey={type}
            onChange={setType}
            centered
            items={[
              { key: 'student', label: '学生入口' },
              { key: 'admin', label: '管理员入口' }
            ]}
          />
          {(type === 'student' || type === 'admin') && (
            <>
              <ProFormText
                name="userAccount"
                fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
                placeholder={isStudent ? "请输入学号 / 账号" : "请输入管理员账号"}
                rules={[{ required: true, message: '账号是必填项！' }]}
              />
              <ProFormText.Password
                name="userPassword"
                fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
                placeholder="请输入登录密码"
                rules={[{ required: true, message: '密码是必填项！' }]}
              />
            </>
          )}

          {isStudent && (
            <div style={{ marginBottom: 24, textAlign: 'right' }}>
              <Link to="/user/register" style={{ color: '#1677ff', fontSize: 13 }}>还没有账号？立即注册</Link>
            </div>
          )}
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};
export default Login;
