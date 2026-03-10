import { PageContainer } from '@ant-design/pro-components';
import { history, request, useModel } from '@umijs/max';
import { Avatar, Badge, Button, Card, Col, Row, Space, Tag, Tooltip, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';

const { Text, Title } = Typography;

// ─────────────────────────────────────────────
// 颜色常量
// ─────────────────────────────────────────────
const COLORS = {
  blue: '#4096ff',
  green: '#52c41a',
  orange: '#fa8c16',
  purple: '#7c3aed',
  pink: '#eb2f96',
  cyan: '#13c2c2',
  red: '#ff4d4f',
};

const PIE_COLORS = [
  '#4096ff', '#52c41a', '#fa8c16', '#7c3aed',
  '#eb2f96', '#13c2c2', '#ff4d4f', '#fadb14',
];

const CATEGORY_EMOJI: Record<string, string> = {
  科技: '💻', 艺术: '🎨', 体育: '🏅', 文艺: '🎭',
  公益: '🤝', 学术: '📚', 其他: '🏛️',
};

// ─────────────────────────────────────────────
// 顶部统计卡片
// ─────────────────────────────────────────────
const StatCard: React.FC<{
  title: string;
  value: number;
  suffix: string;
  color: string;
  icon: string;
  desc?: string;
  onClick?: () => void;
}> = ({ title, value, suffix, color, icon, desc, onClick }) => (
  <Card
    hoverable={!!onClick}
    onClick={onClick}
    style={{
      borderRadius: 16,
      border: `1px solid ${color}25`,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.25s',
    }}
    bodyStyle={{ padding: '22px 24px' }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 26,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#8c8c8c', fontSize: 13, marginBottom: 4 }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>
            {value.toLocaleString()}
          </span>
          <span style={{ color: '#8c8c8c', fontSize: 13 }}>{suffix}</span>
        </div>
        {desc && <div style={{ color: '#bfbfbf', fontSize: 12, marginTop: 4 }}>{desc}</div>}
      </div>
    </div>
  </Card>
);

// ─────────────────────────────────────────────
// 折线图 Canvas 组件
// ─────────────────────────────────────────────
const LineChart: React.FC<{
  dates: string[];
  series: { label: string; data: number[]; color: string }[];
}> = ({ dates, series }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !dates.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const padL = 36, padR = 16, padT = 16, padB = 32;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const allValues = series.flatMap((s) => s.data);
    const maxV = Math.max(...allValues, 1);
    const step = chartW / (dates.length - 1);

    // 网格线
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + chartW, y);
      ctx.stroke();
      // Y轴刻度
      ctx.fillStyle = '#bfbfbf';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(String(Math.round(maxV - (maxV / 4) * i)), padL - 4, y + 4);
    }

    // X轴标签
    ctx.fillStyle = '#bfbfbf';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    dates.forEach((d, i) => {
      ctx.fillText(d, padL + i * step, H - padB + 16);
    });

    // 折线 + 渐变填充
    series.forEach(({ data, color }) => {
      const points = data.map((v, i) => ({
        x: padL + i * step,
        y: padT + chartH - (v / maxV) * chartH,
      }));

      // 渐变填充
      const grad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
      grad.addColorStop(0, color + '33');
      grad.addColorStop(1, color + '00');
      ctx.beginPath();
      ctx.moveTo(points[0].x, padT + chartH);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, padT + chartH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // 折线
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();

      // 数据点
      points.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    });
  }, [dates, series]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
};

