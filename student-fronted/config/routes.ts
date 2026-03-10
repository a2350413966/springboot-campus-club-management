export default [
    {
        path: '/user',
        layout: false,
        routes: [
            { name: '登录', path: '/user/login', component: './User/Login' },
            { name: '注册', path: '/user/register', component: './User/Register' },
        ],
    },
    { path: '/welcome', name: '首页', icon: 'smile', component: './Welcome' },
    { path: '/activity', name: '活动中心', icon: 'fire', component: './Activity' },
    { path: '/activity/detail/:id', name: '活动详情', component: './Activity/Detail', hideInMenu: true },
    { path: '/club', name: '社团中心', icon: 'cluster', component: './Club' },
    { path: '/club/detail/:id', name: '社团详情', component: './Club/Detail', hideInMenu: true },
    { path: '/post', name: '社群广场', icon: 'bulb', component: './Post' },
    { path: '/post/detail/:id', name: '帖子详情', component: './Post/Detail', hideInMenu: true },
    { path: '/post/my', name: '我的帖子', icon: 'send', component: './Post/My' },
    { path: '/my', name: '个人中心', icon: 'idcard', component: './My' },
    { path: '/message', name: '消息中心', icon: 'bell', component: './Message' },
    {
        path: '/tool',
        name: '实用工具',
        icon: 'tool',
        routes: [
            { path: '/tool/json', name: 'JSON提取工具', icon: 'fileText', component: './Tool/JsonExtractor' },
        ],
    },
    {
        path: '/admin',
        name: '管理页',
        icon: 'crown',
        access: 'canAdmin',
        routes: [
            { path: '/admin', redirect: '/admin/user' },
            { path: '/admin/user', name: '用户管理', component: './Admin/User' },
            { path: '/admin/activity', name: '活动管理', component: './Admin/Activity' },
            { path: '/admin/club', name: '社团审批', component: './Admin/Club' },
            { path: '/admin/post', name: '帖子管理', component: './Admin/Post' },
        ],
    },
    { path: '/', redirect: '/welcome' },
    { path: '*', layout: false, component: './404' },
];
