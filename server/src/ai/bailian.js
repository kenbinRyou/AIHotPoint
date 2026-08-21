// ai/bailian.js
// 阿里云百炼（DashScope OpenAI 兼容模式）接入
import OpenAI from 'openai';
import { logger } from '../utils/logger.js';
import { safeJson } from '../utils/hash.js';

const API_KEY = process.env.DASHSCOPE_API_KEY;
const BASE_URL = process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const MODEL = process.env.DASHSCOPE_MODEL || 'qwen3.7-max';

let client = null;
export function getClient() {
  if (client) return client;
  if (!API_KEY || API_KEY === 'sk-please-replace-me') {
    logger.warn('DASHSCOPE_API_KEY 未配置，AI 分析将不可用', 'ai');
    return null;
  }
  client = new OpenAI({ apiKey: API_KEY, baseURL: BASE_URL });
  return client;
}

const SYSTEM_PROMPT = `你是「AIHotPoint」AI 行业热点分析助手。请阅读一条抓取到的信息，然后严格按 JSON 格式输出（不要 markdown 包，不要多余文字）：
{
  "is_ai": true,            // 内容核心主题是否与人工智能相关（边缘沾边但主题无关要给 false）
  "summary": "中文一句话摘要，30-80 字",
  "importance": "urgent|high|medium|low",
  "score": 0.0,            // 0-1，越重要越接近 1
  "category": "ai-models|ai-products|industry|paper|tip|opinion",
  "keywords": ["关键词1", "关键词2"]   // 3-5 个中文或英文关键词
}
category 判定参考：
- ai-models：模型发布/更新/评测/开源权重（GPT、Claude、Qwen、DeepSeek 等）
- ai-products：AI 产品与应用（ChatGPT、Cursor、AI 助手、AI 工具新功能等）
- industry：行业动态（融资、政策、算力、芯片、市场、公司战略）
- paper：论文与研究突破
- tip：教程、指南、提示词技巧、最佳实践
- opinion：观点、评论、趋势判断、争议讨论
importance 判定参考：
- urgent：突发重大事件（重大安全事件、重磅模型意外发布、市场闪崩等）
- high：行业重要新闻（重要模型/产品发布、重大政策、大额融资等）
- medium：值得关注但非紧急
- low：普通/低价值
score：0-1 的浮点置信度。
注意：即使来源不严肃，只要核心主题是 AI 就按内容质量打分；与 AI 无关的内容 is_ai 给 false。`;

/**
 * 对单条 item 做 AI 分析。
 * 返回 { importance, score, summary, category, keywords }
 */
export async function analyzeItem(item) {
  const c = getClient();
  if (!c) return null;
  const text = `标题: ${item.title}\n内容: ${(item.content || '').slice(0, 600)}\n来源: ${item.source}\n作者: ${item.author || ''}`;
  try {
    const completion = await c.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
      // 兼容模式不支持 enable_thinking 参数；qwen3-max 默认就支持思考
    });
    const raw = completion.choices?.[0]?.message?.content || '';
    const obj = safeJson(extractJson(raw), null);
    if (!obj) {
      logger.warn('AI 返回无法解析', 'ai', { raw: raw.slice(0, 200) });
      return null;
    }
    return {
      is_ai: typeof obj.is_ai === 'boolean' ? obj.is_ai : true,
      importance: ['urgent', 'high', 'medium', 'low'].includes(obj.importance) ? obj.importance : 'low',
      score: typeof obj.score === 'number' ? Math.max(0, Math.min(1, obj.score)) : 0.5,
      summary: String(obj.summary || '').slice(0, 200),
      category: ['ai-models', 'ai-products', 'industry', 'paper', 'tip', 'opinion'].includes(obj.category)
        ? obj.category
        : 'industry',
      keywords: Array.isArray(obj.keywords) ? obj.keywords.map(String).slice(0, 8) : [],
    };
  } catch (e) {
    logger.error(`AI analyze failed: ${e.message}`, 'ai');
    return null;
  }
}

function extractJson(s) {
  if (!s) return null;
  const m = String(s).match(/\{[\s\S]*\}/);
  return m ? m[0] : s;
}

const DIGEST_SYSTEM_PROMPT = `你是「AIHotPoint」AI 行业动态编辑。基于给定的同一事件多篇报道素材，写一段客观的事件综述。直接输出正文（不要标题、不要 markdown 标记），120-250 字中文，陈述事实与关键数字，不做营销式夸张。`;

/**
 * 故事线事件综述：汇总同一事件的多篇报道
 * 返回综述文本，失败返回 null
 */
export async function storyDigest(story, items) {
  const c = getClient();
  if (!c) return null;
  const material = items
    .slice(0, 8)
    .map((it, i) => `[${i + 1}] ${it.source} · ${it.title}\n${(it.ai_summary || it.content || '').slice(0, 150)}`)
    .join('\n\n');
  try {
    const completion = await c.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: DIGEST_SYSTEM_PROMPT },
        { role: 'user', content: `事件主题：${story.title}\n\n报道素材：\n${material}` },
      ],
      temperature: 0.3,
    });
    return (completion.choices?.[0]?.message?.content || '').trim().slice(0, 500) || null;
  } catch (e) {
    logger.error(`storyDigest failed: ${e.message}`, 'ai');
    return null;
  }
}

/**
 * AI 日报：当日重点条目 → 日报标题与导语
 * 返回 { title, intro } 或 null
 */
