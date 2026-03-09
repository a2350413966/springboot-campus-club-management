// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 发布活动 POST /api/activity/add */
export async function addActivityUsingPost(
    body: {
        clubId?: string;
        title: string;
        description?: string;
        category?: string;
        coverImage?: string;
        location?: string;
        startTime?: string;
        endTime?: string;
        signupStart?: string;
        signupEnd?: string;
        maxSignup?: number;
    },
    options?: { [key: string]: any },
) {
    return request<API.BaseResponseLong_>('/api/activity/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: body,
        ...(options || {}),
    });
}

/** 分页查询活动列表 POST /api/activity/list/page/vo */
export async function listActivityVOByPageUsingPost(
    body: API.ActivityQueryRequest,
    options?: { [key: string]: any },
) {
    return request<API.BaseResponsePageActivityVO_>('/api/activity/list/page/vo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: body,
        ...(options || {}),
    });
}

/** 获取活动详情 GET /api/activity/get/vo */
export async function getActivityVOByIdUsingGet(
    params: { id: string },
    options?: { [key: string]: any },
) {
    return request<API.BaseResponseActivityVO_>('/api/activity/get/vo', {
        method: 'GET',
        params,
        ...(options || {}),
    });
}

/** 报名活动 POST /api/activity/signup */
export async function signupActivityUsingPost(
    params: { activityId: string },
    options?: { [key: string]: any },
) {
    return request<API.BaseResponseBoolean_>('/api/activity/signup', {
        method: 'POST',
        params,
        ...(options || {}),
    });
}

/** 取消报名 POST /api/activity/signup/cancel */
export async function cancelSignupUsingPost(
    params: { activityId: string },
    options?: { [key: string]: any },
) {
    return request<API.BaseResponseBoolean_>('/api/activity/signup/cancel', {
        method: 'POST',
        params,
        ...(options || {}),
    });
}

/** 更新活动 POST /api/activity/update */
export async function updateActivityUsingPost(
    body: { id?: string;[key: string]: any },
    options?: { [key: string]: any },
) {
    return request<API.BaseResponseBoolean_>('/api/activity/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: body,
        ...(options || {}),
    });
}


/** 获取活动报名人员名单 GET /api/activity/signup/list */
export async function listActivitySignupsUsingGet(
    params: { activityId: string },
    options?: { [key: string]: any },
) {
    return request<API.BaseResponseListMapStringObject_>('/api/activity/signup/list', {
        method: 'GET',
        params,
        ...(options || {}),
    });
}
