package com.yupi.springbootinit.model.dto.user;

import java.io.Serializable;
import lombok.Data;

@Data
public class UserRegisterRequest implements Serializable {
    private static final long serialVersionUID = 3191241716373120793L;
    private String userAccount;
    private String userPassword;
    private String checkPassword;
    private String studentId;
    private String major;
    private String realName;
    private String college;
    private String phone;
}
