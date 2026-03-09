package com.yupi.springbootinit.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yupi.springbootinit.common.BaseResponse;
import com.yupi.springbootinit.common.DeleteRequest;
import com.yupi.springbootinit.common.ErrorCode;
import com.yupi.springbootinit.common.ResultUtils;
import com.yupi.springbootinit.exception.ThrowUtils;
import com.yupi.springbootinit.model.entity.PostComment;
import com.yupi.springbootinit.model.vo.PostCommentVO;
import com.yupi.springbootinit.service.PostCommentService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.Map;

/**
 * 帖子评论接口
 */
@RestController
@RequestMapping("/post_comment")
public class PostCommentController {

    @Resource
    private PostCommentService postCommentService;

    /**
     * 发表评论
     */
    @PostMapping("/add")
    public BaseResponse<PostComment> addComment(@RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        Object postIdObj = body.get("postId");
        Object contentObj = body.get("content");
        ThrowUtils.throwIf(postIdObj == null || contentObj == null, ErrorCode.PARAMS_ERROR);
        Long postId = Long.parseLong(postIdObj.toString());
        String content = contentObj.toString();
        PostComment comment = postCommentService.addComment(postId, content, request);
        return ResultUtils.success(comment);
    }

    /**
     * 删除评论
     */
    @PostMapping("/delete")
    public BaseResponse<Boolean> deleteComment(@RequestBody DeleteRequest deleteRequest,
            HttpServletRequest request) {
        ThrowUtils.throwIf(deleteRequest == null || deleteRequest.getId() <= 0, ErrorCode.PARAMS_ERROR);
        postCommentService.deleteComment(deleteRequest.getId(), request);
        return ResultUtils.success(true);
    }

    /**
     * 分页获取帖子评论列表（含用户信息，批量查询）
     */
    @GetMapping("/list")
    public BaseResponse<Page<PostCommentVO>> listComments(
            @RequestParam Long postId,
            @RequestParam(defaultValue = "1") int current,
            @RequestParam(defaultValue = "20") int pageSize,
            HttpServletRequest request) {
        ThrowUtils.throwIf(postId == null || postId <= 0, ErrorCode.PARAMS_ERROR);
        pageSize = Math.min(pageSize, 50);
        Page<PostCommentVO> page = postCommentService.listCommentVO(postId, current, pageSize);
        return ResultUtils.success(page);
    }
}
