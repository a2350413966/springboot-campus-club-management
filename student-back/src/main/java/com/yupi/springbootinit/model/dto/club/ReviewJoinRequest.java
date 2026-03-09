package com.yupi.springbootinit.model.dto.club;

import java.io.Serializable;
import lombok.Data;

@Data
public class ReviewJoinRequest implements Serializable {
    private Long requestId;
    /** 审批结果：1=同意 2=拒绝 */
    private Integer status;
    private String reviewNote;
    private static final long serialVersionUID = 1L;
}
