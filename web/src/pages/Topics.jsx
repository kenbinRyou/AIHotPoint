import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Loader2, ChevronRight, Shapes } from 'lucide-react';

/**
 * 主题地图（对齐目标站 /topics）：分组主题卡片 + 精选计数
 */
export default function Topics() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listTopics()
      .then((r) => setGroups(r.data || []))
      .catch(() => setGroups([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6">
      <div className="mb-6">
        <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-teal-600 mb-1.5">
          Topics · 主题地图
        </div>
        <h1 className="text-[26px] font-bold tracking-tight leading-none flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-teal-600 grid place-items-center">
            <Shapes className="w-4 h-4 text-white" />
          </span>
          按主题看 AI
        </h1>
        <p className="mt-2 text-[13px] text-ink-500">
          公司与模型、技术方向、内容形态——点进任何一个主题看该方向的全部动态。
        </p>
      </div>

      {loading ? (
        <div className="py-24 grid place-items-center text-ink-500">
          <Loader2 className="w-5 h-5 animate-spin mb-2" />
          <span className="text-[13px]">加载中…</span>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <section key={g.group}>
              <h2 className="text-[17px] font-bold text-ink-900">{g.group}</h2>
              <p className="mt-1 mb-3.5 text-[12.5px] text-ink-500">{g.desc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {g.topics
                  .filter((t) => t.count > 0)
                  .map((t) => (
                    <Link
                      key={t.key}
                      to={`/topics/${t.key}`}
                      className="card-hover p-4 group"
                      aria-label={`查看${t.name}相关内容`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[14.5px] font-semibold text-ink-900 group-hover:text-teal-600 transition-colors">
                          {t.name}
                        </span>
                        <span className="text-[11.5px] text-ink-500 num shrink-0 inline-flex items-center gap-0.5">
                          {t.count} 条
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500 line-clamp-2">
                        {t.desc}
                      </p>
                    </Link>
                  ))}
              </div>
              {g.topics.every((t) => t.count === 0) && (
                <div className="card p-6 text-center text-[12.5px] text-ink-500">
                  该分组暂无收录内容，抓取积累后会自动出现
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
