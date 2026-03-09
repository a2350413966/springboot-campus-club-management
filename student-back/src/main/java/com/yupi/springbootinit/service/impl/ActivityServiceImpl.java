package com.yupi.springbootinit.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.yupi.springbootinit.common.ErrorCode;
import com.yupi.springbootinit.exception.ThrowUtils;
import com.yupi.springbootinit.mapper.ActivityMapper;
import com.yupi.springbootinit.model.dto.activity.ActivityQueryRequest;
import com.yupi.springbootinit.model.entity.Activity;
import com.yupi.springbootinit.model.entity.ActivitySignup;
import com.yupi.springbootinit.model.entity.Club;
import com.yupi.springbootinit.model.entity.User;
import com.yupi.springbootinit.model.vo.ActivityVO;
import com.yupi.springbootinit.model.vo.UserVO;
import com.yupi.springbootinit.service.ActivityService;
import com.yupi.springbootinit.service.ActivitySignupService;
import com.yupi.springbootinit.service.ClubService;
import com.yupi.springbootinit.service.UserService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ActivityServiceImpl extends ServiceImpl<ActivityMapper, Activity> implements ActivityService {

    @Resource
    private UserService userService;

    @Resource
    private ClubService clubService;

    @Resource
    private ActivitySignupService activitySignupService;

    @Override
    public QueryWrapper<Activity> getQueryWrapper(ActivityQueryRequest request) {
        QueryWrapper<Activity> wrapper = new QueryWrapper<>();
        if (request == null)
            return wrapper;
        wrapper.eq(request.getId() != null, "id", request.getId());
        wrapper.eq(request.getClubId() != null, "clubId", request.getClubId());
        wrapper.like(StringUtils.isNotBlank(request.getTitle()), "title", request.getTitle());
        wrapper.eq(StringUtils.isNotBlank(request.getCategory()), "category", request.getCategory());
        wrapper.eq(request.getStatus() != null, "status", request.getStatus());
        wrapper.eq("isDelete", 0);
        String sortField = request.getSortField();
        boolean isAsc = "ascend".equals(request.getSortOrder());
        if (StringUtils.isNotBlank(sortField)) {
            wrapper.orderBy(true, isAsc, sortField);
        } else {
            wrapper.orderByDesc("startTime");
        }
        return wrapper;
    }

    @Override
    public ActivityVO getActivityVO(Activity activity, HttpServletRequest httpRequest) {
        ActivityVO vo = new ActivityVO();
        BeanUtils.copyProperties(activity, vo);

        // 填充发布人用户信息
        User user = userService.getById(activity.getUserId());
        if (user != null) {
            vo.setUser(userService.getUserVO(user));
        }

        // 填充社团名称
        try {
            Club club = clubService.getById(activity.getClubId());
            if (club != null)
                vo.setClubName(club.getClubName());
        } catch (Exception ignored) {
        }
        // 查当前用户是否已报名
        try {
            User loginUser = userService.getLoginUserPermitNull(httpRequest);
            if (loginUser != null) {
                long count = activitySignupService.count(
                        new QueryWrapper<ActivitySignup>()
                                .eq("activityId", activity.getId())
                                .eq("userId", loginUser.getId())
                                .in("status", 0, 1)
                                .eq("isDelete", 0));
                vo.setSigned(count > 0);
            } else {
                vo.setSigned(false);
            }
        } catch (Exception ignored) {
            vo.setSigned(false);
        }
        return vo;
    }

    @Override
    public Page<ActivityVO> listActivityVOByPage(Page<Activity> page, ActivityQueryRequest request,
            HttpServletRequest httpRequest) {
        Page<Activity> activityPage = this.page(page, getQueryWrapper(request));
        Page<ActivityVO> voPage = new Page<>(activityPage.getCurrent(), activityPage.getSize(),
                activityPage.getTotal());
        List<ActivityVO> voList = activityPage.getRecords().stream()
                .map(a -> getActivityVO(a, httpRequest))
                .collect(Collectors.toList());
        voPage.setRecords(voList);
        return voPage;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean signupActivity(Long activityId, HttpServletRequest httpRequest) {
        User loginUser = userService.getLoginUser(httpRequest);
        Activity activity = this.getById(activityId);
        ThrowUtils.throwIf(activity == null, ErrorCode.NOT_FOUND_ERROR, "活动不存在");
        ThrowUtils.throwIf(activity.getStatus() != 0, ErrorCode.OPERATION_ERROR, "活动不在报名阶段");

        // 检查人数上限
        if (activity.getMaxSignup() > 0) {
            ThrowUtils.throwIf(activity.getSignupCount() >= activity.getMaxSignup(),
                    ErrorCode.OPERATION_ERROR, "活动报名人数已满");
        }
        // 查询是否有过报名记录（包括曾经取消或被拒绝的）
        ActivitySignup oldSignup = activitySignupService.getOne(
                new QueryWrapper<ActivitySignup>()
                        .eq("activityId", activityId)
                        .eq("userId", loginUser.getId()));

        if (oldSignup != null) {
            ThrowUtils.throwIf(oldSignup.getStatus() == 0 || oldSignup.getStatus() == 1,
                    ErrorCode.OPERATION_ERROR, "您已报名该活动");
            // 恢复报名（把原本已取消或拒绝的状态改为报名成功）
            oldSignup.setStatus(1);
            activitySignupService.updateById(oldSignup);
        } else {
            ActivitySignup signup = new ActivitySignup();
            signup.setActivityId(activityId);
            signup.setUserId(loginUser.getId());
            signup.setStatus(1); // 直接报名成功
            activitySignupService.save(signup);
        }
        // 更新报名人数
        this.lambdaUpdate().eq(Activity::getId, activityId)
                .setSql("signupCount = signupCount + 1").update();
        return true;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean cancelSignup(Long activityId, HttpServletRequest httpRequest) {
        User loginUser = userService.getLoginUser(httpRequest);
        ActivitySignup signup = activitySignupService.getOne(
                new QueryWrapper<ActivitySignup>()
                        .eq("activityId", activityId)
                        .eq("userId", loginUser.getId())
                        .in("status", 0, 1)
                        .eq("isDelete", 0));
        ThrowUtils.throwIf(signup == null, ErrorCode.OPERATION_ERROR, "您未报名该活动");
        signup.setStatus(3); // 已取消
        activitySignupService.updateById(signup);
        this.lambdaUpdate().eq(Activity::getId, activityId)
                .setSql("signupCount = signupCount - 1").update();
        return true;
    }
}