// ─────────────────────────────────────────────
// 饼图 Canvas 组件
// ─────────────────────────────────────────────
const PieChart: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const total = data.reduce((s, d) => s + Number(d.value), 0);
    if (total === 0) return;

    const cx = W * 0.42;
    const cy = H / 2;
    const radius = Math.min(cx, cy) * 0.75;
    const innerR = radius * 0.55;

    let startAngle = -Math.PI / 2;
    data.forEach((item, i) => {
      const val = Number(item.value);
      const slice = (val / total) * Math.PI * 2;
      const color = PIE_COLORS[i % PIE_COLORS.length];

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + slice);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();

      // 间隔白线
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius + 1, startAngle, startAngle + 0.01);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      startAngle += slice;
    });

    // 中空圆
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // 中心文字
    ctx.fillStyle = '#595959';
    ctx.font = `bold 18px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(String(data.length), cx, cy - 4);
    ctx.font = `11px sans-serif`;
    ctx.fillStyle = '#8c8c8c';
    ctx.fillText('个分类', cx, cy + 14);

    // 图例
    const legendX = W * 0.72;
    const legendStartY = cy - (data.length * 22) / 2;
    data.slice(0, 8).forEach((item, i) => {
      const val = Number(item.value);
      const color = PIE_COLORS[i % PIE_COLORS.length];
      const ly = legendStartY + i * 22;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(legendX, ly, 10, 10, 3);
      ctx.fill();

      ctx.fillStyle = '#595959';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      const pct = ((val / total) * 100).toFixed(0);
      ctx.fillText(`${item.name} ${pct}%`, legendX + 15, ly + 9);
    });
  }, [data]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />;
};

// ─────────────────────────────────────────────
// 快捷入口
// ─────────────────────────────────────────────
const shortcuts = [
  { icon: '🏛️', label: '社团管理', path: '/admin/club', color: COLORS.blue },
  { icon: '👤', label: '用户管理', path: '/admin/user', color: COLORS.green },
  { icon: '📅', label: '活动管理', path: '/admin/activity', color: COLORS.orange },
  { icon: '📝', label: '帖子管理', path: '/admin/post', color: COLORS.purple },
];

// ─────────────────────────────────────────────
// 主页面
// ─────────────────────────────────────────────
const Welcome: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const isAdmin = initialState?.currentUser?.userRole === 'admin';

  const [stats, setStats] = useState({
    clubCount: 0, userCount: 0, activityCount: 0,
    recruitingCount: 0, postCount: 0, yesterdayUserCount: 0,
  });
  const [trend, setTrend] = useState<{ dates: string[]; userTrend: number[]; activityTrend: number[]; clubTrend: number[] }>({
    dates: [], userTrend: [], activityTrend: [], clubTrend: [],
  });
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentClubs, setRecentClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      request('/api/dashboard/stats'),
      request('/api/dashboard/stats/trend'),
      request('/api/dashboard/stats/category'),
      request('/api/dashboard/stats/recent'),
    ])
      .then(([statsRes, trendRes, catRes, recentRes]) => {
        if (statsRes.code === 0 && statsRes.data) setStats(statsRes.data);
        if (trendRes.code === 0 && trendRes.data) setTrend(trendRes.data);
        if (catRes.code === 0 && catRes.data) setCategoryData(catRes.data);
        if (recentRes.code === 0 && recentRes.data) {
          setRecentUsers(recentRes.data.recentUsers || []);
          setRecentClubs(recentRes.data.recentClubs || []);
        }
      })
      .catch((err) => console.error('Dashboard data error:', err))
      .finally(() => setLoading(false));
  }, []);

  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
  const weekday = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][now.getDay()];

  if (!isAdmin) {
    return (
      <PageContainer title={false} style={{ padding: '0 0 32px' }}>
        {/* ── 顶部大屏 ── */}
        <div
          style={{
            borderRadius: 18,
            marginBottom: 24,
            padding: '48px 36px',
            background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 10px 30px rgba(161, 140, 209, 0.3)',
          }}
        >
          <div>
            <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
              🎉 欢迎来到校园社团集市
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, marginTop: 10, display: 'block' }}>
              发现你的热爱，结识志同道合的朋友 · {dateStr}
            </Text>
          </div>
          <div>
            <Button
              size="large"
              shape="round"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.4)',
                color: '#fff',
                backdropFilter: 'blur(10px)',
                fontWeight: 600,
              }}
              onClick={() => history.push('/club')}
            >
              去发现社团 →
            </Button>
          </div>
        </div>

        {/* ── 统计卡片 ── */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} xl={8}>
            <StatCard
              title="入驻社团" value={stats.clubCount} suffix="个" color={COLORS.blue} icon="🏛️"
              desc="各类社团百花齐放"
            />
          </Col>
          <Col xs={24} sm={12} xl={8}>
            <StatCard
              title="精彩活动" value={stats.activityCount} suffix="场" color={COLORS.orange} icon="📅"
              desc="精彩瞬间不容错过"
            />
          </Col>
          <Col xs={24} sm={12} xl={8}>
            <StatCard
              title="招募中社团" value={stats.recruitingCount} suffix="个" color={COLORS.green} icon="✨"
              desc="期待你的加入"
            />
          </Col>
        </Row>

        {/* ── 推荐板块 ── */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title={<span style={{ fontWeight: 600 }}>🗂️ 社团分类分布</span>}
              style={{ borderRadius: 16, height: '100%' }}
              bodyStyle={{ padding: '12px 20px 20px' }}
            >
              <div style={{ height: 260 }}>
                {categoryData.length > 0 ? (
                  <PieChart data={categoryData} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bfbfbf' }}>
                    {loading ? '加载中...' : '暂无分类数据'}
                  </div>
                )}
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={<span style={{ fontWeight: 600 }}>🏛️ 最新入驻社团</span>}
              extra={<Button type="link" size="small" onClick={() => history.push('/club')}>全部社团 →</Button>}
              style={{ borderRadius: 16, height: '100%' }}
              bodyStyle={{ padding: '8px 20px 20px' }}
            >
              {recentClubs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                  {recentClubs.map((club) => {
                    const statusMap: Record<number, { label: string; color: string }> = {
                      0: { label: '招募中', color: COLORS.green },
                      1: { label: '已满员', color: COLORS.orange },
                      2: { label: '已解散', color: '#d9d9d9' },
                    };
                    const statusInfo = statusMap[club.status] || { label: '未知', color: '#d9d9d9' };
                    const emoji = CATEGORY_EMOJI[club.category] || '🏛️';
                    return (
                      <div
                        key={club.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                          borderRadius: 10, background: '#fafafa', border: '1px solid #f0f0f0',
                          cursor: 'pointer', transition: 'all 0.3s'
                        }}
                        onClick={() => history.push(`/club/detail/${club.id}`)}
                      >
                        <Avatar src={club.logo} style={{ background: COLORS.purple, flexShrink: 0, fontSize: 18 }}>
                          {!club.logo && emoji}
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{club.clubName}</div>
                          <div style={{ color: '#8c8c8c', fontSize: 12 }}>{club.category || '未分类'} · {club.memberCount || 0} 人</div>
                        </div>
                        <Badge color={statusInfo.color} text={<span style={{ fontSize: 12, color: statusInfo.color }}>{statusInfo.label}</span>} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#bfbfbf', padding: '20px 0' }}>暂无社团数据</div>
              )}
            </Card>
          </Col>
        </Row>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={false} style={{ padding: '0 0 32px' }}>
      {/* ── 顶部页头 ── */}
      <div
        style={{
          borderRadius: 18,
          marginBottom: 24,
          padding: '28px 36px',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
            🖥️ 管理驾驶舱
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 6, display: 'block' }}>
            校园社团管理系统 · {dateStr} {weekday}
          </Text>
        </div>
        <Space wrap>
          {shortcuts.map((s) => (
            <Button
              key={s.path}
              style={{
                background: `${s.color}20`,
                color: s.color,
                border: `1px solid ${s.color}40`,
                borderRadius: 10,
                fontWeight: 500,
              }}
              onClick={() => history.push(s.path)}
            >
              {s.icon} {s.label}
            </Button>
          ))}
        </Space>
      </div>

      {/* ── 统计卡片 ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="社团总数" value={stats.clubCount} suffix="个" color={COLORS.blue} icon="🏛️"
            desc="点击进入社团管理"
            onClick={() => history.push('/admin/club')}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="注册用户" value={stats.userCount} suffix="人" color={COLORS.green} icon="👥"
            desc={`昨日新增 ${stats.yesterdayUserCount} 人`}
            onClick={() => history.push('/admin/user')}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="本月活动" value={stats.activityCount} suffix="场" color={COLORS.orange} icon="📅"
            desc="点击进入活动管理"
            onClick={() => history.push('/admin/activity')}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="帖子总数" value={stats.postCount} suffix="篇" color={COLORS.purple} icon="📝"
            desc={`招募中社团 ${stats.recruitingCount} 个`}
            onClick={() => history.push('/admin/post')}
          />
        </Col>
      </Row>

      {/* ── 趋势图 + 饼图 ── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={15}>
          <Card
            title={<span style={{ fontWeight: 600 }}>📈 近7日数据趋势</span>}
            extra={
              <Space size={12}>
                {[
                  { color: COLORS.blue, label: '新增用户' },
                  { color: COLORS.orange, label: '新增活动' },
                  { color: COLORS.green, label: '新增社团' },
                ].map((item) => (
                  <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                    <span
                      style={{
                        display: 'inline-block', width: 20, height: 3,
                        background: item.color, borderRadius: 2,
                      }}
                    />
                    <span style={{ color: '#8c8c8c' }}>{item.label}</span>
                  </span>
                ))}
              </Space>
            }
            style={{ borderRadius: 16, height: '100%' }}
            bodyStyle={{ padding: '12px 20px 20px' }}
          >
            <div style={{ height: 240 }}>
              {trend.dates.length > 0 ? (
                <LineChart
                  dates={trend.dates}
                  series={[
                    { label: '新增用户', data: trend.userTrend, color: COLORS.blue },
                    { label: '新增活动', data: trend.activityTrend, color: COLORS.orange },
                    { label: '新增社团', data: trend.clubTrend, color: COLORS.green },
                  ]}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bfbfbf' }}>
                  加载中...
                </div>
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card
            title={<span style={{ fontWeight: 600 }}>🗂️ 社团分类分布</span>}
            style={{ borderRadius: 16, height: '100%' }}
            bodyStyle={{ padding: '12px 20px 20px' }}
          >
            <div style={{ height: 240 }}>
              {categoryData.length > 0 ? (
                <PieChart data={categoryData} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bfbfbf' }}>
                  {loading ? '加载中...' : '暂无社团数据'}
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── 最新动态 ── */}
      <Row gutter={[16, 16]}>
        {/* 最新注册用户 */}
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ fontWeight: 600 }}>🆕 最新注册用户</span>}
            extra={
              <Button type="link" size="small" onClick={() => history.push('/admin/user')}>
                全部用户 →
              </Button>
            }
            style={{ borderRadius: 16 }}
            bodyStyle={{ padding: '8px 20px 20px' }}
          >
            {recentUsers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                {recentUsers.map((user) => {
                  const roleColor = user.userRole === 'admin' ? COLORS.orange : COLORS.blue;
                  const roleLabel = user.userRole === 'admin' ? '管理员' : user.userRole === 'ban' ? '已封禁' : '普通用户';
                  return (
                    <div
                      key={user.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: '#fafafa',
                        border: '1px solid #f0f0f0',
                      }}
                    >
                      <Avatar src={user.userAvatar} style={{ background: COLORS.blue, flexShrink: 0 }}>
                        {!user.userAvatar && (user.userName || '?')[0]}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.userName || '未命名'}
                        </div>
                        <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                          {user.createTime ? new Date(user.createTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </div>
                      <Tag color={roleColor} style={{ borderRadius: 6, fontSize: 11 }}>{roleLabel}</Tag>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#bfbfbf', padding: '20px 0' }}>暂无用户数据</div>
            )}
          </Card>
        </Col>

        {/* 最新社团 */}
        <Col xs={24} lg={12}>
          <Card
            title={<span style={{ fontWeight: 600 }}>🏛️ 最新创建社团</span>}
            extra={
              <Button type="link" size="small" onClick={() => history.push('/admin/club')}>
                全部社团 →
              </Button>
            }
            style={{ borderRadius: 16 }}
            bodyStyle={{ padding: '8px 20px 20px' }}
          >
            {recentClubs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                {recentClubs.map((club) => {
                  const statusMap: Record<number, { label: string; color: string }> = {
                    0: { label: '招募中', color: COLORS.green },
                    1: { label: '已满员', color: COLORS.orange },
                    2: { label: '已解散', color: '#d9d9d9' },
                  };
                  const statusInfo = statusMap[club.status] || { label: '未知', color: '#d9d9d9' };
                  const emoji = CATEGORY_EMOJI[club.category] || '🏛️';
                  return (
                    <div
                      key={club.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: '#fafafa',
                        border: '1px solid #f0f0f0',
                      }}
                    >
                      <Avatar src={club.logo} style={{ background: COLORS.purple, flexShrink: 0, fontSize: 18 }}>
                        {!club.logo && emoji}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {club.clubName}
                        </div>
                        <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                          {club.category || '未分类'} · {club.memberCount || 0} 人
                        </div>
                      </div>
                      <Badge color={statusInfo.color} text={
                        <span style={{ fontSize: 12, color: statusInfo.color }}>{statusInfo.label}</span>
                      } />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#bfbfbf', padding: '20px 0' }}>暂无社团数据</div>
            )}
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Welcome;
