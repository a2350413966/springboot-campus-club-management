import type { ProColumns } from '@ant-design/pro-components';
import { ProFormDateTimePicker, ProFormSelect, ProFormText, ProFormTextArea, StepsForm } from '@ant-design/pro-components';
import '@umijs/max';
import { Modal, message } from 'antd';
import React from 'react';

interface Props {
    oldData?: any;
    visible: boolean;
    columns: ProColumns<any>[];
    onSubmit: (values: any) => void;
    onCancel: () => void;
}

/**
 * 更新社团信息节点
 *
 * @param fields
 */
const handleUpdate = async (fields: any) => {
    const hide = message.loading('Configuring');
    try {
        const { updateClubUsingPost } = await import('@/services/backend/clubController');
        await updateClubUsingPost(fields);
        hide();
        message.success('更新成功');
        return true;
    } catch (error: any) {
        hide();
        message.error('更新失败：' + error.message);
        return false;
    }
};

/**
 * 更新弹窗
 * @param props
 * @constructor
 */
const UpdateModal: React.FC<Props> = (props) => {
    const { oldData, visible, onSubmit, onCancel } = props;

    if (!oldData) {
        return <></>;
    }

    return (
        <StepsForm<any>
            onFinish={async (values) => {
                const success = await handleUpdate({
                    ...values,
                    id: oldData.id as any,
                });
                if (success) {
                    onSubmit?.(values);
                }
            }}
            formProps={{
                initialValues: oldData,
            }}
            stepsProps={{
                size: 'small',
            }}
            stepsFormRender={(dom, submitter) => {
                return (
                    <Modal
                        width={640}
                        bodyStyle={{ padding: '32px 40px 48px' }}
                        destroyOnClose
                        title="上帝之手：编辑社团总表"
                        open={visible}
                        footer={submitter}
                        onCancel={() => {
                            onCancel?.();
                        }}
                    >
                        {dom}
                    </Modal>
                );
            }}
        >
            <StepsForm.StepForm
                initialValues={oldData}
                title="基本信息"
            >
                <ProFormText
                    name="clubName"
                    label="社团名称"
                    rules={[{ required: true, message: '必须输入名称！' }]}
                />
                <ProFormText
                    name="category"
                    label="二级类目"
                />
                <ProFormText
                    name="logo"
                    label="图标直链(Logo URL)"
                />
                <ProFormTextArea
                    name="description"
                    label="社团概述"
                />
            </StepsForm.StepForm>
            <StepsForm.StepForm
                initialValues={oldData}
                title="强干预与行政控制"
            >
                <ProFormSelect
                    name="status"
                    label="存续与招新状态 (上帝视角)"
                    valueEnum={{
                        0: '开放/招募中',
                        1: '私密/暂停招新',
                        2: '已封禁/打入黑房',
                    }}
                    rules={[{ required: true, message: '请配置状态！' }]}
                />
                <ProFormText
                    name="presidentId"
                    label="【慎用】更迭社长用户编号 (UserId)"
                    tooltip="直接修改会剥夺原社长权限，引发数据震荡"
                />
            </StepsForm.StepForm>
        </StepsForm>
    );
};
export default UpdateModal;
