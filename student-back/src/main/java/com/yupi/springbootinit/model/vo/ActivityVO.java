package com.yupi.springbootinit.model.vo;

import com.yupi.springbootinit.model.entity.Activity;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;
import org.springframework.beans.BeanUtils;

@Data
public class ActivityVO implements Serializable {
    private Long id;
    private Long clubId;
    private String title;
    private String description;
    private String category;
    private String coverImage;
    private String location;
    private Date startTime;
    private Date endTime;
    private Date signupStart;
    private Date signupEnd;
    private Integer maxSignup;
    private Integer signupCount;
    private Integer status;
    private Long userId;
    private Date createTime;
    private Date updateTime;
    private boolean isSigned;
    private String clubName;
    private UserVO user;

    public static ActivityVO objToVo(Activity activity) {
        if (activity == null)
            return null;
        ActivityVO vo = new ActivityVO();
        BeanUtils.copyProperties(activity, vo);
        return vo;
    }

    private static final long serialVersionUID = 1L;
}
