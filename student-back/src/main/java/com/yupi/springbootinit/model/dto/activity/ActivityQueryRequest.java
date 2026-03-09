package com.yupi.springbootinit.model.dto.activity;

import com.yupi.springbootinit.common.PageRequest;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class ActivityQueryRequest extends PageRequest implements Serializable {
    private Long id;
    private Long clubId;
    private String title;
    private String category;
    private Integer status;
    private Long userId;
    private String searchText;
    private static final long serialVersionUID = 1L;
}
