import { Github, Rss } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-6 pb-10">
      <h1 className="text-[26px] font-bold tracking-tight">关于 AIHotPoint</h1>
      <div className="mt-4 space-y-4 text-[14px] leading-relaxed text-ink-700">
        <p>
          <span className="font-semibold text-ink-900">AIHotPoint</span> 是一个 AI 行业动态的聚合雷达：
          实时抓取多家权威信源，用 AI 做重要度评级、摘要与推荐理由，帮你从信息噪声里快速锁定真正值得关注的事。
        </p>
        <p>
          我们相信「少而精」——每天精选少量 high 级条目，配合 AI 日报 / 周报 / 月报，
          让你用几分钟掌握一个行业的全貌，而不是被无穷的信息流淹没。
        </p>

        <div className="card p-5">
          <div className="text-[14px] font-semibold text-ink-900 mb-3">关注我们</div>
          <div className="space-y-2.5 text-[13.5px]">
            <a
              href="/feed.xml"
              className="flex items-center gap-2 text-teal-600 hover:text-teal-700"
            >
              <Rss className="w-4 h-4" />
              订阅 RSS（精选）
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2 text-teal-600 hover:text-teal-700"
            >
              <Github className="w-4 h-4" />
              开源仓库（建设中）
            </a>
          </div>
        </div>

        <p className="text-[13px] text-ink-500">
          数据来源：OpenAI、Anthropic、Google、Meta、阿里通义、深度求索等官方博客与社区信源。
          评级与摘要由 AI 生成，仅供参考。
        </p>
      </div>
    </div>
  );
}
