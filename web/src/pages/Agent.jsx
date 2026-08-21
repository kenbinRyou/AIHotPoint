import { Rss, Code2, Bot } from 'lucide-react';

const FEEDS = [
  { label: '精选', url: '/feed.xml' },
  { label: '全部动态', url: '/feed/all.xml' },
  { label: 'AI 日报', url: '/feed/daily.xml' },
  { label: '论文研究', url: '/feed/category/paper.xml' },
];

export default function Agent() {
  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 pb-10">
      <div className="flex items-center gap-2">
        <Bot className="w-6 h-6 text-teal-600" />
        <h1 className="text-[26px] font-bold tracking-tight">Agent 接入</h1>
      </div>
      <div className="mt-1.5 text-[13px] text-ink-500">
        把 AIHotPoint 的聚合能力接入你自己的 Agent 或工作流
      </div>

      <div className="mt-5 space-y-5">
        <section className="card p-5">
          <div className="flex items-center gap-2 text-[15px] font-semibold text-ink-900 mb-2">
            <Rss className="w-4 h-4 text-teal-600" /> RSS 订阅
          </div>
          <p className="text-[13px] text-ink-700 mb-3">
            直接订阅以下 RSS，无需鉴权即可在你的阅读器或自动化工具中消费：
          </p>
          <div className="space-y-1.5">
            {FEEDS.map((f) => (
              <div key={f.url} className="flex items-center justify-between text-[13px]">
                <span className="text-ink-700">{f.label}</span>
                <a href={f.url} className="text-teal-600 hover:text-teal-700 num">{f.url}</a>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5">
          <div className="flex items-center gap-2 text-[15px] font-semibold text-ink-900 mb-2">
            <Code2 className="w-4 h-4 text-teal-600" /> HTTP API
          </div>
          <p className="text-[13px] text-ink-700 mb-3">开放只读接口，便于二次开发：</p>
          <pre className="text-[12px] leading-relaxed bg-paper-1 rounded-lg p-3 overflow-x-auto text-ink-900 num">
{`GET /api/items?category=ai-models&sort=score_desc&page=1
GET /api/daily/latest
GET /api/hot?window=48h
GET /api/topics`}
          </pre>
          <p className="text-[12px] text-ink-500 mt-2">
            返回标准 JSON；分页参数 <code className="text-ink-700">page</code> / <code className="text-ink-700">pageSize</code>。
          </p>
        </section>

        <section className="card p-5">
          <div className="text-[15px] font-semibold text-ink-900 mb-2">在 Agent 中的典型用法</div>
          <ul className="list-disc pl-5 space-y-1.5 text-[13px] text-ink-700">
            <li>每日定时拉取 <code className="text-ink-900">/api/daily/latest</code>，生成晨间简报</li>
            <li>订阅 RSS 作为 RAG 知识库的新增语料</li>
            <li>按分类过滤（ai-models / ai-products / industry / paper / tip / opinion）聚焦你关心的方向</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
