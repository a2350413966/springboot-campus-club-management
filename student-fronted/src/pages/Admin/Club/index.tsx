import UpdateModal from '@/pages/Admin/Club/components/UpdateModal';
import { deleteClubUsingPost, listClubVOByPageUsingPost } from '@/services/backend/clubController';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import '@umijs/max';
import { message, Space, Typography, Avatar } from 'antd';
import React, { useRef, useState } from 'react';

const { Text: AntText } = Typography;

/** 解析 leaderName，格式："姓名 (学号)" */
const parseLeader = (raw: string = '') => {
    const m = raw.match(/^(.+?)\s*\((.+?)\)$/);
    return m ? { name: m[1].trim(), studentId: m[2].trim() } : { name: raw, studentId: '' };
};

/**
 * 核心行政区：全校社团天眼台
 */
const ClubAdminPage: React.FC = () => {
    const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
    const actionRef = useRef<ActionType>();
    const [currentRow, setCurrentRow] = useState<API.ClubVO>();

    /**
     * 上帝之手：强杀节点（彻底从大盘注销该社团）
     * @param row
     */
    const handleDelete = async (row: API.ClubVO) => {
        const hide = message.loading('执行高维驱逐协议...');
        if (!row) return true;
        try {
            await deleteClubUsingPost({
                id: row.id as any,
            });
            hide();
            message.success('该社团已被强行取缔！全网数据擦除倒计时');
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
    const columns: ProColumns<API.ClubVO>[] = [
        {
            title: '系统唯一标识 (ID)',
            dataIndex: 'id',
            valueType: 'text',
            hideInForm: true,
            hideInSearch: true,
        },
        {
            title: '社团印记',
            dataIndex: 'logo',
            valueType: 'image',
            fieldProps: { width: 44 },
            hideInSearch: true,
        },
        {
            title: '官方核准名称',
            dataIndex: 'clubName',
            valueType: 'text',
        },
        {
            title: '隶属大类',
            dataIndex: 'category',
            valueType: 'text',
        },
        {
            title: '主理人',
            dataIndex: 'leaderName',
            valueType: 'text',
            hideInSearch: true,
            width: 180,
            render: (_, record) => {
                const { name, studentId } = parseLeader(record.leaderName || '');
                return (
                    <Space align="start">
                        <Avatar
                            size={28}
                            src={record.leaderAvatar || undefined}
                            style={record.leaderAvatar ? {} : { backgroundColor: '#1677ff', flexShrink: 0 }}
                        >
                            {!record.leaderAvatar && (name ? name.charAt(0) : '?')}
                        </Avatar>
                        <div style={{ lineHeight: 1.4 }}>
                            <AntText style={{ fontSize: 13, display: 'block' }}>{name || '-'}</AntText>
                            {studentId && (
                                <AntText type="secondary" style={{ fontSize: 12 }}>
                                    学号：{studentId}
                                </AntText>
                            )}
                        </div>
                    </Space>
                );
            },
        },
        {
            title: '在编人口',
            dataIndex: 'memberCount',
            valueType: 'digit',
            hideInSearch: true,
        },
        {
            title: '大盘挂牌状态',
            dataIndex: 'status',
            valueEnum: {
                0: { text: '开放/正在招人', status: 'Success' },
                1: { text: '私有/满员封盘', status: 'Default' },
                2: { text: '警告/封禁中', status: 'Error' },
            },
        },
        {
            title: '建规落户时间',
            sorter: true,
            dataIndex: 'createTime',
            valueType: 'dateTime',
            hideInSearch: true,
            hideInForm: true,
        },
        {
            title: '行政干预台',
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
                        强制编辑
                    </Typography.Link>
                    <Typography.Link type="danger" onClick={() => handleDelete(record)}>
                        就地解散
                    </Typography.Link>
                </Space>
            ),
        },
    ];

    return (
        <PageContainer title="天眼网 - 社团全息雷达">
            <ProTable<API.ClubVO>
                headerTitle={'行政总监视图：校级在榜社团矩阵'}
                actionRef={actionRef}
                rowKey="id"
                search={{
                    labelWidth: 120,
                }}
                request={async (params, sort, filter) => {
                    const sortField = Object.keys(sort)?.[0];
                    const sortOrder = sort?.[sortField] ?? undefined;

                    const { data, code } = await listClubVOByPageUsingPost({
                        ...params,
                        sortField,
                        sortOrder,
                        ...filter,
                    } as API.ClubQueryRequest);

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

export default ClubAdminPage;