export async function dailyDigest(date, items) {
  const c = getClient();
  if (!c) return null;
  const material = items
    .slice(0, 8)
    .map((it) => `- ${it.title}（${it.source}，AI 评分 ${Math.round((it.ai_score || 0) * 100)}）\n  ${(it.ai_summary || '').slice(0, 100)}`)
    .join('\n');
  try {
    const completion = await c.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `你是「AIHotPoint」AI 日报编辑。根据当日重点条目，输出 JSON（不要 markdown 包）：{"title":"当日最重要的一个事件标题（15字内）","intro":"80-150字中文导语，概括今日 AI 领域整体动态"}`,
        },
        { role: 'user', content: `日期：${date}\n\n当日重点：\n${material}` },
      ],
      temperature: 0.3,
    });
    const raw = completion.choices?.[0]?.message?.content || '';
    const obj = safeJson(extractJson(raw), null);
    if (!obj) return null;
    return {
      title: String(obj.title || '').slice(0, 30) || 'AI 日报',
      intro: String(obj.intro || '').slice(0, 300),
    };
  } catch (e) {
    logger.error(`dailyDigest failed: ${e.message}`, 'ai');
    return null;
  }
}

/**
 * AI 周报 / 月报：基于一段周期内重点条目，生成刊名标题与导语
 * 返回 { title, intro } 或 null
 */
export async function reportDigest({ periodLabel, kind }, items) {
  const c = getClient();
  if (!c) return null;
  const material = items
    .slice(0, 24)
    .map(
      (it) =>
        `- ${it.title}（${it.source}，AI 评分 ${Math.round((it.ai_score || 0) * 100)}）\n  ${(it.ai_summary || '').slice(0, 90)}`,
    )
    .join('\n');
  try {
    const completion = await c.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `你是「AIHotPoint」${kind === 'weekly' ? 'AI 周报' : 'AI 月报'}编辑。根据周期内重点条目，输出 JSON（不要 markdown 包）：{"title":"本期主线主题（15字内）","intro":"120-220字中文导语，概括本期 AI 领域整体动态与关键事件"}`,
        },
        { role: 'user', content: `周期：${periodLabel}\n\n重点条目：\n${material}` },
      ],
      temperature: 0.3,
    });
    const raw = completion.choices?.[0]?.message?.content || '';
    const obj = safeJson(extractJson(raw), null);
    if (!obj) return null;
    return {
      title: String(obj.title || '').slice(0, 30) || `${periodLabel} AI 动态`,
      intro: String(obj.intro || '').slice(0, 400),
    };
  } catch (e) {
    logger.error(`reportDigest failed: ${e.message}`, 'ai');
    return null;
  }
}

/**
 * 判断一组 item 是否命中用户监控的关键词
 * （先做一遍本地匹配，省得 AI 调用）
 */
export function matchKeywords(text, keywords) {
  if (!keywords || !keywords.length) return [];
  const lower = String(text || '').toLowerCase();
  return keywords.filter((k) => lower.includes(String(k).toLowerCase()));
}

const REASON_SYSTEM_PROMPT = `你是「AIHotPoint」AI 行业动态编辑。请用一句话（20-50字中文）说明这条内容为什么值得关注。直接输出理由正文，不要标题、不要 markdown 标记。重点说明：对读者有什么价值、为什么在这个时间点值得了解。`;

/**
 * 生成推荐理由：为什么这条内容值得关注
 * 只对 high 以上条目调用（控制 API 成本）
 * 返回理由文本，失败返回 null
 */
export async function generateReason(item) {
  const c = getClient();
  if (!c) return null;
  const text = `标题: ${item.title}\n摘要: ${item.ai_summary || ''}\n来源: ${item.source}\n分类: ${item.ai_category || ''}\n重要度: ${item.ai_importance || ''}`;
  try {
    const completion = await c.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: REASON_SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
    });
    return (completion.choices?.[0]?.message?.content || '').trim().slice(0, 200) || null;
  } catch (e) {
    logger.error(`generateReason failed: ${e.message}`, 'ai');
    return null;
  }
}

const TRANSLATE_SYSTEM_PROMPT = `你是专业的英译中翻译。把给定的英文（或中英混排）技术内容准确翻译成流畅的中文，保留专有名词（如模型名、公司名、产品名）原文。直接输出译文，不要解释、不要 markdown 标记。`;

/**
 * 将正文翻译为中文（按长度分块，控制单次调用体量）
 * 返回中文译文，失败返回 null
 */
export async function translateText(text, maxChars = 8000) {
  const c = getClient();
  if (!c) return null;
  const clean = String(text || '').trim().replace(/\s+/g, ' ');
  if (!clean) return null;
  const capped = clean.slice(0, maxChars);
  // 按段落/句子粗略分块（每块 ~2500 字），避免超长
  const chunks = [];
  const SIZE = 2500;
  for (let i = 0; i < capped.length; i += SIZE) chunks.push(capped.slice(i, i + SIZE));
  try {
    const parts = [];
    for (const ch of chunks) {
      const completion = await c.chat.completions.create({
        model: MODEL,
        messages: [
          { role: 'system', content: TRANSLATE_SYSTEM_PROMPT },
          { role: 'user', content: ch },
        ],
        temperature: 0.1,
      });
      const t = (completion.choices?.[0]?.message?.content || '').trim();
      if (t) parts.push(t);
    }
    return parts.join('\n\n') || null;
  } catch (e) {
    logger.error(`translateText failed: ${e.message}`, 'ai');
    return null;
  }
}
