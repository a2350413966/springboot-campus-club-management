package com.yupi.springbootinit.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.yupi.springbootinit.common.BaseResponse;
import com.yupi.springbootinit.common.DeleteRequest;
import com.yupi.springbootinit.common.ErrorCode;
import com.yupi.springbootinit.common.ResultUtils;
import com.yupi.springbootinit.exception.ThrowUtils;
import com.yupi.springbootinit.model.dto.club.ClubAddRequest;
import com.yupi.springbootinit.model.dto.club.ClubQueryRequest;
import com.yupi.springbootinit.model.dto.club.ClubUpdateRequest;
import com.yupi.springbootinit.model.dto.club.JoinClubRequest;
import com.yupi.springbootinit.model.dto.club.ReviewJoinRequest;
import com.yupi.springbootinit.model.entity.Club;
import com.yupi.springbootinit.model.entity.ClubMember;
import com.yupi.springbootinit.model.entity.User;
import com.yupi.springbootinit.model.vo.ClubVO;
import com.yupi.springbootinit.service.ClubMemberService;
import com.yupi.springbootinit.service.ClubService;
import com.yupi.springbootinit.service.JoinRequestService;
import com.yupi.springbootinit.service.MessageService;
import com.yupi.springbootinit.service.UserService;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 社团接口
 * status: -1=待审核 0=招募中 1=已满员 2=已解散
 */
@RestController
@RequestMapping("/club")
@Slf4j
public class ClubController {

    @Resource
    private ClubService clubService;

    @Resource
    private UserService userService;

    @Resource
    private ClubMemberService clubMemberService;

    @Resource
    private JoinRequestService joinRequestService;

    @Resource
    private MessageService messageService;

    // ─── 审批操作 DTO ─────────────────────────────────────────────────────────

    @Data
    static class ClubReviewRequest {
        private Long id;
        /** true=通过 false=拒绝 */
        private Boolean approve;
        /** 审批备注（拒绝时说明原因） */
        private String reviewNote;
    }

    // ─── 审批接口 ─────────────────────────────────────────────────────────────

    /**
     * 管理员审批社团（通过 or 拒绝）
     * POST /api/club/review
     */
    @PostMapping("/review")
    public BaseResponse<Boolean> reviewClub(@RequestBody ClubReviewRequest request,
            HttpServletRequest httpRequest) {
        ThrowUtils.throwIf(request == null || request.getId() == null || request.getApprove() == null,
                ErrorCode.PARAMS_ERROR);
        User loginUser = userService.getLoginUser(httpRequest);
        ThrowUtils.throwIf(!userService.isAdmin(loginUser), ErrorCode.NO_AUTH_ERROR, "仅管理员可审批社团");

        Club club = clubService.getById(request.getId());
        ThrowUtils.throwIf(club == null, ErrorCode.NOT_FOUND_ERROR, "社团不存在");
        ThrowUtils.throwIf(!Integer.valueOf(-1).equals(club.getStatus()),
                ErrorCode.OPERATION_ERROR, "该社团不在待审核状态");

        Club update = new Club();
        update.setId(request.getId());
        // 通过 → 招募中(0)；拒绝 → 已解散(2)
        update.setStatus(Boolean.TRUE.equals(request.getApprove()) ? 0 : 2);
        boolean result = clubService.updateById(update);

        // 发送通知
        String statusText = Boolean.TRUE.equals(request.getApprove()) ? "通过" : "拒绝";
        String content = "您创建的社团 [" + club.getClubName() + "] 审批已" + statusText;
        if (request.getReviewNote() != null && !request.getReviewNote().isEmpty()) {
            content += "，备注：" + request.getReviewNote();
        }
        messageService.addSystemMessage(club.getLeaderId(), "CLUB_REVIEW", "【社团审核】", content, club.getId());

        log.info("管理员[{}]{}社团[{}]，备注：{}",
                loginUser.getId(),
                statusText,
                request.getId(),
                request.getReviewNote());
        return ResultUtils.success(result);
    }

    // ─── 角色管理接口 ─────────────────────────────────────────────────────────

