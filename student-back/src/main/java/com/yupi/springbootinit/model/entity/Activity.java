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
 * 活动
 */
@TableName(value = "activity")
@Data
public class Activity implements Serializable {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /** 所属社团ID */
    private Long clubId;

    /** 活动名称 */
    private String title;

    /** 活动详情 */
    private String description;

    /** 活动分类 */
    private String category;

    /** 封面图 URL */
    private String coverImage;

    /** 活动地点 */
    private String location;

    /** 活动开始时间 */
    private Date startTime;

    /** 活动结束时间 */
    private Date endTime;

    /** 报名开始时间 */
    private Date signupStart;

    /** 报名截止时间 */
    private Date signupEnd;

    /** 最大报名人数（0=不限） */
    private Integer maxSignup;

    /** 当前报名人数 */
    private Integer signupCount;

    /** 状态：0=报名中 1=进行中 2=已结束 3=已取消 */
    private Integer status;

    /** 发布人用户ID */
    private Long userId;

    private Date createTime;
    private Date updateTime;

    @TableLogic
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
