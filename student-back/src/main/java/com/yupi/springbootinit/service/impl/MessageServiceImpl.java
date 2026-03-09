package com.yupi.springbootinit.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.yupi.springbootinit.common.ErrorCode;
import com.yupi.springbootinit.exception.ThrowUtils;
import com.yupi.springbootinit.mapper.MessageMapper;
import com.yupi.springbootinit.model.entity.Message;
import com.yupi.springbootinit.model.entity.User;
import com.yupi.springbootinit.service.MessageService;
import com.yupi.springbootinit.service.UserService;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;

/**
 * 消息通知服务实现
 */
@Service
public class MessageServiceImpl extends ServiceImpl<MessageMapper, Message> implements MessageService {

    @Resource
    private UserService userService;

    @Override
    public long getUnreadCount(Long userId) {
        if (userId == null || userId <= 0) {
            return 0;
        }
        QueryWrapper<Message> qw = new QueryWrapper<>();
        qw.eq("receiverId", userId);
        qw.eq("isRead", 0);
        return this.count(qw);
    }

    @Override
    public Page<Message> listUserMessages(int current, int pageSize, HttpServletRequest request) {
        User loginUser = userService.getLoginUser(request);
        QueryWrapper<Message> qw = new QueryWrapper<>();
        qw.eq("receiverId", loginUser.getId());
        qw.orderByDesc("createTime");
        return this.page(new Page<>(current, pageSize), qw);
    }

    @Override
    public void readMessage(Long messageId, HttpServletRequest request) {
        ThrowUtils.throwIf(messageId == null || messageId <= 0, ErrorCode.PARAMS_ERROR);
        Message message = this.getById(messageId);
        ThrowUtils.throwIf(message == null, ErrorCode.NOT_FOUND_ERROR);

        User loginUser = userService.getLoginUser(request);
        ThrowUtils.throwIf(!message.getReceiverId().equals(loginUser.getId()), ErrorCode.NO_AUTH_ERROR);

        Message updateMessage = new Message();
        updateMessage.setId(messageId);
        updateMessage.setIsRead(1);
        this.updateById(updateMessage);
    }

    @Override
    public void readAllMessages(HttpServletRequest request) {
        User loginUser = userService.getLoginUser(request);
        UpdateWrapper<Message> uw = new UpdateWrapper<>();
        uw.eq("receiverId", loginUser.getId());
        uw.eq("isRead", 0);
        uw.set("isRead", 1);
        this.update(uw);
    }

    @Override
    public void addSystemMessage(Long receiverId, String type, String title, String content, Long relatedId) {
        if (receiverId == null || receiverId <= 0) {
            return;
        }
        Message msg = new Message();
        msg.setReceiverId(receiverId);
        msg.setSenderId(1L); // 默认系统发送者ID为1
        msg.setType(type);
        msg.setTitle(title);
        msg.setContent(content);
        msg.setRelatedId(relatedId);
        msg.setIsRead(0);
        this.save(msg);
    }
}