    /**
     * 设置/取消部长
     * POST /api/club/role/set
     * 仅会长或系统管理员可操作
     *
     * @param clubId       社团ID
     * @param targetUserId 目标成员ID
     * @param role         "minister"=授权部长，"member"=取消部长恢复普通成员
     */
    @PostMapping("/role/set")
    public BaseResponse<Boolean> setMemberRole(
            @RequestParam Long clubId,
            @RequestParam Long targetUserId,
            @RequestParam String role,
            HttpServletRequest httpRequest) {
        ThrowUtils.throwIf(clubId == null || targetUserId == null, ErrorCode.PARAMS_ERROR);
        // role 只允许 minister / member 两种（leader 走 transfer 接口）
        if (!"minister".equals(role) && !"member".equals(role)) {
            ThrowUtils.throwIf(true, ErrorCode.PARAMS_ERROR, "role 只允许传 minister 或 member");
        }

        User loginUser = userService.getLoginUser(httpRequest);
        Club club = clubService.getById(clubId);
        ThrowUtils.throwIf(club == null, ErrorCode.NOT_FOUND_ERROR, "社团不存在");

        boolean isAdmin = userService.isAdmin(loginUser);
        boolean isLeader = club.getLeaderId().equals(loginUser.getId());
        ThrowUtils.throwIf(!isAdmin && !isLeader, ErrorCode.NO_AUTH_ERROR, "只有会长或管理员可以设置角色");
        ThrowUtils.throwIf(targetUserId.equals(loginUser.getId()), ErrorCode.PARAMS_ERROR, "不能修改自己的角色");

        // 目标用户必须是社团正式成员
        ClubMember member = clubMemberService.getOne(
                new QueryWrapper<ClubMember>()
                        .eq("clubId", clubId)
                        .eq("userId", targetUserId)
                        .eq("status", 1)
                        .eq("isDelete", 0));
        ThrowUtils.throwIf(member == null, ErrorCode.NOT_FOUND_ERROR, "该用户不是社团成员");
        ThrowUtils.throwIf("leader".equals(member.getRole()), ErrorCode.OPERATION_ERROR, "会长角色请通过转让接口操作");

        member.setRole(role);
        boolean result = clubMemberService.updateById(member);

        // 发送消息通知
        String roleName = "minister".equals(role) ? "部长" : "普通成员";
        String content = "您在社团 [" + club.getClubName() + "] 的职务已变更为：" + roleName;
        messageService.addSystemMessage(targetUserId, "ROLE_CHANGE", "【职务变动】", content, clubId);

        log.info("{}[{}]将社团[{}]成员[{}]角色改为[{}]",
                isLeader ? "会长" : "管理员", loginUser.getId(), clubId, targetUserId, role);
        return ResultUtils.success(result);
    }

    // ─── 基础 CRUD ────────────────────────────────────────────────────────────

    /** 创建社团（需登录，创建后进入待审核状态） */
    @PostMapping("/add")
    public BaseResponse<Long> addClub(@RequestBody ClubAddRequest request, HttpServletRequest httpRequest) {
        ThrowUtils.throwIf(request == null, ErrorCode.PARAMS_ERROR);
        User loginUser = userService.getLoginUser(httpRequest);
        Club club = new Club();
        BeanUtils.copyProperties(request, club);
        club.setUserId(loginUser.getId());
        club.setLeaderId(loginUser.getId());
        club.setMemberCount(1);
        // ★ 核心改动：创建后进入待审核状态（-1），需管理员审批后才公开展示
        club.setStatus(-1);
        if (club.getMaxMembers() == null)
            club.setMaxMembers(100);
        boolean result = clubService.save(club);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);

        // 同步在俱乐部成员表中为主创兼首任会长留档
        ClubMember member = new ClubMember();
        member.setClubId(club.getId());
        member.setUserId(loginUser.getId());
        member.setRole("leader");
        member.setStatus(1);
        member.setJoinTime(new java.util.Date());
        clubMemberService.save(member);

