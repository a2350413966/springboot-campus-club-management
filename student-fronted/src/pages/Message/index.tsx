import {
    getUnreadCountUsingGet,
    listUserMessagesUsingGet,
    readAllMessagesUsingPost,
    readMessageUsingPost,
} from '@/services/backend/messageController';
import { CheckOutlined, ClearOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Badge, Button, Card, Col, Empty, List, message, Popconfirm, Row, Spin, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { history, useModel } from '@umijs/max';

const { Text, Paragraph } = Typography;

export default function MessageCenter() {
    const { initialState, setInitialState } = useModel('@@initialState');
    const [messages, setMessages] = useState<API.Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [current, setCurrent] = useState(1);

    const fetchMessages = async (page = 1) => {
        setLoading(true);
        try {
            const res = await listUserMessagesUsingGet({ current: page, pageSize: 10 });
            setMessages(res.data?.records || []);
            setTotal(Number(res.data?.total || 0));
        } catch (error: any) {
            message.error(`获取消息失败：${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const updateMessageContext = async () => {
        try {
            const res = await getUnreadCountUsingGet();
            if (initialState?.currentUser) {
                setInitialState({
                    ...initialState,
                    currentUser: {
                        ...initialState.currentUser,
                        unreadCount: Number(res.data || 0),
                    } as any, // assuming unreadCount is extended in current user or handled in Layout
                });
            }
        } catch { }
    };

    useEffect(() => {
        fetchMessages();
        updateMessageContext();
    }, []);

    const handleRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await readMessageUsingPost({ id });
            message.success('已标记为已读');
            fetchMessages(current);
            updateMessageContext();
        } catch (error: any) {
            message.error(`操作失败：${error.message}`);
        }
    };

    const handleReadAll = async () => {
        try {
            await readAllMessagesUsingPost();
            message.success('全部已读操作成功');
            fetchMessages(1);
            updateMessageContext();
        } catch (error: any) {
            message.error(`全部已读失败：${error.message}`);
        }
    };

    const handleMessageClick = (msg: API.Message) => {
        if (msg.isRead === 0) {
            readMessageUsingPost({ id: msg.id }).then(() => {
                fetchMessages(current);
                updateMessageContext();
            });
        }
        // 根据相关ID和消息类型，可以支持跳转：
        if (msg.relatedId) {
            if (['CLUB_REVIEW', 'JOIN_REVIEW', 'ROLE_CHANGE', 'TRANSFER_LEADER'].includes(msg.type || '')) {
                history.push(`/club/detail/${msg.relatedId}`);
            }
        }
    };

    const getTagColor = (type?: string) => {
        switch (type) {
            case 'CLUB_REVIEW':
            case 'JOIN_REVIEW':
                return 'blue';
            case 'ROLE_CHANGE':
            case 'TRANSFER_LEADER':
                return 'magenta';
            default:
                return 'default';
        }
    };

    return (
        <PageContainer
            title="消息中心"
            subTitle="掌握您的所有动态通知"
            extra={[
                <Popconfirm key="readAll" title="确定要将所有消息标为已读吗？" onConfirm={handleReadAll}>
                    <Button icon={<ClearOutlined />} type="default">
                        全部已读
                    </Button>
                </Popconfirm>,
            ]}
        >
            <Card
                style={{ borderRadius: 14, minHeight: 500 }}
                bodyStyle={{ padding: '0 24px' }}
            >
                <List
                    loading={loading}
                    itemLayout="horizontal"
                    dataSource={messages}
                    pagination={{
                        current,
                        pageSize: 10,
                        total,
                        onChange: (page) => {
                            setCurrent(page);
                            fetchMessages(page);
                        },
                        showSizeChanger: false,
                        style: { padding: '24px 0', textAlign: 'center' }
                    }}
                    locale={{ emptyText: <Empty description="暂无消息记录" /> }}
                    renderItem={(item) => (
                        <List.Item
                            onClick={() => handleMessageClick(item)}
                            actions={[
                                item.isRead === 0 ? (
                                    <Button
                                        type="link"
                                        size="small"
                                        onClick={(e) => handleRead(item.id!, e)}
                                        icon={<CheckOutlined />}
                                    >
                                        标为已读
                                    </Button>
                                ) : (
                                    <Text type="secondary" style={{ fontSize: 12 }}>已读</Text>
                                )
                            ]}
                            style={{
                                cursor: item.relatedId ? 'pointer' : 'default',
                                padding: '20px 0',
                                opacity: item.isRead === 1 ? 0.6 : 1,
                                transition: 'all 0.3s'
                            }}
                        >
                            <List.Item.Meta
                                title={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        {item.isRead === 0 && <Badge status="processing" />}
                                        <Text strong style={{ fontSize: 16 }}>{item.title}</Text>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {new Date(item.createTime || '').toLocaleString()}
                                        </Text>
                                    </div>
                                }
                                description={
                                    <Paragraph style={{ margin: 0, color: '#666' }}>
                                        {item.content}
                                    </Paragraph>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Card>
        </PageContainer>
    );
}
