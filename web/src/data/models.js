// 模型榜静态数据（MVP：人工维护，后续可接 AI 自动提取）
export const MODELS = [
  { rank: 1, name: 'GPT-5', vendor: 'OpenAI', date: '2025-08', tag: '旗舰通用大模型', note: '多模态、长上下文推理标杆' },
  { rank: 2, name: 'Claude Opus 4', vendor: 'Anthropic', date: '2025-05', tag: '长上下文 / 代码', note: 'Agent 与长文档处理强' },
  { rank: 3, name: 'Gemini 2.5 Pro', vendor: 'Google', date: '2025-03', tag: '超长上下文', note: '百万级 token 窗口' },
  { rank: 4, name: 'Qwen3-Max', vendor: '阿里通义', date: '2025-09', tag: '中文 / 开源生态', note: '中文与工具调用表现突出' },
  { rank: 5, name: 'DeepSeek-V3', vendor: '深度求索', date: '2025-12', tag: '高性价比推理', note: 'MoE 架构、训练成本低' },
  { rank: 6, name: 'Llama 4', vendor: 'Meta', date: '2025-04', tag: '开源基座', note: '社区生态最广' },
  { rank: 7, name: 'Grok 4', vendor: 'xAI', date: '2025-07', tag: '实时信息', note: '对接 X 实时数据' },
  { rank: 8, name: 'o3', vendor: 'OpenAI', date: '2025-04', tag: '深度推理', note: '强化学习推理专用' },
  { rank: 9, name: 'Kimi K2', vendor: '月之暗面', date: '2025-07', tag: '长文本 / Agent', note: '国产长上下文代表' },
  { rank: 10, name: 'Mistral Large', vendor: 'Mistral', date: '2025-02', tag: '欧洲开源', note: '多语种能力强' },
];

export const RANK_COLOR = ['#d86a52', '#d18a5e', '#d3b26a'];
