import { request, useModel, history } from '@umijs/max';
import { uploadFileUsingPost } from '@/services/backend/fileController';
import {
    Alert,
    Avatar,
    Button,
    Card,
    Collapse,
    Col,
    Empty,
    Form,
    Image,
    Input,
    message,
    Modal,
    Pagination,
    Row,
    Select,
    Space,
    Spin,
    Tag,
    Typography,
    Upload,
} from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import {
    HeartOutlined,
    HeartFilled,
    StarOutlined,
    StarFilled,
    PlusOutlined,
    SearchOutlined,
    EditOutlined,
    UserOutlined,
    ClockCircleOutlined,
    DownOutlined,
    PictureOutlined,
    PhoneOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import React, { useEffect, useState } from 'react';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const PRESET_TAGS = ['二手闲置', '打听求助', '恋爱交友', '校园趣事', '兼职招聘', '校园招聘'];

const PostPage: React.FC = () => {
    const { initialState } = useModel('@@initialState');
    const currentUser = initialState?.currentUser;

    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [current, setCurrent] = useState(1);
    const [pageSize] = useState(12);

    // 搜索
    const [searchTitle, setSearchTitle] = useState('');
    const [searchTag, setSearchTag] = useState<string | undefined>(undefined);

    // 发帖弹窗
    const [createOpen, setCreateOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [form] = Form.useForm();
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);

    const fetchPosts = async (page = 1, title = searchTitle, tag = searchTag) => {
        setLoading(true);
        try {
            const res: any = await request('/api/post/list/page/vo', {
                method: 'POST',
                data: {
                    current: page,
                    pageSize,
                    title: title || undefined,
                    tags: tag ? [tag] : undefined,
                    sortField: 'createTime',
                    sortOrder: 'descend',
                },
            });
            setPosts(res?.data?.records || []);
            setTotal(Number(res?.data?.total) || 0);
        } catch {
            message.error('加载帖子失败');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts(current);
    }, [current]);

    const handleSearch = () => {
        setCurrent(1);
        fetchPosts(1, searchTitle, searchTag);
    };

    const handleCreate = async () => {
        try {
            const values = await form.validateFields();
            setCreateLoading(true);
            // 拼装联系方式
            let extra = '';
            const { contactName, contactPhone, contactQQ, contactWechat } = values;
            const contacts = [
                contactName && `联系人：${contactName}`,
                contactPhone && `手机：${contactPhone}`,
                contactQQ && `QQ：${contactQQ}`,
                contactWechat && `微信：${contactWechat}`,
            ].filter(Boolean);
            if (contacts.length > 0) extra += `\n\n📞 联系方式\n${contacts.join('　')}`;
            // 拼装图片（存为 URL 列表，后端原样保存在 content 末尾）
            if (uploadedImages.length > 0) {
                extra += `\n\n[images]${uploadedImages.join(',')}[/images]`;
            }
            await request('/api/post/add', {
                method: 'POST',
                data: {
                    title: values.title,
                    content: values.content + extra,
                    tags: values.tag ? [values.tag] : [],
                },
            });
            message.success('发帖成功！');
            form.resetFields();
            setUploadedImages([]);
            setImageFileList([]);
            setContactOpen(false);
            setCreateOpen(false);
            fetchPosts(1);
        } catch (err: any) {
            if (err?.errorFields) return;
            message.error('发帖失败：' + (err.message || '未知错误'));
        }
        setCreateLoading(false);
    };

    /** 图片自定义上传（走 COS） */
    const handleImageUpload: UploadProps['customRequest'] = async (options) => {
        setUploadingImage(true);
        try {
            const res: any = await uploadFileUsingPost({ biz: 'post_image' }, {}, options.file as File);
            const url = res?.data;
            if (url) {
                setUploadedImages((prev) => [...prev, url]);
                options.onSuccess?.(url);
            } else {
                options.onError?.(new Error('上传失败'));
                message.error('图片上传失败');
            }
        } catch {
            options.onError?.(new Error('上传失败'));
            message.error('图片上传失败');
        }
        setUploadingImage(false);
    };

    const handleImageRemove = (file: UploadFile) => {
        const url = file.response || file.url;
        setUploadedImages((prev) => prev.filter((u) => u !== url));
    };

    return (
        <PageContainer
            title="💬 社群广场"
            extra={
                currentUser && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
                        发帖
                    </Button>
                )
            }
        >
            {/* 搜索栏 */}
            <Card style={{ borderRadius: 12, marginBottom: 20 }} bodyStyle={{ padding: '16px 20px' }}>
                <Space wrap size={12}>
                    <Input
                        prefix={<SearchOutlined />}
                        placeholder="搜索帖子标题…"
                        value={searchTitle}
                        onChange={(e) => setSearchTitle(e.target.value)}
                        onPressEnter={handleSearch}
                        style={{ width: 260 }}
                        allowClear
                    />
                    <Select
                        placeholder="按标签筛选"
                        allowClear
                        value={searchTag}
                        onChange={(v) => setSearchTag(v)}
                        style={{ width: 160 }}
                        options={PRESET_TAGS.map((t) => ({ label: t, value: t }))}
                    />
                    <Button type="primary" onClick={handleSearch}>
                        查询
                    </Button>
                    <Button
                        onClick={() => {
                            history.push('/post/my');
                        }}
                    >
                        我的帖子
                    </Button>
                </Space>
            </Card>

            {/* 帖子列表 */}
            <Spin spinning={loading}>
                {posts.length === 0 && !loading ? (
                    <Empty description="暂无帖子，来发一篇吧！" style={{ marginTop: 80 }} />
                ) : (
                    <Row gutter={[16, 16]}>
                        {posts.map((post) => (
                            <Col xs={24} sm={12} lg={8} key={post.id}>
                                <PostCard post={post} onRefresh={() => fetchPosts(current)} currentUser={currentUser} />
                            </Col>
                        ))}
                    </Row>
                )}
            </Spin>

            {/* 分页 */}
            {total > pageSize && (
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                    <Pagination
                        current={current}
                        pageSize={pageSize}
                        total={total}
                        onChange={(p) => setCurrent(p)}
                        showTotal={(t) => `共 ${t} 篇帖子`}
                    />
                </div>
            )}

            {/* 发帖弹窗 */}
            <Modal
                title="✏️ 发布新帖"
                open={createOpen}
                onCancel={() => {
                    setCreateOpen(false);
                    setUploadedImages([]);
                    setImageFileList([]);
                    setContactOpen(false);
                }}
                onOk={handleCreate}
                confirmLoading={createLoading}
                okText="发布"
                cancelText="取消"
                width={600}
                destroyOnClose
                styles={{ body: { maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 } }}
            >
                <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: 8 }}
                    message="发帖须知"
                    description="禁止发布重复、违法违规、广告营销、含二维码等内容，违规将被删除处理。"
                />
                <Form form={form} layout="vertical">
                    {/* 标题 */}
                    <Form.Item
                        name="title"
                        label="标题"
                        extra="4~20 字，精准表述你的需求"
                        rules={[
                            { required: true, message: '请输入标题' },
                            { min: 4, message: '标题至少 4 个字' },
                            { max: 20, message: '标题最多 20 个字' },
                        ]}
                    >
                        <Input
                            placeholder="简洁描述你的需求，例如：收一辆二手自行车"
                            showCount
                            maxLength={20}
                        />
                    </Form.Item>

                    {/* 正文 */}
                    <Form.Item
                        name="content"
                        label="正文"
                        rules={[{ required: true, message: '请填写正文内容' }]}
                    >
                        <Input.TextArea
                            rows={6}
                            placeholder={`详细描述你的需求\n\n注意：\n· 禁止发布广告/营销内容\n· 禁止含二维码或外部链接\n· 禁止重复发布相同帖子`}
                            showCount
                            maxLength={2000}
                        />
                    </Form.Item>

                    {/* 图片上传 */}
                    <Form.Item label={<span><PictureOutlined style={{ marginRight: 6 }} />配图（最多 5 张）</span>}>
                        <Upload
                            listType="picture-card"
                            fileList={imageFileList}
                            customRequest={handleImageUpload}
                            onRemove={handleImageRemove}
                            onChange={({ fileList }) => setImageFileList(fileList)}
                            accept="image/*"
                            maxCount={5}
                            multiple
                        >
                            {imageFileList.length < 5 && (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <PlusOutlined />
                                    <span style={{ fontSize: 12 }}>{uploadingImage ? '上传中…' : '点击上传'}</span>
                                </div>
                            )}
                        </Upload>
                    </Form.Item>

                    {/* 标签 */}
                    <Form.Item
                        name="tag"
                        label="标签"
                        rules={[{ required: true, message: '请选择一个标签' }]}
                    >
                        <Select
                            placeholder="请选择所属分类"
                            style={{ width: '100%' }}
                            options={PRESET_TAGS.map((t) => ({ label: t, value: t }))}
                            allowClear
                        />
                    </Form.Item>

                    {/* 联系方式折叠面板 */}
                    <Collapse
                        ghost
                        bordered={false}
                        activeKey={contactOpen ? ['contact'] : []}
                        onChange={(keys) => setContactOpen(keys.includes('contact'))}
                        style={{ marginTop: -8 }}
                        items={[{
                            key: 'contact',
                            label: (
                                <span style={{ color: '#1677ff', fontWeight: 500 }}>
                                    <PhoneOutlined style={{ marginRight: 6 }} />
                                    添加联系方式（可选）
                                    <DownOutlined
                                        style={{
                                            marginLeft: 6,
                                            fontSize: 11,
                                            transition: 'transform .3s',
                                            transform: contactOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                        }}
                                    />
                                </span>
                            ),
                            showArrow: false,
                            children: (
                                <div style={{ background: '#fafafa', borderRadius: 8, padding: '12px 16px', marginTop: 4 }}>
                                    <Row gutter={12}>
                                        <Col span={12}>
                                            <Form.Item name="contactName" label="联系人" style={{ marginBottom: 12 }}>
                                                <Input placeholder="姓名" maxLength={20} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                name="contactPhone"
                                                label="手机"
                                                style={{ marginBottom: 12 }}
                                                rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', warningOnly: true }]}
                                            >
                                                <Input placeholder="手机号" maxLength={11} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="contactQQ" label="QQ" style={{ marginBottom: 0 }}>
                                                <Input placeholder="QQ 号码" maxLength={12} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item name="contactWechat" label="微信" style={{ marginBottom: 0 }}>
                                                <Input placeholder="微信号" maxLength={20} />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </div>
                            ),
                        }]}
                    />
                </Form>
            </Modal>
        </PageContainer>
    );
};

