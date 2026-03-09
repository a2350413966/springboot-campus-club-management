-- =====================================================
-- 校园社团管理系统 — 业务表初始化脚本
-- 执行前请确保已切换到对应数据库：use my_db;
-- =====================================================

-- ---------------------------------------------------
-- 1. 社团表 club
-- ---------------------------------------------------
create table if not exists club
(
    id          bigint auto_increment comment 'id' primary key,
    clubName    varchar(128)                           not null comment '社团名称',
    category    varchar(64)                            not null comment '社团分类（科技/艺术/体育/文艺/公益/学术）',
    description text                                   null comment '社团简介',
    logo        varchar(1024)                          null comment '社团 Logo URL',
    coverImage  varchar(1024)                          null comment '社团封面图 URL',
    status      tinyint      default 0                 not null comment '状态：0=招募中 1=已满员 2=已解散',
    maxMembers  int          default 100               not null comment '最大成员数',
    memberCount int          default 0                 not null comment '当前成员数',
    leaderId    bigint                                 not null comment '社团负责人用户ID',
    userId      bigint                                 not null comment '创建人用户ID',
    createTime  datetime     default CURRENT_TIMESTAMP not null comment '创建时间',
    updateTime  datetime     default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间',
    isDelete    tinyint      default 0                 not null comment '是否删除',
    index idx_leaderId (leaderId),
    index idx_userId (userId),
    index idx_status (status),
    index idx_category (category)
) comment '社团' collate = utf8mb4_unicode_ci;

-- ---------------------------------------------------
-- 2. 社团成员表 club_member
--    记录用户与社团的关系
-- ---------------------------------------------------
create table if not exists club_member
(
    id         bigint auto_increment comment 'id' primary key,
    clubId     bigint                                 not null comment '社团ID',
    userId     bigint                                 not null comment '用户ID',
    role       varchar(32)  default 'member'          not null comment '角色：leader=会长 vice_leader=副会长 minister=部长 member=普通成员',
    status     tinyint      default 1                 not null comment '状态：0=待审核 1=已通过 2=已拒绝 3=已退出',
    joinTime   datetime                               null comment '正式加入时间',
    createTime datetime     default CURRENT_TIMESTAMP not null comment '申请时间',
    updateTime datetime     default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间',
    isDelete   tinyint      default 0                 not null comment '是否删除',
    unique key uk_club_user (clubId, userId),
    index idx_clubId (clubId),
    index idx_userId (userId),
    index idx_status (status)
) comment '社团成员' collate = utf8mb4_unicode_ci;

-- ---------------------------------------------------
-- 3. 入社申请表 join_request
--    用户申请加入社团的记录
-- ---------------------------------------------------
create table if not exists join_request
(
    id         bigint auto_increment comment 'id' primary key,
    clubId     bigint                                 not null comment '社团ID',
    userId     bigint                                 not null comment '申请人用户ID',
    reason     varchar(512)                           null comment '申请理由',
    status     tinyint      default 0                 not null comment '状态：0=待审核 1=已通过 2=已拒绝',
    reviewerId bigint                                 null comment '审核人用户ID',
    reviewTime datetime                               null comment '审核时间',
    reviewNote varchar(256)                           null comment '审核备注',
    createTime datetime     default CURRENT_TIMESTAMP not null comment '申请时间',
    updateTime datetime     default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间',
    isDelete   tinyint      default 0                 not null comment '是否删除',
    index idx_clubId (clubId),
    index idx_userId (userId),
    index idx_status (status)
) comment '入社申请' collate = utf8mb4_unicode_ci;

-- ---------------------------------------------------
-- 4. 活动表 activity
-- ---------------------------------------------------
create table if not exists activity
(
    id           bigint auto_increment comment 'id' primary key,
    clubId       bigint                                 not null comment '所属社团ID',
    title        varchar(256)                           not null comment '活动名称',
    description  text                                   null comment '活动详情',
    category     varchar(64)                            null comment '活动分类（竞赛/演出/比赛/展览/招募/公益）',
    coverImage   varchar(1024)                          null comment '活动封面图 URL',
    location     varchar(256)                           null comment '活动地点',
    startTime    datetime                               not null comment '活动开始时间',
    endTime      datetime                               not null comment '活动结束时间',
    signupStart  datetime                               null comment '报名开始时间',
    signupEnd    datetime                               null comment '报名截止时间',
    maxSignup    int          default 0                 not null comment '最大报名人数（0=不限）',
    signupCount  int          default 0                 not null comment '当前报名人数',
    status       tinyint      default 0                 not null comment '状态：0=报名中 1=进行中 2=已结束 3=已取消',
    userId       bigint                                 not null comment '发布人用户ID',
    createTime   datetime     default CURRENT_TIMESTAMP not null comment '创建时间',
    updateTime   datetime     default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间',
    isDelete     tinyint      default 0                 not null comment '是否删除',
    index idx_clubId (clubId),
    index idx_userId (userId),
    index idx_status (status),
    index idx_startTime (startTime)
) comment '活动' collate = utf8mb4_unicode_ci;

-- ---------------------------------------------------
-- 5. 活动报名表 activity_signup
-- ---------------------------------------------------
create table if not exists activity_signup
(
    id         bigint auto_increment comment 'id' primary key,
    activityId bigint                                 not null comment '活动ID',
    userId     bigint                                 not null comment '报名用户ID',
    status     tinyint      default 0                 not null comment '状态：0=待审核 1=报名成功 2=已拒绝 3=已取消',
    remark     varchar(256)                           null comment '备注',
    createTime datetime     default CURRENT_TIMESTAMP not null comment '报名时间',
    updateTime datetime     default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间',
    isDelete   tinyint      default 0                 not null comment '是否删除',
    unique key uk_activity_user (activityId, userId),
    index idx_activityId (activityId),
    index idx_userId (userId),
    index idx_status (status)
) comment '活动报名' collate = utf8mb4_unicode_ci;

-- 消息通知表
create table if not exists message
(
    id         bigint auto_increment comment 'id' primary key,
    type       varchar(128)                       not null comment '消息类型（如 POST_COMMENT, SYSTEM 等）',
    title      varchar(256)                       null comment '消息标题',
    content    varchar(1024)                      not null comment '消息内容',
    senderId   bigint                             not null comment '发送方用户 id',
    receiverId bigint                             not null comment '接收方用户 id',
    relatedId  bigint                             null comment '关联业务的 id',
    isRead     tinyint  default 0                 not null comment '是否已读（0-未读，1-已读）',
    createTime datetime default CURRENT_TIMESTAMP not null comment '创建时间',
    updateTime datetime default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间',
    isDelete   tinyint  default 0                 not null comment '是否删除',
    index idx_receiverId (receiverId)
) comment '消息通知';

