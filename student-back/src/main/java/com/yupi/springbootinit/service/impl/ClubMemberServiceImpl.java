package com.yupi.springbootinit.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.yupi.springbootinit.mapper.ClubMemberMapper;
import com.yupi.springbootinit.model.entity.ClubMember;
import com.yupi.springbootinit.service.ClubMemberService;
import org.springframework.stereotype.Service;

@Service
public class ClubMemberServiceImpl extends ServiceImpl<ClubMemberMapper, ClubMember> implements ClubMemberService {
}
