package com.yupi.springbootinit.model.vo;

import com.yupi.springbootinit.model.entity.Post;
import java.io.Serializable;
import java.util.Date;
import java.util.List;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class PostVO implements Serializable {
    private Long id;
    private String title;
    private String content;
    private List<String> tagList;
    private Integer thumbNum;
    private Integer favourNum;
    private Long userId;
    private Date createTime;
    private Date updateTime;
    private UserVO user;
    private Boolean hasThumb;
    private Boolean hasFavour;

    public static PostVO objToVo(Post post) {
        if (post == null)
            return null;
        PostVO postVO = new PostVO();
        BeanUtils.copyProperties(post, postVO);
        if (post.getTags() != null) {
            try {
                postVO.setTagList(cn.hutool.json.JSONUtil.toList(post.getTags(), String.class));
            } catch (Exception e) {
                // Ignore parse error
            }
        }
        return postVO;
    }

    private static final long serialVersionUID = 1L;
}
