package com.yupi.springbootinit.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.yupi.springbootinit.model.dto.activity.ActivityQueryRequest;
import com.yupi.springbootinit.model.entity.Activity;
import com.yupi.springbootinit.model.vo.ActivityVO;
import javax.servlet.http.HttpServletRequest;

public interface ActivityService extends IService<Activity> {

    QueryWrapper<Activity> getQueryWrapper(ActivityQueryRequest request);

    Page<ActivityVO> listActivityVOByPage(Page<Activity> page, ActivityQueryRequest request,
            HttpServletRequest httpRequest);

    ActivityVO getActivityVO(Activity activity, HttpServletRequest httpRequest);

    /** 报名活动 */
    boolean signupActivity(Long activityId, HttpServletRequest httpRequest);

    /** 取消报名 */
    boolean cancelSignup(Long activityId, HttpServletRequest httpRequest);
}
