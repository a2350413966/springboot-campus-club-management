import Footer from '@/components/Footer';
import { getLoginUserUsingGet } from '@/services/backend/userController';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import { AvatarDropdown } from './components/RightContent/AvatarDropdown';
import { MessageBell } from './components/RightContent/MessageBell';
import { requestConfig } from './requestConfig';

const loginPath = '/user/login';

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<InitialState> {
  const initialState: InitialState = {
    currentUser: undefined,
  };
  // 如果不是登录页面，执行
  const { location } = history;
  if (location.pathname !== loginPath) {
    try {
      const res = await getLoginUserUsingGet();
      initialState.currentUser = res.data;
    } catch (error: any) {
      // 如果未登录
    }

    // 模拟登录用户
    // const mockUser: API.LoginUserVO = {
    //   userAvatar: 'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
    //   userName: 'cao',
    //   userRole: 'admin',
    // };
    // initialState.currentUser = mockUser;
  }
  return initialState;
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
// @ts-ignore
export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  const currentPath = history.location.pathname;
  const isAdminPath = currentPath.startsWith('/admin');

  return {
    actionsRender: () => [<MessageBell key="MessageBell" />],
    avatarProps: {
      render: () => {
        return <AvatarDropdown />;
      },
    },
    // waterMarkProps: {
    //   content: initialState?.currentUser?.userName,
    // },
    footerRender: () => <Footer />,
    menuHeaderRender: undefined,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    ...defaultSettings,
    // 【动态标题】：如果是普通用户，显示“校园社团集市”，管理员保持“校园社团管理系统”
    title: initialState?.currentUser?.userRole !== 'admin' ? '校园社团集市' : '校园社团管理系统',
    // 【动态切换层：核心！】
    layout: isAdminPath ? 'mix' : 'top', // 后台用 mix(左侧+顶部)，前台用 top(无侧栏纯顶部)
    splitMenus: isAdminPath, // 后台菜单切割
    contentStyle: {
      padding: isAdminPath ? '24px' : '0', // 前台容器无内边距，为了做大图/瀑布流
      margin: 0,
      minHeight: '100vh',
    },
    // 【核心注入层：系统整体全域色彩引擎切换 —— 极客天青色流光】
    token: {
      bgLayout: isAdminPath
        ? '#f0f2f5' // 后台使用经典高效的浅灰背景
        : 'linear-gradient(135deg, #fdfbfb 0%, #f4faff 30%, #e0c3fc 70%, #8ec5fc 100%)', // 前台使用沉浸式渐变背景
      pageContainer: {
        colorBgPageContainer: 'transparent',
      },
    },
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request = requestConfig;
