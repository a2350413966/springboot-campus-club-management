package com.yupi.springbootinit.model.dto.postfavour;

import java.io.Serializable;
import lombok.Data;

@Data
public class PostFavourQueryRequest implements Serializable {
    private Long userId;
    private PostQueryRequestInner postQueryRequest;

    @Data
    public static class PostQueryRequestInner implements Serializable {
        private int current = 1;
        private int pageSize = 10;
    }

    public com.yupi.springbootinit.model.dto.post.PostQueryRequest getPostQueryRequest() {
        com.yupi.springbootinit.model.dto.post.PostQueryRequest req = new com.yupi.springbootinit.model.dto.post.PostQueryRequest();
        if (postQueryRequest != null) {
            req.setCurrent(postQueryRequest.getCurrent());
            req.setPageSize(postQueryRequest.getPageSize());
        }
        return req;
    }

    public int getCurrent() {
        return postQueryRequest != null ? postQueryRequest.getCurrent() : 1;
    }

    public int getPageSize() {
        return postQueryRequest != null ? postQueryRequest.getPageSize() : 10;
    }

    private static final long serialVersionUID = 1L;
}
