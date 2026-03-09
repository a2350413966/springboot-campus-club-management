package com.yupi.springbootinit.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

@TableName(value = "message")
@Data
public class Message implements Serializable {
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;
    private String type;
    private String title;
    private String content;
    private Long senderId;
    private Long receiverId;
    private Long relatedId;
    private Integer isRead;
    private Date createTime;
    private Date updateTime;
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
