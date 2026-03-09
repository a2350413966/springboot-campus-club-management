package com.yupi.springbootinit.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yupi.springbootinit.common.BaseResponse;
import com.yupi.springbootinit.common.DeleteRequest;
import com.yupi.springbootinit.common.ErrorCode;
import com.yupi.springbootinit.common.ResultUtils;
import com.yupi.springbootinit.exception.ThrowUtils;
import com.yupi.springbootinit.model.dto.activity.ActivityAddRequest;
import com.yupi.springbootinit.model.dto.activity.ActivityQueryRequest;
import com.yupi.springbootinit.model.dto.activity.ActivityUpdateRequest;
import com.yupi.springbootinit.model.entity.Activity;
import com.yupi.springbootinit.model.entity.User;
import com.yupi.springbootinit.model.vo.ActivityVO;
import com.yupi.springbootinit.service.ActivityService;
import com.yupi.springbootinit.service.UserService;
import com.yupi.springbootinit.service.ActivitySignupService;
import com.yupi.springbootinit.service.ClubMemberService;
import com.yupi.springbootinit.model.entity.ActivitySignup;
import com.yupi.springbootinit.model.entity.ClubMember;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import java.util.stream.Collectors;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;

/**
 * 活动接口
 */
@RestController
@RequestMapping("/activity")
@Slf4j
public class ActivityController {

    @Resource
    private ActivityService activityService;

    @Resource
    private UserService userService;

    @Resource
    private ActivitySignupService activitySignupService;

    @Resource
    private ClubMemberService clubMemberService;

    // ─── 审批操作 DTO ─────────────────────────────────────────────────────────

    @Data
    static class ActivityReviewRequest {
        private Long id;
        /** true=通过 false=拒绝 */
        private Boolean approve;
        /** 审批备注 */
        private String reviewNote;
    }

    // ─── 审批接口 ─────────────────────────────────────────────────────────────

    /**
     * 管理员审批活动（通过 or 拒绝）
     * POST /api/activity/review
     */
    @PostMapping("/review")
    public BaseResponse<Boolean> reviewActivity(@RequestBody ActivityReviewRequest request,
            HttpServletRequest httpRequest) {
        ThrowUtils.throwIf(request == null || request.getId() == null || request.getApprove() == null,
                ErrorCode.PARAMS_ERROR);
        User loginUser = userService.getLoginUser(httpRequest);
        ThrowUtils.throwIf(!userService.isAdmin(loginUser), ErrorCode.NO_AUTH_ERROR, "仅管理员可审批活动");

        Activity activity = activityService.getById(request.getId());
        ThrowUtils.throwIf(activity == null, ErrorCode.NOT_FOUND_ERROR, "活动不存在");
        ThrowUtils.throwIf(!Integer.valueOf(-1).equals(activity.getStatus()),
                ErrorCode.OPERATION_ERROR, "该活动不在待审核状态");

        Activity update = new Activity();
        update.setId(request.getId());
        // 通过 → 报名中(0)；拒绝 → 已取消(3)
        update.setStatus(Boolean.TRUE.equals(request.getApprove()) ? 0 : 3);
        boolean result = activityService.updateById(update);
        log.info("管理员[{}]{}活动[{}]，备注：{}",
                loginUser.getId(),
                Boolean.TRUE.equals(request.getApprove()) ? "通过" : "拒绝",
                request.getId(),
                request.getReviewNote());
        return ResultUtils.success(result);
    }

