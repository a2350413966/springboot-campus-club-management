import { uploadFileUsingPost } from '@/services/backend/fileController';
import { updateMyUserUsingPost } from '@/services/backend/userController';
import { PageContainer, ProForm, ProFormText, ProFormTextArea, ProFormRadio, ProFormDigit } from '@ant-design/pro-components';
import { useModel, request } from '@umijs/max';
import {
    Avatar,
    Button,
    Card,
    Col,
    Empty,
    message,
    Modal,
    Progress,
    Row,
    Spin,
    Statistic,
    Tag,
    Typography,
    Upload,
} from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload';
import React, { useState, useEffect } from 'react';

const { Text, Paragraph, Title } = Typography;

const roleColor: Record<string, string> = { leader: 'red', admin: 'orange', member: 'default', '会长': 'red', '副会长': 'orange', '部长': 'gold' };
const roleLabel: Record<string, string> = { leader: '会长', admin: '管理员', member: '成员' };
const activityStatusColor: Record<string, string> = { '已报名': 'green', '审核中': 'orange', '已参与': 'blue', '已拒绝': 'red' };

const ClubRoleTag: React.FC<{ role: string }> = ({ role }) => {
    const label = roleLabel[role] || role || '成员';
    const color = roleColor[role] || 'default';
    return <Tag color={color}>{label}</Tag>;
};

