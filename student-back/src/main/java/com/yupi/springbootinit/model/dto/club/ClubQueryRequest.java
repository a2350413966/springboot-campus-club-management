package com.yupi.springbootinit.model.dto.club;

import com.yupi.springbootinit.common.PageRequest;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class ClubQueryRequest extends PageRequest implements Serializable {
    private Long id;
    private String clubName;
    private String category;
    private Integer status;
    private Long leaderId;
    private Long userId;
    private String searchText;
    private static final long serialVersionUID = 1L;
}
