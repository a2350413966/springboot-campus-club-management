package com.yupi.springbootinit.model.dto.post;

import java.io.Serializable;
import java.util.List;
import lombok.Data;

@Data
public class PostAddRequest implements Serializable {
    private String title;
    private String content;
    private List<String> tags;
    private static final long serialVersionUID = 1L;
}
