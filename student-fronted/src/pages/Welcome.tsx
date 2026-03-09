import { PageContainer } from '@ant-design/pro-components';
import { history, useModel, request } from '@umijs/max';
import { Avatar, Button, Card, Col, Row, Statistic, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

const { Title, Paragraph, Text } = Typography;

/** 统计卡片 */
const StatCard: React.FC<{
  title: string;
  value: number | string;
  suffix?: string;
  color: string;
  icon: string;
}> = ({ title, value, suffix, color, icon }) => (
  <Card
    style={{ borderRadius: 12, border: `1px solid ${color}20`, overflow: 'hidden' }}
    bodyStyle={{ padding: '24px 28px' }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 14,
          background: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
        }}
      >
        {icon}
      </div>
      <Statistic
        title={<Text type="secondary" style={{ fontSize: 14 }}>{title}</Text>}
        value={value}
        suffix={suffix}
        valueStyle={{ color, fontSize: 28, fontWeight: 700 }}
      />
    </div>
  </Card>
);

/** 社团卡片 */
const ClubCard: React.FC<{
  id: number | string;
  name: string;
  category: string;
  members: number;
  desc: string;
  color: string;
  emoji: string;
  logo?: string;
}> = ({ id, name, category, members, desc, color, emoji, logo }) => (
  <Card
    hoverable
    style={{ borderRadius: 12, height: '100%' }}
    bodyStyle={{ padding: 20 }}
    onClick={() => history.push(`/club/detail/${id}`)}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      {logo ? (
        <Avatar src={logo} size={44} shape="square" style={{ borderRadius: 10, flexShrink: 0 }} />
      ) : (
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {emoji}
        </div>
      )}
      <div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{name}</div>
        <Tag color={color} style={{ marginTop: 2, fontSize: 11 }}>{category}</Tag>
      </div>
    </div>
    <Paragraph
      ellipsis={{ rows: 2 }}
      style={{ color: '#888', fontSize: 13, margin: 0, marginBottom: 10 }}
    >
      {desc}
    </Paragraph>
    <Text type="secondary" style={{ fontSize: 12 }}>👥 {members} 名成员</Text>
  </Card>
);

