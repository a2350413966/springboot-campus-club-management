package com.yupi.springbootinit.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.yupi.springbootinit.model.entity.Post;
import org.apache.ibatis.annotations.Param;
import java.util.Date;
import java.util.List;

public interface PostMapper extends BaseMapper<Post> {
    List<Post> listPostWithDelete(@Param("minUpdateTime") Date minUpdateTime);
}
