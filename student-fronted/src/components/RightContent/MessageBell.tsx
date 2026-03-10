import { BellOutlined, CheckCircleOutlined, MessageOutlined } from '@ant-design/icons';
import { request, history, useModel } from '@umijs/max';
import { Badge, Button, Drawer, List, Typography, message } from 'antd';
import React, { useEffect, useState } from 'react';

const { Text } = Typography;

export const MessageBell: React.FC = () => {
    const { initialState } = useModel('@@initialState');
    const currentUser = initialState?.currentUser;

    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    // 获取未读数量
    const fetchUnreadCount = async () => {
        if (!currentUser) return;
        try {
            const res: any = await request('/api/message/unreadCount');
            if (res.code === 0) {
                setUnreadCount(res.data);
            }
        } catch { }
    };

    // 获取弹框列表
    const loadMessages = async (p = 1) => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const res: any = await request('/api/message/list/page', {
                params: { current: p, pageSize: 15 },
            });
            if (res.code === 0) {
                const records = res.data?.records || [];
                if (p === 1) {
                    setMessages(records);
                } else {
                    setMessages((prev) => [...prev, ...records]);
                }
                setHasMore(records.length === 15);
                setPage(p);
            }
        } catch { }
        setLoading(false);
    };

    // 初始化轮询
    useEffect(() => {
        fetchUnreadCount();
        const timer = setInterval(fetchUnreadCount, 30000); // 30秒轮询
        return () => clearInterval(timer);
    }, [currentUser]);

    // 打开抽屉
    const openDrawer = () => {
        setDrawerVisible(true);
        loadMessages(1);
    };

    // 标记标为已读并跳转
    const handleRead = async (msg: any) => {
        if (msg.isRead === 0) {
            await request('/api/message/read', { method: 'POST', data: { id: msg.id } });
            setUnreadCount((c) => Math.max(0, c - 1));
            setMessages((prev) =>
                prev.map((m) => (m.id === msg.id ? { ...m, isRead: 1 } : m)),
            );
        }
        setDrawerVisible(false);
        if (msg.relatedId) {
            if (['CLUB_REVIEW', 'JOIN_REVIEW', 'ROLE_CHANGE', 'TRANSFER_LEADER'].includes(msg.type)) {
                history.push(`/club/detail/${msg.relatedId}`);
            } else {
                history.push(`/post/detail/${msg.relatedId}`);
            }
        }
    };

    // 全部已读
    const handleReadAll = async () => {
        try {
            await request('/api/message/readAll', { method: 'POST' });
            setUnreadCount(0);
            setMessages((prev) => prev.map((m) => ({ ...m, isRead: 1 })));
            message.success('已全部标为已读');
        } catch { }
    };

    if (!currentUser) return null;

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '0 8px' }} onClick={openDrawer}>
                <Badge count={unreadCount} overflowCount={99}>
                    <BellOutlined style={{ fontSize: 18 }} />
                </Badge>
            </div>

            <Drawer
                title="我的消息"
                placement="right"
                width={400}
                onClose={() => setDrawerVisible(false)}
                open={drawerVisible}
                extra={
                    <Button type="link" size="small" onClick={handleReadAll} disabled={unreadCount === 0}>
                        全部已读
                    </Button>
                }
            >
                <List
                    loading={loading && page === 1}
                    dataSource={messages}
                    loadMore={
                        hasMore && !loading ? (
                            <div style={{ textAlign: 'center', marginTop: 12 }}>
                                <Button size="small" onClick={() => loadMessages(page + 1)}>加载更多</Button>
                            </div>
                        ) : null
                    }
                    renderItem={(item) => (
                        <List.Item
                            onClick={() => handleRead(item)}
                            style={{
                                cursor: 'pointer',
                                background: item.isRead === 0 ? '#f0f5ff' : 'transparent',
                                borderRadius: 4,
                                padding: '12px 16px',
                                marginBottom: 8,
                                border: '1px solid #f0f0f0',
                                opacity: item.isRead === 0 ? 1 : 0.6,
                                transition: 'all 0.3s'
                            }}
                        >
                            <List.Item.Meta
                                avatar={<MessageOutlined style={{ fontSize: 20, color: '#1677ff', marginTop: 4 }} />}
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text strong>{item.title}</Text>
                                        {item.isRead === 1 && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                    </div>
                                }
                                description={
                                    <div>
                                        <div style={{ marginTop: 4, color: '#666' }}>{item.content}</div>
                                        <div style={{ marginTop: 8, fontSize: 12, color: '#aaa' }}>
                                            {new Date(item.createTime).toLocaleString()}
                                        </div>
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
                <div style={{ textAlign: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
                    <Button type="link" onClick={() => { setDrawerVisible(false); history.push('/message'); }}>
                        查看全部消息记录 ➔
                    </Button>
                </div>
            </Drawer>
        </>
    );
};
