# AIHotPoint · 跨平台 AI 热点雷达

聚合 8 大平台（Twitter/X / Hacker News / Bing / Google / DuckDuckGo / 搜狗 / B 站 / 微博）的实时热点，用阿里云百炼（通义千问 qwen3.7-max）做 AI 摘要、重要性评级与关键词提取。

- **前端**：React + Vite + TailwindCSS，Cyberpunk Editorial 风格
- **后端**：Node.js + Express + SQLite
- **AI**：阿里云百炼 OpenAI 兼容接口
- **数据源**：多源适配器（HTTP 抓取 / 第三方 API，免费优先）

---

## 快速开始

### 1. 准备 API Key

| 用途 | 服务 | 申请地址 | 必须？ |
|---|---|---|---|
| AI 摘要 / 重要性评级 | 阿里云百炼 DashScope | https://dashscope.console.aliyun.com/apiKey | 必填（无 key 时 AI 分析自动降级） |
| 抓取 Twitter/X | twitterapi.io | https://twitterapi.io （注册→充值→生成 API Key） | 可选，无 key 时该源自动跳过 |

> 阿里云百炼开通后，模型 `qwen3.7-max` 需要**按量计费或 Token Plan 团队版**（Coding Plan 不支持）。其它源（Bing / Google / DDG / HN / 搜狗 / B 站 / 微博）均为免费抓取。

### 2. 启动后端

```bash
cd server
cp .env.example .env       # 然后填入真实 key
npm install
npm run migrate           # 初始化 SQLite 表
npm run dev               # http://localhost:4000
```

后端会**自动**每 5 分钟抓取一次全量数据源，并对新入库条目跑 AI 分析（cron 可在 `.env` 里改 `CRAWL_CRON`）。

### 3. 启动前端

```bash
cd web
npm install
npm run dev               # http://localhost:5173
```

---

## 关键能力

| 能力 | 说明 |
|---|---|
| 实时热点流 | 主页 30 秒自动刷新，8 源数据按重要性/时间/热度多维排序 |
| 多源搜索 | 搜索页：手动输入关键词，跨 8 源实时抓取，可选 AI 摘要 |
| AI 评级 | 通义千问输出 importance（urgent/high/medium/low）、score、summary、category、keywords |
| 关键词监控 | 后台根据已配关键词自动匹配抓取内容 |
| 数据去重 | URL+标题哈希去重，不重复入库 |
| 反爬策略 | 随机 User-Agent、随机延时（2-6s）、单源失败不影响整体 |

---

## API 速查

```bash
# 健康检查
curl http://localhost:4000/api/health

# 列热点（支持 sources / importance / keyword / time_range / sort / page / pageSize）
curl 'http://localhost:4000/api/items?sources=twitter,hackernews&time_range=24h&sort=heat_desc'

# 多源实时搜索
curl -X POST http://localhost:4000/api/search \
  -H 'Content-Type: application/json' \
  -d '{"keyword":"windsurf","sources":["twitter","hackernews","bing"],"analyze":true}'

# 关键词管理
curl -X POST http://localhost:4000/api/keywords -H 'Content-Type: application/json' -d '{"keyword":"AI Agent"}'

# 手动触发抓取
curl -X POST http://localhost:4000/api/crawl/trigger -H 'Content-Type: application/json' -d '{"source":"twitter"}'
```

完整 API 见 `server/src/routes/`。

---

## 项目结构

```
AIHotPoint/
├── server/                    # 后端
│   ├── src/
│   │   ├── adapters/          # 8 个数据源适配器
│   │   ├── ai/bailian.js      # 阿里云百炼
│   │   ├── db/                # SQLite + 仓储
│   │   ├── routes/            # 4 个路由
│   │   ├── services/scheduler.js
│   │   └── app.js
│   └── tests/                 # node:test 单测
├── web/                       # 前端
│   ├── src/
│   │   ├── pages/             # Home / Search / Keywords
│   │   ├── components/        # HeatCard / FilterBar / ...
│   │   └── api.js
│   └── vite.config.js
└── .gitignore                 # 已统一管理
```

---

## 开发与测试

```bash
# 后端单测
cd server && npm test

# 前端构建
cd web && npm run build
```

---

## License

MIT
