package com.yupi.springbootinit.controller;

import com.yupi.springbootinit.service.JsonToolService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/tool/json")
public class JsonToolController {

    @Resource
    private JsonToolService jsonToolService;

    @PostMapping("/extract")
    public void extractChineseFromJsonAndZip(@RequestPart("files") MultipartFile[] files,
            HttpServletResponse response) {
        if (files == null || files.length == 0) {
            throw new RuntimeException("请上传文件");
        }
        jsonToolService.extractChineseFromJsonAndZip(files, response);
    }
}
