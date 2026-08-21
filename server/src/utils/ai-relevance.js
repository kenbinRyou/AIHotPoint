// utils/ai-relevance.js
// AI 相关性判定 + 分类体系（对齐目标站：模型 / 产品 / 行业 / 论文 / 教程 / 观点）
// 用于：抓取入库标记 is_ai、存量回填、查询过滤、旧分类映射

// 英文词用 \b 词边界匹配，避免 "said"/"domain" 误命中 "ai"
const EN_PATTERNS = [
  'ai', 'a\\.?i\\.', 'agi', 'aigc', 'llm', 'llms', 'gpt[- ]?\\d', 'gpt-\\w+', 'chatgpt',
  'claude', 'gemini', 'deepseek', 'qwen', 'openai', 'anthropic', 'kimi', 'llama',
  'mistral', 'grok', 'copilot', 'midjourney', 'sora', 'stable diffusion', 'comfyui',
  'ollama', 'hugging ?face', 'openrouter', 'transformer', 'diffusion model',
  'multimodal', 'chatbot', 'machine learning', 'deep learning', 'neural network',
  'neural net', 'fine-?tun(e|ing)', 'embeddings?', 'open ?source model', 'token cost',
  'context window', 'inference', 'foundation model', 'text-to-(image|video|speech)',
  'image-to-video', 'vector database', 'nvidia', 'gpu cluster', 'ai chip', 'tpu',
];
// 中文关键词直接子串匹配
const ZH_KEYWORDS = [
  '人工智能', '通用人工智能', '大模型', '大语言模型', '语言模型', '基础模型',
  '机器学习', '深度学习', '神经网络', '智能体', '生成式', '文生文', '文生图',
  '文生视频', '图生视频', '多模态', '算力', '推理模型', '开源模型', '微调',
  '具身智能', '数字人', '智算', '向量数据库', '知识蒸馏', '强化学习',
  '阿里百炼', '通义千问', '通义', '文心一言', '文心', '讯飞星火', '星火大模型',
  '豆包', '腾讯元宝', '智谱', '深度求索', '月之暗面', '零一万物', '百川智能',
  '阶跃星辰', '面壁智能', 'AI芯片', 'AI应用', 'AI助手', 'AI搜索', 'AI工具',
  'AI绘画', 'AI生成', 'AI翻译', 'AI客服', 'AI医疗', 'AI教育', 'AI编程',
  'AIGC', 'AGI', 'AI眼镜', 'AI手机', 'AI PC', '人形机器人', '机器人',
];

const EN_RE = new RegExp(`(^|[^a-z])(${EN_PATTERNS.join('|')})([^a-z]|$)`, 'i');
const ZH_RE = new RegExp(ZH_KEYWORDS.join('|'), 'i');

/**
 * 判断一条内容是否与 AI 相关（标题 / 正文 / AI 关键词 任一命中即可）
 */
export function isAiRelated(item = {}) {
  const text = [
    item.title || '',
    String(item.content || '').slice(0, 800),
    Array.isArray(item.ai_keywords) ? item.ai_keywords.join(' ') : '',
    Array.isArray(item.keywords) ? item.keywords.join(' ') : '',
  ].join(' ');
  if (!text.trim()) return false;
  if (ZH_RE.test(text)) return true;
  // 英文按词边界匹配
  return EN_RE.test(text);
}

// ---------------------------------------------------------------------------
// 分类体系：与目标站对齐的 6 分类（存英文 slug，前端映射中文标签）
export const AI_CATEGORIES = [
  { key: 'ai-models', label: '模型' },
  { key: 'ai-products', label: '产品' },
  { key: 'industry', label: '行业' },
  { key: 'paper', label: '论文' },
  { key: 'tip', label: '教程' },
  { key: 'opinion', label: '观点' },
];
export const AI_CATEGORY_KEYS = AI_CATEGORIES.map((c) => c.key);

/** 分类猜测关键词（用于存量回填 / LLM 不可用时的兜底） */
const CATEGORY_HINTS = {
  'ai-models': [
    '模型', 'llm', 'gpt', 'claude', 'gemini', 'deepseek', 'qwen', 'llama', 'mistral',
    'kimi', 'grok', '大模型', '开源权重', '权重', '参数量', 'benchmark', '评测',
    'context window', 'inference', '推理', '智谱', '通义', '文心',
  ],
  'ai-products': [
    '产品', '上线', '发布', 'app', '助手', 'chatgpt', 'copilot', 'cursor', 'midjourney',
    'sora', '豆包', 'ai工具', '应用', '新功能', 'beta', '订阅', '定价',
  ],
  paper: ['论文', 'paper', 'arxiv', '研究', '研究突破', '实验', '学术', '开源仓库', 'github'],
  tip: ['教程', '指南', '如何', '怎样', 'prompt', '提示词', '技巧', '最佳实践', 'workflow', '工作流'],
  opinion: ['观点', '思考', '为什么', '未来', '趋势', '评论', '看法', '争议', '反思', '预测'],
};

/** 根据 title/content/keywords 猜测新分类，无任何关键词命中时返回 null */
export function guessCategory(item = {}) {
  const text = [
    item.title || '',
    String(item.content || '').slice(0, 400),
    Array.isArray(item.ai_keywords) ? item.ai_keywords.join(' ') : '',
  ].join(' ').toLowerCase();

  let best = null;
  let bestScore = 0;
  for (const [cat, hints] of Object.entries(CATEGORY_HINTS)) {
    let score = 0;
    for (const h of hints) if (text.includes(h)) score++;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return best;
}

/** 旧分类（科技/财经/社会…）→ 新分类映射，用于存量回填 */
export function mapLegacyCategory(legacy) {
  switch (legacy) {
    case '科技': return 'ai-products';
    case '财经': return 'industry';
    case '教育': return 'tip';
    case '社会': return 'industry';
    case '娱乐': return 'ai-products';
    case '政治': return 'industry';
    case '军事': return 'industry';
    case '健康': return 'industry';
    case '体育': return 'industry';
    default: return null; // 其他/未分类 → 由 guessCategory 决定
  }
}
