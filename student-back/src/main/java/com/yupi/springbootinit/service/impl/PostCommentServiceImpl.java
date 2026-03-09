package com.yupi.springbootinit.service.impl;

import cn.hutool.json.JSONUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.yupi.springbootinit.common.ErrorCode;
import com.yupi.springbootinit.exception.BusinessException;
import com.yupi.springbootinit.exception.ThrowUtils;
import com.yupi.springbootinit.mapper.PostCommentMapper;
import com.yupi.springbootinit.model.entity.Post;
import com.yupi.springbootinit.model.entity.PostComment;
import com.yupi.springbootinit.model.entity.User;
import com.yupi.springbootinit.model.vo.PostCommentVO;
import com.yupi.springbootinit.model.vo.UserVO;
import com.yupi.springbootinit.service.PostCommentService;
import com.yupi.springbootinit.service.MessageService;
import com.yupi.springbootinit.model.entity.Message;
import com.yupi.springbootinit.service.PostService;
import com.yupi.springbootinit.service.UserService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.Set;

import java.util.stream.Collectors;

/**
 * 帖子评论服务实现
 */
@Service
public class PostCommentServiceImpl extends ServiceImpl<PostCommentMapper, PostComment>
        implements PostCommentService {

    @Resource
    private UserService userService;

    @Resource
    private PostService postService;

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    @Resource
    private MessageService messageService;

    private static final String CACHE_KEY_PREFIX = "post:comment:page:";

    @Override
    public PostComment addComment(Long postId, String content, HttpServletRequest request) {
        ThrowUtils.throwIf(postId == null || postId <= 0, ErrorCode.PARAMS_ERROR, "帖子不存在");
        ThrowUtils.throwIf(StringUtils.isBlank(content), ErrorCode.PARAMS_ERROR, "评论内容不能为空");
        ThrowUtils.throwIf(content.length() > 500, ErrorCode.PARAMS_ERROR, "评论内容不能超过500字");
        Post post = postService.getById(postId);
        ThrowUtils.throwIf(post == null, ErrorCode.NOT_FOUND_ERROR, "帖子不存在");
        User loginUser = userService.getLoginUser(request);
        PostComment comment = new PostComment();
        comment.setPostId(postId);
        comment.setUserId(loginUser.getId());
        comment.setContent(content.trim());
        this.save(comment);

        // 发送消息通知（这里去掉了“必须是别人评论”的限制，方便你自己测试的时候自己评论自己也能弹出通知）
        Message message = new Message();
        message.setType("POST_COMMENT");
        message.setTitle("帖子收到新评论");
        String abbrevContent = content.trim().length() > 15
                ? content.trim().substring(0, 15) + "..."
                : content.trim();
        message.setContent("【" + loginUser.getUserName() + "】评论了帖子：" + abbrevContent);
        message.setSenderId(loginUser.getId());
        message.setReceiverId(post.getUserId());
        message.setRelatedId(postId);
        messageService.save(message);

        // 清理当前帖子的评论分页缓存
        clearCommentCache(postId);

        return comment;
    }

    @Override
    public void deleteComment(Long commentId, HttpServletRequest request) {
        ThrowUtils.throwIf(commentId == null || commentId <= 0, ErrorCode.PARAMS_ERROR);
        PostComment comment = this.getById(commentId);
        ThrowUtils.throwIf(comment == null, ErrorCode.NOT_FOUND_ERROR, "评论不存在");
        User loginUser = userService.getLoginUser(request);
        boolean isOwner = comment.getUserId().equals(loginUser.getId());
        boolean isAdmin = userService.isAdmin(loginUser);
        if (!isOwner && !isAdmin) {
            throw new BusinessException(ErrorCode.NO_AUTH_ERROR, "无权限删除此评论");
        }
        Long postId = comment.getPostId();
        this.removeById(commentId);

        // 清理当前帖子的评论分页缓存
        clearCommentCache(postId);
    }

    @Override
    public Page<PostCommentVO> listCommentVO(Long postId, int current, int pageSize) {
        ThrowUtils.throwIf(postId == null || postId <= 0, ErrorCode.PARAMS_ERROR);

        // 0. 判断缓存
        String cacheKey = CACHE_KEY_PREFIX + postId + ":" + current + ":" + pageSize;
        String cachedValue = stringRedisTemplate.opsForValue().get(cacheKey);
        if (StringUtils.isNotBlank(cachedValue)) {
            Page<?> rawPage = JSONUtil.toBean(cachedValue, Page.class);
            Page<PostCommentVO> page = new Page<>(rawPage.getCurrent(), rawPage.getSize(), rawPage.getTotal());
            if (rawPage.getRecords() != null) {
                List<PostCommentVO> voList = JSONUtil.toList(JSONUtil.toJsonStr(rawPage.getRecords()),
                        PostCommentVO.class);
                page.setRecords(voList);
            }
            return page;
        }

        // 1. 分页查评论（1次 SQL）
        QueryWrapper<PostComment> qw = new QueryWrapper<>();
        qw.eq("postId", postId).orderByAsc("createTime");
        Page<PostComment> commentPage = this.page(new Page<>(current, pageSize), qw);

        // 2. 批量查用户（1次 SQL，无 N+1）
        Set<Long> userIds = commentPage.getRecords().stream()
                .map(PostComment::getUserId).collect(Collectors.toSet());
        Map<Long, User> userMap = userIds.isEmpty() ? java.util.Collections.emptyMap()
                : userService.listByIds(userIds).stream()
                        .collect(Collectors.toMap(User::getId, u -> u));

        // 3. 内存拼装 VO
        List<PostCommentVO> voList = commentPage.getRecords().stream().map(c -> {
            PostCommentVO vo = new PostCommentVO();
            BeanUtils.copyProperties(c, vo);
            User u = userMap.get(c.getUserId());
            if (u != null) {
                UserVO userVO = new UserVO();
                BeanUtils.copyProperties(u, userVO);
                vo.setUser(userVO);
            }
            return vo;
        }).collect(Collectors.toList());

        // 4. 返回强类型分页并写入缓存（设置 5 分钟过期，防止内存被打满）
        Page<PostCommentVO> resultPage = new Page<>(commentPage.getCurrent(), commentPage.getSize(),
                commentPage.getTotal());
        resultPage.setRecords(voList);
        stringRedisTemplate.opsForValue().set(cacheKey, JSONUtil.toJsonStr(resultPage), 5,
                java.util.concurrent.TimeUnit.MINUTES);

        return resultPage;
    }

    private void clearCommentCache(Long postId) {
        String pattern = CACHE_KEY_PREFIX + postId + ":*";
        Set<String> keys = stringRedisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            stringRedisTemplate.delete(keys);
        }
    }
}
