import {
    getClubVOByIdUsingGet,
    joinClubUsingPost,
    quitClubUsingPost,
    updateClubUsingPost,
} from '@/services/backend/clubController';
import { uploadFileUsingPost } from '@/services/backend/fileController';
import {
    ModalForm,
    ProFormSelect,
    ProFormText,
    ProFormTextArea,
} from '@ant-design/pro-components';
import { history, request, useModel, useParams } from '@umijs/max';
import {
    Avatar,
    Badge,
    Button,
    Card,
    Col,
    Descriptions,
    Dropdown,
    Empty,
    List,
    message,
    Modal,
    Popconfirm,
    Row,
    Skeleton,
    Space,
    Spin,
    Table,
    Tag,
    Tabs,
    Tooltip,
    Typography,
    Upload,
} from 'antd';
import type { RcFile } from 'antd/es/upload';
import type { UploadRequestOption } from 'rc-upload/lib/interface';
import React, { useEffect, useRef, useState } from 'react';

const { Title, Paragraph, Text } = Typography;

const CATEGORY_STYLE: Record<string, { color: string; emoji: string }> = {
    科技: { color: '#1677ff', emoji: '💻' },
    艺术: { color: '#eb2f96', emoji: '🎨' },
    体育: { color: '#fa8c16', emoji: '🏅' },
    文艺: { color: '#13c2c2', emoji: '🎭' },
    公益: { color: '#ff4d4f', emoji: '🤝' },
    学术: { color: '#722ed1', emoji: '📚' },
};
const DEFAULT_STYLE = { color: '#52c41a', emoji: '🏛️' };

const statusConfig: Record<number, { label: string; color: string; badge: 'processing' | 'default' | 'error' }> = {
    0: { label: '招募中', color: '#52c41a', badge: 'processing' },
    1: { label: '已满员', color: '#999', badge: 'default' },
    2: { label: '已解散', color: '#ff4d4f', badge: 'error' },
};

/** 角色中文映射 */
const ROLE_LABEL: Record<string, { text: string; color: string }> = {
    leader: { text: '会长', color: 'gold' },
    minister: { text: '部长', color: 'blue' },
    vice_leader: { text: '副会长', color: 'purple' },
    admin: { text: '管理员', color: 'volcano' },
    member: { text: '成员', color: 'default' },
};

type MemberItem = {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    role: string;
    joinTime?: string;
    realName?: string;
    college?: string;
    major?: string;
    studentId?: string;
    phone?: string;
    gender?: number;
};

type JoinRequestItem = {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    reason?: string;
    status: number;
    createTime?: string;
    realName?: string;
    college?: string;
    major?: string;
    studentId?: string;
    phone?: string;
    gender?: number;
};

// ─── Logo 上传组件 ──────────────────────────────────────────────────────────
const LogoUploader: React.FC<{
    logoUrl?: string;
    uploading: boolean;
    onUrlChange: (url: string) => void;
    onUploadingChange: (v: boolean) => void;
}> = ({ logoUrl, uploading, onUrlChange, onUploadingChange }) => {
    const beforeUpload = (file: RcFile) => {
        if (!['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'].includes(file.type)) {
            message.error('仅支持 JPG / PNG / SVG / WEBP 格式！'); return false;
        }
        if (file.size / 1024 / 1024 >= 1) { message.error('图片大小不能超过 1MB！'); return false; }
        return true;
    };
    const customRequest = async (options: UploadRequestOption) => {
        onUploadingChange(true);
        try {
            const res = await uploadFileUsingPost({ biz: 'user_avatar' }, {}, options.file as File);
            onUrlChange(res.data as string); message.success('Logo 上传成功！');
        } catch (e: any) { message.error(`上传失败：${e.message}`); }
        finally { onUploadingChange(false); }
    };
    return (
        <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 8, color: 'rgba(0,0,0,0.88)', fontWeight: 500 }}>社团 Logo</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <Spin spinning={uploading}>
                    {logoUrl
                        ? <Avatar src={logoUrl} size={72} shape="square" style={{ borderRadius: 12 }} />
                        : <div style={{ width: 72, height: 72, borderRadius: 12, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, border: '1px dashed #d9d9d9' }}>🏛️</div>}
                </Spin>
                <div>
                    <Upload accept="image/jpeg,image/png,image/svg+xml,image/webp" showUploadList={false}
                        beforeUpload={beforeUpload} customRequest={customRequest}>
                        <Button loading={uploading}>{uploading ? '上传中…' : '🖼️ 点击上传 Logo'}</Button>
                    </Upload>
                    <div style={{ color: '#999', fontSize: 12, marginTop: 6 }}>支持 JPG / PNG / WEBP，大小 ≤ 1MB</div>
                </div>
            </div>
        </div>
    );
};

