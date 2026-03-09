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
 * 社团
 */
@TableName(value = "club")
@Data
public class Club implements Serializable {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 社团名称 */
    private String clubName;

    /** 社团分类 */
    private String category;

    /** 社团简介 */
    private String description;

    /** Logo URL */
    private String logo;

    /** 封面图 URL */
    private String coverImage;

    /** 状态：0=招募中 1=已满员 2=已解散 */
    private Integer status;

    /** 最大成员数 */
    private Integer maxMembers;

    /** 当前成员数 */
    private Integer memberCount;

    /** 社团负责人用户ID */
    private Long leaderId;

    /** 创建人用户ID */
    private Long userId;

    private Date createTime;
    private Date updateTime;

    @TableLogic
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
