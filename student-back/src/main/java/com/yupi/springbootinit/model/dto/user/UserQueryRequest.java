package com.yupi.springbootinit.model.dto.user;

import com.yupi.springbootinit.common.PageRequest;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class UserQueryRequest extends PageRequest implements Serializable {
    private Long id;
    private String userName;
    private String userProfile;
    private String userRole;
    private String unionId;
    private String mpOpenId;
    private String studentId;
    private String realName;
    private Integer gender;
    private String phone;
    private String college;
    private String major;
    private Integer enrollmentYear;
    private static final long serialVersionUID = 1L;
}
