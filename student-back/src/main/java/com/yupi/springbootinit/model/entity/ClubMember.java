package com.yupi.springbootinit.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * 社团成员
 */
@TableName(value = "club_member")
@Data
public class ClubMember implements Serializable {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 社团ID */
    private Long clubId;

    /** 用户ID */
    private Long userId;

    /** 角色：leader/vice_leader/minister/member */
    private String role;

    /** 状态：0=待审核 1=已通过 2=已拒绝 3=已退出 */
    private Integer status;

    /** 正式加入时间 */
    private Date joinTime;

    private Date createTime;
    private Date updateTime;

    @TableLogic
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