        return ResultUtils.success(club.getId());
    }

    /** 更新社团（仅会长或管理员） */
    @PostMapping("/update")
    public BaseResponse<Boolean> updateClub(@RequestBody ClubUpdateRequest request, HttpServletRequest httpRequest) {
        ThrowUtils.throwIf(request == null || request.getId() == null, ErrorCode.PARAMS_ERROR);
        User loginUser = userService.getLoginUser(httpRequest);
        Club club = clubService.getById(request.getId());
        ThrowUtils.throwIf(club == null, ErrorCode.NOT_FOUND_ERROR);
        boolean isAdmin = userService.isAdmin(loginUser);
        ThrowUtils.throwIf(!club.getLeaderId().equals(loginUser.getId()) && !isAdmin, ErrorCode.NO_AUTH_ERROR);
        Club update = new Club();
        BeanUtils.copyProperties(request, update);
        boolean result = clubService.updateById(update);
        return ResultUtils.success(result);
    }

    /** 删除社团（仅管理员） */
    @PostMapping("/delete")
    public BaseResponse<Boolean> deleteClub(@RequestBody DeleteRequest request, HttpServletRequest httpRequest) {
        ThrowUtils.throwIf(request == null || request.getId() == null, ErrorCode.PARAMS_ERROR);
        User loginUser = userService.getLoginUser(httpRequest);
        ThrowUtils.throwIf(!userService.isAdmin(loginUser), ErrorCode.NO_AUTH_ERROR);
        boolean result = clubService.removeById(Long.parseLong(String.valueOf(request.getId())));
        return ResultUtils.success(result);
    }

    /** 根据 ID 获取社团详情 */
    @GetMapping("/get/vo")
    public BaseResponse<ClubVO> getClubVOById(@RequestParam Long id, HttpServletRequest httpRequest) {
        Club club = clubService.getById(id);
        ThrowUtils.throwIf(club == null, ErrorCode.NOT_FOUND_ERROR);
        return ResultUtils.success(clubService.getClubVO(club, httpRequest));
    }

    /** 分页查询社团列表 */
    @PostMapping("/list/page/vo")
    public BaseResponse<Page<ClubVO>> listClubVOByPage(@RequestBody ClubQueryRequest request,
            HttpServletRequest httpRequest) {
        int current = request.getCurrent();
        int pageSize = request.getPageSize();
        ThrowUtils.throwIf(pageSize > 50, ErrorCode.PARAMS_ERROR, "单页最多50条");
        Page<Club> page = new Page<>(current, pageSize);
        return ResultUtils.success(clubService.listClubVOByPage(page, request, httpRequest));
    }

    /**
     * 获取社团成员列表（含用户基本信息）
     * GET /api/club/member/list?clubId=xxx
     */
    @GetMapping("/member/list")
    public BaseResponse<List<Map<String, Object>>> listClubMembers(@RequestParam Long clubId) {
        List<ClubMember> members = clubMemberService.list(
                new QueryWrapper<ClubMember>()
                        .eq("clubId", clubId)
                        .eq("status", 1)
                        .eq("isDelete", 0)
                        .orderByAsc("createTime"));

        List<Long> userIds = members.stream().map(ClubMember::getUserId).collect(Collectors.toList());
        Map<Long, User> userMap = userIds.isEmpty()
                ? java.util.Collections.emptyMap()
                : userService.listByIds(userIds).stream().collect(Collectors.toMap(User::getId, u -> u));

        List<Map<String, Object>> result = members.stream().map(m -> {
            User u = userMap.get(m.getUserId());
            Map<String, Object> item = new java.util.LinkedHashMap<>();
            item.put("id", m.getId());
            item.put("userId", m.getUserId());
            if (u != null) {
                item.put("userName", u.getUserName());
                item.put("userAvatar", u.getUserAvatar());
                item.put("studentId", u.getStudentId());
                item.put("realName", u.getRealName());
                item.put("gender", u.getGender());
                item.put("phone", u.getPhone());
                item.put("college", u.getCollege());
                item.put("major", u.getMajor());
                item.put("userProfile", u.getUserProfile());
            } else {
                item.put("userName", "未知用户");
                item.put("userAvatar", null);
            }
            item.put("role", m.getRole());
            item.put("joinTime", m.getJoinTime());
            return item;
        }).collect(Collectors.toList());

        return ResultUtils.success(result);
    }

    // ─── 业务操作 ─────────────────────────────────────────────────────────────

    /** 申请加入社团 */
    @PostMapping("/join")
    public BaseResponse<Boolean> joinClub(@RequestBody JoinClubRequest request, HttpServletRequest httpRequest) {
        ThrowUtils.throwIf(request == null || request.getClubId() == null, ErrorCode.PARAMS_ERROR);
        return ResultUtils.success(clubService.joinClub(request, httpRequest));
    }

    /** 审核入社申请（会长/管理员） */
    @PostMapping("/join/review")
    public BaseResponse<Boolean> reviewJoin(@RequestBody ReviewJoinRequest request, HttpServletRequest httpRequest) {
        ThrowUtils.throwIf(request == null, ErrorCode.PARAMS_ERROR);
        return ResultUtils.success(clubService.reviewJoin(request, httpRequest));
    }

    /** 退出社团 */
    @PostMapping("/quit")
    public BaseResponse<Boolean> quitClub(@RequestParam Long clubId, HttpServletRequest httpRequest) {
        return ResultUtils.success(clubService.quitClub(clubId, httpRequest));
    }

    /** 转让社长（仅现任社长拥有资格） */
    @PostMapping("/transfer")
    public BaseResponse<Boolean> transferLeader(@RequestParam Long clubId, @RequestParam Long newLeaderId,
            HttpServletRequest httpRequest) {
        ThrowUtils.throwIf(clubId == null || newLeaderId == null, ErrorCode.PARAMS_ERROR);
        return ResultUtils.success(clubService.transferLeader(clubId, newLeaderId, httpRequest));
    }

    /** 查询我加入的社团 */
    @PostMapping("/my/list")
    public BaseResponse<Page<ClubVO>> listMyClubs(@RequestBody ClubQueryRequest request,
            HttpServletRequest httpRequest) {
        User loginUser = userService.getLoginUser(httpRequest);
        request.setUserId(loginUser.getId());
        int current = request.getCurrent();
        int pageSize = Math.min(request.getPageSize(), 50);
        Page<Club> page = new Page<>(current, pageSize);
        return ResultUtils.success(clubService.listClubVOByPage(page, request, httpRequest));
    }

    /**
     * 查询社团的入社申请列表（仅会长/管理员）
     * GET /api/club/join/list?clubId=xxx&status=0
     */
    @GetMapping("/join/list")
    public BaseResponse<List<Map<String, Object>>> listJoinRequests(
            @RequestParam Long clubId,
            @RequestParam(required = false, defaultValue = "0") Integer status,
            HttpServletRequest httpRequest) {
        User loginUser = userService.getLoginUser(httpRequest);
        Club club = clubService.getById(clubId);
        ThrowUtils.throwIf(club == null, ErrorCode.NOT_FOUND_ERROR, "社团不存在");

        boolean isAdmin = userService.isAdmin(loginUser);
        boolean isLeader = club.getLeaderId().equals(loginUser.getId());

        // 检查是否为部长
        boolean isMinister = clubMemberService.count(
                new QueryWrapper<com.yupi.springbootinit.model.entity.ClubMember>()
                        .eq("clubId", clubId)
                        .eq("userId", loginUser.getId())
                        .eq("role", "minister")) > 0;

        ThrowUtils.throwIf(!isLeader && !isAdmin && !isMinister, ErrorCode.NO_AUTH_ERROR, "无权限查看申请列表");

        List<com.yupi.springbootinit.model.entity.JoinRequest> requests = joinRequestService.list(
                new QueryWrapper<com.yupi.springbootinit.model.entity.JoinRequest>()
                        .eq("clubId", clubId)
                        .eq("status", status)
                        .eq("isDelete", 0)
                        .orderByDesc("createTime"));

        List<Long> userIds = requests.stream()
                .map(com.yupi.springbootinit.model.entity.JoinRequest::getUserId)
                .collect(Collectors.toList());
        Map<Long, User> userMap = userIds.isEmpty()
                ? java.util.Collections.emptyMap()
                : userService.listByIds(userIds).stream().collect(Collectors.toMap(User::getId, u -> u));

        List<Map<String, Object>> result = requests.stream().map(r -> {
            User u = userMap.get(r.getUserId());
            Map<String, Object> item = new java.util.LinkedHashMap<>();
            item.put("id", r.getId());
            item.put("userId", r.getUserId());
            if (u != null) {
                item.put("userName", u.getUserName());
                item.put("userAvatar", u.getUserAvatar());
                item.put("studentId", u.getStudentId());
                item.put("realName", u.getRealName());
                item.put("gender", u.getGender());
                item.put("phone", u.getPhone());
                item.put("college", u.getCollege());
                item.put("major", u.getMajor());
                item.put("userProfile", u.getUserProfile());
            } else {
                item.put("userName", "未知用户");
                item.put("userAvatar", null);
            }
            item.put("reason", r.getReason());
            item.put("status", r.getStatus());
            item.put("createTime", r.getCreateTime());
            return item;
        }).collect(Collectors.toList());

        return ResultUtils.success(result);
    }
}
