package com.yupi.springbootinit.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.yupi.springbootinit.model.entity.PostComment;
import com.yupi.springbootinit.model.vo.PostCommentVO;

import javax.servlet.http.HttpServletRequest;

/**
 * 帖子评论服务
 */
public interface PostCommentService extends IService<PostComment> {

    /**
     * 发表评论
     */
    PostComment addComment(Long postId, String content, HttpServletRequest request);

    /**
     * 删除评论（评论者本人或管理员）
     */
    void deleteComment(Long commentId, HttpServletRequest request);

    /**
     * 分页查询帖子的评论（含用户信息，批量查询无 N+1）
     */
    Page<PostCommentVO> listCommentVO(Long postId, int current, int pageSize);
}
