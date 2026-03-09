package com.yupi.springbootinit.model.dto.club;

import java.io.Serializable;
import lombok.Data;

@Data
public class ClubUpdateRequest implements Serializable {
    private Long id;
    private String clubName;
    private String category;
    private String description;
    private String logo;
    private String coverImage;
    private Integer maxMembers;
    private Integer status;
    private Long leaderId;
    private static final long serialVersionUID = 1L;
}
