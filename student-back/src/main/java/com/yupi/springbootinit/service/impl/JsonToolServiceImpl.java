package com.yupi.springbootinit.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.yupi.springbootinit.service.JsonToolService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@Slf4j
public class JsonToolServiceImpl implements JsonToolService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private static final Pattern CHINESE_PATTERN = Pattern.compile("[\u4e00-\u9fa5]");

    @Override
    public void extractChineseFromJsonAndZip(MultipartFile[] files, HttpServletResponse response) {
        if (files == null || files.length == 0) {
            throw new RuntimeException("请上传文件");
        }

        response.setContentType("application/zip");
        response.setHeader("Content-Disposition", "attachment; filename=\"extracted_json.zip\"");

        try (ZipOutputStream zos = new ZipOutputStream(response.getOutputStream(), StandardCharsets.UTF_8)) {
            for (MultipartFile file : files) {
                if (file.isEmpty()) {
                    continue;
                }

                String originalFilename = file.getOriginalFilename();
                if (originalFilename == null) {
                    originalFilename = "unnamed.json";
                }

                try {
                    // 读取 JSON
                    JsonNode rootNode = objectMapper.readTree(file.getInputStream());

                    // 过滤保留中文字段
                    JsonNode filteredNode = filterChineseNodes(rootNode);

                    // 如果过滤后不为空，则写入 zip
                    if (filteredNode != null && !filteredNode.isEmpty()) {
                        String newFilename = "extracted_" + originalFilename;
                        ZipEntry zipEntry = new ZipEntry(newFilename);
                        zos.putNextEntry(zipEntry);

                        byte[] bytes = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(filteredNode);
                        zos.write(bytes);

                        zos.closeEntry();
                    }
                } catch (Exception e) {
                    log.error("处理文件失败: {}", originalFilename, e);
                    // 可以选择跳过错误文件，继续处理其他文件
                }
            }
            zos.finish();
        } catch (IOException e) {
            log.error("打包 zip 失败", e);
            throw new RuntimeException("打包 zip 失败", e);
        }
    }

    /**
     * 递归过滤，只保留包含中文的 String 节点及其父结构
     * 如果某结构过滤后为空，则返回 null 代表剪枝
     */
    private JsonNode filterChineseNodes(JsonNode node) {
        if (node.isObject()) {
            ObjectNode newNode = objectMapper.createObjectNode();
            Iterator<Map.Entry<String, JsonNode>> fields = node.fields();
            while (fields.hasNext()) {
                Map.Entry<String, JsonNode> entry = fields.next();
                JsonNode childFiltered = filterChineseNodes(entry.getValue());
                if (childFiltered != null && !childFiltered.isEmpty(objectMapper.getSerializerProviderInstance())) {
                    newNode.set(entry.getKey(), childFiltered);
                }
            }
            return newNode.isEmpty(objectMapper.getSerializerProviderInstance()) ? null : newNode;
        } else if (node.isArray()) {
            ArrayNode newNode = objectMapper.createArrayNode();
            for (JsonNode child : node) {
                JsonNode childFiltered = filterChineseNodes(child);
                if (childFiltered != null && !childFiltered.isEmpty(objectMapper.getSerializerProviderInstance())) {
                    newNode.add(childFiltered);
                }
            }
            return newNode.isEmpty(objectMapper.getSerializerProviderInstance()) ? null : newNode;
        } else if (node.isTextual()) {
            String text = node.asText();
            if (CHINESE_PATTERN.matcher(text).find()) {
                return node;
            }
            return null;
        }
        // 对于数字、布尔值、null 或普通不带中文的字符串，统统丢弃
        return null;
    }
}
