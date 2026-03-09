import { request, useModel, history } from '@umijs/max';
import {
    Avatar,
    Button,
    Card,
    Col,
    Empty,
    Form,
    Input,
    message,
    Modal,
    Pagination,
    Row,
    Select,
    Space,
    Spin,
    Tabs,
    Tag,
    Typography,
    Upload,
    Collapse,
    Image,
} from 'antd';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    HeartFilled,
    StarFilled,
    PictureOutlined,
    PhoneOutlined,
    DownOutlined,
} from '@ant-design/icons';
import { uploadFileUsingPost } from '@/services/backend/fileController';
import { PageContainer } from '@ant-design/pro-components';
import React, { useEffect, useState } from 'react';
import type { UploadFile, UploadProps } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const PRESET_TAGS = ['二手闲置', '打听求助', '恋爱交友', '校园趣事', '兼职招聘', '校园招聘'];

/** 剔除正文中的图片标记，只保留纯文字 */
const stripImages = (raw: string = '') =>
    raw.replace(/\[images\][\s\S]*?\[\/images\]/g, '').trim();

/** 从原始字符串中提取 文本、图片、联系人 */
const extractPostContent = (raw: string = '') => {
    let text = raw.replace(/\[images\][\s\S]*?\[\/images\]/g, '');
    const imageMatch = raw.match(/\[images\]([\s\S]*?)\[\/images\]/);
    let images: string[] = [];
    if (imageMatch && imageMatch[1]) {
        images = imageMatch[1].split(',').filter(url => url.trim() !== '');
    }

    const contactBlockMatch = text.match(/📞 联系方式\n([\s\S]*)$/);
    const contacts = { contactName: '', contactPhone: '', contactQQ: '', contactWechat: '' };
    if (contactBlockMatch) {
        text = text.replace(/📞联系方式\n[\s\S]*$/, '').replace(/📞 联系方式\n[\s\S]*$/, '').trim();
        const contactStr = contactBlockMatch[1];
        const nameMatch = contactStr.match(/联系人：([^　\n]+)/);
        const phoneMatch = contactStr.match(/手机：([^　\n]+)/);
        const qqMatch = contactStr.match(/QQ：([^　\n]+)/);
        const wechatMatch = contactStr.match(/微信：([^　\n]+)/);
        if (nameMatch) contacts.contactName = nameMatch[1];
        if (phoneMatch) contacts.contactPhone = phoneMatch[1];
        if (qqMatch) contacts.contactQQ = qqMatch[1];
        if (wechatMatch) contacts.contactWechat = wechatMatch[1];
    }
    return { text: text.trim(), images, contacts };
};

