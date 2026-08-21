// services/topics.js
// 主题地图：预定义主题分组 + 动态计数（对齐目标站 /topics）
import { getDb } from '../db/sqlite.js';

// 每个主题：key（URL 用）、名称、描述、匹配关键词（命中任意一个即算该主题）
export const TOPIC_GROUPS = [
  {
    group: '公司与模型',
    desc: '按厂商与模型系追踪：谁发了什么、又赢了哪一局',
    topics: [
      { key: 'openai', name: 'OpenAI / ChatGPT', desc: 'GPT 系列模型、ChatGPT 与 Sora 产品、公司战略的持续追踪。', keywords: ['openai', 'chatgpt', 'gpt', 'sora', 'sam altman', '奥特曼'] },
      { key: 'anthropic', name: 'Anthropic / Claude', desc: 'Claude 系列模型、Claude Code、安全研究与公司进展。', keywords: ['anthropic', 'claude'] },
      { key: 'google', name: 'Google / Gemini', desc: 'Gemini 系列、DeepMind 研究成果与产品生态。', keywords: ['gemini', 'deepmind', 'google ai', 'bard'] },
      { key: 'deepseek', name: 'DeepSeek', desc: '深度求索的模型发布、开源权重与技术报告。', keywords: ['deepseek', '深度求索', '深度seek'] },
      { key: 'qwen', name: '通义千问 Qwen', desc: '阿里 Qwen 系列从旗舰到端侧的全谱系动态。', keywords: ['qwen', '通义', '千问', '百炼'] },
      { key: 'kimi', name: 'Kimi / 月之暗面', desc: '月之暗面 Kimi 系列模型与产品动态。', keywords: ['kimi', '月之暗面'] },
      { key: 'zhipu', name: '智谱 GLM', desc: '智谱 GLM 系列旗舰开源与商业化进展。', keywords: ['智谱', 'glm', 'zhipu', 'chatglm'] },
      { key: 'xai', name: 'xAI / Grok', desc: '马斯克 xAI 与 Grok 系列的模型迭代与算力扩张。', keywords: ['grok', 'xai', '马斯克'] },
      { key: 'meta', name: 'Meta / Llama', desc: 'Llama 开源模型系列与超级智能实验室。', keywords: ['llama', 'meta ai', '扎克伯格'] },
      { key: 'nvidia', name: 'NVIDIA 英伟达', desc: 'GPU 新品、CUDA 生态与 AI 算力市场风向。', keywords: ['nvidia', '英伟达', 'cuda', '黄仁勋'] },
      { key: 'huggingface', name: 'Hugging Face', desc: '开源社区热门模型与数据集、排行榜变化。', keywords: ['hugging face', 'huggingface', 'transformers'] },
      { key: 'midjourney', name: 'Midjourney', desc: '图像生成头部玩家的产品迭代。', keywords: ['midjourney'] },
    ],
  },
  {
    group: '技术方向',
    desc: '按技术领域深挖：Agent、多模态、具身智能……',
    topics: [
      { key: 'agent', name: 'Agent 智能体', desc: '自主规划、工具调用、多步任务的技术方向与评测基准。', keywords: ['智能体', 'agent', 'manus', 'mcp', '工作流'] },
      { key: 'coding', name: 'AI 编码', desc: '编码助手、代码模型评测与开发工作流变革。', keywords: ['cursor', 'copilot', '代码', '编程', 'vibe coding', 'codex'] },
      { key: 'multimodal', name: '多模态', desc: '文生图、文生视频、语音与跨模态能力。', keywords: ['多模态', '文生图', '文生视频', 'stable diffusion', 'comfyui', '语音合成', 'tts', 'asr'] },
      { key: 'opensource', name: '开源模型', desc: '开源权重发布与开源生态动态。', keywords: ['开源', 'open source', 'open-source', '权重'] },
      { key: 'infra', name: '算力与芯片', desc: 'GPU、AI 芯片、数据中心与能源。', keywords: ['算力', 'gpu', '芯片', '数据中心', 'tpu', '推理成本'] },
      { key: 'safety', name: 'AI 安全', desc: '对齐、越狱攻防、安全研究与监管政策。', keywords: ['安全', '对齐', 'alignment', '越狱', 'jailbreak', '监管', '安全漏洞'] },
      { key: 'robotics', name: '具身智能 / 机器人', desc: '人形机器人、具身智能与物理 AI。', keywords: ['机器人', '具身智能', '人形', 'robotics'] },
      { key: 'rag', name: 'RAG / 知识库', desc: '检索增强、向量数据库与企业知识库。', keywords: ['rag', '检索增强', '向量数据库', 'embedding', '知识库'] },
    ],
  },
  {
    group: '内容形态',
    desc: '论文、教程与观点的不同打开方式',
    topics: [
      { key: 'paper', name: '论文与研究', desc: '值得关注的 AI 论文与研究突破。', keywords: ['论文', 'paper', 'arxiv', '研究'] },
      { key: 'tip', name: '教程与技巧', desc: '提示词、工作流与最佳实践。', keywords: ['教程', '指南', '提示词', 'prompt', '技巧'] },
      { key: 'opinion', name: '观点与讨论', desc: '趋势判断、争议与深度评论。', keywords: ['观点', '趋势', '争议', '讨论', '思考'] },
    ],
  },
];

const ALL_TOPICS = TOPIC_GROUPS.flatMap((g) =>
  g.topics.map((t) => ({ ...t, group: g.group })),
);

export function getTopic(key) {
  return ALL_TOPICS.find((t) => t.key === key) || null;
}

/** 全部主题 + 每个主题的精选条目数（is_ai=1） */
export function listTopics() {
  const db = getDb();
  return TOPIC_GROUPS.map((g) => ({
    group: g.group,
    desc: g.desc,
    topics: g.topics.map((t) => {
      const conds = t.keywords.map(() => '(title LIKE ? OR ai_keywords_json LIKE ?)').join(' OR ');
      const params = t.keywords.flatMap((k) => [`%${k}%`, `%${k}%`]);
      const count = db
        .prepare(`SELECT COUNT(*) AS c FROM items WHERE is_ai = 1 AND (${conds})`)
        .get(...params).c;
      return { key: t.key, name: t.name, desc: t.desc, count };
    }),
  }));
}

/** 主题下的条目 id 集合（供 listItems 过滤） */
export function topicItemIds(key, limit = 200) {
  const topic = getTopic(key);
  if (!topic) return null;
  const db = getDb();
  const conds = topic.keywords.map(() => '(title LIKE ? OR ai_keywords_json LIKE ?)').join(' OR ');
  const params = topic.keywords.flatMap((k) => [`%${k}%`, `%${k}%`]);
  const rows = db
    .prepare(
      `SELECT id FROM items WHERE is_ai = 1 AND (${conds}) ORDER BY fetched_at DESC LIMIT ?`,
    )
    .all(...params, limit);
  return rows.map((r) => r.id);
}
