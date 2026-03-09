package com.yupi.springbootinit.model.dto.club;

import lombok.Data;
import java.io.Serializable;

@Data
public class JoinClubRequest implements Serializable {
    private Long clubId;
    private String reason;
    private static final long serialVersionUID = 1L;
}
