package com.yupi.springbootinit.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.yupi.springbootinit.model.entity.Message;

import javax.servlet.http.HttpServletRequest;

public interface MessageService extends IService<Message> {
    long getUnreadCount(Long userId);

    Page<Message> listUserMessages(int current, int pageSize, HttpServletRequest request);

    void readMessage(Long messageId, HttpServletRequest request);

    void readAllMessages(HttpServletRequest request);

    /**
     * 发送一条系统消息
     * 
     * @param receiverId 接收者ID
     * @param type       消息类型 (如 "SYSTEM", "CLUB_REVIEW", 等)
     * @param title      消息标题
     * @param content    消息内容
     * @param relatedId  关联ID (可选，如俱乐部ID或活动ID)
     */
    void addSystemMessage(Long receiverId, String type, String title, String content, Long relatedId);
}
