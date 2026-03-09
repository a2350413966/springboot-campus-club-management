import UpdateModal from '@/pages/Admin/Activity/components/UpdateModal';
import { listActivityVOByPageUsingPost } from '@/services/backend/activityController';
import { request } from '@umijs/max';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import '@umijs/max';
import { message, Space, Typography } from 'antd';
import React, { useRef, useState } from 'react';

/**
 * 活动巡查署：全校事件池监控
 */
const ActivityAdminPage: React.FC = () => {
    const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.ActivityVO>();

    /**
     * 上帝之手：强杀节点（彻底从大盘注销该活动）
     * @param row
     */
    const handleDelete = async (row: API.ActivityVO) => {
        const hide = message.loading('执行高维驱逐协议...');
        if (!row) return true;
        try {
            await request('/api/activity/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                data: { id: row.id },
            });
            hide();
            message.success('该事件活动已被强行抹除！');
            actionRef?.current?.reload();
            return true;
        } catch (error: any) {
            hide();
            message.error('清除失败：' + error.message);
            return false;
        }
    };

    /**
     * 极权仪表盘：表头透视镜
     */
    const columns: ProColumns<API.ActivityVO>[] = [
        {
            title: '事务编号 (Event ID)',
            dataIndex: 'id',
            valueType: 'text',
            hideInForm: true,
            hideInSearch: true,
        },
        {
            title: '海报/宣传图',
            dataIndex: 'coverImage',
            valueType: 'image',
            fieldProps: { width: 56 },
            hideInSearch: true,
        },
        {
            title: '活动主题称谓',
            dataIndex: 'title',
            valueType: 'text',
        },
        {
            title: '发起方 (社团指名)',
            dataIndex: 'clubName', // 假设后端 VO 带了 clubName 或者是 clubVO
            valueType: 'text',
            render: (_, record) => {
                return record.clubVO?.clubName || record.clubName || '系统指派/独立活动';
            }
        },
        {
            title: '容量池 [已签到/总发售]',
            dataIndex: 'capacity',
            valueType: 'text',
            hideInSearch: true,
            render: (_, record) => {
                const max = record.maxSignup ? record.maxSignup : '∞(不限)';
                return `${record.signupCount || 0} / ${max}`;
            }
        },
        {
            title: '时轨推进状态',
            dataIndex: 'status',
            valueEnum: {
                0: { text: '开盘吸筹中', status: 'Processing' },
                1: { text: '火热进行时', status: 'Success' },
                2: { text: '已闭店结算', status: 'Default' },
            },
        },
        {
            title: '系统发起锚点',
            sorter: true,
            dataIndex: 'createTime',
            valueType: 'dateTime',
            hideInSearch: true,
            hideInForm: true,
        },
        {
            title: '行政干涉枢纽',
            dataIndex: 'option',
            valueType: 'option',
            width: 150,
            render: (_, record) => (
                <Space size="middle">
                    <Typography.Link
                        onClick={() => {
                            setCurrentRow(record);
                            setUpdateModalVisible(true);
                        }}
                    >
                        校准切入
                    </Typography.Link>
                    <Typography.Link type="danger" onClick={() => handleDelete(record)}>
                        强力停办
                    </Typography.Link>
                </Space>
            ),
        },
    ];

    return (
        <PageContainer title="巡视台 - 活动强管控表单">
            <ProTable<API.ActivityVO>
                headerTitle={'全域记录监测链：实况/历史排期池'}
                actionRef={actionRef}
                rowKey="id"
                search={{
                    labelWidth: 120,
                }}
                request={async (params, sort, filter) => {
                    const sortField = Object.keys(sort)?.[0];
                    const sortOrder = sort?.[sortField] ?? undefined;

                    const { data, code } = await listActivityVOByPageUsingPost({
                        ...params,
                        sortField,
                        sortOrder,
                        ...filter,
                    } as API.ActivityQueryRequest);

                    return {
                        success: code === 0,
                        data: data?.records || [],
                        total: Number(data?.total) || 0,
                    };
                }}
                columns={columns}
            />

            <UpdateModal
                visible={updateModalVisible}
                columns={columns}
                oldData={currentRow}
                onSubmit={() => {
                    setUpdateModalVisible(false);
                    setCurrentRow(undefined);
                    actionRef.current?.reload();
                }}
                onCancel={() => {
                    setUpdateModalVisible(false);
                }}
            />
        </PageContainer>
    );
};

export default ActivityAdminPage;
