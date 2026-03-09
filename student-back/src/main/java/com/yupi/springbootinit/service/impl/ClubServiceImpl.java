package com.yupi.springbootinit.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.yupi.springbootinit.common.ErrorCode;
import com.yupi.springbootinit.exception.ThrowUtils;
import com.yupi.springbootinit.mapper.ClubMapper;
import com.yupi.springbootinit.model.dto.club.ClubQueryRequest;
import com.yupi.springbootinit.model.dto.club.JoinClubRequest;
import com.yupi.springbootinit.model.dto.club.ReviewJoinRequest;
import com.yupi.springbootinit.model.entity.Club;
import com.yupi.springbootinit.model.entity.ClubMember;
import com.yupi.springbootinit.model.entity.JoinRequest;
import com.yupi.springbootinit.model.entity.User;
import com.yupi.springbootinit.model.vo.ClubVO;
import com.yupi.springbootinit.service.ClubMemberService;
import com.yupi.springbootinit.service.ClubService;
import com.yupi.springbootinit.service.JoinRequestService;
import com.yupi.springbootinit.service.MessageService;
import com.yupi.springbootinit.service.UserService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ClubServiceImpl extends ServiceImpl<ClubMapper, Club> implements ClubService {

    @Resource
    private UserService userService;

    @Resource
    private ClubMemberService clubMemberService;

    @Resource
    private JoinRequestService joinRequestService;

    @Resource
    private MessageService messageService;

    @Override
    public QueryWrapper<Club> getQueryWrapper(ClubQueryRequest request) {
        QueryWrapper<Club> wrapper = new QueryWrapper<>();
        if (request == null)
            return wrapper;
        wrapper.like(StringUtils.isNotBlank(request.getClubName()), "clubName", request.getClubName());
        wrapper.eq(StringUtils.isNotBlank(request.getCategory()), "category", request.getCategory());
        wrapper.eq(request.getStatus() != null, "status", request.getStatus());
        wrapper.eq(request.getLeaderId() != null, "leaderId", request.getLeaderId());
        wrapper.eq(request.getUserId() != null, "userId", request.getUserId());
        wrapper.eq("isDelete", 0);
        // 排序
        String sortField = request.getSortField();
        boolean isAsc = "ascend".equals(request.getSortOrder());
        wrapper.orderBy(StringUtils.isNotBlank(sortField), isAsc, sortField);
        return wrapper;
    }

    @Override
    public ClubVO getClubVO(Club club, HttpServletRequest httpRequest) {
        ClubVO vo = new ClubVO();
        BeanUtils.copyProperties(club, vo);
        // 查负责人姓名(拼装姓名与学号)
        try {
            User leader = userService.getById(club.getLeaderId());
            if (leader != null) {
                String name = leader.getRealName() != null && !leader.getRealName().isEmpty() ? leader.getRealName()
                        : leader.getUserName();
                String sno = leader.getStudentId() != null && !leader.getStudentId().isEmpty() ? leader.getStudentId()
                        : leader.getUserAccount();
                vo.setLeaderName(name + " (" + sno + ")");
                vo.setLeaderAvatar(leader.getUserAvatar());
            }
        } catch (Exception ignored) {
        }

        // 【关键修复】动态修正脱轨的总人数，强制取外表活人总数兜底展示给前台
        try {
            long realMemberCount = clubMemberService.count(
                    new QueryWrapper<ClubMember>().eq("clubId", club.getId())
                            .eq("status", 1).eq("isDelete", 0));
            vo.setMemberCount((int) realMemberCount);
        } catch (Exception ignored) {
            // 如异常保留原貌
        }

        // 查当前用户是否已加入
        try {
            User loginUser = userService.getLoginUserPermitNull(httpRequest);
            if (loginUser != null) {
                ClubMember member = clubMemberService.getOne(
                        new QueryWrapper<ClubMember>()
                                .eq("clubId", club.getId())
                                .eq("userId", loginUser.getId())
                                .eq("status", 1)
                                .eq("isDelete", 0));
                vo.setJoined(member != null);
                vo.setMyRole(member != null ? member.getRole() : null);
            } else {
                vo.setJoined(false);
            }
        } catch (Exception ignored) {
            vo.setJoined(false);
        }
        return vo;
    }

    @Override
    public Page<ClubVO> listClubVOByPage(Page<Club> page, ClubQueryRequest request, HttpServletRequest httpRequest) {
        Page<Club> clubPage = this.page(page, getQueryWrapper(request));
        Page<ClubVO> voPage = new Page<>(clubPage.getCurrent(), clubPage.getSize(), clubPage.getTotal());
        List<ClubVO> voList = clubPage.getRecords().stream()
                .map(club -> getClubVO(club, httpRequest))
                .collect(Collectors.toList());
        voPage.setRecords(voList);
        return voPage;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean joinClub(JoinClubRequest joinRequest, HttpServletRequest httpRequest) {
        Long clubId = joinRequest.getClubId();
        User loginUser = userService.getLoginUser(httpRequest);
        Long userId = loginUser.getId();

        Club club = this.getById(clubId);
        // @TableLogic 已保证 getById 不会返回已删除记录，无需再判断 isDelete
        ThrowUtils.throwIf(club == null, ErrorCode.NOT_FOUND_ERROR, "社团不存在");
        ThrowUtils.throwIf(club.getStatus() == 1, ErrorCode.OPERATION_ERROR, "该社团已满员，暂不接受申请");
        ThrowUtils.throwIf(club.getStatus() == 2, ErrorCode.OPERATION_ERROR, "社团已解散");

        // 检查是否已是成员
        long existCount = clubMemberService.count(
                new QueryWrapper<ClubMember>().eq("clubId", clubId).eq("userId", userId)
                        .eq("status", 1).eq("isDelete", 0));
        ThrowUtils.throwIf(existCount > 0, ErrorCode.OPERATION_ERROR, "您已是该社团成员");

        // 检查是否已有待审核申请
        long pendingCount = joinRequestService.count(
                new QueryWrapper<JoinRequest>().eq("clubId", clubId).eq("userId", userId)
                        .eq("status", 0).eq("isDelete", 0));
        ThrowUtils.throwIf(pendingCount > 0, ErrorCode.OPERATION_ERROR, "已有待审核的申请，请勿重复申请");

        // 创建申请记录
        JoinRequest jr = new JoinRequest();
        jr.setClubId(clubId);
        jr.setUserId(userId);
        jr.setReason(joinRequest.getReason());
        jr.setStatus(0);
        return joinRequestService.save(jr);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean reviewJoin(ReviewJoinRequest reviewRequest, HttpServletRequest httpRequest) {
        User loginUser = userService.getLoginUser(httpRequest);
        JoinRequest jr = joinRequestService.getById(reviewRequest.getRequestId());
        ThrowUtils.throwIf(jr == null, ErrorCode.NOT_FOUND_ERROR, "申请记录不存在");

        // 只有社团负责人、部长或系统管理员可以审核
        Club club = this.getById(jr.getClubId());
        boolean isLeader = club.getLeaderId().equals(loginUser.getId());
        boolean isAdmin = userService.isAdmin(loginUser);
        // ★ 新增：部长(minister)也有审批权
        boolean isMinister = clubMemberService.count(
                new QueryWrapper<ClubMember>()
                        .eq("clubId", jr.getClubId())
                        .eq("userId", loginUser.getId())
                        .eq("role", "minister")
                        .eq("status", 1)
                        .eq("isDelete", 0)) > 0;
        ThrowUtils.throwIf(!isLeader && !isAdmin && !isMinister, ErrorCode.NO_AUTH_ERROR, "无权限审核，需要会长/部长权限");

        int newStatus = reviewRequest.getStatus(); // 1=通过 2=拒绝
        jr.setStatus(newStatus);
        jr.setReviewerId(loginUser.getId());
        jr.setReviewTime(new Date());
        jr.setReviewNote(reviewRequest.getReviewNote());
        joinRequestService.updateById(jr);

        // 审核通过则创建成员记录并更新人数
        if (newStatus == 1) {
            // 解决重复申请通过的 DuplicateKeyException：先查此人是不是原先在这社团里且退出了
            ClubMember existMember = clubMemberService.getOne(
                    new QueryWrapper<ClubMember>().eq("clubId", jr.getClubId())
                            .eq("userId", jr.getUserId()).eq("isDelete", 0));
            if (existMember != null) {
                // 如果曾经存在记录，只需将其状态重新激活为 1 即可
                existMember.setRole("member");
                existMember.setStatus(1);
                existMember.setJoinTime(new Date());
                clubMemberService.updateById(existMember);
            } else {
                ClubMember member = new ClubMember();
                member.setClubId(jr.getClubId());
                member.setUserId(jr.getUserId());
                member.setRole("member");
                member.setStatus(1);
                member.setJoinTime(new Date());
                clubMemberService.save(member);
            }
            // 更新社团成员数
            this.lambdaUpdate().eq(Club::getId, jr.getClubId())
                    .setSql("memberCount = memberCount + 1").update();
        }

        // 发送审批结果通知
        String resultText = newStatus == 1 ? "通过" : "拒绝";
        String content = "您申请加入社团 [" + club.getClubName() + "] 的审核已被" + resultText;
        if (reviewRequest.getReviewNote() != null && !reviewRequest.getReviewNote().isEmpty()) {
            content += "，备注：" + reviewRequest.getReviewNote();
        }
        messageService.addSystemMessage(jr.getUserId(), "JOIN_REVIEW", "【入社审核】", content, jr.getClubId());

        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean quitClub(Long clubId, HttpServletRequest httpRequest) {
        User loginUser = userService.getLoginUser(httpRequest);
        Club club = this.getById(clubId);
        ThrowUtils.throwIf(club == null, ErrorCode.NOT_FOUND_ERROR, "社团不存在");
        ThrowUtils.throwIf(club.getLeaderId().equals(loginUser.getId()), ErrorCode.OPERATION_ERROR, "会长不能直接退出，请先转让会长");

        ClubMember member = clubMemberService.getOne(
                new QueryWrapper<ClubMember>().eq("clubId", clubId)
                        .eq("userId", loginUser.getId()).eq("status", 1).eq("isDelete", 0));
        ThrowUtils.throwIf(member == null, ErrorCode.OPERATION_ERROR, "您不是该社团成员");

        member.setStatus(3); // 已退出
        clubMemberService.updateById(member);
        // 更新人数
        this.lambdaUpdate().eq(Club::getId, clubId)
                .setSql("memberCount = memberCount - 1").update();
        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean transferLeader(Long clubId, Long newLeaderId, HttpServletRequest httpRequest) {
        User loginUser = userService.getLoginUser(httpRequest);
        Club club = this.getById(clubId);
        ThrowUtils.throwIf(club == null, ErrorCode.NOT_FOUND_ERROR, "社团不存在");

        // 鉴权：只有当前社长允许转让
        ThrowUtils.throwIf(!club.getLeaderId().equals(loginUser.getId()), ErrorCode.NO_AUTH_ERROR, "只有现任社长可转让权限");
        ThrowUtils.throwIf(newLeaderId == null || newLeaderId.equals(loginUser.getId()), ErrorCode.PARAMS_ERROR,
                "无法转让给自己");

        // 验证接收人：必须是该社团当前内部的状态正常的成员
        ClubMember newLeaderMember = clubMemberService.getOne(
                new QueryWrapper<ClubMember>().eq("clubId", clubId)
                        .eq("userId", newLeaderId).eq("status", 1).eq("isDelete", 0));
        ThrowUtils.throwIf(newLeaderMember == null, ErrorCode.OPERATION_ERROR, "接收人尚未加入该社团或状态异常");

        // 验证原社长成员表记录，并降级
        ClubMember oldLeaderMember = clubMemberService.getOne(
                new QueryWrapper<ClubMember>().eq("clubId", clubId)
                        .eq("userId", loginUser.getId()).eq("status", 1).eq("isDelete", 0));

        if (oldLeaderMember != null) {
            oldLeaderMember.setRole("member"); // 原社长退化为普通成员
            clubMemberService.updateById(oldLeaderMember);
        }

        // 接收人升权
        newLeaderMember.setRole("leader");
        clubMemberService.updateById(newLeaderMember);

        // 社团主表指针换线
        club.setLeaderId(newLeaderId);
        this.updateById(club);

        // 发送转让通知
        String content = "您已被转让为社团 [" + club.getClubName() + "] 的会长";
        messageService.addSystemMessage(newLeaderId, "TRANSFER_LEADER", "【职务变动】", content, clubId);

        return true;
    }
}
