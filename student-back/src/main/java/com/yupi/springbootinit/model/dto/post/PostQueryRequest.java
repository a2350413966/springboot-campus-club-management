package com.yupi.springbootinit.model.dto.post;

import com.yupi.springbootinit.common.PageRequest;
import java.io.Serializable;
import java.util.List;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class PostQueryRequest extends PageRequest implements Serializable {
    private Long id;
    private Long notId;
    private String searchText;
    private String title;
    private String content;
    private List<String> tags;
    private List<String> orTags;
    private Long userId;
    private Long favourUserId;
    private static final long serialVersionUID = 1L;
}
