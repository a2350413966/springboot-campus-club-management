package com.yupi.springbootinit.model.vo;

import java.io.Serializable;
import java.util.Date;
import lombok.Data;

@Data
public class PostCommentVO implements Serializable {
    private Long id;
    private Long postId;
    private Long userId;
    private String content;
    private Date createTime;
    private UserVO user;
    private static final long serialVersionUID = 1L;
}