// ─── 编辑资料弹窗 ────────────────────────────────────────────────────────────
interface EditProfileModalProps {
    open: boolean;
    initialValues: API.UserUpdateMyRequest;
    onClose: () => void;
    onSuccess: (updated: API.UserUpdateMyRequest) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
    open,
    initialValues,
    onClose,
    onSuccess,
}) => {
    const [submitLoading, setSubmitLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string | undefined>(initialValues.userAvatar);
    const [form] = ProForm.useForm<API.UserUpdateMyRequest>();

    // 每次弹窗打开时重置预览头像
    const handleAfterOpen = (visible: boolean) => {
        if (visible) {
            setAvatarUrl(initialValues.userAvatar);
            form.setFieldsValue(initialValues);
        }
    };

    const handleFinish = async (values: API.UserUpdateMyRequest) => {
        setSubmitLoading(true);
        try {
            await updateMyUserUsingPost(values);
            message.success('个人资料更新成功！');
            onSuccess(values);
            onClose();
        } catch (e: any) {
            message.error(`更新失败：${e.message}`);
        } finally {
            setSubmitLoading(false);
        }
    };

    // 上传前校验：格式 + 大小
    const beforeUpload = (file: RcFile) => {
        const allowed = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
        if (!allowed.includes(file.type)) {
            message.error('仅支持 JPG / PNG / SVG / WEBP 格式的图片！');
            return false;
        }
        if (file.size / 1024 / 1024 >= 1) {
            message.error('头像图片大小不能超过 1MB！');
            return false;
        }
        return true;
    };

    // 自定义上传：调用后端接口，回填 form 字段
    const handleUpload = async ({ file }: { file: RcFile | UploadFile }) => {
        setUploading(true);
        try {
            const res = await uploadFileUsingPost({ biz: 'user_avatar' }, {}, file as File);
            const url = res.data as string;
            setAvatarUrl(url);
            form.setFieldValue('userAvatar', url);
            message.success('头像上传成功！');
        } catch (e: any) {
            message.error(`上传失败：${e.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <Modal
            title="编辑个人资料"
            open={open}
            onCancel={onClose}
            afterOpenChange={handleAfterOpen}
            footer={null}
            width={600}
            destroyOnClose
        >
            <ProForm<API.UserUpdateMyRequest>
                form={form}
                initialValues={initialValues}
                onFinish={handleFinish}
                submitter={{
                    render: () => (
                        <div style={{ textAlign: 'right', marginTop: 8 }}>
                            <Button style={{ marginRight: 8 }} onClick={onClose}>
                                取消
                            </Button>
                            <Button type="primary" htmlType="submit" loading={submitLoading}>
                                保存修改
                            </Button>
                        </div>
                    ),
                }}
            >
                {/* 头像上传区 */}
                <ProForm.Item label="头像" name="userAvatar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <Spin spinning={uploading}>
                            <Avatar
                                size={72}
                                src={avatarUrl}
                                style={{ background: '#1677ff', fontSize: 28, flexShrink: 0 }}
                            >
                                {!avatarUrl && '👤'}
                            </Avatar>
                        </Spin>
                        <div>
                            <Upload
                                accept="image/jpeg,image/png,image/svg+xml,image/webp"
                                showUploadList={false}
                                beforeUpload={beforeUpload}
                                customRequest={handleUpload as any}
                            >
                                <Button loading={uploading}>
                                    {uploading ? '上传中…' : '📷 点击上传头像'}
                                </Button>
                            </Upload>
                            <div style={{ color: '#999', fontSize: 12, marginTop: 6 }}>
                                支持 JPG / PNG / WEBP，大小 ≤ 1MB
                            </div>
                        </div>
                    </div>
                </ProForm.Item>
                <ProFormText
                    name="userName"
                    label="昵称"
                    placeholder="请输入昵称"
                    rules={[{ required: true, message: '昵称不能为空' }]}
                />

                <ProForm.Group title="真实学籍档案 (选填)" style={{ marginTop: 12 }}>
                    <ProFormText name="realName" label="真实姓名" placeholder="请输入姓名" width="sm" />
                    <ProFormText name="studentId" label="学号" placeholder="请输入学号" width="sm" />
                    <ProFormRadio.Group
                        name="gender"
                        label="性别"
                        options={[{ label: '保密', value: 0 }, { label: '男', value: 1 }, { label: '女', value: 2 }]}
                    />
                    <ProFormText name="phone" label="联系电话" placeholder="请输入电话" width="sm" />
                    <ProFormText name="college" label="所属学院" placeholder="如 计算机学院" width="sm" />
                    <ProFormText name="major" label="所属专业" placeholder="如 软件工程" width="sm" />
                    <ProFormDigit name="enrollmentYear" label="入学年份" placeholder="如 2023" width="sm" fieldProps={{ precision: 0 }} />
                </ProForm.Group>

                <ProFormTextArea
                    name="userProfile"
                    label="个人简介"
                    placeholder="介绍一下你自己吧～"
                    fieldProps={{ rows: 3, maxLength: 150, showCount: true }}
                />
            </ProForm>
        </Modal>
    );
};

// ─── 主页面 ──────────────────────────────────────────────────────────────────
const MyPage: React.FC = () => {
    const { initialState, setInitialState } = useModel('@@initialState');
    const currentUser = initialState?.currentUser;
    const userName = currentUser?.userName || '同学';
    const avatar = currentUser?.userAvatar;

    const [editOpen, setEditOpen] = useState(false);

    // ── 数据状态 ────────────────────────────────
    const [myClubs, setMyClubs] = useState<any[]>([]);
    const [loadingClubs, setLoadingClubs] = useState(true);
    const [myActivities, setMyActivities] = useState<any[]>([]);
    const [myCreatedActivities, setMyCreatedActivities] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(true);

    useEffect(() => {
        if (!currentUser) return;
        // 我加入(含创建) 的社团
        request('/api/club/my/list', { method: 'POST', data: { current: 1, pageSize: 50 } })
            .then((res: any) => { setMyClubs(res?.data?.records || []); setLoadingClubs(false); })
            .catch(() => setLoadingClubs(false));
        // 我参与的活动
        request('/api/activity/my/list', { method: 'POST', data: { current: 1, pageSize: 50 } })
            .then((res: any) => { setMyActivities(res?.data?.records || []); })
            .catch(() => { });
        // 我创建的活动(按 userId 过滤)
        request('/api/activity/list/page/vo', { method: 'POST', data: { current: 1, pageSize: 50, userId: currentUser.id } })
            .then((res: any) => { setMyCreatedActivities(res?.data?.records || []); setLoadingActivities(false); })
            .catch(() => setLoadingActivities(false));
    }, [currentUser?.id]);

    // 我创建的社团 = myRole 为 leader 的那些
    const myCreatedClubs = myClubs.filter((c) => c.myRole === 'leader');
    // 我加入但非创建的社团
    const myJoinedClubs = myClubs.filter((c) => c.myRole !== 'leader');

    /** 编辑成功后同步更新 initialState，触发全局刷新（头像、用户名等） */
    const handleEditSuccess = (updated: API.UserUpdateMyRequest) => {
        setInitialState({
            ...initialState,
            currentUser: {
                ...currentUser,
                ...updated, // 整体散装进去
                userName: updated.userName ?? currentUser?.userName,
            },
        });
    };

    return (
        <PageContainer title="👤 我的社团">
            {/* 个人信息卡片 */}
            <Card
                style={{
                    borderRadius: 16,
                    marginBottom: 20,
                    background: 'linear-gradient(135deg, #1677ff15, #7c3aed10)',
                }}
                bodyStyle={{ padding: '28px 32px' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                    <Avatar
                        size={80}
                        src={avatar}
                        style={{ background: '#1677ff', fontSize: 32, flexShrink: 0 }}
                    >
                        {!avatar && userName[0]}
                    </Avatar>
                    <div style={{ flex: 1 }}>
                        <Title level={4} style={{ margin: 0 }}>
                            {userName}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginTop: 4 }}>
                            {currentUser?.college ? `${currentUser.college} · ${currentUser.major || '未知专业'}` : '身份：神秘同学（未填写学籍资料）'}
                            {currentUser?.studentId && ` · 学号: ${currentUser.studentId}`}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>
                            {currentUser?.userProfile || '这位同学很神秘，还没有填写简介～'}
                        </Text>
                        <div style={{ marginTop: 12, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <Tag color="blue">加入 {myClubs.length} 个社团</Tag>
                            <Tag color="green">参与 {myActivities.length} 场活动</Tag>
                            <Tag
                                color="purple"
                                style={{ cursor: 'pointer' }}
                                onClick={() => (window.location.href = '/post/my')}
                            >
                                💬 我的帖子
                            </Tag>
                        </div>
                    </div>
                    {currentUser ? (
                        <Button type="primary" ghost onClick={() => setEditOpen(true)}>
                            ✏️ 编辑个人资料
                        </Button>
                    ) : (
                        <Button type="primary" onClick={() => (window.location.href = '/user/login')}>
                            登录以探索更多功能
                        </Button>
                    )}
                </div>
            </Card>

            {/* 统计栏 - 全部动态 */}
            <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                {[
                    { title: '加入的社团', value: myClubs.length, color: '#1677ff', icon: '🏛️' },
                    { title: '创建的社团', value: myCreatedClubs.length, color: '#faad14', icon: '👑' },
                    { title: '参与的活动', value: myActivities.length, color: '#52c41a', icon: '📅' },
                    { title: '创建的活动', value: myCreatedActivities.length, color: '#9c27b0', icon: '✏️' },
                ].map((stat) => (
                    <Col xs={12} sm={6} key={stat.title}>
                        <Card style={{ borderRadius: 12, textAlign: 'center' }} bodyStyle={{ padding: '20px 12px' }}>
                            <div style={{ fontSize: 28, marginBottom: 6 }}>{stat.icon}</div>
                            <Statistic
                                title={<span style={{ fontSize: 12 }}>{stat.title}</span>}
                                value={stat.value}
                                valueStyle={{ color: stat.color, fontSize: 24, fontWeight: 700 }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* 社团区块 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                {/* 我加入的社团 */}
                <Col xs={24} lg={12}>
                    <Card
                        title="🏛️ 我加入的社团"
                        style={{ borderRadius: 14 }}
                        extra={<Button type="link" size="small" onClick={() => (window.location.href = '/club')}>去发现更多 →</Button>}
                    >
                        <Spin spinning={loadingClubs}>
                            {myJoinedClubs.length === 0 ? (
                                <Empty description="还没有加入任何社团，去社团广场看看吧！" />
                            ) : (
                                myJoinedClubs.map((club) => (
                                    <div key={club.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                                        <Avatar size={40} src={club.logo} style={{ background: '#1677ff18', flexShrink: 0 }}>{!club.logo && '🏛️'}</Avatar>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.clubName}</div>
                                            <div style={{ fontSize: 12, color: '#999' }}>
                                                <ClubRoleTag role={club.myRole} />
                                                <Tag color="default" style={{ marginLeft: 4 }}>{club.category || '未分类'}</Tag>
                                            </div>
                                        </div>
                                        <Button size="small" type="primary" ghost onClick={() => (window.location.href = `/club/${club.id}`)}>查看详情</Button>
                                    </div>
                                ))
                            )}
                        </Spin>
                    </Card>
                </Col>

                {/* 我创建的社团 */}
                <Col xs={24} lg={12}>
                    <Card
                        title="👑 我创建的社团"
                        style={{ borderRadius: 14 }}
                        extra={<Button type="link" size="small" onClick={() => (window.location.href = '/club')}>全部社团 →</Button>}
                    >
                        <Spin spinning={loadingClubs}>
                            {myCreatedClubs.length === 0 ? (
                                <Empty description="你还没有创建社团" />
                            ) : (
                                myCreatedClubs.map((club) => (
                                    <div key={club.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                                        <Avatar size={40} src={club.logo} style={{ background: '#faad1418', flexShrink: 0 }}>{!club.logo && '🏛️'}</Avatar>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.clubName}</div>
                                            <div style={{ fontSize: 12, color: '#999' }}>
                                                <Tag color="red">会长</Tag>
                                                <Tag color="default" style={{ marginLeft: 4 }}>{club.category || '未分类'}</Tag>
                                                <span style={{ marginLeft: 4 }}>{club.memberCount || 1} 名成员</span>
                                            </div>
                                        </div>
                                        <Button size="small" type="primary" ghost onClick={() => (window.location.href = `/club/${club.id}`)}>管理详情</Button>
                                    </div>
                                ))
                            )}
                        </Spin>
                    </Card>
                </Col>
            </Row>

            {/* 活动区块 */}
            <Row gutter={[16, 16]}>
                {/* 我参与的活动 */}
                <Col xs={24} lg={12}>
                    <Card
                        title="📅 我参与的活动"
                        style={{ borderRadius: 14 }}
                        extra={<Button type="link" size="small" onClick={() => (window.location.href = '/activity')}>全部活动 →</Button>}
                    >
                        <Spin spinning={loadingActivities}>
                            {myActivities.length === 0 ? (
                                <Empty description="还没有参与任何活动" />
                            ) : (
                                myActivities.map((act) => (
                                    <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#52c41a18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {act.coverImage ? <img src={act.coverImage} alt="cover" style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} /> : '📅'}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.title}</div>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{act.activityTime ? new Date(act.activityTime).toLocaleDateString() : ''} · {act.location || '地点待定'}</Text>
                                        </div>
                                        <Button size="small" onClick={() => (window.location.href = `/activity/${act.id}`)}>查看详情</Button>
                                    </div>
                                ))
                            )}
                        </Spin>
                    </Card>
                </Col>

                {/* 我创建的活动 */}
                <Col xs={24} lg={12}>
                    <Card
                        title="✏️ 我创建的活动"
                        style={{ borderRadius: 14 }}
                        extra={<Button type="link" size="small" onClick={() => (window.location.href = '/activity')}>发布活动 →</Button>}
                    >
                        <Spin spinning={loadingActivities}>
                            {myCreatedActivities.length === 0 ? (
                                <Empty description="你还没有发布过活动" />
                            ) : (
                                myCreatedActivities.map((act) => (
                                    <div key={act.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 8, background: '#9c27b018', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            {act.coverImage ? <img src={act.coverImage} alt="cover" style={{ width: '100%', height: '100%', borderRadius: 8, objectFit: 'cover' }} /> : '✏️'}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{act.title}</div>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {act.activityTime ? new Date(act.activityTime).toLocaleDateString() : '时间待定'}
                                                {act.signupCount !== undefined && ` · ${act.signupCount} 人报名`}
                                            </Text>
                                        </div>
                                        <Button size="small" type="primary" ghost onClick={() => (window.location.href = `/activity/${act.id}`)}>管理详情</Button>
                                    </div>
                                ))
                            )}
                        </Spin>
                    </Card>
                </Col>
            </Row>

            {/* 编辑资料弹窗 */}
            <EditProfileModal
                open={editOpen}
                initialValues={{
                    // @ts-ignore
                    userName: currentUser?.userName,
                    userAvatar: currentUser?.userAvatar,
                    userProfile: currentUser?.userProfile,
                    studentId: currentUser?.studentId,
                    realName: currentUser?.realName,
                    gender: currentUser?.gender ?? 0,
                    phone: currentUser?.phone,
                    college: currentUser?.college,
                    major: currentUser?.major,
                    enrollmentYear: currentUser?.enrollmentYear,
                }}
                onClose={() => setEditOpen(false)}
                onSuccess={handleEditSuccess}
            />
        </PageContainer>
    );
};

export default MyPage;
