const VERSIONS = [
  {
    version: '2026.08.21',
    date: '2026-08-21',
    title: '视觉对齐 & 全站结构升级',
    items: [
      '默认切换为深色主题，全面对齐 aihot.virxact.com 视觉规范',
      '侧栏重构为「内容 / 模型 / 更多」三组，新增模型榜、Agent 接入、关于、更新日志、反馈入口',
      '新增 AI 周报 / 月报、RSS 订阅输出',
      '条目详情支持全文中文翻译',
    ],
  },
  {
    version: '2026.08.20',
    date: '2026-08-20',
    title: 'RSS 信源体系 & AI 推荐理由',
    items: [
      '建立 7 个 RSS 信源 + 信源分类体系',
      'AI 推荐理由（仅 high+ 条目生成，独立 AI 调用）',
      '多源信源列表与信源分类筛选',
    ],
  },
  {
    version: '2026.08.19',
    date: '2026-08-19',
    title: '基础信息流',
    items: [
      '首页时间线、全部动态、热点榜、AI 日报、主题、收藏',
      'AI 评分、重要度分级、关键词标签',
    ],
  },
];

export default function Changelog() {
  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 pb-10">
      <h1 className="text-[26px] font-bold tracking-tight">更新日志</h1>
      <div className="mt-1.5 text-[13px] text-ink-500">我们持续打磨产品，这里记录每一次重要变化</div>

      <div className="mt-5 space-y-5">
        {VERSIONS.map((v, i) => (
          <div key={v.version} className="card p-5">
            <div className="flex items-center gap-2.5 mb-1">
              <span
                className={`num text-[15px] font-bold ${i === 0 ? 'text-teal-600' : 'text-ink-900'}`}
              >
                v{v.version}
              </span>
              <span className="text-[12px] text-ink-500 num">{v.date}</span>
              {i === 0 && (
                <span className="chip" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                  最新
                </span>
              )}
            </div>
            <div className="text-[14px] font-semibold text-ink-900 mb-2">{v.title}</div>
            <ul className="list-disc pl-5 space-y-1 text-[13px] text-ink-700">
              {v.items.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
