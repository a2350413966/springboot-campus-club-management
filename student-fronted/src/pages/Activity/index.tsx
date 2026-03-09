import {
    addActivityUsingPost,
    cancelSignupUsingPost,
    listActivityVOByPageUsingPost,
    signupActivityUsingPost,
    updateActivityUsingPost,
} from '@/services/backend/activityController';
import { listClubVOByPageUsingPost } from '@/services/backend/clubController';
import {
    ModalForm,
    PageContainer,
    ProFormDateTimePicker,
    ProFormDigit,
    ProFormSelect,
    ProFormText,
    ProFormTextArea,
} from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import {
    Button,
    Card,
    Col,
    Empty,
    Input,
    message,
    Pagination,
    Popconfirm,
    Row,
    Select,
    Skeleton,
    Space,
    Tag,
    Timeline,
    Typography,
    Spin,
    Upload,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { uploadFileUsingPost } from '@/services/backend/fileController';

const { Search } = Input;
const { Text, Paragraph } = Typography;

// ─── 海报上传组件 ─────────────────────────────────────────────────────────────────
const PosterUpload: React.FC<{
    posterUrl: string;
    uploading: boolean;
    onUrlChange: (url: string) => void;
    onUploadingChange: (v: boolean) => void;
}> = ({ posterUrl, uploading, onUrlChange, onUploadingChange }) => {
    const handleBeforeUpload = (file: any) => {
        const allowed = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
        if (!allowed.includes(file.type)) { message.error('仅支持 JPG / PNG / SVG / WEBP 格式！'); return false; }
        if (file.size / 1024 / 1024 >= 5) { message.error('文件大小不能超过 5MB！'); return false; }
        return true;
    };
    const handleCustomRequest = async (options: any) => {
        onUploadingChange(true);
        try {
            const res = await uploadFileUsingPost({ biz: 'activity_picture' }, {}, options.file as File);
            onUrlChange(res.data as string);
            message.success('海报上传成功！');
        } catch (e: any) {
            message.error(`上传失败：${e.message}`);
        } finally {
            onUploadingChange(false);
        }
    };
    return (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{ width: '20.8%', textAlign: 'right', color: 'rgba(0,0,0,0.85)' }}>活动海报</div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 20 }}>
                <Spin spinning={uploading}>
                    {posterUrl ? (
                        <div style={{ width: 140, height: 78, borderRadius: 8, overflow: 'hidden', border: '1px solid #d9d9d9' }}>
                            <img src={posterUrl} alt="poster" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ) : (
                        <div style={{ width: 140, height: 78, borderRadius: 8, background: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, border: '1px dashed #d9d9d9' }}>
                            🖼️
                        </div>
                    )}
                </Spin>
                <div>
                    <Upload accept="image/jpeg,image/png,image/svg+xml,image/webp" showUploadList={false} beforeUpload={handleBeforeUpload} customRequest={handleCustomRequest}>
                        <Button loading={uploading}>{uploading ? '上传中...' : '点击上传横版海报'}</Button>
                    </Upload>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>推荐比例 16:9，小于 5MB</div>
                </div>
            </div>
        </div>
    );
};

const CATEGORIES = ['全部', '竞赛', '演出', '比赛', '展览', '招募', '公益', '讲座', '其他'];

/** status: 0=报名中 1=进行中 2=已结束 3=已取消 */
const statusConfig: Record<number, { label: string; color: string; bg: string }> = {
    0: { label: '报名中', color: 'green', bg: '#f6ffed' },
    1: { label: '进行中', color: 'blue', bg: '#e6f4ff' },
    2: { label: '已结束', color: 'default', bg: '#f5f5f5' },
    3: { label: '已取消', color: 'red', bg: '#fff1f0' },
};

