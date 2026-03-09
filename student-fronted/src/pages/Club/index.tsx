import {
    addClubUsingPost,
    joinClubUsingPost,
    listClubVOByPageUsingPost,
    updateClubUsingPost,
} from '@/services/backend/clubController';
import { uploadFileUsingPost } from '@/services/backend/fileController';
import {
    ModalForm,
    PageContainer,
    ProFormSelect,
    ProFormText,
    ProFormTextArea,
} from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import {
    Avatar,
    Badge,
    Button,
    Card,
    Col,
    Empty,
    Input,
    message,
    Pagination,
    Row,
    Select,
    Skeleton,
    Space,
    Spin,
    Tag,
    Tooltip,
    Typography,
    Upload,
} from 'antd';
import type { RcFile } from 'antd/es/upload';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import React, { useEffect, useRef, useState } from 'react';

const { Search } = Input;
const { Paragraph, Text } = Typography;

const CATEGORIES = ['全部', '科技', '艺术', '体育', '文艺', '公益', '学术'];

const CATEGORY_STYLE: Record<string, { color: string; emoji: string }> = {
    科技: { color: '#1677ff', emoji: '💻' },
    艺术: { color: '#eb2f96', emoji: '🎨' },
    体育: { color: '#fa8c16', emoji: '🏅' },
    文艺: { color: '#13c2c2', emoji: '🎭' },
    公益: { color: '#ff4d4f', emoji: '🤝' },
    学术: { color: '#722ed1', emoji: '📚' },
};
const DEFAULT_STYLE = { color: '#52c41a', emoji: '🏛️' };

const statusLabel: Record<number, { text: string; color: string }> = {
    0: { text: '招募中', color: '#52c41a' },
    1: { text: '已满员', color: '#999' },
    2: { text: '已解散', color: '#ff4d4f' },
};

