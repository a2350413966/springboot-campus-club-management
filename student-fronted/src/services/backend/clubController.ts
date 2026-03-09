// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 创建社团 POST /api/club/add */
export async function addClubUsingPost(
    body: {
        clubName: string;
        category: string;
        description?: string;
        logo?: string;
        coverImage?: string;
        maxMembers?: number;
    },
    options?: { [key: string]: any },
) {
    return request<API.BaseResponseLong_>('/api/club/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: body,
        ...(options || {}),
    });
}

/** 更新社团 POST /api/club/update */
export async function updateClubUsingPost(
    body: API.ClubUpdateRequest,
    options?: { [key: string]: any },
) {
    return request<API.BaseResponseBoolean_>('/api/club/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: body,
        ...(options || {}),
    });
}

/** 分页查询社团列表 POST /api/club/list/page/vo */
export async function listClubVOByPageUsingPost(
    body: API.ClubQueryRequest,
    options?: { [key: string]: any },
) {
    return request<API.BaseResponsePageClubVO_>('/api/club/list/page/vo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: body,
        ...(options || {}),
    });
}

/** 获取社团详情 GET /api/club/get/vo */
export async function getClubVOByIdUsingGet(
    params: { id: string },
    options?: { [key: string]: any },
) {
    return request<API.BaseResponseClubVO_>('/api/club/get/vo', {
        method: 'GET',
        params,
        ...(options || {}),
    });
}

/** 申请加入社团 POST /api/club/join */
export async function joinClubUsingPost(
    body: { clubId: number; reason?: string },
    options?: { [key: string]: any },
) {
    return request<API.BaseResponseBoolean_>('/api/club/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: body,
        ...(options || {}),
    });
}

/** 退出社团 POST /api/club/quit */
export async function quitClubUsingPost(
    params: { clubId: number },
    options?: { [key: string]: any },
) {
    return request<API.BaseResponseBoolean_>('/api/club/quit', {
        method: 'POST',
        params,
        ...(options || {}),
    });
}

/** 删除社团 POST /api/club/delete */
export async function deleteClubUsingPost(
    body: API.DeleteRequest,
    options?: { [key: string]: any },
) {
    return request<API.BaseResponseBoolean_>('/api/club/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: body,
        ...(options || {}),
    });
}
