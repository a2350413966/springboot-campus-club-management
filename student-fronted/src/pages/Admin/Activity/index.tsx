import UpdateModal from '@/pages/Admin/Activity/components/UpdateModal';
import { listActivityVOByPageUsingPost } from '@/services/backend/activityController';
import { request } from '@umijs/max';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
    Badge,
    Button,
    Input,
    message,
    Modal,
    Space,
    Tabs,
    Tag,
    Typography,
} from 'antd';
import React, { useRef, useState } from 'react';

const { TextArea } = Input;

/** 活动状态枚举 */
const STATUS_MAP: Record<number, { label: string; color: string }> = {
    [-1]: { label: '待审核', color: 'orange' },
    0: { label: '报名中', color: 'processing' },
    1: { label: '进行中', color: 'success' },
    2: { label: '已结束', color: 'default' },
    3: { label: '已取消/拒绝', color: 'error' },
};

/**
 * 活动管理页（含审批流）
 */
const ActivityAdminPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>('pending');
    const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
    const actionRef = useRef<ActionType>();
    const pendingActionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.ActivityVO>();
    // 审批弹窗状态
    const [reviewVisible, setReviewVisible] = useState(false);
    const [reviewTarget, setReviewTarget] = useState<API.ActivityVO | null>(null);
    const [reviewNote, setReviewNote] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);

    /** 删除活动 */
    const handleDelete = async (row: API.ActivityVO) => {
        const hide = message.loading('删除中...');
        try {
            await request('/api/activity/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: { id: row.id },
            });
            hide();
            message.success('活动已删除');
            actionRef?.current?.reload();
            return true;
        } catch (error: any) {
            hide();
            message.error('删除失败：' + error.message);
            return false;
        }
    };

    /** 执行审批 */
    const handleReview = async (approve: boolean) => {
        if (!reviewTarget) return;
        setReviewLoading(true);
        try {
            const res = await request('/api/activity/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: { id: reviewTarget.id, approve, reviewNote },
            });
            if (res.code === 0) {
                message.success(approve ? '✅ 已通过审核，活动现已开放报名！' : '❌ 已拒绝该活动申请');
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

    /** 公共列 */
    const commonColumns: ProColumns<API.ActivityVO>[] = [
        {
            title: '封面',
            dataIndex: 'coverImage',
            valueType: 'image',
            fieldProps: { width: 56 },
            hideInSearch: true,
            width: 70,
        },
        {
            title: '活动名称',
            dataIndex: 'title',
            valueType: 'text',
        },
        {
            title: '发起社团',
            dataIndex: 'clubName',
            valueType: 'text',
            render: (_, record) =>
                (record as any).clubVO?.clubName || (record as any).clubName || (
                    <span style={{ color: '#bfbfbf' }}>独立活动</span>
                ),
        },
        {
            title: '报名人数',
            dataIndex: 'capacity',
            valueType: 'text',
            hideInSearch: true,
            width: 120,
            render: (_, record) => {
                const max = record.maxSignup ? record.maxSignup : '不限';
                return `${record.signupCount || 0} / ${max}`;
            },
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
    const pendingColumns: ProColumns<API.ActivityVO>[] = [
        ...commonColumns,
        {
            title: '操作',
            dataIndex: 'option',
            valueType: 'option',
            width: 160,
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

    /** 全部活动列 */
    const allColumns: ProColumns<API.ActivityVO>[] = [
        ...commonColumns,
        {
            title: '状态',
            dataIndex: 'status',
            width: 110,
            render: (_, record) => {
                const s = STATUS_MAP[record.status ?? 0] || { label: '未知', color: 'default' };
                return <Tag color={s.color}>{s.label}</Tag>;
            },
            valueEnum: {
                '-1': { text: '待审核', status: 'Warning' },
                0: { text: '报名中', status: 'Processing' },
                1: { text: '进行中', status: 'Success' },
                2: { text: '已结束', status: 'Default' },
                3: { text: '已取消', status: 'Error' },
            },
        },
        {
            title: '操作',
            dataIndex: 'option',
            valueType: 'option',
            width: 130,
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
            title="活动审批与管理"
            subTitle="审核新发布的活动申请，管理所有活动"
        >
            {/* 审批弹窗 */}
            <Modal
                title={
                    <span>
                        📅 审核活动申请 —
                        <span style={{ color: '#1677ff', marginLeft: 8 }}>{reviewTarget?.title}</span>
                    </span>
                }
                open={reviewVisible}
                onCancel={() => setReviewVisible(false)}
                footer={null}
                width={500}
            >
                <div style={{ marginBottom: 16 }}>
                    <div style={{ marginBottom: 8, color: '#595959' }}>
                        <strong>发起社团：</strong>
                        {(reviewTarget as any)?.clubVO?.clubName || (reviewTarget as any)?.clubName || '独立活动'}
                    </div>
                    <div style={{ marginBottom: 8, color: '#595959' }}>
                        <strong>报名上限：</strong>
                        {reviewTarget?.maxSignup ? `${reviewTarget.maxSignup} 人` : '不限'}
                    </div>
                    <div style={{ color: '#595959', marginBottom: 4 }}>
                        <strong>活动简介：</strong>
                    </div>
                    <div
                        style={{
                            background: '#f9f9f9',
                            borderRadius: 8,
                            padding: '10px 14px',
                            color: '#8c8c8c',
                            fontSize: 13,
                            marginBottom: 16,
                            maxHeight: 100,
                            overflow: 'auto',
                        }}
                    >
                        {(reviewTarget as any)?.description || '暂无简介'}
                    </div>
                    <div style={{ color: '#595959', marginBottom: 6 }}>
                        <strong>审批备注（可选）：</strong>
                    </div>
                    <TextArea
                        rows={3}
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        placeholder="填写审批意见，将记录在系统日志中……"
                    />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <Button onClick={() => setReviewVisible(false)}>取消</Button>
                    <Button
                        danger
                        loading={reviewLoading}
                        onClick={() => handleReview(false)}
                    >
                        ❌ 拒绝活动
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
                                待审核活动
                            </span>
                        ),
                        children: (
                            <ProTable<API.ActivityVO>
                                actionRef={pendingActionRef}
                                rowKey="id"
                                search={{ labelWidth: 100 }}
                                headerTitle="待审核的活动申请"
                                request={async (params, sort) => {
                                    const sortField = Object.keys(sort)?.[0];
                                    const sortOrder = sort?.[sortField] ?? undefined;
                                    const { data, code } = await listActivityVOByPageUsingPost({
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
                        label: '全部活动',
                        children: (
                            <ProTable<API.ActivityVO>
                                actionRef={actionRef}
                                rowKey="id"
                                search={{ labelWidth: 100 }}
                                headerTitle="全部活动"
                                request={async (params, sort) => {
                                    const sortField = Object.keys(sort)?.[0];
                                    const sortOrder = sort?.[sortField] ?? undefined;
                                    const { data, code } = await listActivityVOByPageUsingPost({
                                        ...params,
                                        sortField,
                                        sortOrder,
                                    } as API.ActivityQueryRequest);
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

export default ActivityAdminPage;
