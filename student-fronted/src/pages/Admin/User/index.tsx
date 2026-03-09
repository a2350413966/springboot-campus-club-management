import CreateModal from '@/pages/Admin/User/components/CreateModal';
import UpdateModal from '@/pages/Admin/User/components/UpdateModal';
import { deleteUserUsingPost, listUserByPageUsingPost, updateUserUsingPost } from '@/services/backend/userController';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import { Button, message, Space, Typography, Popconfirm, Tag } from 'antd';
import React, { useRef, useState } from 'react';

/**
 * 极权人员监控中心
 *
 * @constructor
 */
const UserAdminPage: React.FC = () => {
  // 是否显示新建窗口
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  // 是否显示更新窗口
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const actionRef = useRef<ActionType>();
  // 当前用户点击的数据
  const [currentRow, setCurrentRow] = useState<API.User>();

  /**
   * 删除节点
   *
   * @param row
   */
  const handleDelete = async (row: API.User) => {
    const hide = message.loading('正在删除');
    if (!row) return true;
    try {
      await deleteUserUsingPost({
        id: row.id as any,
      });
      hide();
      message.success('删除成功');
      actionRef?.current?.reload();
      return true;
    } catch (error: any) {
      hide();
      message.error('删除失败，' + error.message);
      return false;
    }
  };

  /**
   * 变更人员序列极权（降维/解封/提拔）
   */
  const handleRoleChange = async (row: API.User, newRole: string) => {
    const hide = message.loading('执行序列覆写...');
    try {
      await updateUserUsingPost({ id: row.id, userRole: newRole });
      hide();
      message.success('权限更迭已生效');
      actionRef?.current?.reload();
    } catch (e: any) {
      hide();
      message.error(`覆写操作遭到阻断：${e.message}`);
    }
  };

  /**
   * 密码洗白指令
   */
  const handleResetPwd = async (row: API.User) => {
    const hide = message.loading('正在突破安全层执行重置...');
    try {
      await request('/api/user/reset_pwd', { method: 'POST', data: { id: row.id } });
      hide();
      message.success('该账户的安全密钥已被成功降级回档至初始态 (12345678)');
    } catch (e: any) {
      hide();
      message.error(`密令覆盖时失败：${e.message}`);
    }
  };

  /**
   * 表格列配置
   */
  const columns: ProColumns<API.User>[] = [
    {
      title: 'id',
      dataIndex: 'id',
      valueType: 'text',
      hideInForm: true,
    },
    {
      title: '账号',
      dataIndex: 'userAccount',
      valueType: 'text',
    },
    {
      title: '用户名',
      dataIndex: 'userName',
      valueType: 'text',
    },
    {
      title: '学号',
      dataIndex: 'studentId',
      valueType: 'text',
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      valueType: 'text',
    },
    {
      title: '性别',
      dataIndex: 'gender',
      valueEnum: {
        0: { text: '保密' },
        1: { text: '男' },
        2: { text: '女' },
      },
      hideInSearch: true,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      valueType: 'text',
      hideInSearch: true,
    },
    {
      title: '学院',
      dataIndex: 'college',
      valueType: 'text',
    },
    {
      title: '专业',
      dataIndex: 'major',
      valueType: 'text',
    },
    {
      title: '入学年份',
      dataIndex: 'enrollmentYear',
      valueType: 'text',
      hideInSearch: true,
    },
    {
      title: '头像',
      dataIndex: 'userAvatar',
      valueType: 'image',
      fieldProps: {
        width: 64,
      },
      hideInSearch: true,
    },
    {
      title: '简介',
      dataIndex: 'userProfile',
      valueType: 'textarea',
      hideInSearch: true,
    },
    {
      title: '系统段位',
      dataIndex: 'userRole',
      valueEnum: {
        user: { text: '普通学生', status: 'Default' },
        admin: { text: '行政超级首长', status: 'Success' },
        ban: { text: '封禁区 (黑名单)', status: 'Error' },
      },
    },
    {
      title: '创建时间',
      sorter: true,
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInSearch: true,
      hideInForm: true,
    },
    {
      title: '更新时间',
      sorter: true,
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      hideInSearch: true,
      hideInForm: true,
    },
    {
      title: '行政干涉',
      dataIndex: 'option',
      valueType: 'option',
      width: 320,
      render: (_, record) => (
        <Space size="middle" wrap>
          {record.userRole === 'ban' ? (
            <Popconfirm title="确认释放此人离开隔离区？" onConfirm={() => handleRoleChange(record, 'user')}>
              <Button size="small" style={{ color: '#52c41a', borderColor: '#52c41a' }}>解约黑名单</Button>
            </Popconfirm>
          ) : (
            <Popconfirm title="确认将其账号彻底封杀阻断登入？" onConfirm={() => handleRoleChange(record, 'ban')} placement="topRight">
              <Button size="small" danger>🚨 封号</Button>
            </Popconfirm>
          )}

          {record.userRole !== 'admin' ? (
            <Popconfirm title="警告：您将直接交出高频权限，确定提拔吗？" onConfirm={() => handleRoleChange(record, 'admin')}>
              <Button size="small" type="dashed" style={{ color: '#722ed1', borderColor: '#722ed1' }}>👑 提权为管理</Button>
            </Popconfirm>
          ) : (
            <Popconfirm title="确认剥夺该首长的行政高压权限？" onConfirm={() => handleRoleChange(record, 'user')}>
              <Button size="small" type="dashed" danger>📉 剥夺权柄</Button>
            </Popconfirm>
          )}

          <Popconfirm title="确认强洗其安全词条？将变回 12345678" onConfirm={() => handleResetPwd(record)}>
            <Typography.Link type="danger">🔑 重洗密码</Typography.Link>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  return (
    <PageContainer>
      <ProTable<API.User>
        headerTitle={'黑白档案 / 人员调度池'}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              setCreateModalVisible(true);
            }}
          >
            <PlusOutlined /> 新建
          </Button>,
        ]}
        request={async (params, sort, filter) => {
          const sortField = Object.keys(sort)?.[0];
          const sortOrder = sort?.[sortField] ?? undefined;

          const { data, code } = await listUserByPageUsingPost({
            ...params,
            sortField,
            sortOrder,
            ...filter,
          } as API.UserQueryRequest);

          return {
            success: code === 0,
            data: data?.records || [],
            total: Number(data?.total) || 0,
          };
        }}
        columns={columns}
      />

      <CreateModal
        visible={createModalVisible}
        columns={columns}
        onSubmit={() => {
          setCreateModalVisible(false);
          actionRef.current?.reload();
        }}
        onCancel={() => setCreateModalVisible(false)}
      />
    </PageContainer>
  );
};
export default UserAdminPage;