// ─── 帖子卡片子组件 ────────────────────────────────────────────────
/** 拆分帖子正文，提取纯文字和图片链接集合 */
const extractPostContent = (raw: string = '') => {
    const text = raw.replace(/\[images\][\s\S]*?\[\/images\]/g, '').trim();
    const match = raw.match(/\[images\]([\s\S]*?)\[\/images\]/);
    let images: string[] = [];
    if (match && match[1]) {
        images = match[1].split(',').filter(url => url.trim() !== '');
    }
    return { text, images };
};

const PostCard: React.FC<{ post: any; onRefresh: () => void; currentUser: any }> = ({
    post,
    onRefresh,
    currentUser,
}) => {
    const [thumbed, setThumbed] = useState(post.hasThumb);
    const [thumbCount, setThumbCount] = useState(post.thumbNum || 0);
    const [favoured, setFavoured] = useState(post.hasFavour);
    const [favourCount, setFavourCount] = useState(post.favourNum || 0);
    const [actionLoading, setActionLoading] = useState(false);

    const doThumb = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return message.warning('请先登录');
        if (actionLoading) return;
        setActionLoading(true);
        try {
            const res: any = await request('/api/post_thumb/', {
                method: 'POST',
                data: { postId: post.id },
            });
            const change = res?.data ?? 0;
            setThumbed(change > 0);
            setThumbCount((c: number) => c + change);
        } catch {
            message.error('操作失败');
        }
        setActionLoading(false);
    };

    const doFavour = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) return message.warning('请先登录');
        if (actionLoading) return;
        setActionLoading(true);
        try {
            const res: any = await request('/api/post_favour/', {
                method: 'POST',
                data: { postId: post.id },
            });
            const change = res?.data ?? 0;
            setFavoured(change > 0);
            setFavourCount((c: number) => c + change);
        } catch {
            message.error('操作失败');
        }
        setActionLoading(false);
    };

    return (
        <Card
            hoverable
            style={{ borderRadius: 14, height: '100%' }}
            bodyStyle={{ padding: 20, display: 'flex', flexDirection: 'column', height: '100%' }}
            onClick={() => history.push(`/post/detail/${post.id}`)}
        >
            {/* 标签 */}
            <div style={{ marginBottom: 8 }}>
                {(post.tagList || []).slice(0, 3).map((tag: string) => (
                    <Tag key={tag} color="blue" style={{ marginBottom: 4 }}>
                        {tag}
                    </Tag>
                ))}
            </div>

            {/* 标题 */}
            <Title level={5} ellipsis={{ rows: 2 }} style={{ margin: '0 0 8px' }}>
                {post.title}
            </Title>

            {/* 摘要 */}
            {(() => {
                const { text, images } = extractPostContent(post.content);
                return (
                    <div style={{ flex: 1, margin: '0 0 12px' }}>
                        <Paragraph
                            ellipsis={{ rows: 2 }}
                            style={{ color: '#666', fontSize: 13, margin: 0 }}
                        >
                            {text || '（无文字内容）'}
                        </Paragraph>

                        {/* 展示第一张图作为卡片缩略图 */}
                        {images.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                                <Image
                                    src={images[0]}
                                    height={100}
                                    width={140}
                                    style={{ objectFit: 'cover', borderRadius: 6 }}
                                    preview={false}
                                />
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* 作者 & 时间 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Avatar size={22} src={post.user?.userAvatar} icon={<UserOutlined />} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {post.user?.userName || '匿名用户'}
                </Text>
                <ClockCircleOutlined style={{ marginLeft: 'auto', color: '#bbb', fontSize: 12 }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {post.createTime ? new Date(post.createTime).toLocaleDateString() : ''}
                </Text>
            </div>

            {/* 点赞 & 收藏 */}
            <div
                style={{ display: 'flex', gap: 16 }}
                onClick={(e) => e.stopPropagation()}
            >
                <Button
                    size="small"
                    type="text"
                    icon={thumbed ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                    onClick={doThumb}
                    loading={actionLoading}
                    style={{ color: thumbed ? '#ff4d4f' : '#888' }}
                >
                    {thumbCount}
                </Button>
                <Button
                    size="small"
                    type="text"
                    icon={favoured ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                    onClick={doFavour}
                    loading={actionLoading}
                    style={{ color: favoured ? '#faad14' : '#888' }}
                >
                    {favourCount}
                </Button>
                <Button
                    size="small"
                    type="text"
                    icon={<EditOutlined />}
                    style={{ marginLeft: 'auto', color: '#888' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        history.push(`/post/detail/${post.id}`);
                    }}
                >
                    查看
                </Button>
            </div>
        </Card>
    );
};

export default PostPage;