// ─── 详情页主体 ──────────────────────────────────────────────────────────────
const ClubDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { initialState } = useModel('@@initialState');
    const currentUser = initialState?.currentUser;
    const isSysAdmin = currentUser?.userRole === 'admin';

    const [club, setClub] = useState<API.ClubVO | null>(null);
    const [members, setMembers] = useState<MemberItem[]>([]);
    const [joinRequests, setJoinRequests] = useState<JoinRequestItem[]>([]);
    const [loadingClub, setLoadingClub] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [reviewingId, setReviewingId] = useState<string | null>(null);
    const [roleChangingId, setRoleChangingId] = useState<string | null>(null);

    // 编辑弹窗
    const [editOpen, setEditOpen] = useState(false);
    const [editLogoUrl, setEditLogoUrl] = useState<string | undefined>();
    const [editLogoUploading, setEditLogoUploading] = useState(false);
    const editFormRef = useRef<any>(null);

    // 申请加入弹窗
    const [joinOpen, setJoinOpen] = useState(false);

    // ─── 当前用户在本社团的角色 ───────────────────────────────────────────────
    // 从 club.myRole 获取（后端 getClubVO 已回填）
    const myClubRole: string | null = (club as any)?.myRole ?? null;

    // 权限推断（由低到高：member < minister < leader < sysAdmin）
    const isLeader = club ? club.leaderId === String(currentUser?.id) : false;
    const isMinister = myClubRole === 'minister';
    // "有审批权"：会长 / 部长 / 系统管理员
    const canReview = isLeader || isMinister || isSysAdmin;
    // "可编辑社团"：会长 / 系统管理员
    const canEdit = club ? (isSysAdmin || isLeader) : false;
    // "可设角色"（设置/取消部长）：会长 / 系统管理员
    const canSetRole = canEdit;
    // 是否可退出（成员本人，且不是会长）
    const canQuit = club?.joined && !isLeader;

    const fetchClub = async () => {
        if (!id) return;
        setLoadingClub(true);
        try {
            const res = await getClubVOByIdUsingGet({ id });
            setClub(res.data ?? null);
        } catch (e: any) { message.error(`加载失败：${e.message}`); }
        finally { setLoadingClub(false); }
    };

    const fetchMembers = async () => {
        if (!id) return;
        setLoadingMembers(true);
        try {
            const res = await fetch(`/api/club/member/list?clubId=${id}`, { credentials: 'include' });
            const json = await res.json();
            setMembers(json.data ?? []);
        } catch { setMembers([]); }
        finally { setLoadingMembers(false); }
    };

    const fetchJoinRequests = async () => {
        if (!id) return;
        setLoadingRequests(true);
        try {
            const res = await fetch(`/api/club/join/list?clubId=${id}&status=0`, { credentials: 'include' });
            const json = await res.json();
            if (json.code !== 0) { message.error(json.message); setJoinRequests([]); return; }
            setJoinRequests(json.data ?? []);
        } catch { setJoinRequests([]); }
        finally { setLoadingRequests(false); }
    };

    useEffect(() => {
        fetchClub();
        fetchMembers();
    }, [id]);

    // 当 club 加载完且有权限时才拉申请列表
    useEffect(() => {
        if (club && canReview) fetchJoinRequests();
    }, [club?.id, myClubRole]);

    /** 审核加入申请 */
    const handleReview = async (requestId: string, status: 1 | 2) => {
        setReviewingId(requestId);
        try {
            const res = await fetch('/api/club/join/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ requestId, status }),
            });
            const json = await res.json();
            if (json.code !== 0) throw new Error(json.message);
            message.success(status === 1 ? '已通过申请！' : '已拒绝申请');
            fetchJoinRequests();
            if (status === 1) fetchMembers();
            fetchClub();
        } catch (e: any) { message.error(`操作失败：${e.message}`); }
        finally { setReviewingId(null); }
    };

    /** 转让会长 */
    const handleTransfer = (newLeaderId: string) => {
        Modal.confirm({
            title: '确认转让会长职务？',
            content: '转让后您将降级为普通成员，该操作不可撤销，请谨慎！',
            okText: '确认转让',
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    const res = await fetch(`/api/club/transfer?clubId=${id}&newLeaderId=${newLeaderId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                    });
                    const json = await res.json();
                    if (json.code !== 0) throw new Error(json.message);
                    message.success('已成功转让会长职务！');
                    fetchClub();
                    fetchMembers();
                } catch (e: any) { message.error(`转让失败：${e.message}`); }
            },
        });
    };

    /** ★ 新增：设置/取消部长 */
    const handleSetRole = async (targetUserId: string, targetRole: 'minister' | 'member', memberName: string) => {
        const actionText = targetRole === 'minister' ? `设置「${memberName}」为部长` : `取消「${memberName}」的部长职务`;
        Modal.confirm({
            title: `确认${actionText}？`,
            content: targetRole === 'minister'
                ? '部长可以审核入社申请和代表社团发布活动。'
                : '取消后该成员将恢复为普通成员，失去审批和发布活动权限。',
            okText: '确认',
            onOk: async () => {
                setRoleChangingId(targetUserId);
                try {
                    const res = await request('/api/club/role/set', {
                        method: 'POST',
                        params: { clubId: id, targetUserId, role: targetRole },
                    });
                    if (res.code === 0) {
                        message.success(`${actionText}成功！`);
                        fetchMembers();
                    } else {
                        message.error(res.message || '操作失败');
                    }
                } catch (e: any) { message.error(`操作失败：${e.message}`); }
                finally { setRoleChangingId(null); }
            },
        });
    };

    const openEdit = () => {
        setEditLogoUrl(club?.logo);
        setEditOpen(true);
        setTimeout(() => {
            editFormRef.current?.setFieldsValue({
                clubName: club?.clubName, category: club?.category,
                description: club?.description, status: club?.status,
            });
        }, 100);
    };

    const handleQuit = () => {
        Modal.confirm({
            title: '确认退出社团？',
            content: '退出后需重新申请才能加入，确定要退出吗？',
            okText: '确认退出', okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    await quitClubUsingPost({ clubId: id as any });
                    message.success('已成功退出社团'); fetchClub();
                } catch (e: any) { message.error(`退出失败：${e.message}`); }
            },
        });
    };

    if (loadingClub) return <div style={{ padding: '40px 32px' }}><Skeleton active avatar={{ size: 80, shape: 'square' }} paragraph={{ rows: 5 }} /></div>;
    if (!club) return <Empty description="社团不存在或已被删除" style={{ paddingTop: 100 }} />;

    const style = CATEGORY_STYLE[club.category ?? ''] ?? DEFAULT_STYLE;
    const statusInfo = statusConfig[club.status ?? 0] ?? statusConfig[0];

    // ── 申请管理列表列定义 ──
    const requestColumns = [
        {
            title: '申请人',
            key: 'user',
            render: (_: any, r: JoinRequestItem) => (
                <Space>
                    <Avatar src={r.userAvatar} size={32}>{!r.userAvatar && r.userName?.[0]}</Avatar>
                    <div>
                        <div style={{ fontWeight: 500 }}>{r.userName}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>
                            {r.realName ? `${r.realName} · ${r.college || '未知学院'} · ${r.major || '未知专业'}` : '未完善真实学籍资料'}
                        </div>
                    </div>
                </Space>
            ),
        },
        {
            title: '申请理由',
            dataIndex: 'reason',
            render: (v: string) => v || <Text type="secondary">未填写</Text>,
        },
        {
            title: '申请时间',
            dataIndex: 'createTime',
            render: (v: string) => v ? new Date(v).toLocaleString() : '-',
        },
        {
            title: '操作',
            key: 'action',
            render: (_: any, r: JoinRequestItem) => (
                <Space>
                    <Popconfirm title="确认通过该申请？" onConfirm={() => handleReview(r.id, 1)}>
                        <Button type="primary" size="small" loading={reviewingId === r.id}>通过</Button>
                    </Popconfirm>
                    <Popconfirm title="确认拒绝该申请？" onConfirm={() => handleReview(r.id, 2)}>
                        <Button danger size="small" loading={reviewingId === r.id}>拒绝</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // ── Tab 内容 ──
    const tabItems = [
        {
            key: 'info',
            label: '📋 社团信息',
            children: (
                <Card style={{ borderRadius: 14 }}>
                    <Descriptions column={1} size="small">
                        <Descriptions.Item label="社团名称">{club.clubName}</Descriptions.Item>
                        <Descriptions.Item label="社团分类"><Tag color={style.color}>{club.category}</Tag></Descriptions.Item>
                        <Descriptions.Item label="当前状态"><Badge status={statusInfo.badge} text={statusInfo.label} /></Descriptions.Item>
                        <Descriptions.Item label="成员人数">{club.memberCount} / {club.maxMembers ?? '不限'}</Descriptions.Item>
                        <Descriptions.Item label="社团会长">{club.leaderName}</Descriptions.Item>
                    </Descriptions>
                </Card>
            ),
        },
        {
            key: 'members',
            label: `👥 成员（${members.length}人）`,
            children: (
                <Card style={{ borderRadius: 14 }}>
                    {loadingMembers ? <Skeleton active paragraph={{ rows: 4 }} /> : members.length === 0
                        ? <Empty description="暂无成员" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        : (
                            <List dataSource={members} renderItem={(m) => {
                                const roleInfo = ROLE_LABEL[m.role] ?? { text: m.role, color: 'default' };
                                const isMe = String(m.userId) === String(currentUser?.id);
                                const isTargetLeader = m.role === 'leader';
                                const isTargetMinister = m.role === 'minister';

                                // 构建成员操作菜单（会长操作区）
                                const menuItems: any[] = [];
                                if (canSetRole && !isMe && !isTargetLeader) {
                                    if (isTargetMinister) {
                                        menuItems.push({
                                            key: 'unset-minister',
                                            label: '取消部长职务',
                                            onClick: () => handleSetRole(String(m.userId), 'member', m.userName),
                                        });
                                    } else {
                                        menuItems.push({
                                            key: 'set-minister',
                                            label: '🎖️ 任命为部长',
                                            onClick: () => handleSetRole(String(m.userId), 'minister', m.userName),
                                        });
                                    }
                                    if (isLeader) {
                                        menuItems.push({
                                            key: 'transfer',
                                            label: '👑 委任为新会长',
                                            danger: true,
                                            onClick: () => handleTransfer(String(m.userId)),
                                        });
                                    }
                                }

                                return (
                                    <List.Item
                                        style={{ padding: '12px 0' }}
                                        actions={[
                                            menuItems.length > 0 && (
                                                <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                                                    <Button
                                                        size="small"
                                                        loading={roleChangingId === String(m.userId)}
                                                    >
                                                        管理 ▾
                                                    </Button>
                                                </Dropdown>
                                            ),
                                        ].filter(Boolean) as React.ReactNode[]}
                                    >
                                        <List.Item.Meta
                                            avatar={<Avatar src={m.userAvatar} style={{ background: style.color }}>{!m.userAvatar && m.userName?.[0]}</Avatar>}
                                            title={<Space>
                                                <span>{m.userName}</span>
                                                <Tag color={roleInfo.color} style={{ fontSize: 11 }}>{roleInfo.text}</Tag>
                                                {isMe && <Tag style={{ fontSize: 11 }}>我</Tag>}
                                            </Space>}
                                            description={
                                                <Space direction="vertical" size={2}>
                                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                                        {m.realName ? `${m.realName} (${m.college || ''} ${m.major || ''})` : '神秘同学'}
                                                        {m.studentId && ` · 学号: ${m.studentId}`}
                                                    </Text>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        {m.joinTime ? `加入于 ${new Date(m.joinTime).toLocaleDateString()}` : ''}
                                                    </Text>
                                                </Space>
                                            }
                                        />
                                    </List.Item>
                                );
                            }} />
                        )}
                </Card>
            ),
        },
        // ★ 关键：入社审批 Tab 现在向 minister（部长）也开放
        ...(canReview ? [{
            key: 'requests',
            label: (
                <span>
                    📬 申请审核
                    {joinRequests.length > 0 && (
                        <Tag color="red" style={{ marginLeft: 6, fontSize: 11 }}>{joinRequests.length}</Tag>
                    )}
                    {isMinister && !isLeader && <Tag color="blue" style={{ marginLeft: 4, fontSize: 10 }}>部长权限</Tag>}
                </span>
            ),
            children: (
                <Card style={{ borderRadius: 14 }}>
                    <Table
                        dataSource={joinRequests}
                        columns={requestColumns}
                        rowKey="id"
                        loading={loadingRequests}
                        locale={{ emptyText: <Empty description="暂无待审核的申请 🎉" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                        pagination={false}
                    />
                </Card>
            ),
        }] : []),
    ];

    return (
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
            <Button type="link" style={{ padding: 0, marginBottom: 16 }} onClick={() => history.back()}>
                ← 返回社团广场
            </Button>

            {/* ── 顶部 Banner ── */}
            <Card style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 20 }} bodyStyle={{ padding: 0 }}>
                <div style={{ height: 8, background: `linear-gradient(135deg, ${style.color}, ${style.color}88)` }} />
                <div style={{ padding: '28px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
                        {club.logo
                            ? <Avatar src={club.logo} size={88} shape="square" style={{ borderRadius: 16, flexShrink: 0 }} />
                            : <div style={{ width: 88, height: 88, borderRadius: 16, background: `${style.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, flexShrink: 0 }}>{style.emoji}</div>
                        }
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                <Title level={3} style={{ margin: 0 }}>{club.clubName}</Title>
                                <Tag color={style.color} style={{ borderRadius: 6 }}>{club.category}</Tag>
                                <Badge status={statusInfo.badge} text={<span style={{ color: statusInfo.color }}>{statusInfo.label}</span>} />
                            </div>
                            <Paragraph style={{ color: '#666', marginTop: 12, marginBottom: 16, lineHeight: 1.8 }}>
                                {club.description || '该社团暂未填写简介。'}
                            </Paragraph>
                            <Space size={20} wrap>
                                <Text type="secondary">👥 {club.memberCount ?? 0} / {club.maxMembers ?? '∞'} 成员</Text>
                                <Text type="secondary">👑 会长：{club.leaderName ?? '未知'}</Text>
                            </Space>
                        </div>
                        {/* ★ 右侧按钮区根据角色动态渲染 */}
                        <Space direction="vertical" style={{ flexShrink: 0 }}>
                            {canEdit && <Button type="primary" onClick={openEdit}>✏️ 编辑社团</Button>}
                            {!club.joined && club.status === 0 && currentUser && (
                                <Button onClick={() => setJoinOpen(true)}>申请加入</Button>
                            )}
                            {canQuit && <Button danger onClick={handleQuit}>退出社团</Button>}
                            {/* 角色徽章 */}
                            {club.joined && isLeader && <Tag color="gold">👑 我是会长</Tag>}
                            {club.joined && isMinister && !isLeader && <Tag color="blue">🎖️ 我是部长</Tag>}
                            {club.joined && !isLeader && !isMinister && <Tag color="green">✅ 已加入</Tag>}
                        </Space>
                    </div>
                </div>
            </Card>

            {/* ── Tab 区域 ── */}
            <Tabs items={tabItems} defaultActiveKey="info" size="large" />

            {/* ── 申请加入弹窗 ── */}
            <ModalForm
                title={`申请加入「${club.clubName}」`}
                open={joinOpen}
                onOpenChange={setJoinOpen}
                onFinish={async (values) => {
                    try {
                        await joinClubUsingPost({ clubId: id as any, reason: values.reason });
                        message.success('申请已提交，等待审核！');
                        setJoinOpen(false); fetchClub(); return true;
                    } catch (e: any) { message.error(`申请失败：${e.message}`); return false; }
                }}
                submitter={{ searchConfig: { submitText: '提交申请', resetText: '取消' } }}
            >
                <ProFormTextArea name="reason" label="申请理由"
                    placeholder="请简单介绍一下你自己，以及加入该社团的理由（选填）"
                    fieldProps={{ rows: 4, maxLength: 200, showCount: true }}
                />
            </ModalForm>

            {/* ── 编辑弹窗 ── */}
            <ModalForm<{ clubName: string; category: string; description?: string; status?: number }>
                title={`✏️ 编辑社团「${club.clubName}」`}
                open={editOpen}
                formRef={editFormRef}
                onOpenChange={(open) => { if (!open) { setEditOpen(false); setEditLogoUrl(undefined); } }}
                onFinish={async (values) => {
                    try {
                        await updateClubUsingPost({ id: club.id, ...values, logo: editLogoUrl });
                        message.success('社团信息已更新！');
                        setEditOpen(false); setEditLogoUrl(undefined); fetchClub(); return true;
                    } catch (e: any) { message.error(`更新失败：${e.message}`); return false; }
                }}
                submitter={{ searchConfig: { submitText: '保存修改', resetText: '取消' } }}
                width={520}
            >
                <ProFormText name="clubName" label="社团名称" rules={[{ required: true }]} />
                <ProFormSelect name="category" label="社团分类"
                    options={['科技', '艺术', '体育', '文艺', '公益', '学术'].map((c) => ({ label: c, value: c }))}
                    rules={[{ required: true }]}
                />
                <ProFormTextArea name="description" label="社团简介" fieldProps={{ rows: 4, maxLength: 500, showCount: true }} />
                <ProFormSelect name="status" label="招募状态"
                    options={[{ label: '招募中', value: 0 }, { label: '已满员', value: 1 }, { label: '已解散', value: 2 }]}
                />
                <LogoUploader logoUrl={editLogoUrl} uploading={editLogoUploading}
                    onUrlChange={setEditLogoUrl} onUploadingChange={setEditLogoUploading}
                />
            </ModalForm>
        </div>
    );
};

export default ClubDetailPage;