// ─── 社团卡片 ─────────────────────────────────────────────────────────────────
const ClubCard: React.FC<{
    club: API.ClubVO;
    currentUserId?: string;
    isAdmin?: boolean;
    onJoin: (club: API.ClubVO) => void;
    onEdit: (club: API.ClubVO) => void;
}> = ({ club, currentUserId, isAdmin, onJoin, onEdit }) => {
    const style = CATEGORY_STYLE[club.category ?? ''] ?? DEFAULT_STYLE;
    const st = statusLabel[club.status ?? 0] ?? statusLabel[0];
    // 是否有编辑权限：会长 或 管理员
    const canEdit = isAdmin || club.leaderId === currentUserId || club.userId === currentUserId;

    return (
        <Card
            hoverable
            style={{ borderRadius: 14, height: '100%', overflow: 'hidden', cursor: 'pointer' }}
            bodyStyle={{ padding: 0 }}
            onClick={() => history.push(`/club/detail/${club.id}`)}
        >
            <div style={{ height: 6, background: style.color }} />
            <div style={{ padding: '20px 20px 18px' }}>
                {/* 头部：Logo + 名称 + 状态 + 编辑按钮 */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {club.logo ? (
                            <Avatar src={club.logo} size={48} shape="square" style={{ borderRadius: 12 }} />
                        ) : (
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${style.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                                {style.emoji}
                            </div>
                        )}
                        <div>
                            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{club.clubName}</div>
                            <Tag color={style.color} style={{ marginTop: 4, fontSize: 11, borderRadius: 4 }}>{club.category}</Tag>
                        </div>
                    </div>
                    <Space size={6}>
                        <Badge
                            status={club.status === 0 ? 'processing' : 'default'}
                            text={<span style={{ fontSize: 12, color: st.color }}>{st.text}</span>}
                        />
                        {canEdit && (
                            <Tooltip title="编辑社团">
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<span>✏️</span>}
                                    onClick={(e) => { e.stopPropagation(); onEdit(club); }}
                                    style={{ padding: '0 4px', fontSize: 14 }}
                                />
                            </Tooltip>
                        )}
                    </Space>
                </div>

                <Paragraph
                    ellipsis={{ rows: 2 }}
                    style={{ color: '#666', fontSize: 13, margin: 0, marginBottom: 14, lineHeight: 1.6 }}
                >
                    {club.description || '暂无简介'}
                </Paragraph>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        👥 {club.memberCount ?? 0} 名成员
                    </Text>
                    {club.joined ? (
                        <Tag color="blue" style={{ borderRadius: 6, fontSize: 12, margin: 0 }}>已加入</Tag>
                    ) : (
                        <Button
                            type="primary"
                            size="small"
                            disabled={club.status !== 0}
                            style={{ borderRadius: 6, fontSize: 12 }}
                            onClick={() => onJoin(club)}
                        >
                            {club.status === 0 ? '申请加入' : '暂不开放'}
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
};

// ─── Logo 上传子组件（创建/编辑共用）────────────────────────────────────────────
const LogoUploader: React.FC<{
    logoUrl?: string;
    uploading: boolean;
    onUrlChange: (url: string) => void;
    onUploadingChange: (v: boolean) => void;
}> = ({ logoUrl, uploading, onUrlChange, onUploadingChange }) => {

    const handleBeforeUpload = (file: RcFile) => {
        const allowed = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
        if (!allowed.includes(file.type)) { message.error('仅支持 JPG / PNG / SVG / WEBP 格式！'); return false; }
        if (file.size / 1024 / 1024 >= 1) { message.error('图片大小不能超过 1MB！'); return false; }
        return true;
    };

    const handleCustomRequest = async (options: UploadRequestOption) => {
        onUploadingChange(true);
        try {
            const res = await uploadFileUsingPost({ biz: 'user_avatar' }, {}, options.file as File);
            onUrlChange(res.data as string);
            message.success('Logo 上传成功！');
        } catch (e: any) {
            message.error(`上传失败：${e.message}`);
        } finally {
            onUploadingChange(false);
        }
    };

    return (
        <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 8, color: 'rgba(0,0,0,0.88)', fontWeight: 500 }}>社团 Logo</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <Spin spinning={uploading}>
                    {logoUrl ? (
                        <Avatar src={logoUrl} size={72} shape="square" style={{ borderRadius: 12 }} />
                    ) : (
                        <div style={{ width: 72, height: 72, borderRadius: 12, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, border: '1px dashed #d9d9d9' }}>
                            🏛️
                        </div>
                    )}
                </Spin>
                <div>
                    <Upload accept="image/jpeg,image/png,image/svg+xml,image/webp" showUploadList={false} beforeUpload={handleBeforeUpload} customRequest={handleCustomRequest}>
                        <Button loading={uploading}>{uploading ? '上传中…' : '🖼️ 点击上传 Logo'}</Button>
                    </Upload>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 6 }}>支持 JPG / PNG / WEBP，大小 ≤ 1MB</div>
                </div>
            </div>
        </div>
    );
};

