import { request } from '@umijs/max';
import { ActionType, PageContainer, ProColumns, ProTable } from '@ant-design/pro-components';
import { Avatar, Button, message, Modal, Space, Tag, Tooltip, Typography } from 'antd';
import {
    EyeOutlined,
    DeleteOutlined,
    HeartFilled,
    StarFilled,
    UserOutlined,
} from '@ant-design/icons';
import React, { useRef } from 'react';

const { Text, Paragraph } = Typography;

/** 剔除正文中的图片标记 */
const stripImages = (raw: string = '') =>
    raw.replace(/\[images\][\s\S]*?\[\/images\]/g, '').trim();

const AdminPostPage: React.FC = () => {
    const actionRef = useRef<ActionType>();

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: '确认删除此帖子？',
            content: '删除后不可恢复',
            okText: '删除',
            okType: 'danger',
            onOk: async () => {
                try {
                    await request('/api/post/delete', { method: 'POST', data: { id } });
                    message.success('已删除');
                    actionRef.current?.reload();
                } catch {
                    message.error('删除失败');
                }
            },
        });
    };

    const columns: ProColumns<any>[] = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 80,
            copyable: true,
            hideInSearch: true,
        },
        {
            title: '标题',
            dataIndex: 'title',
            ellipsis: true,
            width: 220,
            render: (val, record) => (
                <a href={`/post/detail/${record.id}`} target="_blank" rel="noreferrer">
                    {val}
                </a>
            ),
        },
        {
            title: '内容摘要',
            dataIndex: 'content',
            hideInSearch: true,
            ellipsis: true,
            width: 260,
            render: (_, record) => (
                <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, color: '#666', fontSize: 13 }}>
                    {stripImages(record.content)}
                </Paragraph>
            ),
        },
        {
            title: '标签',
            dataIndex: 'tags',
            hideInSearch: true,
            width: 160,
            render: (_, record) =>
                (record.tagList || []).map((t: string) => (
                    <Tag key={t} color="blue" style={{ marginBottom: 4 }}>
                        {t}
                    </Tag>
                )),
        },
        {
            title: '发帖人',
            dataIndex: 'userId',
            width: 180,
            render: (_, record) => {
                const u = record.user;
                const name = u?.realName || u?.userName || String(record.userId);
                const sid = u?.studentId;
                return (
                    <Space align="start">
                        <Avatar size={28} src={u?.userAvatar} icon={<UserOutlined />} />
                        <div style={{ lineHeight: 1.4 }}>
                            <Text style={{ fontSize: 13, display: 'block' }}>{name}</Text>
                            {sid && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    学号：{sid}
                                </Text>
                            )}
                        </div>
                    </Space>
                );
            },
        },
        {
            title: '点赞 / 收藏',
            dataIndex: 'thumbNum',
            hideInSearch: true,
            width: 120,
            render: (_, record) => (
                <Space>
                    <Text style={{ fontSize: 13 }}>
                        <HeartFilled style={{ color: '#ff4d4f', marginRight: 4 }} />
                        {record.thumbNum || 0}
                    </Text>
                    <Text style={{ fontSize: 13 }}>
                        <StarFilled style={{ color: '#faad14', marginRight: 4 }} />
                        {record.favourNum || 0}
                    </Text>
                </Space>
            ),
        },
        {
            title: '发布时间',
            dataIndex: 'createTime',
            hideInSearch: true,
            valueType: 'dateTime',
            width: 160,
        },
        {
            title: '操作',
            dataIndex: 'option',
            valueType: 'option',
            width: 110,
            render: (_, record) => (
                <Space>
                    <Tooltip title="查看详情">
                        <Button
                            size="small"
                            type="link"
                            onClick={() => window.open(`/post/detail/${record.id}`, '_blank')}
                        >
                            查看
                        </Button>
                    </Tooltip>
                    <Tooltip title="删除">
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record.id)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <PageContainer title="📋 帖子管理">
            <ProTable<any>
                actionRef={actionRef}
                rowKey="id"
                columns={columns}
                search={{
                    labelWidth: 80,
                    defaultCollapsed: false,
                }}
                request={async (params) => {
                    const { title, current, pageSize } = params;
                    const res: any = await request('/api/post/list/page/vo', {
                        method: 'POST',
                        data: {
                            title: title || undefined,
                            current,
                            pageSize,
                            sortField: 'createTime',
                            sortOrder: 'descend',
                        },
                    });
                    return {
                        data: res?.data?.records || [],
                        total: Number(res?.data?.total) || 0,
                        success: true,
                    };
                }}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                scroll={{ x: 1100 }}
                cardProps={{ style: { borderRadius: 14 } }}
            />
        </PageContainer>
    );
};

export default AdminPostPage;
