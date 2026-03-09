import {
    getActivityVOByIdUsingGet,
    listActivitySignupsUsingGet,
    signupActivityUsingPost,
    cancelSignupUsingPost
} from '@/services/backend/activityController';
import { PageContainer } from '@ant-design/pro-components';
import { history, useModel, useParams } from '@umijs/max';
import {
    Avatar,
    Button,
    Card,
    Col,
    Descriptions,
    Empty,
    List,
    message,
    Popconfirm,
    Row,
    Skeleton,
    Space,
    Tag,
    Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';

const { Title, Paragraph, Text } = Typography;

const statusConfig: Record<number, { label: string; color: string; bg: string }> = {
    0: { label: '报名中', color: 'green', bg: '#f6ffed' },
    1: { label: '进行中', color: 'blue', bg: '#e6f4ff' },
    2: { label: '已结束', color: 'default', bg: '#f5f5f5' },
    3: { label: '已取消', color: 'red', bg: '#fff1f0' },
};

const ActivityDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { initialState } = useModel('@@initialState');
    const loginUser = initialState?.currentUser;
    const isLogin = !!loginUser;

    const [activity, setActivity] = useState<API.ActivityVO>();
    const [loading, setLoading] = useState(true);
    // 报名人员名单（受权限控制）
    const [signups, setSignups] = useState<Record<string, any>[]>([]);
    const [signupLoading, setSignupLoading] = useState(false);
    const [hasAuth, setHasAuth] = useState(false);

    // 获取活动详情与权限嗅探
    const fetchDetail = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await getActivityVOByIdUsingGet({ id });
            const act = res.data;
            if (act) {
                setActivity(act);
                // 简单的本地权限嗅探，判断是否尝试拉取名单
                // 此处后端也有拦截，即使提前发请求也不会泄漏数据
                let auth = false;
                if (loginUser?.userRole === 'admin') auth = true;
                if (act.user?.id === loginUser?.id) auth = true;
                setHasAuth(auth);
                // 如果后端允许，顺便去拉一下名单，没权限会报错，忽略即可
                fetchSignups(act.id?.toString() || id);
            }
        } catch (e: any) {
            message.error(`加载活动详情失败: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchSignups = async (actId: string) => {
        setSignupLoading(true);
        try {
            const res = await listActivitySignupsUsingGet({ activityId: actId });
            // 如果后端拦截了，会在这里跑 throw，然后被 catch 跳过
            setSignups(res.data || []);
            setHasAuth(true); // 如果能正常拉回来，说明有真实权限
        } catch (e: any) {
            // 没有权限获取报名名单的正常用户不需特殊处理报错
        } finally {
            setSignupLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const handleSignup = async () => {
        if (!isLogin) { message.warning('请先登录再报名！'); return; }
        try {
            await signupActivityUsingPost({ activityId: id! });
            message.success('报名成功！');
            fetchDetail(); // 刷新页面状态
        } catch (e: any) {
            message.error(`报名失败：${e.message}`);
        }
    };

    const handleCancelSignup = async () => {
        if (!isLogin) { message.warning('请先登录再操作！'); return; }
        try {
            await cancelSignupUsingPost({ activityId: id! });
            message.success('已取消报名！');
            fetchDetail();
        } catch (e: any) {
            message.error(`操作失败：${e.message}`);
        }
    };

    // UI 构建区
    if (loading || !activity) {
        return <PageContainer title="活动详情加载中..."><Skeleton active avatar paragraph={{ rows: 6 }} /></PageContainer>;
    }

    const cfg = statusConfig[activity.status ?? 0] ?? statusConfig[0];

    return (
        <PageContainer
            title={
                <Space>
                    <span style={{ cursor: 'pointer' }} onClick={() => history.back()}>🔙 返回</span>
                    <span>|</span>
                    <span>活动详情</span>
                </Space>
            }
        >
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    {/* 左侧主要活动信息 */}
                    <Card style={{ borderRadius: 12, marginBottom: 24, padding: 12 }} bordered={false} hoverable>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <Title level={2} style={{ marginTop: 0, marginBottom: 12 }}>
                                    {activity.title}
                                </Title>
                                <Space>
                                    {activity.category && <Tag color="blue">{activity.category}</Tag>}
                                    <Tag color={cfg.color}>{cfg.label}</Tag>
                                </Space>
                            </div>

                            <Paragraph style={{ fontSize: 16, color: '#555', marginBottom: 24, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                                {activity.description || '暂无详细介绍'}
                            </Paragraph>

                            <Descriptions column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} layout="vertical" bordered size="small" style={{ marginBottom: 24 }}>
                                <Descriptions.Item label="举办社团">{activity.clubName || '系统 / 个人 公开活动'}</Descriptions.Item>
                                <Descriptions.Item label="活动地点">{activity.location || '线上 / 待定'}</Descriptions.Item>
                                <Descriptions.Item label="活动开始">{activity.startTime ? new Date(activity.startTime).toLocaleString() : '未定'}</Descriptions.Item>
                                <Descriptions.Item label="活动结束">{activity.endTime ? new Date(activity.endTime).toLocaleString() : '未定'}</Descriptions.Item>
                                <Descriptions.Item label="报名开始">{activity.signupStart ? new Date(activity.signupStart).toLocaleString() : '随时可报'}</Descriptions.Item>
                                <Descriptions.Item label="报名截止">{activity.signupEnd ? new Date(activity.signupEnd).toLocaleString() : '随时可报'}</Descriptions.Item>
                                <Descriptions.Item label="名额限制">
                                    {activity.maxSignup && activity.maxSignup > 0 ? (
                                        <Text type={activity.signupCount! >= activity.maxSignup ? 'danger' : 'success'}>
                                            <b>{activity.signupCount ?? 0}</b> / {activity.maxSignup} 人
                                        </Text>
                                    ) : (
                                        <Text type="success">不限名额 (已报 {activity.signupCount ?? 0} 人)</Text>
                                    )}
                                </Descriptions.Item>
                                <Descriptions.Item label="发布人" span={2}>
                                    <Space>
                                        <Avatar src={activity.user?.userAvatar} style={{ background: '#f56a00' }}>
                                            {activity.user?.userName?.[0]}
                                        </Avatar>
                                        <Text strong>{activity.user?.userName || '未知发布者'}</Text>
                                    </Space>
                                </Descriptions.Item>
                            </Descriptions>

                            <div style={{ textAlign: 'center' }}>
                                {activity.signed ? (
                                    <Popconfirm title="确定要取消报名吗？" onConfirm={handleCancelSignup}>
                                        <Button type="primary" size="large" style={{ background: '#52c41a', borderColor: '#52c41a', padding: '0 40px', borderRadius: 8 }}>
                                            ✅ 已报名成功 (点击取消)
                                        </Button>
                                    </Popconfirm>
                                ) : (
                                    <Button type="primary" size="large" onClick={handleSignup}
                                        disabled={activity.status !== 0 || (activity.maxSignup! > 0 && activity.signupCount! >= activity.maxSignup!)}
                                        style={{ padding: '0 50px', borderRadius: 8 }}>
                                        {activity.status !== 0 ? '不可报名' : (activity.maxSignup! > 0 && activity.signupCount! >= activity.maxSignup! ? '名额已满' : '立即报名')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    {/* 右侧参与人员看板 - 只对有权限的人显示 */}
                    {hasAuth ? (
                        <Card
                            title="🎫 报名人员名单 (管理者可见)"
                            extra={
                                <Button
                                    type="primary"
                                    size="small"
                                    onClick={() => window.open(`/api/activity/signup/export?activityId=${id}`)}
                                    disabled={signups.length === 0}
                                >
                                    ⬇️ 导出 Excel
                                </Button>
                            }
                            style={{ borderRadius: 12, height: '100%' }}
                            bordered={false}
                            bodyStyle={{ padding: 12 }}
                        >
                            {signupLoading ? (
                                <Skeleton active />
                            ) : signups.length === 0 ? (
                                <Empty description="暂无人员报名" />
                            ) : (
                                <List
                                    itemLayout="horizontal"
                                    dataSource={signups}
                                    renderItem={(item) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={<Avatar src={item.userAvatar}>{item.userName?.[0]}</Avatar>}
                                                title={item.userName || '未知用户'}
                                                description={`报名时间：${new Date(item.signupTime).toLocaleString()}`}
                                            />
                                        </List.Item>
                                    )}
                                />
                            )}
                        </Card>
                    ) : (
                        <Card style={{ borderRadius: 12 }} bordered={false}>
                            <Empty description="报名人员信息不对外公开" />
                        </Card>
                    )}
                </Col>
            </Row>
        </PageContainer>
    );
};

export default ActivityDetail;
