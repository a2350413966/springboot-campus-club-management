package com.yupi.springbootinit.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.yupi.springbootinit.mapper.ActivitySignupMapper;
import com.yupi.springbootinit.model.entity.ActivitySignup;
import com.yupi.springbootinit.service.ActivitySignupService;
import org.springframework.stereotype.Service;

@Service
public class ActivitySignupServiceImpl extends ServiceImpl<ActivitySignupMapper, ActivitySignup>
        implements ActivitySignupService {
}
