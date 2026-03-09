import type { ProColumns } from '@ant-design/pro-components';
import { ProFormDateTimePicker, ProFormSelect, ProFormText, ProFormTextArea, StepsForm } from '@ant-design/pro-components';
import '@umijs/max';
import { Modal, message } from 'antd';
import React from 'react';

// 注意这里使用的是后端的 API.ActivityUpdateRequest
interface Props {
    oldData?: any;
    visible: boolean;
    columns: ProColumns<any>[];
    onSubmit: (values: any) => void;
    onCancel: () => void;
}

/**
 * 更新活动信息节点
 *
 * @param fields
 */
const handleUpdate = async (fields: any) => {
    const hide = message.loading('执行高维指令...');
    try {
        const { updateActivityUsingPost } = await import('@/services/backend/activityController');
        await updateActivityUsingPost(fields);
        hide();
        message.success('更新成功');
        return true;
    } catch (error: any) {
        hide();
        message.error('调度失败：' + error.message);
        return false;
    }
};

/**
 * 活动强干预弹窗
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
                        width={680}
                        bodyStyle={{ padding: '32px 40px 48px' }}
                        destroyOnClose
                        title="中央活动编排所：修改活动参数"
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
                title="重写表面素材"
            >
                <ProFormText
                    name="title"
                    label="展出标题"
                    rules={[{ required: true, message: '必须存在标题！' }]}
                />
                <ProFormText
                    name="coverImage"
                    label="强制替换海报直链(Poster URL)"
                />
                <ProFormTextArea
                    name="description"
                    label="宣传语/概览修正"
                />
            </StepsForm.StepForm>
            <StepsForm.StepForm
                initialValues={oldData}
                title="强力参数干涉"
            >
                <ProFormDateTimePicker
                    name="startTime"
                    label="活动宣发时间"
                    rules={[{ required: true }]}
                />
                <ProFormText
                    name="maxSignup"
                    label="硬性锁死招募人数峰值"
                    tooltip="强制改变原本的发售额度。填写0代表不限制名额。"
                />
                <ProFormSelect
                    name="status"
                    label="状态锁死系统"
                    valueEnum={{
                        0: '强制重开招募 (0)',
                        1: '强行切为进行中 (1)',
                        2: '打下架/已挂起 (2)',
                    }}
                    rules={[{ required: true, message: '请配置状态！' }]}
                />
            </StepsForm.StepForm>
        </StepsForm>
    );
};
export default UpdateModal;
