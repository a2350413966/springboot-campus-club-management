import { defineConfig } from '@umijs/max';
import defaultSettings from './defaultSettings';
import proxy from './proxy';
import routes from './routes';

export default defineConfig({
    hash: true,
    routes,
    theme: {
        'root-entry-name': 'variable',
    },
    ignoreMomentLocale: true,
    proxy: proxy.dev,
    fastRefresh: true,
    model: {},
    initialState: {},
    title: '校园社团管理系统',
    layout: {
        locale: true,
        ...defaultSettings,
    },
    moment2dayjs: {
        preset: 'antd',
        plugins: ['duration'],
    },
    locale: {
        default: 'zh-CN',
        antd: true,
        baseNavigator: true,
    },
    antd: {},
    request: {},
    access: {},
    headScripts: [
        { src: '/scripts/loading.js', async: true },
    ],
    presets: ['umi-presets-pro'],
});