    /** 获取活动的报名人员名单（仅发布者或关联社团的管理员） */
    @GetMapping("/signup/list")
    public BaseResponse<List<Map<String, Object>>> listActivitySignups(@RequestParam Long activityId,
            HttpServletRequest httpRequest) {
        User loginUser = userService.getLoginUser(httpRequest);
        Activity activity = activityService.getById(activityId);
        ThrowUtils.throwIf(activity == null, ErrorCode.NOT_FOUND_ERROR, "活动不存在");

        boolean hasAuth = userService.isAdmin(loginUser) || activity.getUserId().equals(loginUser.getId());
        if (!hasAuth && activity.getClubId() != null && activity.getClubId() > 0) {
            long count = clubMemberService.count(new QueryWrapper<ClubMember>()
                    .eq("clubId", activity.getClubId())
                    .eq("userId", loginUser.getId())
                    .in("role", "leader", "admin")
                    .eq("status", 1));
            hasAuth = count > 0;
        }
        ThrowUtils.throwIf(!hasAuth, ErrorCode.NO_AUTH_ERROR, "无权查看该活动的报名名单");

        List<ActivitySignup> signupList = activitySignupService.list(new QueryWrapper<ActivitySignup>()
                .eq("activityId", activityId)
                .in("status", 1) // 只看目前处于报名成功的
                .orderByDesc("createTime"));

        if (signupList.isEmpty()) {
            return ResultUtils.success(java.util.Collections.emptyList());
        }

        List<Long> userIds = signupList.stream().map(ActivitySignup::getUserId).collect(Collectors.toList());
        Map<Long, User> userMap = userService.listByIds(userIds).stream()
                .collect(Collectors.toMap(User::getId, u -> u));

        List<Map<String, Object>> result = signupList.stream().map(signup -> {
            Map<String, Object> map = new HashMap<>();
            map.put("signupId", signup.getId().toString());
            map.put("userId", signup.getUserId().toString());
            map.put("signupTime", signup.getCreateTime());
            map.put("status", signup.getStatus());
            User user = userMap.get(signup.getUserId());
            if (user != null) {
                map.put("userName", user.getUserName());
                map.put("userAvatar", user.getUserAvatar());
                map.put("userProfile", user.getUserProfile());
            }
            return map;
        }).collect(Collectors.toList());

        return ResultUtils.success(result);
    }

    /** 导出报名名单（仅发布者或管理员） */
    @GetMapping("/signup/export")
    public void exportActivitySignups(@RequestParam Long activityId,
            HttpServletRequest httpRequest, javax.servlet.http.HttpServletResponse response) {
        User loginUser = userService.getLoginUser(httpRequest);
        Activity activity = activityService.getById(activityId);
        ThrowUtils.throwIf(activity == null, ErrorCode.NOT_FOUND_ERROR, "活动不存在");

        boolean hasAuth = userService.isAdmin(loginUser) || activity.getUserId().equals(loginUser.getId());
        if (!hasAuth && activity.getClubId() != null && activity.getClubId() > 0) {
            long count = clubMemberService.count(new QueryWrapper<ClubMember>()
                    .eq("clubId", activity.getClubId())
                    .eq("userId", loginUser.getId())
                    .in("role", "leader", "admin")
                    .eq("status", 1));
            hasAuth = count > 0;
        }
        ThrowUtils.throwIf(!hasAuth, ErrorCode.NO_AUTH_ERROR, "无权导出该活动的报名名单");

        List<ActivitySignup> signupList = activitySignupService.list(new QueryWrapper<ActivitySignup>()
                .eq("activityId", activityId)
                .in("status", 1)
                .orderByAsc("createTime")); // 按报名时间先行后后

        List<Long> userIds = signupList.stream().map(ActivitySignup::getUserId).collect(Collectors.toList());
        Map<Long, User> userMap = userIds.isEmpty() ? new HashMap<>()
                : userService.listByIds(userIds).stream().collect(Collectors.toMap(User::getId, u -> u));

        // 组装要在 Excel 里出现的行数据。动态生成或利用内部类、Map等平铺结构写出。
        List<Map<String, Object>> resultList = signupList.stream().map(signup -> {
            Map<String, Object> map = new java.util.LinkedHashMap<>();
            User user = userMap.get(signup.getUserId());
            map.put("报名记录ID", signup.getId().toString());
            map.put("报名时间",
                    signup.getCreateTime() != null
                            ? new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(signup.getCreateTime())
                            : "");
            if (user != null) {
                map.put("学号", user.getStudentId() != null ? user.getStudentId() : "");
                map.put("真实姓名", user.getRealName() != null ? user.getRealName() : "");
                map.put("用户昵称", user.getUserName() != null ? user.getUserName() : "未知");

                String genderStr = "保密";
                if (user.getGender() != null) {
                    if (user.getGender() == 1)
                        genderStr = "男";
                    else if (user.getGender() == 2)
                        genderStr = "女";
                }
                map.put("性别", genderStr);
                map.put("联系电话", user.getPhone() != null ? user.getPhone() : "");
                map.put("学院", user.getCollege() != null ? user.getCollege() : "");
                map.put("专业", user.getMajor() != null ? user.getMajor() : "");
            } else {
                map.put("学号", "");
                map.put("真实姓名", "");
                map.put("用户昵称", "未知");
                map.put("性别", "");
                map.put("联系电话", "");
                map.put("学院", "");
                map.put("专业", "");
            }
            map.put("用户编号", signup.getUserId().toString());
            map.put("签到打卡 (空白预留)", "");
            map.put("备注信息录入", "");
            return map;
        }).collect(Collectors.toList());

        // 使用 EasyExcel 输出文件流到客户端
        try {
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setCharacterEncoding("utf-8");
            String fileName = java.net.URLEncoder.encode(activity.getTitle() + "_签到表", "UTF-8").replaceAll("\\+",
                    "%20");
            response.setHeader("Content-disposition", "attachment;filename*=utf-8''" + fileName + ".xlsx");

            // 按 LinkedHashMap 的列头自动排开
            List<List<String>> head = new java.util.ArrayList<>();
            if (!resultList.isEmpty()) {
                for (String key : resultList.get(0).keySet()) {
                    List<String> headCol = new java.util.ArrayList<>();
                    headCol.add(key);
                    head.add(headCol);
                }
            }

            List<List<Object>> data = resultList.stream()
                    .map(map -> new java.util.ArrayList<>(map.values()))
                    .collect(Collectors.toList());

            com.alibaba.excel.EasyExcel.write(response.getOutputStream()).head(head)
                    .sheet("报名签到名单表").doWrite(data);
        } catch (Exception e) {
            log.error("活动名单导出失败", e);
            ThrowUtils.throwIf(true, ErrorCode.SYSTEM_ERROR, "下载失败，请稍后重试");
        }
    }

