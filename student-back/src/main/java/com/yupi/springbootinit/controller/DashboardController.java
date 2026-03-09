package com.yupi.springbootinit.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.yupi.springbootinit.common.BaseResponse;
import com.yupi.springbootinit.common.ResultUtils;
import com.yupi.springbootinit.model.entity.Activity;
import com.yupi.springbootinit.model.entity.Club;
import com.yupi.springbootinit.model.entity.Post;
import com.yupi.springbootinit.model.entity.User;
import com.yupi.springbootinit.service.ActivityService;
import com.yupi.springbootinit.service.ClubService;
import com.yupi.springbootinit.service.PostService;
import com.yupi.springbootinit.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 管理驾驶舱统计接口
 */
@RestController
@RequestMapping("/dashboard")
@Slf4j
public class DashboardController {

    @Resource
    private ClubService clubService;

    @Resource
    private UserService userService;

    @Resource
    private ActivityService activityService;

    @Resource
    private PostService postService;

    /**
     * 核心指标统计（顶部卡片数据）
     */
    @GetMapping("/stats")
    public BaseResponse<Map<String, Object>> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        try {
            // 社团总数
            long clubCount = clubService.count(new QueryWrapper<Club>().eq("isDelete", 0));
            stats.put("clubCount", clubCount);

            // 在校用户总数
            long userCount = userService.count(new QueryWrapper<User>().eq("isDelete", 0));
            stats.put("userCount", userCount);

            // 本月活动数量
            Calendar calendar = Calendar.getInstance();
            calendar.set(Calendar.DAY_OF_MONTH, 1);
            calendar.set(Calendar.HOUR_OF_DAY, 0);
            calendar.set(Calendar.MINUTE, 0);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            Date firstDayOfMonth = calendar.getTime();
            long activityCount = activityService.count(new QueryWrapper<Activity>()
                    .eq("isDelete", 0)
                    .ge("createTime", firstDayOfMonth));
            stats.put("activityCount", activityCount);

            // 招募中社团数
            long recruitingCount = clubService.count(new QueryWrapper<Club>()
                    .eq("status", 0)
                    .eq("isDelete", 0));
            stats.put("recruitingCount", recruitingCount);

            // 帖子总数
            long postCount = postService.count(new QueryWrapper<Post>().eq("isDelete", 0));
            stats.put("postCount", postCount);

            // 昨日新增用户数（用于趋势对比）
            Calendar yesterday = Calendar.getInstance();
            yesterday.add(Calendar.DAY_OF_MONTH, -1);
            yesterday.set(Calendar.HOUR_OF_DAY, 0);
            yesterday.set(Calendar.MINUTE, 0);
            yesterday.set(Calendar.SECOND, 0);
            yesterday.set(Calendar.MILLISECOND, 0);
            Calendar yesterdayEnd = Calendar.getInstance();
            yesterdayEnd.add(Calendar.DAY_OF_MONTH, -1);
            yesterdayEnd.set(Calendar.HOUR_OF_DAY, 23);
            yesterdayEnd.set(Calendar.MINUTE, 59);
            yesterdayEnd.set(Calendar.SECOND, 59);
            long yesterdayUserCount = userService.count(new QueryWrapper<User>()
                    .eq("isDelete", 0)
                    .ge("createTime", yesterday.getTime())
                    .le("createTime", yesterdayEnd.getTime()));
            stats.put("yesterdayUserCount", yesterdayUserCount);

        } catch (Exception e) {
            log.error("仪表盘统计数据获取失败", e);
            stats.put("clubCount", 0);
            stats.put("userCount", 0);
            stats.put("activityCount", 0);
            stats.put("recruitingCount", 0);
            stats.put("postCount", 0);
            stats.put("yesterdayUserCount", 0);
        }
        return ResultUtils.success(stats);
    }

    /**
     * 近7天趋势数据（折线图）
     * 返回结构: { dates: ["03-04",...], userTrend: [3,...], activityTrend: [1,...] }
     */
    @GetMapping("/stats/trend")
    public BaseResponse<Map<String, Object>> getTrendStats() {
        Map<String, Object> result = new HashMap<>();
        try {
            List<String> dates = new ArrayList<>();
            List<Long> userTrend = new ArrayList<>();
            List<Long> activityTrend = new ArrayList<>();
            List<Long> clubTrend = new ArrayList<>();

            SimpleDateFormat sdf = new SimpleDateFormat("MM-dd");
            // 往前推6天（加今天共7天）
            for (int i = 6; i >= 0; i--) {
                Calendar dayStart = Calendar.getInstance();
                dayStart.add(Calendar.DAY_OF_MONTH, -i);
                dayStart.set(Calendar.HOUR_OF_DAY, 0);
                dayStart.set(Calendar.MINUTE, 0);
                dayStart.set(Calendar.SECOND, 0);
                dayStart.set(Calendar.MILLISECOND, 0);

                Calendar dayEnd = Calendar.getInstance();
                dayEnd.add(Calendar.DAY_OF_MONTH, -i);
                dayEnd.set(Calendar.HOUR_OF_DAY, 23);
                dayEnd.set(Calendar.MINUTE, 59);
                dayEnd.set(Calendar.SECOND, 59);
                dayEnd.set(Calendar.MILLISECOND, 999);

                dates.add(sdf.format(dayStart.getTime()));

                long uCount = userService.count(new QueryWrapper<User>()
                        .eq("isDelete", 0)
                        .ge("createTime", dayStart.getTime())
                        .le("createTime", dayEnd.getTime()));
                userTrend.add(uCount);

                long aCount = activityService.count(new QueryWrapper<Activity>()
                        .eq("isDelete", 0)
                        .ge("createTime", dayStart.getTime())
                        .le("createTime", dayEnd.getTime()));
                activityTrend.add(aCount);

                long cCount = clubService.count(new QueryWrapper<Club>()
                        .eq("isDelete", 0)
                        .ge("createTime", dayStart.getTime())
                        .le("createTime", dayEnd.getTime()));
                clubTrend.add(cCount);
            }

            result.put("dates", dates);
            result.put("userTrend", userTrend);
            result.put("activityTrend", activityTrend);
            result.put("clubTrend", clubTrend);
        } catch (Exception e) {
            log.error("趋势数据获取失败", e);
        }
        return ResultUtils.success(result);
    }

    /**
     * 社团分类分布（饼图）
     * 返回结构: [{ name: "科技", value: 5 }, ...]
     */
    @GetMapping("/stats/category")
    public BaseResponse<List<Map<String, Object>>> getCategoryStats() {
        List<Map<String, Object>> result = new ArrayList<>();
        try {
            List<Club> clubs = clubService.list(new QueryWrapper<Club>().eq("isDelete", 0).select("category"));
            Map<String, Long> categoryMap = clubs.stream()
                    .collect(Collectors.groupingBy(
                            club -> club.getCategory() != null && !club.getCategory().isEmpty()
                                    ? club.getCategory()
                                    : "其他",
                            Collectors.counting()));
            categoryMap.forEach((name, value) -> {
                Map<String, Object> item = new HashMap<>();
                item.put("name", name);
                item.put("value", value);
                result.add(item);
            });
            result.sort((a, b) -> Long.compare((Long) b.get("value"), (Long) a.get("value")));
        } catch (Exception e) {
            log.error("分类分布数据获取失败", e);
        }
        return ResultUtils.success(result);
    }

    /**
     * 最新动态（最新注册用户 + 最新社团）
     */
    @GetMapping("/stats/recent")
    public BaseResponse<Map<String, Object>> getRecentStats() {
        Map<String, Object> result = new HashMap<>();
        try {
            // 最新5个注册用户
            List<User> recentUsers = userService.list(new QueryWrapper<User>()
                    .eq("isDelete", 0)
                    .orderByDesc("createTime")
                    .last("LIMIT 5"));
            List<Map<String, Object>> userList = recentUsers.stream().map(u -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", u.getId().toString());
                item.put("userName", u.getUserName() != null ? u.getUserName() : u.getUserAccount());
                item.put("userAvatar", u.getUserAvatar());
                item.put("userRole", u.getUserRole());
                item.put("createTime", u.getCreateTime());
                return item;
            }).collect(Collectors.toList());
            result.put("recentUsers", userList);

            // 最新5个社团
            List<Club> recentClubs = clubService.list(new QueryWrapper<Club>()
                    .eq("isDelete", 0)
                    .orderByDesc("createTime")
                    .last("LIMIT 5"));
            List<Map<String, Object>> clubList = recentClubs.stream().map(c -> {
                Map<String, Object> item = new LinkedHashMap<>();
                item.put("id", c.getId().toString());
                item.put("clubName", c.getClubName());
                item.put("category", c.getCategory());
                item.put("memberCount", c.getMemberCount());
                item.put("status", c.getStatus());
                item.put("logo", c.getLogo());
                item.put("createTime", c.getCreateTime());
                return item;
            }).collect(Collectors.toList());
            result.put("recentClubs", clubList);

        } catch (Exception e) {
            log.error("最新动态数据获取失败", e);
            result.put("recentUsers", Collections.emptyList());
            result.put("recentClubs", Collections.emptyList());
        }
        return ResultUtils.success(result);
    }
}
