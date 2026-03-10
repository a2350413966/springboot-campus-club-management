// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取未读消息数量 GET /api/message/unreadCount */
export async function getUnreadCountUsingGet(options?: { [key: string]: any }) {
    return request<API.BaseResponseLong_>('/api/message/unreadCount', {
        method: 'GET',
        ...(options || {}),
    });
}

/** 分页查收我的消息 GET /api/message/list/page */
export async function listUserMessagesUsingGet(
    params: {
        /** current */
        current?: number;
        /** pageSize */
        pageSize?: number;
    },
    options?: { [key: string]: any },
) {
    return request<API.BaseResponsePageMessage>('/api/message/list/page', {
        method: 'GET',
        params: {
            ...params,
        },
        ...(options || {}),
    });
}

/** 阅读单条消息（标为已读） POST /api/message/read */
export async function readMessageUsingPost(
    body: Record<string, any>,
    options?: { [key: string]: any },
) {
    return request<API.BaseResponseBoolean_>('/api/message/read', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        data: body,
        ...(options || {}),
    });
}

/** 全部标为已读 POST /api/message/readAll */
export async function readAllMessagesUsingPost(options?: { [key: string]: any }) {
    return request<API.BaseResponseBoolean_>('/api/message/readAll', {
        method: 'POST',
        ...(options || {}),
    });
}
