import { request, useModel, useParams, history } from '@umijs/max';
import {
    Avatar,
    Button,
    Card,
    Divider,
    Form,
    Image,
    Input,
    List,
    message,
    Modal,
    Select,
    Skeleton,
    Space,
    Tag,
    Typography,
} from 'antd';
import {
    HeartOutlined, HeartFilled,
    StarOutlined, StarFilled,
    ArrowLeftOutlined, EditOutlined,
    DeleteOutlined, UserOutlined,
    ClockCircleOutlined, CommentOutlined,
    SendOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import React, { useEffect, useState, useCallback } from 'react';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const PRESET_TAGS = ['技术', '生活', '学习', '活动', '校园', '求助', '分享', '公告'];

/** 解析正文：拆出纯文字和图片 URL 列表 */
const parseContent = (raw: string = '') => {
    const imgMatch = raw.match(/\[images\]([\s\S]*?)\[\/images\]/);
    const images: string[] = imgMatch ? imgMatch[1].split(',').map(u => u.trim()).filter(Boolean) : [];
    const text = raw.replace(/\[images\][\s\S]*?\[\/images\]/g, '').trimEnd();
    return { text, images };
};


const PostDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { initialState } = useModel('@@initialState');
    const currentUser = initialState?.currentUser;

    const [post, setPost] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [thumbed, setThumbed] = useState(false);
    const [thumbCount, setThumbCount] = useState(0);
    const [favoured, setFavoured] = useState(false);
    const [favourCount, setFavourCount] = useState(0);
    const [actionLoading, setActionLoading] = useState(false);

    // 编辑弹窗
    const [editOpen, setEditOpen] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [editForm] = Form.useForm();

    // 评论
    const [comments, setComments] = useState<any[]>([]);
    const [commentTotal, setCommentTotal] = useState(0);
    const [commentPage, setCommentPage] = useState(1);
    const [commentLoading, setCommentLoading] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);
    const COMMENT_PAGE_SIZE = 20;

    /** 加载帖子详情 */
    const fetchPost = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res: any = await request(`/api/post/get/vo?id=${id}`, { method: 'GET' });
            const data = res?.data;
            setPost(data);
            setThumbed(data?.hasThumb || false);
            setThumbCount(data?.thumbNum || 0);
            setFavoured(data?.hasFavour || false);
            setFavourCount(data?.favourNum || 0);
        } catch {
            message.error('帖子不存在或已删除');
        }
        setLoading(false);
    }, [id]);

    /** 加载评论 */
    const fetchComments = useCallback(async (page = 1) => {
        if (!id) return;
        setCommentLoading(true);
        try {
            const res: any = await request(`/api/post_comment/list?postId=${id}&current=${page}&pageSize=${COMMENT_PAGE_SIZE}`, {
                method: 'GET',
            });
            setComments(res?.data?.records || []);
            setCommentTotal(Number(res?.data?.total) || 0);
        } catch {
            // 静默失败
        }
        setCommentLoading(false);
    }, [id]);

    useEffect(() => {
        fetchPost();
        fetchComments(1);
    }, [id]);

    /** 点赞 */
    const doThumb = async () => {
        if (!currentUser) return message.warning('请先登录');
        if (actionLoading) return;
        setActionLoading(true);
        try {
            const res: any = await request('/api/post_thumb/', { method: 'POST', data: { postId: id } });
            const change = res?.data ?? 0;
            setThumbed(change > 0);
            setThumbCount((c) => c + change);
        } catch { message.error('操作失败'); }
        setActionLoading(false);
    };

    /** 收藏 */
    const doFavour = async () => {
        if (!currentUser) return message.warning('请先登录');
        if (actionLoading) return;
        setActionLoading(true);
        try {
            const res: any = await request('/api/post_favour/', { method: 'POST', data: { postId: id } });
            const change = res?.data ?? 0;
            setFavoured(change > 0);
            setFavourCount((c) => c + change);
        } catch { message.error('操作失败'); }
        setActionLoading(false);
    };

    /** 提交评论 */
    const submitComment = async () => {
        if (!currentUser) return message.warning('请先登录后再评论');
        const text = commentText.trim();
        if (!text) return message.warning('评论内容不能为空');
        if (text.length > 500) return message.warning('评论最多500字');
        setSubmittingComment(true);
        try {
            await request('/api/post_comment/add', {
                method: 'POST',
                data: { postId: id, content: text },
            });
            message.success('评论成功！');
            setCommentText('');
            fetchComments(1);
            setCommentPage(1);
        } catch (err: any) {
            message.error('评论失败：' + (err?.message || '未知错误'));
        }
        setSubmittingComment(false);
    };

    /** 删除评论 */
    const deleteComment = (commentId: number) => {
        Modal.confirm({
            title: '确认删除该评论？',
            okText: '删除',
            okType: 'danger',
            onOk: async () => {
                await request('/api/post_comment/delete', { method: 'POST', data: { id: commentId } });
                message.success('已删除');
                fetchComments(commentPage);
            },
        });
    };

    /** 编辑帖子 */
    const handleEdit = async () => {
        try {
            const values = await editForm.validateFields();
            setEditLoading(true);
            await request('/api/post/edit', {
                method: 'POST',
                data: { id, title: values.title, content: values.content, tags: values.tags || [] },
            });
            message.success('编辑成功');
            setEditOpen(false);
            fetchPost();
        } catch (err: any) {
            if (!err?.errorFields) message.error('编辑失败');
        }
        setEditLoading(false);
    };

    const handleDelete = () => {
        Modal.confirm({
            title: '确认删除？',
            content: '删除后不可恢复',
            okText: '删除',
            okType: 'danger',
            onOk: async () => {
                await request('/api/post/delete', { method: 'POST', data: { id: Number(id) } });
                message.success('已删除');
                history.replace('/post');
            },
        });
    };

    const isOwner = currentUser && post && String(currentUser.id) === String(post.userId);

    return (
        <PageContainer title={false} style={{ maxWidth: 860, margin: '0 auto' }}>
            <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => history.replace('/post')} style={{ marginBottom: 16 }}>
                返回社群广场
            </Button>

            {/* ── 帖子主体 ── */}
            {loading ? (
                <Card style={{ borderRadius: 14 }}><Skeleton active paragraph={{ rows: 10 }} /></Card>
            ) : !post ? (
                <Card style={{ borderRadius: 14, textAlign: 'center', padding: 40 }}>
                    <Text type="secondary">帖子不存在或已被删除</Text>
                </Card>
            ) : (
                <Card style={{ borderRadius: 14 }} bodyStyle={{ padding: '32px 36px' }}>
                    {/* 标签 */}
                    <div style={{ marginBottom: 12 }}>
                        {(post.tagList || []).map((tag: string) => (
                            <Tag key={tag} color="blue" style={{ marginBottom: 4 }}>{tag}</Tag>
                        ))}
                    </div>

                    {/* 标题 */}
                    <Title level={3} style={{ marginBottom: 16 }}>{post.title}</Title>

                    {/* 作者行 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                        <Avatar src={post.user?.userAvatar} icon={<UserOutlined />} />
                        <Text strong>{post.user?.userName || '匿名用户'}</Text>
                        <ClockCircleOutlined style={{ marginLeft: 8, color: '#bbb' }} />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            {post.createTime ? new Date(post.createTime).toLocaleString() : ''}
                        </Text>
                        {isOwner && (
                            <Space style={{ marginLeft: 'auto' }}>
                                <Button size="small" icon={<EditOutlined />}
                                    onClick={() => {
                                        editForm.setFieldsValue({ title: post.title, content: post.content, tags: post.tagList || [] });
                                        setEditOpen(true);
                                    }}>编辑</Button>
                                <Button size="small" danger icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
                            </Space>
                        )}
                    </div>

                    <Divider style={{ margin: '0 0 24px' }} />

                    {/* 正文 */}
                    {(() => {
                        const { text, images } = parseContent(post.content);
                        return (
                            <>
                                <div style={{ fontSize: 15, lineHeight: 1.85, whiteSpace: 'pre-wrap', color: '#333', minHeight: 80, marginBottom: images.length > 0 ? 20 : 32 }}>
                                    {text}
                                </div>
                                {images.length > 0 && (
                                    <Image.PreviewGroup>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
                                            {images.map((url, i) => (
                                                <Image
                                                    key={i}
                                                    src={url}
                                                    width={160}
                                                    height={120}
                                                    style={{ objectFit: 'cover', borderRadius: 8, border: '1px solid #f0f0f0', cursor: 'pointer' }}
                                                />
                                            ))}
                                        </div>
                                    </Image.PreviewGroup>
                                )}
                            </>
                        );
                    })()}

                    <Divider />

                    {/* 点赞 & 收藏 */}
                    <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 8 }}>
                        <Button size="large" shape="round"
                            icon={thumbed ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                            onClick={doThumb} loading={actionLoading}
                            style={thumbed ? { color: '#ff4d4f', borderColor: '#ff4d4f' } : {}}>
                            {thumbed ? '已点赞' : '点赞'}{thumbCount > 0 ? ` (${thumbCount})` : ''}
                        </Button>
                        <Button size="large" shape="round"
                            icon={favoured ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                            onClick={doFavour} loading={actionLoading}
                            style={favoured ? { color: '#faad14', borderColor: '#faad14' } : {}}>
                            {favoured ? '已收藏' : '收藏'}{favourCount > 0 ? ` (${favourCount})` : ''}
                        </Button>
                    </div>
                </Card>
            )}

            {/* ── 评论区 ── */}
            {!loading && post && (
                <Card
                    style={{ borderRadius: 14, marginTop: 16 }}
                    bodyStyle={{ padding: '24px 32px' }}
                    title={
                        <span>
                            <CommentOutlined style={{ marginRight: 8 }} />
                            评论 ({commentTotal})
                        </span>
                    }
                >
                    {/* 发表评论输入框 */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-start' }}>
                        <Avatar
                            src={currentUser?.userAvatar}
                            icon={<UserOutlined />}
                            style={{ flexShrink: 0, marginTop: 4 }}
                        />
                        <div style={{ flex: 1 }}>
                            <TextArea
                                placeholder={currentUser ? '写下你的评论…（最多 500 字）' : '登录后才能评论'}
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                autoSize={{ minRows: 2, maxRows: 5 }}
                                maxLength={500}
                                showCount
                                disabled={!currentUser}
                            />
                            <div style={{ textAlign: 'right', marginTop: 8 }}>
                                <Button
                                    type="primary"
                                    icon={<SendOutlined />}
                                    loading={submittingComment}
                                    onClick={submitComment}
                                    disabled={!currentUser || !commentText.trim()}
                                >
                                    发表评论
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Divider style={{ margin: '0 0 16px' }} />

                    {/* 评论列表 */}
                    <List
                        loading={commentLoading}
                        dataSource={comments}
                        locale={{ emptyText: '暂无评论，来发表第一条评论吧！' }}
                        pagination={commentTotal > COMMENT_PAGE_SIZE ? {
                            current: commentPage,
                            pageSize: COMMENT_PAGE_SIZE,
                            total: commentTotal,
                            size: 'small',
                            onChange: (p) => { setCommentPage(p); fetchComments(p); },
                        } : false}
                        renderItem={(item: any) => (
                            <List.Item
                                key={item.id}
                                style={{ alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px solid #f5f5f5' }}
                                actions={
                                    (currentUser && (String(currentUser.id) === String(item.userId) || currentUser.userRole === 'admin'))
                                        ? [
                                            <Button
                                                key="del"
                                                type="text"
                                                danger
                                                size="small"
                                                icon={<DeleteOutlined />}
                                                onClick={() => deleteComment(item.id)}
                                            >
                                                删除
                                            </Button>,
                                        ]
                                        : []
                                }
                            >
                                <List.Item.Meta
                                    avatar={<Avatar src={item.user?.userAvatar} icon={<UserOutlined />} />}
                                    title={
                                        <Space>
                                            <Text strong style={{ fontSize: 14 }}>{item.user?.userName || '匿名用户'}</Text>
                                            <Text type="secondary" style={{ fontSize: 12, fontWeight: 'normal' }}>
                                                {item.createTime ? new Date(item.createTime).toLocaleString() : ''}
                                            </Text>
                                        </Space>
                                    }
                                    description={
                                        <span style={{ color: '#333', fontSize: 14, whiteSpace: 'pre-wrap' }}>
                                            {item.content}
                                        </span>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            )}

            {/* 编辑弹窗 */}
            <Modal title="编辑帖子" open={editOpen} onCancel={() => setEditOpen(false)}
                onOk={handleEdit} confirmLoading={editLoading} okText="保存" cancelText="取消" width={560} destroyOnClose>
                <Form form={editForm} layout="vertical" style={{ marginTop: 8 }}>
                    <Form.Item name="title" label="标题" rules={[{ required: true }, { max: 80 }]}>
                        <Input showCount maxLength={80} />
                    </Form.Item>
                    <Form.Item name="content" label="正文" rules={[{ required: true }]}>
                        <TextArea rows={8} showCount maxLength={2000} />
                    </Form.Item>
                    <Form.Item name="tags" label="标签">
                        <Select mode="tags" options={PRESET_TAGS.map((t) => ({ label: t, value: t }))} maxTagCount={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </PageContainer>
    );
};

export default PostDetailPage;
