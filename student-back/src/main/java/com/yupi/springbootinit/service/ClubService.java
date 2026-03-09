package com.yupi.springbootinit.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.yupi.springbootinit.model.dto.club.ClubQueryRequest;
import com.yupi.springbootinit.model.dto.club.JoinClubRequest;
import com.yupi.springbootinit.model.dto.club.ReviewJoinRequest;
import com.yupi.springbootinit.model.entity.Club;
import com.yupi.springbootinit.model.vo.ClubVO;
import javax.servlet.http.HttpServletRequest;

public interface ClubService extends IService<Club> {

    /** 构造查询条件 */
    QueryWrapper<Club> getQueryWrapper(ClubQueryRequest request);

    /** 分页获取社团 VO 列表（含当前用户已加入标记） */
    Page<ClubVO> listClubVOByPage(Page<Club> page, ClubQueryRequest request, HttpServletRequest httpRequest);

    /** 单个社团转 VO */
    ClubVO getClubVO(Club club, HttpServletRequest httpRequest);

    /** 申请加入社团 */
    boolean joinClub(JoinClubRequest joinRequest, HttpServletRequest httpRequest);

    /** 审核入社申请 */
    boolean reviewJoin(ReviewJoinRequest reviewRequest, HttpServletRequest httpRequest);

    /** 退出社团 */
    boolean quitClub(Long clubId, HttpServletRequest httpRequest);

    /** 转让会长 */
    boolean transferLeader(Long clubId, Long newLeaderId, HttpServletRequest httpRequest);
}
