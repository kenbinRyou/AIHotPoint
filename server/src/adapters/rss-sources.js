// adapters/rss-sources.js
// RSS 信源配置：对齐 AIHOT 的信源结构
// 每个源：key(唯一标识)、label(显示名)、feedUrl(RSS地址)、category(信源分类)、lang(语言)
//
// category 分类：
//   ai-official  — AI 公司官方博客
//   tech-media   — 科技媒体
//   community    — 社区/论文平台

export const RSS_SOURCES = [
  // AI 公司官方
  {
    key: 'google-ai',
    label: 'Google AI',
    feedUrl: 'https://blog.google/innovation-and-ai/technology/ai/rss/',
    category: 'ai-official',
    lang: 'en',
  },
  {
    key: 'huggingface',
    label: 'Hugging Face',
    feedUrl: 'https://huggingface.co/blog/feed.xml',
    category: 'community',
    lang: 'en',
  },
  // 科技媒体
  {
    key: 'techcrunch',
    label: 'TechCrunch',
    feedUrl: 'https://techcrunch.com/feed/',
    category: 'tech-media',
    lang: 'en',
  },
  {
    key: 'the-verge',
    label: 'The Verge',
    feedUrl: 'https://www.theverge.com/rss/index.xml',
    category: 'tech-media',
    lang: 'en',
  },
  {
    key: 'the-decoder',
    label: 'The Decoder',
    feedUrl: 'https://the-decoder.com/feed/',
    category: 'tech-media',
    lang: 'en',
  },
  {
    key: 'mit-tech-review',
    label: 'MIT Tech Review',
    feedUrl: 'https://www.technologyreview.com/feed/',
    category: 'tech-media',
    lang: 'en',
  },
  {
    key: 'ithome',
    label: 'IT之家',
    feedUrl: 'https://www.ithome.com/rss/',
    category: 'tech-media',
    lang: 'zh',
  },
  // AI 垂直媒体（补充大模型内容）
  {
    key: 'ai-news',
    label: 'AI News',
    feedUrl: 'https://www.artificialintelligence-news.com/feed/',
    category: 'tech-media',
    lang: 'en',
  },
  {
    key: 'last-week-in-ai',
    label: 'Last Week in AI',
    feedUrl: 'https://lastweekin.ai/feed',
    category: 'tech-media',
    lang: 'en',
  },
  {
    key: 'unite-ai',
    label: 'Unite.ai',
    feedUrl: 'https://www.unite.ai/feed/',
    category: 'tech-media',
    lang: 'en',
  },
  {
    key: 'marktechpost',
    label: 'MarkTechPost',
    feedUrl: 'https://www.marktechpost.com/feed/',
    category: 'tech-media',
    lang: 'en',
  },
  // 论文（社区/论文平台）
  {
    key: 'arxiv-ai',
    label: 'arXiv cs.AI',
    feedUrl: 'http://export.arxiv.org/rss/cs.AI',
    category: 'community',
    lang: 'en',
  },
  {
    key: 'arxiv-ml',
    label: 'arXiv cs.LG',
    feedUrl: 'http://export.arxiv.org/rss/cs.LG',
    category: 'community',
    lang: 'en',
  },
  {
    key: 'arxiv-cl',
    label: 'arXiv cs.CL',
    feedUrl: 'http://export.arxiv.org/rss/cs.CL',
    category: 'community',
    lang: 'en',
  },
];
