import Footer from '@/components/Footer';
import { userRegisterUsingPost } from '@/services/backend/userController';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { useEmotionCss } from '@ant-design/use-emotion-css';
import { Helmet, history } from '@umijs/max';
import { message, Tabs } from 'antd';
import React, { useState } from 'react';
import { Link } from 'umi';
import Settings from '../../../../config/defaultSettings';

/**
 * 用户注册页面
 */
const UserRegisterPage: React.FC = () => {
  const [type, setType] = useState<string>('account');
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

  const handleSubmit = async (values: API.UserRegisterRequest) => {
    const { userPassword, checkPassword } = values;
    if (userPassword !== checkPassword) {
      message.error('两次输入的密码不一致，请重新确认！');
      return;
    }
    try {
      await userRegisterUsingPost({ ...values });
      message.success('注册成功！欢迎加入校园社团大家庭 🎉');
      history.push('/user/login');
    } catch (error: any) {
      message.error(`注册失败，${error.message}`);
    }
  };

  return (
    <div className={containerClassName}>
      <Helmet>
        <title>{'注册'} - {Settings.title}</title>
      </Helmet>
      <div style={{ flex: '1', padding: '32px 0' }}>
        <LoginForm
          contentStyle={{ minWidth: 280, maxWidth: '75vw' }}
          logo={<img alt="logo" style={{ height: '100%' }} src="/logo.svg" />}
          title="校园社团管理系统"
          subTitle="注册账号，探索丰富多彩的校园社团活动"
          initialValues={{ autoLogin: true }}
          submitter={{ searchConfig: { submitText: '立即注册' } }}
          onFinish={async (values) => {
            await handleSubmit(values as API.UserRegisterRequest);
          }}
        >
          <Tabs
            activeKey={type}
            onChange={setType}
            centered
            items={[{ key: 'account', label: '新用户注册' }]}
          />
          {type === 'account' && (
            <>
              <ProFormText
                name="userAccount"
                fieldProps={{ size: 'large', prefix: <UserOutlined /> }}
                placeholder="请输入系统登录账号（至少4位）"
                rules={[
                  { required: true, message: '账号是必填项！' },
                  { min: 4, message: '账号不得少于4个字符！' },
                ]}
              />
              <ProFormText.Password
                name="userPassword"
                fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
                placeholder="请设置密码（至少8位）"
                rules={[
                  { required: true, message: '密码是必填项！' },
                  { min: 8, message: '密码不得少于8个字符！' },
                ]}
              />
              <ProFormText.Password
                name="checkPassword"
                fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
                placeholder="请再次确认密码"
                rules={[{ required: true, message: '确认密码是必填项！' }]}
              />
              <div style={{ padding: '4px 0 16px', fontSize: 13, color: '#1677ff' }}>
                为了维护校园社团秩序，请如实填报以下真实学籍档案信息
              </div>
              <ProFormText
                name="realName"
                placeholder="您的真实姓名 (必填)"
                rules={[{ required: true, message: '真实姓名是必填项！' }]}
              />
              <ProFormText
                name="studentId"
                placeholder="您的校内学号 (必填)"
                rules={[{ required: true, message: '学号是必填项！' }]}
              />
              <ProFormText
                name="college"
                placeholder="所属学院 (选填，如：软件专硕)"
              />
              <ProFormText
                name="major"
                placeholder="专业名称 (必填，如：软件工程)"
                rules={[{ required: true, message: '专业是必填项！' }]}
              />
            </>
          )}
          <div style={{ marginBottom: 24, textAlign: 'right' }}>
            <Link to="/user/login">已有账号？返回登录</Link>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};
export default UserRegisterPage;
