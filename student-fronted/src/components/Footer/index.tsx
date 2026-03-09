import { BankOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import '@umijs/max';
import React from 'react';

const Footer: React.FC = () => {
  return (
    <DefaultFooter
      style={{
        background: 'none',
        textAlign: 'center',
      }}
      copyright="2026 届毕业设计作品 · 开发：曹宏福"
      links={[
        {
          key: 'cust',
          title: (
            <span style={{ color: 'rgba(0,0,0,0.7)', fontSize: 15, fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>
              <BankOutlined style={{ marginRight: 6, fontSize: 16 }} />
              长春理工大学官网
            </span>
          ),
          href: 'https://www.cust.edu.cn/',
          blankTarget: true,
        },
      ]}
    />
  );
};
export default Footer;
