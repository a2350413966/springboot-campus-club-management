package com.yupi.springbootinit.model.dto.activity;

import java.io.Serializable;
import java.util.Date;
import lombok.Data;

@Data
public class ActivityUpdateRequest implements Serializable {
    private Long id;
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
    private Integer status;
    private static final long serialVersionUID = 1L;
}
