package com.yupi.springbootinit.model.dto.club;

import java.io.Serializable;
import lombok.Data;

@Data
public class ClubAddRequest implements Serializable {
    private String clubName;
    private String category;
    private String description;
    private String logo;
    private String coverImage;
    private Integer maxMembers;
    private static final long serialVersionUID = 1L;
}
