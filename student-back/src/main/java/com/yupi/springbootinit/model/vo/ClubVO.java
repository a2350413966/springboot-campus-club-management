package com.yupi.springbootinit.model.vo;

import lombok.Data;
import java.io.Serializable;
import java.util.Date;

/**
 * 社团视图对象（返回给前端）
 */
@Data
public class ClubVO implements Serializable {
    private Long id;
    private String clubName;
    private String category;
    private String description;
    private String logo;
    private String coverImage;
    private Integer status;
    private Integer maxMembers;
    private Integer memberCount;
    private Long leaderId;
    private String leaderName;
    private String leaderAvatar;
    private Long userId;
    /** 当前登录用户是否已加入 */
    private Boolean joined;
    /** 当前登录用户在该社团的角色 */
    private String myRole;
    private Date createTime;
    private static final long serialVersionUID = 1L;
}
