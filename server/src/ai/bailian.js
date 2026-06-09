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

const SYSTEM_PROMPT = `你是「AIHotPoint」热点分析助手。请阅读一条抓取到的信息，然后严格按 JSON 格式输出（不要 markdown 包，不要多余文字）：
{
  "summary": "中文一句话摘要，30-80 字",
  "importance": "urgent|high|medium|low",
  "score": 0.0,            // 0-1，越重要越接近 1
  "category": "科技|财经|社会|娱乐|体育|政治|军事|健康|教育|其他",
  "keywords": ["关键词1", "关键词2"]   // 3-5 个中文或英文关键词
}
importance 判定参考：
- urgent：突发重大事件（地震、战争、爆炸、领导人重大声明、市场闪崩等）
- high：行业重要新闻（重要产品发布、重大政策、知名公司财报等）
- medium：值得关注但非紧急
- low：娱乐/普通/低价值
score：0-1 的浮点置信度。`;

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
      importance: ['urgent', 'high', 'medium', 'low'].includes(obj.importance) ? obj.importance : 'low',
      score: typeof obj.score === 'number' ? Math.max(0, Math.min(1, obj.score)) : 0.5,
      summary: String(obj.summary || '').slice(0, 200),
      category: String(obj.category || '其他'),
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

/**
 * 判断一组 item 是否命中用户监控的关键词
 * （先做一遍本地匹配，省得 AI 调用）
 */
export function matchKeywords(text, keywords) {
  if (!keywords || !keywords.length) return [];
  const lower = String(text || '').toLowerCase();
  return keywords.filter((k) => lower.includes(String(k).toLowerCase()));
}