/** 活动卡片 */
const ActivityCard: React.FC<{
  id: number | string;
  title: string;
  club: string;
  date: string;
  status: '报名中' | '进行中' | '已结束';
}> = ({ id, title, club, date, status }) => {
  const statusColor = { '报名中': 'green', '进行中': 'blue', '已结束': 'default' }[status];
  return (
    <Card
      hoverable
      style={{ borderRadius: 10, marginBottom: 12 }}
      bodyStyle={{ padding: '14px 18px' }}
      onClick={() => history.push(`/activity/detail/${id}`)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>📌 {club} · {date}</Text>
        </div>
        <Tag color={statusColor}>{status}</Tag>
      </div>
    </Card>
  );
};

const Welcome: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const userName = currentUser?.userName || '同学';

  const [stats, setStats] = useState({
    clubCount: 0,
    userCount: 0,
    activityCount: 0,
    recruitingCount: 0,
  });

  const [hotClubs, setHotClubs] = useState<any[]>([]);
  const [recentActs, setRecentActs] = useState<any[]>([]);

  useEffect(() => {
    request('/api/dashboard/stats').then((res) => {
      if (res.code === 0 && res.data) {
        setStats(res.data);
      }
    });

    // 请求热点社团数据，为了保证能够通过拦截器并拿到正确数据，修改为 VO 专用端点，并扩大查询数量以选出真正热门的
    request('/api/club/list/page/vo', {
      method: 'POST',
      data: {
        current: 1,
        pageSize: 10,
        sortField: 'memberCount',
        sortOrder: 'descend'
      }
    }).then((res) => {
      // 容错处理：为了防止没有拿到数据导致空白，如果没数据我们可以在这里塞入默认数据或留空
      if (res.code === 0 && res.data && res.data.records) {
        // 由于需要原 UI 渲染的颜色和 emoji，前端做一层颜色随机/按类型映射转换
        const CATEGORY_STYLE: Record<string, { color: string; emoji: string }> = {
          科技: { color: '#1677ff', emoji: '💻' },
          艺术: { color: '#eb2f96', emoji: '🎨' },
          体育: { color: '#fa8c16', emoji: '🏅' },
          文艺: { color: '#13c2c2', emoji: '🎭' },
          公益: { color: '#ff4d4f', emoji: '🤝' },
          学术: { color: '#722ed1', emoji: '📚' },
        };
        const defaultStyle = { color: '#52c41a', emoji: '🏛️' };

        const mappedClubs = res.data.records.map((item: any) => {
          let style = CATEGORY_STYLE[item.category] || defaultStyle;
          return {
            id: item.id,
            name: item.clubName,
            category: item.category || '综合',
            members: item.memberCount || 0,
            desc: item.description || '暂无社团介绍',
            color: style.color,
            emoji: style.emoji,
            logo: item.logo
          };
        });
        // 根据成员数量做个降序（假装是真正的最热排行）
        mappedClubs.sort((a: any, b: any) => b.members - a.members);
        setHotClubs(mappedClubs);
      }
    });

    // 同样，启动对于近期的热门活动提取（取最新的5条排期或者报盘最热的）
    request('/api/activity/list/page/vo', {
      method: 'POST',
      data: {
        current: 1,
        pageSize: 5,
        status: 0, // 在后端数据结构中：0表示报名中/招募中。过滤掉已结束（status >= 2）的数据。使用只等于0是因为这样最切合“还可以参加”的热榜主题。
        sortField: 'createTime', // 或者根据 signupCount 等，此处用常规最新排期发版倒序
        sortOrder: 'descend'
      }
    }).then((res) => {
      if (res.code === 0 && res.data && res.data.records) {
        const mappedActs = res.data.records.map((item: any) => {
          let stLabel: '报名中' | '进行中' | '已结束' = '已结束';
          if (item.status === 0) stLabel = '报名中';
          if (item.status === 1) stLabel = '进行中';

          // 把 UTC 时间格式化为 MM/DD
          let dateStr = '待定';
          if (item.startTime) {
            const d = new Date(item.startTime);
            dateStr = `${('0' + (d.getMonth() + 1)).slice(-2)}/${('0' + d.getDate()).slice(-2)}`;
          }

          return {
            id: item.id,
            title: item.title,
            club: item.clubName || '系统公开',
            date: dateStr,
            status: stLabel
          };
        });
        setRecentActs(mappedActs);
      }
    });
  }, []);

  return (
    <PageContainer
      title={false}
      style={{ padding: '0 0 24px' }}
    >
      {/* Banner */}
      <Card
        style={{
          borderRadius: 16,
          marginBottom: 24,
          background: 'linear-gradient(135deg, #1677ff 0%, #5b8def 50%, #7c3aed 100%)',
          border: 'none',
          overflow: 'hidden',
        }}
        bodyStyle={{ padding: '36px 40px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
              🎓 欢迎回来，{userName}！
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', marginTop: 10, marginBottom: 20, fontSize: 15 }}>
              探索校园社团，参与精彩活动，结识志同道合的朋友
            </Paragraph>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button
                type="primary"
                size="large"
                style={{ background: '#fff', color: '#1677ff', border: 'none', fontWeight: 600 }}
                onClick={() => history.push('/club')}
              >
                🏫 浏览社团
              </Button>
              <Button
                size="large"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }}
                onClick={() => history.push('/activity')}
              >
                📅 查看活动
              </Button>
            </div>
          </div>
          <div style={{ fontSize: 96, opacity: 0.2, userSelect: 'none' }}>🏛️</div>
        </div>
      </Card>

      {/* 统计数据 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="社团总数" value={stats.clubCount} suffix="个" color="#1677ff" icon="🏛️" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="在校成员" value={stats.userCount} suffix="人" color="#52c41a" icon="👥" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="本月活动" value={stats.activityCount} suffix="场" color="#fa8c16" icon="📅" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard title="正在招兵买马的社团" value={stats.recruitingCount} suffix="个" color="#722ed1" icon="📢" />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 热门社团 */}
        <Col xs={24} lg={14}>
          <Card
            title={<span style={{ fontWeight: 600 }}>🔥 热门社团</span>}
            extra={<Button type="link" onClick={() => history.push('/club')}>查看全部 →</Button>}
            style={{ borderRadius: 12 }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            <Row gutter={[12, 12]}>
              {hotClubs.length > 0 ? (
                hotClubs.map((club) => (
                  <Col xs={24} sm={12} key={club.id || club.name}>
                    <ClubCard {...club} />
                  </Col>
                ))
              ) : (
                <div style={{ padding: 20, width: '100%', textAlign: 'center', color: '#999' }}>暂无社团数据</div>
              )}
            </Row>
          </Card>
        </Col>

        {/* 近期活动 */}
        <Col xs={24} lg={10}>
          <Card
            title={<span style={{ fontWeight: 600 }}>📅 近期活动</span>}
            extra={<Button type="link" onClick={() => history.push('/activity')}>查看全部 →</Button>}
            style={{ borderRadius: 12, height: '100%' }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            {recentActs.length > 0 ? (
              recentActs.map((act) => (
                <ActivityCard key={act.id} {...act} />
              ))
            ) : (
              <div style={{ padding: 20, width: '100%', textAlign: 'center', color: '#999' }}>暂无活动排期</div>
            )}
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Welcome;
