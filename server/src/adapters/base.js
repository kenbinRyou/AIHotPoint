// adapters/base.js
// 适配器基类。所有适配器都返回标准化的 items：
//   { source, external_id, url, title, content, author, lang, metrics, published_at }
export class BaseAdapter {
  constructor(name) {
    this.name = name;
  }

  /**
   * 抓取热点。query 为关键词（搜索页使用），trending 模式 query 为空
   * 返回 Item[]
   */
  // eslint-disable-next-line no-unused-vars
  async fetch({ query = '', limit = 30 } = {}) {
    throw new Error(`fetch() not implemented for ${this.name}`);
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const items = await this.fetch({ limit: 1 });
      return { ok: true, count: items.length };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
}
