import UpdateModal from '@/pages/Admin/Club/components/UpdateModal';
import { deleteClubUsingPost, listClubVOByPageUsingPost } from '@/services/backend/clubController';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { request } from '@umijs/max';
import {
    Avatar,
    Badge,
    Button,
    message,
    Modal,
    Space,
    Tabs,
    Tag,
    Typography,
    Input,
} from 'antd';
import React, { useRef, useState } from 'react';

const { Text: AntText } = Typography;
const { TextArea } = Input;

/** 解析 leaderName，格式："姓名 (学号)" */
const parseLeader = (raw: string = '') => {
    const m = raw.match(/^(.+?)\s*\((.+?)\)$/);
    return m ? { name: m[1].trim(), studentId: m[2].trim() } : { name: raw, studentId: '' };
};

/** 状态枚举 */
const STATUS_MAP: Record<number, { label: string; color: string; badge: any }> = {
    [-1]: { label: '待审核', color: 'orange', badge: 'warning' },
    0: { label: '招募中', color: 'green', badge: 'success' },
    1: { label: '已满员', color: 'default', badge: 'default' },
    2: { label: '已解散/拒绝', color: 'red', badge: 'error' },
};

/**
 * 社团管理页（含审批流）
 */
const ClubAdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('pending');
    const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
    const actionRef = useRef<ActionType>();
    const pendingActionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.ClubVO>();
    // 审批弹窗状态
    const [reviewVisible, setReviewVisible] = useState(false);
    const [reviewTarget, setReviewTarget] = useState<API.ClubVO | null>(null);
    const [reviewNote, setReviewNote] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);

    /** 删除社团 */
    const handleDelete = async (row: API.ClubVO) => {
        const hide = message.loading('删除中...');
        try {
            await deleteClubUsingPost({ id: row.id as any });
            hide();
            message.success('社团已删除');
            actionRef?.current?.reload();
            return true;
        } catch (error: any) {
            hide();
            message.error('删除失败：' + error.message);
            return false;
        }
    };

    /** 执行审批（通过/拒绝） */
    const handleReview = async (approve: boolean) => {
        if (!reviewTarget) return;
        setReviewLoading(true);
        try {
            const res = await request('/api/club/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: { id: reviewTarget.id, approve, reviewNote },
            });
            if (res.code === 0) {
                message.success(approve ? '✅ 已通过审核，社团现已上线！' : '❌ 已拒绝申请');
                setReviewVisible(false);
                setReviewNote('');
                pendingActionRef.current?.reload();
                actionRef.current?.reload();
            } else {
                message.error(res.message || '操作失败');
            }
        } catch (e: any) {
            message.error('请求失败：' + e.message);
        } finally {
            setReviewLoading(false);
        }
    };

    /** 公共列（名称、分类、会长、时间） */
    const commonColumns: ProColumns<API.ClubVO>[] = [
        {
            title: 'Logo',
            dataIndex: 'logo',
            valueType: 'image',
            fieldProps: { width: 40 },
            hideInSearch: true,
            width: 60,
        },
        {
            title: '社团名称',
            dataIndex: 'clubName',
            valueType: 'text',
        },
        {
            title: '分类',
            dataIndex: 'category',
            valueType: 'text',
            width: 80,
        },
        {
            title: '会长',
            dataIndex: 'leaderName',
            valueType: 'text',
            hideInSearch: true,
            width: 160,
            render: (_, record) => {
                const { name, studentId } = parseLeader(record.leaderName || '');
                return (
                    <Space align="start">
                        <Avatar
                            size={28}
                            src={record.leaderAvatar || undefined}
                            style={record.leaderAvatar ? {} : { backgroundColor: '#1677ff' }}
                        >
                            {!record.leaderAvatar && (name ? name.charAt(0) : '?')}
                        </Avatar>
                        <div style={{ lineHeight: 1.4 }}>
                            <AntText style={{ fontSize: 13, display: 'block' }}>{name || '-'}</AntText>
                            {studentId && (
                                <AntText type="secondary" style={{ fontSize: 12 }}>
                                    {studentId}
                                </AntText>
                            )}
                        </div>
                    </Space>
                );
            },
        },
        {
            title: '成员数',
            dataIndex: 'memberCount',
            valueType: 'digit',
            hideInSearch: true,
            width: 80,
        },
        {
            title: '创建时间',
            sorter: true,
            dataIndex: 'createTime',
            valueType: 'dateTime',
            hideInSearch: true,
            hideInForm: true,
            width: 160,
        },
    ];

    /** 待审核列 */
    const pendingColumns: ProColumns<API.ClubVO>[] = [
        ...commonColumns,
        {
            title: '操作',
            dataIndex: 'option',
            valueType: 'option',
            width: 180,
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        size="small"
                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                        onClick={() => {
                            setReviewTarget(record);
                            setReviewNote('');
                            setReviewVisible(true);
                        }}
                    >
                        审核
                    </Button>
                    <Typography.Link type="danger" onClick={() => handleDelete(record)}>
                        删除
                    </Typography.Link>
                </Space>
            ),
        },
    ];

    /** 全部社团列 */
    const allColumns: ProColumns<API.ClubVO>[] = [
        ...commonColumns,
        {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (_, record) => {
                const s = STATUS_MAP[record.status ?? 0] || { label: '未知', color: 'default' };
                return <Tag color={s.color}>{s.label}</Tag>;
            },
            valueEnum: {
                '-1': { text: '待审核', status: 'Warning' },
                0: { text: '招募中', status: 'Success' },
                1: { text: '已满员', status: 'Default' },
                2: { text: '已解散', status: 'Error' },
            },
        },
        {
            title: '操作',
            dataIndex: 'option',
            valueType: 'option',
            width: 140,
            render: (_, record) => (
                <Space size="middle">
                    <Typography.Link
                        onClick={() => {
                            setCurrentRow(record);
                            setUpdateModalVisible(true);
                        }}
                    >
                        编辑
                    </Typography.Link>
                    <Typography.Link type="danger" onClick={() => handleDelete(record)}>
                        删除
                    </Typography.Link>
                </Space>
            ),
        },
    ];

    return (
        <PageContainer
            title="社团审批与管理"
            subTitle="审核新建社团申请，管理所有在册社团"
        >
            {/* 审批弹窗 */}
            <Modal
                title={
                    <span>
                        🏛️ 审核社团申请 —
                        <span style={{ color: '#1677ff', marginLeft: 8 }}>{reviewTarget?.clubName}</span>
                    </span>
                }
                open={reviewVisible}
                onCancel={() => setReviewVisible(false)}
                footer={null}
                width={480}
            >
                <div style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8, color: '#595959' }}>
                        <strong>申请人（会长）：</strong>{reviewTarget?.leaderName || '-'}
                    </div>
                    <div style={{ marginBottom: 8, color: '#595959' }}>
                        <strong>社团分类：</strong>
                        <Tag color="blue" style={{ marginLeft: 4 }}>{reviewTarget?.category || '未分类'}</Tag>
                    </div>
                    <div style={{ color: '#595959', marginBottom: 4 }}>
                        <strong>简介：</strong>
                    </div>
                    <div
                        style={{
                            background: '#f9f9f9',
                            borderRadius: 8,
                            padding: '10px 14px',
                            color: '#8c8c8c',
                            fontSize: 13,
                            marginBottom: 16,
                        }}
                    >
                        {(reviewTarget as any)?.description || '暂无简介'}
                    </div>
                    <div style={{ color: '#595959', marginBottom: 6 }}>
                        <strong>审批备注（可选，拒绝时建议填写原因）：</strong>
                    </div>
                    <TextArea
                        rows={3}
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="填写审批意见，将记录在日志中……"
                    />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <Button onClick={() => setReviewVisible(false)}>取消</Button>
                    <Button
                        danger
                        loading={reviewLoading}
                        onClick={() => handleReview(false)}
                    >
                        ❌ 拒绝申请
                    </Button>
                    <Button
                        type="primary"
                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                        loading={reviewLoading}
                        onClick={() => handleReview(true)}
                    >
                        ✅ 通过审核
                    </Button>
                </div>
            </Modal>

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                type="card"
                style={{ marginBottom: 16 }}
                items={[
                    {
                        key: 'pending',
                        label: (
                            <span>
                                <Badge color="orange" style={{ marginRight: 6 }} />
                                待审核申请
                            </span>
                        ),
                        children: (
                            <ProTable<API.ClubVO>
                                actionRef={pendingActionRef}
                                rowKey="id"
                                search={{ labelWidth: 100 }}
                                headerTitle="待审核的社团申请"
                                request={async (params, sort) => {
                                    const sortField = Object.keys(sort)?.[0];
                                    const sortOrder = sort?.[sortField] ?? undefined;
                                    const { data, code } = await listClubVOByPageUsingPost({
                                        ...params,
                                        status: -1,
                                        sortField,
                                        sortOrder,
                                    } as any);
                                    return {
                                        success: code === 0,
                                        data: data?.records || [],
                                        total: Number(data?.total) || 0,
                                    };
                                }}
                                columns={pendingColumns}
                            />
                        ),
                    },
                    {
                        key: 'all',
                        label: '全部社团',
                        children: (
                            <ProTable<API.ClubVO>
                                actionRef={actionRef}
                                rowKey="id"
                                search={{ labelWidth: 100 }}
                                headerTitle="全部在册社团"
                                request={async (params, sort) => {
                                    const sortField = Object.keys(sort)?.[0];
                                    const sortOrder = sort?.[sortField] ?? undefined;
                                    const { data, code } = await listClubVOByPageUsingPost({
                                        ...params,
                                        sortField,
                                        sortOrder,
                                    } as API.ClubQueryRequest);
                                    return {
                                        success: code === 0,
                                        data: data?.records || [],
                                        total: Number(data?.total) || 0,
                                    };
                                }}
                                columns={allColumns}
                            />
                        ),
                    },
                ]}
            />

            <UpdateModal
                visible={updateModalVisible}
                columns={allColumns}
                oldData={currentRow}
                onSubmit={() => {
                    setUpdateModalVisible(false);
                    setCurrentRow(undefined);
                    actionRef.current?.reload();
                }}
                onCancel={() => setUpdateModalVisible(false)}
            />
        </PageContainer>
    );
};

export default ClubAdminPage;
