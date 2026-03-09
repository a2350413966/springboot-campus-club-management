package com.yupi.springbootinit.model.dto.postthumb;

import java.io.Serializable;
import lombok.Data;

@Data
public class PostThumbAddRequest implements Serializable {
    private Long postId;
    private static final long serialVersionUID = 1L;
}