    /** 发布活动 */
    @PostMapping("/add")
    public BaseResponse<Long> addActivity(@RequestBody ActivityAddRequest request, HttpServletRequest httpRequest) {
        ThrowUtils.throwIf(request == null, ErrorCode.PARAMS_ERROR);
        User loginUser = userService.getLoginUser(httpRequest);

        // --- ★防越权漏洞修复：只有关联社团的【管理员/会长】或【系统超管】才有资格以该社团名义发布活动 ---
        if (request.getClubId() != null && request.getClubId() > 0) {
            boolean isSysAdmin = userService.isAdmin(loginUser);
            if (!isSysAdmin) {
                long authCount = clubMemberService.count(new QueryWrapper<ClubMember>()
                        .eq("clubId", request.getClubId())
                        .eq("userId", loginUser.getId())
                        // ★ 扩展：部长(minister)也可以代表社团发布活动
                        .in("role", "leader", "admin", "minister")
                        .eq("status", 1)
                        .eq("isDelete", 0));
                ThrowUtils.throwIf(authCount <= 0, ErrorCode.NO_AUTH_ERROR, "越权拦截：您必须是此社团的现任会长或部长才能发布活动！");
            }
        }

        Activity activity = new Activity();
        BeanUtils.copyProperties(request, activity);
        activity.setUserId(loginUser.getId());
        activity.setSignupCount(0);
        // ★ 核心改动：活动创建后进入待审核状态（-1），需管理员审批后才对外开放报名
        activity.setStatus(-1);
        if (activity.getClubId() == null) {
            activity.setClubId(0L);
        }
        if (activity.getMaxSignup() == null)
            activity.setMaxSignup(0);
        boolean result = activityService.save(activity);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(activity.getId());
    }

