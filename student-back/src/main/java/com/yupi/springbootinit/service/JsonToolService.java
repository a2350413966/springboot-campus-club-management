package com.yupi.springbootinit.service;

import org.springframework.web.multipart.MultipartFile;
import javax.servlet.http.HttpServletResponse;

public interface JsonToolService {
    /**
     * 提取 JSON 文件中的中文字段并打包下载
     *
     * @param files    上传的 JSON 文件数组
     * @param response HTTP 响应
     */
    void extractChineseFromJsonAndZip(MultipartFile[] files, HttpServletResponse response);
}
