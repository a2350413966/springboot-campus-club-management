package com.yupi.springbootinit.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yupi.springbootinit.common.BaseResponse;
import com.yupi.springbootinit.common.ResultUtils;
import com.yupi.springbootinit.model.entity.Message;
import com.yupi.springbootinit.model.entity.User;
import com.yupi.springbootinit.service.MessageService;
import com.yupi.springbootinit.service.UserService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * 消息通知接口
 */
@RestController
@RequestMapping("/message")
public class MessageController {

    @Resource
    private MessageService messageService;

    @Resource
    private UserService userService;

    /**
     * 获取未读消息数量
     */
    @GetMapping("/unreadCount")
    public BaseResponse<Long> getUnreadCount(HttpServletRequest request) {
        try {
            User loginUser = userService.getLoginUser(request);
            long count = messageService.getUnreadCount(loginUser.getId());
            return ResultUtils.success(count);
        } catch (Exception e) {
            return ResultUtils.success(0L);
        }
    }

    /**
     * 分页查收我的消息
     */
    @GetMapping("/list/page")
    public BaseResponse<Page<Message>> listUserMessages(
            @RequestParam(defaultValue = "1") int current,
            @RequestParam(defaultValue = "15") int pageSize,
            HttpServletRequest request) {
        Page<Message> messagePage = messageService.listUserMessages(current, pageSize, request);
        return ResultUtils.success(messagePage);
    }

    /**
     * 阅读单条消息（标为已读）
     */
    @PostMapping("/read")
    public BaseResponse<Boolean> readMessage(@RequestBody Map<String, Long> body, HttpServletRequest request) {
        Long id = body.get("id");
        messageService.readMessage(id, request);
        return ResultUtils.success(true);
    }

    /**
     * 全部标为已读
     */
    @PostMapping("/readAll")
    public BaseResponse<Boolean> readAllMessages(HttpServletRequest request) {
        messageService.readAllMessages(request);
        return ResultUtils.success(true);
    }
}