    /** 更新活动（开放给发帖人及所在社团管理员） */
    @PostMapping("/update")
    public BaseResponse<Boolean> updateActivity(@RequestBody ActivityUpdateRequest request,
            HttpServletRequest httpRequest) {
        ThrowUtils.throwIf(request == null || request.getId() == null, ErrorCode.PARAMS_ERROR);
        User loginUser = userService.getLoginUser(httpRequest);
        Activity activity = activityService.getById(request.getId());
        ThrowUtils.throwIf(activity == null, ErrorCode.NOT_FOUND_ERROR);

        // 核心改造：引入协同代理制编辑鉴权，而非仅仅只属创建人
        boolean hasAuth = userService.isAdmin(loginUser) || activity.getUserId().equals(loginUser.getId());
        if (!hasAuth && activity.getClubId() != null && activity.getClubId() > 0) {
            long count = clubMemberService.count(new QueryWrapper<ClubMember>()
                    .eq("clubId", activity.getClubId())
                    .eq("userId", loginUser.getId())
                    .in("role", "leader", "admin")
                    .eq("status", 1)
                    .eq("isDelete", 0));
            hasAuth = count > 0;
        }
        ThrowUtils.throwIf(!hasAuth, ErrorCode.NO_AUTH_ERROR, "没有权限代理修改：只限原发起人或同群社主管执行！");

        Activity update = new Activity();
        BeanUtils.copyProperties(request, update);
        return ResultUtils.success(activityService.updateById(update));
    }

    /** 删除活动（开放给发帖人及所在社团管理员） */
    @PostMapping("/delete")
    public BaseResponse<Boolean> deleteActivity(@RequestBody DeleteRequest request, HttpServletRequest httpRequest) {
        ThrowUtils.throwIf(request == null || request.getId() == null, ErrorCode.PARAMS_ERROR);
        User loginUser = userService.getLoginUser(httpRequest);
        Activity activity = activityService.getById(request.getId());
        ThrowUtils.throwIf(activity == null, ErrorCode.NOT_FOUND_ERROR, "记录早已烟消云散");

        // 删除也同样放权给本社团高层治理结构
        boolean hasAuth = userService.isAdmin(loginUser) || activity.getUserId().equals(loginUser.getId());
        if (!hasAuth && activity.getClubId() != null && activity.getClubId() > 0) {
            long count = clubMemberService.count(new QueryWrapper<ClubMember>()
                    .eq("clubId", activity.getClubId())
                    .eq("userId", loginUser.getId())
                    .in("role", "leader", "admin")
                    .eq("status", 1)
                    .eq("isDelete", 0));
            hasAuth = count > 0;
        }
        ThrowUtils.throwIf(!hasAuth, ErrorCode.NO_AUTH_ERROR, "无法下架：需本人或同属社团管理团方可定夺！");

        return ResultUtils.success(activityService.removeById(Long.parseLong(String.valueOf(request.getId()))));
    }

    /** 根据ID获取活动详情 */
    @GetMapping("/get/vo")
    public BaseResponse<ActivityVO> getActivityVOById(@RequestParam Long id, HttpServletRequest httpRequest) {
        Activity activity = activityService.getById(id);
        ThrowUtils.throwIf(activity == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(activityService.getActivityVO(activity, httpRequest));
    }

    /** 分页查询活动列表 */
    @PostMapping("/list/page/vo")
    public BaseResponse<Page<ActivityVO>> listActivityVOByPage(@RequestBody ActivityQueryRequest request,
            HttpServletRequest httpRequest) {
        int current = request.getCurrent();
        int pageSize = Math.min(request.getPageSize(), 50);
        Page<Activity> page = new Page<>(current, pageSize);
        return ResultUtils.success(activityService.listActivityVOByPage(page, request, httpRequest));
    }

    /** 报名活动 */
    @PostMapping("/signup")
    public BaseResponse<Boolean> signup(@RequestParam Long activityId, HttpServletRequest httpRequest) {
        return ResultUtils.success(activityService.signupActivity(activityId, httpRequest));
    }

    /** 取消报名 */
    @PostMapping("/signup/cancel")
    public BaseResponse<Boolean> cancelSignup(@RequestParam Long activityId, HttpServletRequest httpRequest) {
        return ResultUtils.success(activityService.cancelSignup(activityId, httpRequest));
    }

    /** 查询我参与的活动 */
    @PostMapping("/my/list")
    public BaseResponse<Page<ActivityVO>> listMyActivities(@RequestBody ActivityQueryRequest request,
            HttpServletRequest httpRequest) {
        User loginUser = userService.getLoginUser(httpRequest);
        request.setUserId(loginUser.getId());
        int current = request.getCurrent();
        int pageSize = Math.min(request.getPageSize(), 50);
        Page<Activity> page = new Page<>(current, pageSize);
        return ResultUtils.success(activityService.listActivityVOByPage(page, request, httpRequest));
    }
}
