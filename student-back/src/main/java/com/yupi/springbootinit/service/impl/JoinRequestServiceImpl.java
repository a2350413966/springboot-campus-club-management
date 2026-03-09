package com.yupi.springbootinit.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.yupi.springbootinit.mapper.JoinRequestMapper;
import com.yupi.springbootinit.model.entity.JoinRequest;
import com.yupi.springbootinit.service.JoinRequestService;
import org.springframework.stereotype.Service;

@Service
public class JoinRequestServiceImpl extends ServiceImpl<JoinRequestMapper, JoinRequest> implements JoinRequestService {
}