const PostMyPage: React.FC = () => {
    const { initialState } = useModel('@@initialState');
    const currentUser = initialState?.currentUser;

    const [tab, setTab] = useState('mine');

    // 我发布的帖子
    const [minePosts, setMinePosts] = useState<any[]>([]);
    const [mineLoading, setMineLoading] = useState(true);
    const [mineTotal, setMineTotal] = useState(0);
    const [minePage, setMinePage] = useState(1);

    // 我收藏的帖子
    const [favourPosts, setFavourPosts] = useState<any[]>([]);
    const [favourLoading, setFavourLoading] = useState(true);
    const [favourTotal, setFavourTotal] = useState(0);
    const [favourPage, setFavourPage] = useState(1);

    // 编辑弹窗
    const [editOpen, setEditOpen] = useState(false);
    const [editPost, setEditPost] = useState<any>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editForm] = Form.useForm();
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [imageFileList, setImageFileList] = useState<UploadFile[]>([]);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);

    const PAGE_SIZE = 10;

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

    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState('');

    const handlePreview = async (file: UploadFile) => {
        setPreviewImage(file.url || file.response || '');
        setPreviewOpen(true);
    };

    const fetchMine = async (page = minePage) => {
        if (!currentUser) return;
        setMineLoading(true);
        try {
            const res: any = await request('/api/post/my/list/page/vo', {
                method: 'POST',
                data: { current: page, pageSize: PAGE_SIZE, sortField: 'createTime', sortOrder: 'descend' },
            });
            setMinePosts(res?.data?.records || []);
            setMineTotal(Number(res?.data?.total) || 0);
        } catch (err) {
            console.error('[fetchMine] 加载我的帖子失败', err);
        }
        setMineLoading(false);
    };

    const fetchFavour = async (page = favourPage) => {
        if (!currentUser) return;
        setFavourLoading(true);
        try {
            const res: any = await request('/api/post_favour/my/list/page', {
                method: 'POST',
                data: { current: page, pageSize: PAGE_SIZE },
            });
            setFavourPosts(res?.data?.records || []);
            setFavourTotal(Number(res?.data?.total) || 0);
        } catch (err) {
            console.error('[fetchFavour] 加载收藏贴子失败', err);
        }
        setFavourLoading(false);
    };

    useEffect(() => {
        fetchMine(minePage);
    }, [minePage, currentUser]);

    useEffect(() => {
        fetchFavour(favourPage);
    }, [favourPage, currentUser]);

    const handleDelete = (postId: number) => {
        Modal.confirm({
            title: '确认删除这篇帖子？',
            content: '删除后不可恢复',
            okText: '删除',
            okType: 'danger',
            onOk: async () => {
                await request('/api/post/delete', { method: 'POST', data: { id: postId } });
                message.success('已删除');
                fetchMine(minePage);
            },
        });
    };

    const openEdit = (post: any) => {
        setEditPost(post);
        const { text, images, contacts } = extractPostContent(post.content);

        editForm.setFieldsValue({
            title: post.title,
            content: text,
            tags: post.tagList || [],
            ...contacts
        });

        setUploadedImages(images);
        setImageFileList(images.map((url, index) => ({ uid: `-1-${index}`, name: `image-${index}`, status: 'done', response: url, url })));
        setContactOpen(Object.values(contacts).some(v => v !== ''));

        setEditOpen(true);
    };

    const handleEdit = async () => {
        try {
            const values = await editForm.validateFields();
            setEditLoading(true);

            let extra = '';
            const { contactName, contactPhone, contactQQ, contactWechat } = values;
            const contacts = [
                contactName && `联系人：${contactName}`,
                contactPhone && `手机：${contactPhone}`,
                contactQQ && `QQ：${contactQQ}`,
                contactWechat && `微信：${contactWechat}`,
            ].filter(Boolean);
            if (contacts.length > 0) extra += `\n\n📞 联系方式\n${contacts.join('　')}`;

            if (uploadedImages.length > 0) {
                extra += `\n\n[images]${uploadedImages.join(',')}[/images]`;
            }
            const finalContent = values.content + extra;

            await request('/api/post/edit', {
                method: 'POST',
                data: { id: editPost.id, title: values.title, content: finalContent, tags: values.tags || [] },
            });
            message.success('编辑成功');
            setEditOpen(false);
            fetchMine(minePage);
        } catch (err: any) {
            if (!err?.errorFields) message.error('编辑失败');
        }
        setEditLoading(false);
    };

    const PostRow: React.FC<{ post: any; showActions?: boolean }> = ({ post, showActions }) => (
        <div
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '14px 0',
                borderBottom: '1px solid #f5f5f5',
                cursor: 'pointer',
            }}
            onClick={() => history.push(`/post/detail/${post.id}`)}
        >
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: 4 }}>
                    {(post.tagList || []).slice(0, 3).map((tag: string) => (
                        <Tag key={tag} color="blue" style={{ marginRight: 4 }}>
                            {tag}
                        </Tag>
                    ))}
                </div>
                <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 4 }}>
                    {post.title}
                </Text>
                <Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{ color: '#888', fontSize: 13, margin: 0 }}
                >
                    {stripImages(post.content) || '（无文字内容）'}
                </Paragraph>
                <Space size={16} style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {post.createTime ? new Date(post.createTime).toLocaleDateString() : ''}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        <HeartFilled style={{ color: '#ff4d4f', marginRight: 4 }} />
                        {post.thumbNum || 0}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        <StarFilled style={{ color: '#faad14', marginRight: 4 }} />
                        {post.favourNum || 0}
                    </Text>
                </Space>
            </div>
            {showActions && (
                <Space onClick={(e) => e.stopPropagation()}>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openEdit(post)}
                    >
                        编辑
                    </Button>
                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(post.id)}
                    >
                        删除
                    </Button>
                </Space>
            )}
        </div>
    );

    if (!currentUser) {
        return (
            <PageContainer title="我的帖子">
                <Empty description="请先登录">
                    <Button type="primary" onClick={() => history.push('/user/login')}>
                        去登录
                    </Button>
                </Empty>
            </PageContainer>
        );
    }

    return (
        <PageContainer
            title="📝 我的帖子"
            extra={
                <Button
                    icon={<PlusOutlined />}
                    type="primary"
                    onClick={() => history.push('/post')}
                >
                    去广场发帖
                </Button>
            }
        >
            <Card style={{ borderRadius: 14 }}>
                <Tabs
                    activeKey={tab}
                    onChange={setTab}
                    items={[
                        {
                            key: 'mine',
                            label: `我发布的（${mineTotal}）`,
                            children: (
                                <Spin spinning={mineLoading}>
                                    {minePosts.length === 0 && !mineLoading ? (
                                        <Empty description="还没有发布过帖子" style={{ margin: '40px 0' }} />
                                    ) : (
                                        minePosts.map((p) => <PostRow key={p.id} post={p} showActions />)
                                    )}
                                    {mineTotal > PAGE_SIZE && (
                                        <div style={{ textAlign: 'center', marginTop: 20 }}>
                                            <Pagination
                                                current={minePage}
                                                pageSize={PAGE_SIZE}
                                                total={mineTotal}
                                                onChange={setMinePage}
                                                size="small"
                                            />
                                        </div>
                                    )}
                                </Spin>
                            ),
                        },
                        {
                            key: 'favour',
                            label: `我收藏的（${favourTotal}）`,
                            children: (
                                <Spin spinning={favourLoading}>
                                    {favourPosts.length === 0 && !favourLoading ? (
                                        <Empty description="还没有收藏过帖子" style={{ margin: '40px 0' }} />
                                    ) : (
                                        favourPosts.map((p) => <PostRow key={p.id} post={p} />)
                                    )}
                                    {favourTotal > PAGE_SIZE && (
                                        <div style={{ textAlign: 'center', marginTop: 20 }}>
                                            <Pagination
                                                current={favourPage}
                                                pageSize={PAGE_SIZE}
                                                total={favourTotal}
                                                onChange={setFavourPage}
                                                size="small"
                                            />
                                        </div>
                                    )}
                                </Spin>
                            ),
                        },
                    ]}
                />
            </Card>

            {/* 编辑弹窗 */}
            <Modal
                title="✏️ 编辑帖子"
                open={editOpen}
                onCancel={() => setEditOpen(false)}
                onOk={handleEdit}
                confirmLoading={editLoading}
                okText="保存并发布"
                cancelText="取消"
                width={600}
                destroyOnClose
                styles={{ body: { maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 } }}
            >
                <Form form={editForm} layout="vertical" style={{ marginTop: 8 }}>
                    <Form.Item name="title" label="标题" rules={[{ required: true }, { max: 80 }]}>
                        <Input showCount maxLength={80} />
                    </Form.Item>
                    <Form.Item name="content" label="正文" rules={[{ required: true }]}>
                        <TextArea rows={8} showCount maxLength={2000} />
                    </Form.Item>

                    {/* 图片上传 */}
                    <Form.Item label={<span><PictureOutlined style={{ marginRight: 6 }} />配图（最多 5 张）</span>}>
                        <Upload
                            listType="picture-card"
                            fileList={imageFileList}
                            customRequest={handleImageUpload}
                            onRemove={handleImageRemove}
                            onPreview={handlePreview}
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

                    {/* 图片预览受控 Modal */}
                    {previewImage && (
                        <Image
                            wrapperStyle={{ display: 'none' }}
                            preview={{
                                visible: previewOpen,
                                onVisibleChange: (visible) => setPreviewOpen(visible),
                                afterOpenChange: (visible) => !visible && setPreviewImage(''),
                            }}
                            src={previewImage}
                        />
                    )}

                    {/* 标签 */}
                    <Form.Item name="tags" label="标签" rules={[{ required: true, message: '请选择至少一个标签' }]}>
                        <Select
                            mode="tags"
                            options={PRESET_TAGS.map((t) => ({ label: t, value: t }))}
                            maxTagCount={3}
                        />
                    </Form.Item>

                    {/* 联系方式 */}
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
                                    添加/修改联系方式（可选）
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

export default PostMyPage;
