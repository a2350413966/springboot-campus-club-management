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
 * 入社申请
 */
@TableName(value = "join_request")
@Data
public class JoinRequest implements Serializable {

    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    private Long clubId;
    private Long userId;

    /** 申请理由 */
    private String reason;

    /** 状态：0=待审核 1=已通过 2=已拒绝 */
    private Integer status;

    private Long reviewerId;
    private Date reviewTime;
    private String reviewNote;

    private Date createTime;
    private Date updateTime;

    @TableLogic
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