// ─── 活动卡片 ─────────────────────────────────────────────────────────────────
const ActivityCard: React.FC<{
    act: API.ActivityVO;
    onSignup: (act: API.ActivityVO) => void;
    onCancelSignup: (act: API.ActivityVO) => void;
    canEdit?: boolean;
    onEdit?: (act: API.ActivityVO) => void;
}> = ({ act, onSignup, onCancelSignup, canEdit, onEdit }) => {
    const cfg = statusConfig[act.status ?? 0] ?? statusConfig[0];

    return (
        <Card
            hoverable
            style={{ borderRadius: 14, marginBottom: 0, background: cfg.bg, border: '1px solid #f0f0f0', cursor: 'pointer' }}
            bodyStyle={{ padding: '20px 22px' }}
            onClick={() => history.push(`/activity/detail/${act.id}`)}
        >
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                {/* 图标/海报 */}
                {act.coverImage ? (
                    <div style={{ width: 68, height: 68, borderRadius: 12, overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        <img src={act.coverImage} alt={act.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                ) : (
                    <div style={{ width: 52, height: 52, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                        📅
                    </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{act.title}</div>
                        <Space size={6}>
                            {act.category && <Tag color="blue" style={{ borderRadius: 4, fontSize: 11 }}>{act.category}</Tag>}
                            <Tag color={cfg.color} style={{ borderRadius: 4, fontSize: 11 }}>{cfg.label}</Tag>
                        </Space>
                    </div>
                    <Paragraph ellipsis={{ rows: 2 }} style={{ color: '#666', fontSize: 13, margin: '6px 0 10px', lineHeight: 1.6 }}>
                        {act.description || '暂无活动简介'}
                    </Paragraph>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <Space size={12} wrap>
                            {act.clubName && <Text type="secondary" style={{ fontSize: 12 }}>📌 {act.clubName}</Text>}
                            {act.startTime && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    📅 {new Date(act.startTime).toLocaleDateString()}
                                    {act.endTime && act.endTime !== act.startTime
                                        ? ` ~ ${new Date(act.endTime).toLocaleDateString()}` : ''}
                                </Text>
                            )}
                            {act.location && <Text type="secondary" style={{ fontSize: 12 }}>📍 {act.location}</Text>}
                            {(act.maxSignup ?? 0) > 0 && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    👥 {act.signupCount ?? 0}/{act.maxSignup}
                                </Text>
                            )}
                        </Space>
                        <Space>
                            {canEdit && (
                                <Typography.Link onClick={(e) => { e.stopPropagation(); onEdit?.(act); }}>
                                    ✏️ 修改
                                </Typography.Link>
                            )}
                            {act.signed ? (
                                <Popconfirm title="确定取消报名吗？" onConfirm={(e) => { e?.stopPropagation(); onCancelSignup(act) }}>
                                    <Button size="small" style={{ borderRadius: 6, fontSize: 12, color: '#52c41a', borderColor: '#52c41a' }} onClick={e => e.stopPropagation()}>
                                        ✅ 已报名
                                    </Button>
                                </Popconfirm>
                            ) : (
                                <Button type="primary" size="small" disabled={act.status !== 0}
                                    style={{ borderRadius: 6, fontSize: 12 }}
                                    onClick={(e) => { e.stopPropagation(); onSignup(act); }}
                                >
                                    {act.status === 0 ? '立即报名' : act.status === 1 ? '进行中' : '已结束'}
                                </Button>
                            )}
                        </Space>
                    </div>
                </div>
            </div>
        </Card>
    );
};

// ─── 主页面 ───────────────────────────────────────────────────────────────────
const ActivityPage: React.FC = () => {
    const { initialState } = useModel('@@initialState');
    const isLogin = !!initialState?.currentUser;
    const isAdmin = initialState?.currentUser?.userRole === 'admin';

    const [activities, setActivities] = useState<API.ActivityVO[]>([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [current, setCurrent] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [category, setCategory] = useState('全部');
    const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);

    // 发布活动弹窗
    const [publishOpen, setPublishOpen] = useState(false);
    const [myClubs, setMyClubs] = useState<{ label: string; value: string }[]>([]);

    // 海报
    const [posterUrl, setPosterUrl] = useState<string>('');
    const [uploadingPoster, setUploadingPoster] = useState<boolean>(false);

    // 修改活动
    const [editOpen, setEditOpen] = useState(false);
    const [editingAct, setEditingAct] = useState<API.ActivityVO | null>(null);

    const PAGE_SIZE = 10;

    const fetchActivities = async (page = 1, kw = keyword, cat = category, sta = statusFilter) => {
        setLoading(true);
        try {
            const res = await listActivityVOByPageUsingPost({
                current: page,
                pageSize: PAGE_SIZE,
                title: kw || undefined,
                category: cat === '全部' ? undefined : cat,
                status: sta,
            });
            setActivities(res.data?.records ?? []);
            setTotal(Number(res.data?.total ?? 0));
        } catch (e: any) {
            message.error(`加载失败：${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    // 查当前用户的社团（用于选择发布活动的社团）
    const fetchMyClubs = async () => {
        if (!isLogin) return;
        try {
            const res = await listClubVOByPageUsingPost({ current: 1, pageSize: 50 });
            const clubs = (res.data?.records ?? []).filter((c) => c.myRole === 'leader' || c.myRole === 'admin');
            setMyClubs(clubs.map((c) => ({ label: c.clubName ?? '', value: c.id ?? '' })));
        } catch { /* 忽略 */ }
    };

    useEffect(() => {
        fetchActivities(1, keyword, category, statusFilter);
        setCurrent(1);
    }, [keyword, category, statusFilter]);

    useEffect(() => {
        if (isLogin) fetchMyClubs();
    }, [isLogin]);

    const handleSignup = async (act: API.ActivityVO) => {
        if (!isLogin) { message.warning('请先登录再报名！'); return; }
        try {
            await signupActivityUsingPost({ activityId: act.id! });
            message.success('报名成功！');
            fetchActivities(current);
        } catch (e: any) {
            message.error(`报名失败：${e.message}`);
        }
    };

    const handleCancelSignup = async (act: API.ActivityVO) => {
        if (!isLogin) { message.warning('请先登录再操作！'); return; }
        try {
            await cancelSignupUsingPost({ activityId: act.id! });
            message.success('已取消报名！');
            fetchActivities(current);
        } catch (e: any) {
            message.error(`取消失败：${e.message}`);
        }
    };

    const handleOpenEdit = (act: API.ActivityVO) => {
        setEditingAct(act);
        setPosterUrl(act.coverImage || '');
        setEditOpen(true);
    };

    // 右侧面板：近期日程（直接取前 6 个未结束活动）
    const upcomingActivities = activities.filter((a) => (a.status ?? 2) < 2).slice(0, 6);

    return (
        <PageContainer
            title="📅 活动中心"
            subTitle="参与丰富活动，精彩大学生活就在这里"
            extra={[
                <Search key="search" placeholder="搜索活动名称" allowClear style={{ width: 200 }}
                    onSearch={(v) => setKeyword(v)}
                    onChange={(e) => !e.target.value && setKeyword('')}
                />,
                <Select key="cat" value={category} onChange={setCategory} style={{ width: 110 }}
                    options={CATEGORIES.map((c) => ({ label: c, value: c }))}
                />,
                <Select key="status" placeholder="全部状态" allowClear style={{ width: 110 }}
                    onChange={(v) => setStatusFilter(v)}
                    options={[
                        { label: '报名中', value: 0 },
                        { label: '进行中', value: 1 },
                        { label: '已结束', value: 2 },
                    ]}
                />,
                isLogin && (isAdmin || myClubs.length > 0) && (
                    <Button key="publish" type="primary" onClick={() => setPublishOpen(true)}>
                        + 发布活动
                    </Button>
                ),
            ]}
        >
            <Row gutter={[16, 16]}>
                {/* ── 左侧活动列表 ── */}
                <Col xs={24} lg={16}>
                    {loading ? (
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Card key={i} style={{ borderRadius: 14 }}><Skeleton active avatar paragraph={{ rows: 2 }} /></Card>
                            ))}
                        </Space>
                    ) : activities.length === 0 ? (
                        <Card style={{ borderRadius: 14 }} bodyStyle={{ padding: 60, textAlign: 'center' }}>
                            <Empty description="暂无相关活动，换个筛选条件试试" />
                        </Card>
                    ) : (
                        <>
                            <Space direction="vertical" size={12} style={{ width: '100%' }}>
                                {activities.map((act) => (
                                    <ActivityCard
                                        key={act.id}
                                        act={act}
                                        onSignup={handleSignup}
                                        onCancelSignup={handleCancelSignup}
                                        canEdit={isAdmin || initialState?.currentUser?.id === act.userId}
                                        onEdit={handleOpenEdit}
                                    />
                                ))}
                            </Space>
                            <div style={{ textAlign: 'center', marginTop: 20 }}>
                                <Pagination current={current} pageSize={PAGE_SIZE} total={total}
                                    showTotal={(t) => `共 ${t} 个活动`}
                                    onChange={(p) => { setCurrent(p); fetchActivities(p); }}
                                />
                            </div>
                        </>
                    )}
                </Col>

                {/* ── 右侧近期日程 ── */}
                <Col xs={24} lg={8}>
                    <Card title="🗓️ 近期日程" style={{ borderRadius: 14, position: 'sticky', top: 80 }}
                        bodyStyle={{ padding: '16px 20px' }}
                    >
                        {upcomingActivities.length === 0 ? (
                            <Empty description="暂无近期活动" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                            <Timeline items={upcomingActivities.map((a) => ({
                                color: (a.status ?? 0) === 1 ? 'blue' : 'green',
                                children: (
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{a.title}</div>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {a.startTime ? new Date(a.startTime).toLocaleDateString() : ''} · {a.clubName ?? ''}
                                        </Text>
                                    </div>
                                ),
                            }))} />
                        )}
                    </Card>
                </Col>
            </Row>

            {/* ── 发布活动弹窗 ── */}
            <ModalForm<{
                title: string;
                clubId?: string;
                category?: string;
                description?: string;
                location?: string;
                startTime?: string;
                endTime?: string;
                signupStart?: string;
                signupEnd?: string;
                maxSignup?: number;
            }>
                title="📅 发布新活动"
                open={publishOpen}
                onOpenChange={setPublishOpen}
                onFinish={async (values) => {
                    try {
                        await addActivityUsingPost({
                            ...values,
                            coverImage: posterUrl,
                        });
                        message.success('活动发布成功！');
                        setPublishOpen(false);
                        setPosterUrl('');
                        fetchActivities(1);
                        return true;
                    } catch (e: any) {
                        message.error(`发布失败：${e.message}`);
                        return false;
                    }
                }}
                submitter={{ searchConfig: { submitText: '发布活动', resetText: '取消' } }}
                width={580}
                layout="horizontal"
                labelCol={{ span: 5 }}
            >
                <ProFormText
                    name="title"
                    label="活动名称"
                    placeholder="请输入活动名称"
                    rules={[{ required: true, message: '请输入活动名称' }]}
                />
                <PosterUpload
                    posterUrl={posterUrl}
                    uploading={uploadingPoster}
                    onUrlChange={setPosterUrl}
                    onUploadingChange={setUploadingPoster}
                />
                {myClubs.length > 0 && (
                    <ProFormSelect
                        name="clubId"
                        label="所属社团"
                        placeholder="选择举办社团（可选）"
                        options={myClubs}
                    />
                )}
                <ProFormSelect
                    name="category"
                    label="活动类型"
                    options={['竞赛', '演出', '比赛', '展览', '招募', '公益', '讲座', '其他'].map((c) => ({ label: c, value: c }))}
                />
                <ProFormTextArea
                    name="description"
                    label="活动简介"
                    placeholder="介绍一下这个活动～"
                    fieldProps={{ rows: 4, maxLength: 500, showCount: true }}
                />
                <ProFormText name="location" label="活动地点" placeholder="例如：图书馆B301" />
                <ProFormDateTimePicker
                    name="startTime"
                    label="开始时间"
                    rules={[{ required: true, message: '请选择活动开始时间' }]}
                    fieldProps={{ style: { width: '100%' } }}
                />
                <ProFormDateTimePicker
                    name="endTime"
                    label="结束时间"
                    fieldProps={{ style: { width: '100%' } }}
                />
                <ProFormDateTimePicker
                    name="signupStart"
                    label="报名开始"
                    fieldProps={{ style: { width: '100%' } }}
                />
                <ProFormDateTimePicker
                    name="signupEnd"
                    label="报名截止"
                    fieldProps={{ style: { width: '100%' } }}
                />
                <ProFormDigit
                    name="maxSignup"
                    label="人数上限"
                    placeholder="0 表示不限"
                    min={0}
                    fieldProps={{ style: { width: '100%' } }}
                />
            </ModalForm>

            {/* ── 修改活动弹窗 ── */}
            {editingAct && (
                <ModalForm<{
                    title: string;
                    clubId?: string;
                    category?: string;
                    description?: string;
                    location?: string;
                    startTime?: string;
                    endTime?: string;
                    signupStart?: string;
                    signupEnd?: string;
                    maxSignup?: number;
                }>
                    title="📝 修改活动设置"
                    open={editOpen}
                    initialValues={editingAct as any}
                    onOpenChange={(v) => {
                        setEditOpen(v);
                        if (!v) setEditingAct(null);
                    }}
                    onFinish={async (values) => {
                        try {
                            await updateActivityUsingPost({
                                ...values,
                                id: editingAct.id,
                                coverImage: posterUrl,
                            });
                            message.success('活动信息修订成功！');
                            setEditOpen(false);
                            setPosterUrl('');
                            setEditingAct(null);
                            fetchActivities(current);
                            return true;
                        } catch (e: any) {
                            message.error(`修改提交时失败：${e.message}`);
                            return false;
                        }
                    }}
                    submitter={{ searchConfig: { submitText: '保存修改', resetText: '取消' } }}
                    width={580}
                    layout="horizontal"
                    labelCol={{ span: 5 }}
                >
                    <ProFormText
                        name="title"
                        label="活动名称"
                        rules={[{ required: true, message: '必须输入新名称' }]}
                    />
                    <PosterUpload
                        posterUrl={posterUrl}
                        uploading={uploadingPoster}
                        onUrlChange={setPosterUrl}
                        onUploadingChange={setUploadingPoster}
                    />
                    {myClubs.length > 0 && (
                        <ProFormSelect
                            name="clubId"
                            label="所属社团"
                            options={myClubs}
                            disabled
                            tooltip="活动隶属关系一经指派，通常不可更改"
                        />
                    )}
                    <ProFormSelect
                        name="category"
                        label="活动类型"
                        options={['竞赛', '演出', '比赛', '展览', '招募', '公益', '讲座', '其他'].map((c) => ({ label: c, value: c }))}
                    />
                    <ProFormTextArea
                        name="description"
                        label="活动简介"
                        fieldProps={{ rows: 4, maxLength: 500, showCount: true }}
                    />
                    <ProFormText name="location" label="活动地点" />
                    <ProFormDateTimePicker
                        name="startTime"
                        label="开始时间"
                        rules={[{ required: true }]}
                        fieldProps={{ style: { width: '100%' } }}
                    />
                    <ProFormDateTimePicker
                        name="endTime"
                        label="结束时间"
                        fieldProps={{ style: { width: '100%' } }}
                    />
                    <ProFormDateTimePicker
                        name="signupStart"
                        label="报名开始"
                        fieldProps={{ style: { width: '100%' } }}
                    />
                    <ProFormDateTimePicker
                        name="signupEnd"
                        label="报名截止"
                        fieldProps={{ style: { width: '100%' } }}
                    />
                    <ProFormDigit
                        name="maxSignup"
                        label="人数上限"
                        placeholder="0 表示不限"
                        min={0}
                        fieldProps={{ style: { width: '100%' } }}
                    />
                </ModalForm>
            )}
        </PageContainer>
    );
};

export default ActivityPage;