// ─── 主页面 ───────────────────────────────────────────────────────────────────
const ClubPage: React.FC = () => {
    const { initialState } = useModel('@@initialState');
    const currentUser = initialState?.currentUser;
    const isLogin = !!currentUser;
    const isAdmin = currentUser?.userRole === 'admin';

    const [clubs, setClubs] = useState<API.ClubVO[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [current, setCurrent] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [category, setCategory] = useState('全部');

    // 创建弹窗
    const [createOpen, setCreateOpen] = useState(false);
    const [createLogoUrl, setCreateLogoUrl] = useState<string | undefined>();
    const [createLogoUploading, setCreateLogoUploading] = useState(false);

    // 编辑弹窗
    const [editTarget, setEditTarget] = useState<API.ClubVO | null>(null);
    const [editLogoUrl, setEditLogoUrl] = useState<string | undefined>();
    const [editLogoUploading, setEditLogoUploading] = useState(false);
    const editFormRef = useRef<any>(null);

    // 申请加入弹窗
    const [joinTarget, setJoinTarget] = useState<API.ClubVO | null>(null);

    const PAGE_SIZE = 12;

    const fetchClubs = async (page = 1, kw = keyword, cat = category) => {
        setLoading(true);
        try {
            const res = await listClubVOByPageUsingPost({
                current: page,
                pageSize: PAGE_SIZE,
                clubName: kw || undefined,
                category: cat === '全部' ? undefined : cat,
            });
            setClubs(res.data?.records ?? []);
            setTotal(Number(res.data?.total ?? 0));
        } catch (e: any) {
            message.error(`加载失败：${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClubs(1, keyword, category);
        setCurrent(1);
    }, [keyword, category]);

    const handleJoin = (club: API.ClubVO) => {
        if (!isLogin) { message.warning('请先登录后再申请加入！'); return; }
        setJoinTarget(club);
    };

    /** 打开编辑弹窗，预填数据 */
    const handleEdit = (club: API.ClubVO) => {
        setEditTarget(club);
        setEditLogoUrl(club.logo);
        // 等弹窗渲染后再 setFieldsValue
        setTimeout(() => {
            editFormRef.current?.setFieldsValue({
                clubName: club.clubName,
                category: club.category,
                description: club.description,
                status: club.status,
            });
        }, 100);
    };

    return (
        <PageContainer
            title="🏛️ 社团广场"
            subTitle="探索 TA 们，找到属于你的精彩"
            extra={[
                <Search key="search" placeholder="搜索社团名称" allowClear style={{ width: 220 }}
                    onSearch={(v) => setKeyword(v)}
                    onChange={(e) => !e.target.value && setKeyword('')}
                />,
                <Select key="cat" value={category} onChange={setCategory} style={{ width: 120 }}
                    options={CATEGORIES.map((c) => ({ label: c, value: c }))}
                />,
                isLogin && (
                    <Button key="create" type="primary" onClick={() => setCreateOpen(true)}>
                        + 创建社团
                    </Button>
                ),
            ]}
        >
            {/* 社团卡片列表 */}
            {loading ? (
                <Row gutter={[16, 16]}>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Col xs={24} sm={12} lg={8} xl={6} key={i}>
                            <Card style={{ borderRadius: 14 }}><Skeleton active avatar paragraph={{ rows: 3 }} /></Card>
                        </Col>
                    ))}
                </Row>
            ) : clubs.length === 0 ? (
                <Empty description="暂无相关社团，换个关键词试试吧" style={{ padding: '80px 0' }} />
            ) : (
                <>
                    <Row gutter={[16, 16]}>
                        {clubs.map((club) => (
                            <Col xs={24} sm={12} lg={8} xl={6} key={club.id}>
                                <ClubCard
                                    club={club}
                                    currentUserId={currentUser?.id ? String(currentUser.id) : undefined}
                                    isAdmin={isAdmin}
                                    onJoin={handleJoin}
                                    onEdit={handleEdit}
                                />
                            </Col>
                        ))}
                    </Row>
                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <Pagination current={current} pageSize={PAGE_SIZE} total={total}
                            showTotal={(t) => `共 ${t} 个社团`}
                            onChange={(p) => { setCurrent(p); fetchClubs(p); }}
                        />
                    </div>
                </>
            )}

            {/* ── 申请加入弹窗 ── */}
            <ModalForm
                title={`申请加入「${joinTarget?.clubName}」`}
                open={!!joinTarget}
                onOpenChange={(open) => !open && setJoinTarget(null)}
                onFinish={async (values) => {
                    try {
                        await joinClubUsingPost({ clubId: joinTarget?.id as any, reason: values.reason });
                        message.success(`已成功申请加入「${joinTarget?.clubName}」，等待审核！`);
                        setJoinTarget(null);
                        fetchClubs(current);
                        return true;
                    } catch (e: any) {
                        message.error(`申请失败：${e.message}`);
                        return false;
                    }
                }}
                submitter={{ searchConfig: { submitText: '提交申请', resetText: '取消' } }}
            >
                <ProFormTextArea name="reason" label="申请理由"
                    placeholder="请简单介绍一下你自己，以及加入该社团的理由（选填）"
                    fieldProps={{ rows: 4, maxLength: 200, showCount: true }}
                />
            </ModalForm>

            {/* ── 创建社团弹窗 ── */}
            <ModalForm<{ clubName: string; category: string; description?: string }>
                title="🏛️ 创建新社团"
                open={createOpen}
                onOpenChange={(open) => { setCreateOpen(open); if (!open) setCreateLogoUrl(undefined); }}
                onFinish={async (values) => {
                    try {
                        await addClubUsingPost({ ...values, logo: createLogoUrl });
                        message.success('社团创建成功！');
                        setCreateOpen(false);
                        setCreateLogoUrl(undefined);
                        fetchClubs(1);
                        return true;
                    } catch (e: any) {
                        message.error(`创建失败：${e.message}`);
                        return false;
                    }
                }}
                submitter={{ searchConfig: { submitText: '提交创建', resetText: '取消' } }}
                width={520}
            >
                <ProFormText name="clubName" label="社团名称" placeholder="请输入社团名称"
                    rules={[{ required: true, message: '请输入社团名称' }]}
                />
                <ProFormSelect name="category" label="社团分类"
                    options={['科技', '艺术', '体育', '文艺', '公益', '学术'].map((c) => ({ label: c, value: c }))}
                    rules={[{ required: true, message: '请选择社团分类' }]}
                />
                <ProFormTextArea name="description" label="社团简介" placeholder="介绍一下你的社团吧～"
                    fieldProps={{ rows: 4, maxLength: 500, showCount: true }}
                />
                <LogoUploader logoUrl={createLogoUrl} uploading={createLogoUploading}
                    onUrlChange={setCreateLogoUrl} onUploadingChange={setCreateLogoUploading}
                />
            </ModalForm>

            {/* ── 编辑社团弹窗 ── */}
            <ModalForm<{ clubName: string; category: string; description?: string; status?: number }>
                title={`✏️ 编辑社团「${editTarget?.clubName}」`}
                open={!!editTarget}
                formRef={editFormRef}
                onOpenChange={(open) => { if (!open) { setEditTarget(null); setEditLogoUrl(undefined); } }}
                onFinish={async (values) => {
                    try {
                        await updateClubUsingPost({
                            id: editTarget?.id,
                            ...values,
                            logo: editLogoUrl,
                        });
                        message.success('社团信息已更新！');
                        setEditTarget(null);
                        setEditLogoUrl(undefined);
                        fetchClubs(current);
                        return true;
                    } catch (e: any) {
                        message.error(`更新失败：${e.message}`);
                        return false;
                    }
                }}
                submitter={{ searchConfig: { submitText: '保存修改', resetText: '取消' } }}
                width={520}
            >
                <ProFormText name="clubName" label="社团名称" placeholder="请输入社团名称"
                    rules={[{ required: true, message: '请输入社团名称' }]}
                />
                <ProFormSelect name="category" label="社团分类"
                    options={['科技', '艺术', '体育', '文艺', '公益', '学术'].map((c) => ({ label: c, value: c }))}
                    rules={[{ required: true, message: '请选择社团分类' }]}
                />
                <ProFormTextArea name="description" label="社团简介" placeholder="介绍一下你的社团吧～"
                    fieldProps={{ rows: 4, maxLength: 500, showCount: true }}
                />
                <ProFormSelect name="status" label="招募状态"
                    options={[
                        { label: '招募中', value: 0 },
                        { label: '已满员', value: 1 },
                        { label: '已解散', value: 2 },
                    ]}
                />
                <LogoUploader logoUrl={editLogoUrl} uploading={editLogoUploading}
                    onUrlChange={setEditLogoUrl} onUploadingChange={setEditLogoUploading}
                />
            </ModalForm>
        </PageContainer>
    );
};

export default ClubPage;
