package com.yupi.springbootinit.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.yupi.springbootinit.model.dto.post.PostQueryRequest;
import com.yupi.springbootinit.model.entity.Post;
import com.yupi.springbootinit.model.vo.PostVO;

import javax.servlet.http.HttpServletRequest;

public interface PostService extends IService<Post> {
    void validPost(Post post, boolean add);

    Page<Post> searchFromEs(PostQueryRequest postQueryRequest);

    PostVO getPostVO(Post post, HttpServletRequest request);

    Page<PostVO> getPostVOPage(Page<Post> postPage, HttpServletRequest request);

    QueryWrapper<Post> getQueryWrapper(PostQueryRequest postQueryRequest);
}
