# AIHotPoint · 跨源 AI 热点雷达

聚合 **RSS 信源 + 官博页面爬取 + 社交平台 + 搜索引擎** 的 AI 行业动态，用阿里云百炼（通义千问 `qwen3.7-max`）做 AI 评级、摘要、关键词提取，并自动生成 **日报 / 周报 / 月报**、主题聚合与模型榜。

- **前端**：React 18 + Vite 5 + TailwindCSS，支持深色 / 浅色 / 跟随系统三主题
- **后端**：Node.js + Express + better-sqlite3 + node-cron
- **AI**：阿里云百炼 DashScope（OpenAI 兼容接口）
- **数据源**：可插拔适配器（RSS / 页面爬取 / 社交 API / 搜索引擎，免费优先）

---

## 核心特性

| 特性 | 说明 |
|---|---|
| 实时热点流 | 主页按时间线聚合，自动刷新；多维排序（重要性 / 时间 / 热度） |
| 多源搜索 | 搜索页跨 19 个主信源 + 4 个搜索引擎实时抓取，可选 AI 摘要 |
| AI 评级 | 通义千问输出 `importance`（urgent/high/medium/low）、`score`、`summary`、`category`、`keywords` |
| 推荐理由 | 对 high+ 条目额外生成一句话「为什么值得看」（独立 AI 调用，控制成本） |
| 全文抓取 + 中文翻译 | 可选开关：抓正文并用 AI 翻译成中文，仅对 high+ 或用户点开的条目（控制 token 成本） |
| 故事线聚合 | 同一事件的跨源报道自动归并为一个 Story，附 AI 综述与多源信源列表 |
| 日报 / 周报 / 月报 | 定时自动生成（日报每日 8 点、周报每周一、月报每月 1 日），按主题分节 + AI 导语 |
| 主题索引 | 按 AI 分类（模型 / 产品 / 行业 / 论文 / 教程 / 观点）聚合浏览 |
| 模型榜 | 主流大模型排行（人工维护静态数据，含厂商 / 发布时间 / 定位） |
| 收藏 | 本地收藏夹，跨设备需自行扩展 |
| 关键词监控 | 后端按配置关键词自动匹配抓取内容（前端仅保留后端能力） |
| 数据去重 | URL + 标题哈希去重，不重复入库 |
| 反爬策略 | 随机 User-Agent、随机延时（2–6s）、单源失败不影响整体 |
| RSS 输出 | 提供 `/feed.xml`、`/feed/all.xml`、`/feed/daily.xml`、`/feed/category/:cat.xml` |
| 主题切换 | 深色（默认）/ 浅色 / 跟随系统，侧栏一键切换 |

---

## 信源体系

主信源（scheduler 自动抓取）共 **19 个**，搜索引擎（仅搜索功能调用）**4 个**。

| 分类 | 信源 |
|---|---|
| AI 公司官方（`ai-official`） | Google AI、Hugging Face、Anthropic（官博页爬取） |
| 科技媒体（`tech-media`） | TechCrunch、The Verge、The Decoder、MIT Tech Review、IT之家、AI News、Last Week in AI、Unite.ai、MarkTechPost |
| 社区 / 论文（`community`） | Hacker News、arXiv cs.AI / cs.LG / cs.CL |
| 社交平台（`social`） | Twitter / X（twitterapi.io）、B 站、微博热搜 |
| 搜索引擎（`search-engine`，搜索专用） | Bing、Google、DuckDuckGo、搜狗 |

> RSS 信源在 `server/src/adapters/rss-sources.js`，页面爬取源在 `server/src/adapters/page-sources.js`，社交 / 搜索适配器在 `server/src/adapters/*.js`。

---

## 快速开始

### 环境要求

- **后端**：Node.js 20.x（better-sqlite3 为原生模块，需用 20.x 编译运行）
- **前端**：Node.js 18+（Vite 5）

### 1. 准备 API Key

| 用途 | 服务 | 申请地址 | 必须？ |
|---|---|---|---|
| AI 评级 / 摘要 / 翻译 | 阿里云百炼 DashScope | https://dashscope.console.aliyun.com/apiKey | 必填（无 key 时 AI 分析自动降级为仅入库） |
| 抓取 Twitter / X | twitterapi.io | https://twitterapi.io （注册 → 充值 → 生成 API Key） | 可选，无 key 时该源自动跳过 |

> 阿里云百炼开通后，模型 `qwen3.7-max` 需**按量计费或 Token Plan 团队版**（Coding Plan 不支持）。其余信源均为免费抓取 / 爬取。

### 2. 启动后端

```bash
cd server
cp .env.example .env       # 然后填入真实 key
npm install
npm run migrate           # 初始化 SQLite 表
npm run dev               # http://localhost:4000
```

后端会**自动**：
- 每 5 分钟（`CRAWL_CRON`）抓取全部主信源并入库；
- 对新条目跑 AI 分析与故事线聚合；
- 每小时做一次热度采样（供趋势图）；
- 每日 8 点生成前一天的 AI 日报（周报 / 月报同理定时生成）。

### 3. 启动前端

```bash
cd web
npm install
npm run dev               # http://localhost:5173（已配置 /api 与 /feed 代理到 4000）
```

---

## 配置项（`.env`）

| 变量 | 默认值 | 说明 |
|---|---|---|
| `DASHSCOPE_API_KEY` | — | 阿里云百炼 API Key（必填） |
| `DASHSCOPE_BASE_URL` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | 兼容接口地址 |
| `DASHSCOPE_MODEL` | `qwen3.7-max` | 使用的模型 |
| `TWITTER_API_KEY` | — | twitterapi.io Key（可选） |
| `TWITTER_API_BASE` | `https://api.twitterapi.io` | — |
| `CRAWL_CRON` | `*/5 * * * *` | 抓取周期（cron） |
| `ENABLE_AI_ANALYZE` | `true` | 是否跑 AI 分析（`false` 时仅入库） |
| `SNAPSHOT_CRON` | `0 * * * *` | 热度采样周期 |
| `DAILY_CRON` | `0 8 * * *` | 日报生成时间 |
| `FULLTEXT_TRANSLATE` | `off` | 全文抓取 + 中文翻译开关（开启会显著增加 token 成本） |
| `PORT` | `4000` | 后端端口 |
| `DB_PATH` | `./data/aihotpoint.db` | SQLite 文件路径 |
| `CRAWL_DELAY_MIN` / `CRAWL_DELAY_MAX` | `2000` / `6000` | 单源间随机延时（毫秒），避免被封 |
| `SITE_URL` | `https://aihotpoint.dev` | RSS 输出中的站点地址 |

---

## API 速查

```bash
# 健康检查
curl http://localhost:4000/api/health

# 列热点（支持 sources / category / importance / keyword / time_range / sort / page / pageSize）
curl 'http://localhost:4000/api/items?category=model&time_range=24h&sort=score_desc'

# 多源实时搜索
curl -X POST http://localhost:4000/api/search \
  -H 'Content-Type: application/json' \
  -d '{"keyword":"windsurf","sources":["twitter","hackernews","bing"],"analyze":true}'

# 关键词管理
curl -X POST http://localhost:4000/api/keywords -H 'Content-Type: application/json' -d '{"keyword":"AI Agent"}'

# 手动触发单源抓取
curl -X POST http://localhost:4000/api/crawl/trigger -H 'Content-Type: application/json' -d '{"source":"twitter"}'

# 故事线 / 日报 / 主题 / 反馈 / 周报 / 月报
curl http://localhost:4000/api/stories
curl http://localhost:4000/api/daily/latest
curl http://localhost:4000/api/topics
curl http://localhost:4000/api/weekly/latest
curl http://localhost:4000/api/monthly/latest
```

完整路由见 `server/src/routes/`（`items` / `search` / `keywords` / `crawl` / `stories` / `daily` / `topics` / `feedback` / `reports` / `feed`）。

### RSS 输出

| 地址 | 内容 |
|---|---|
| `/feed.xml` | 精选（近 7 天，AI 评级 high 以上） |
| `/feed/all.xml` | 全部动态（近 7 天） |
| `/feed/daily.xml` | AI 日报（近 24 小时） |
| `/feed/category/:cat.xml` | 指定分类（如 `model`、`product`） |

---

## 项目结构

```
AIHotPoint/
├── server/                    # 后端
│   ├── src/
│   │   ├── adapters/          # 数据源适配器：RSS(14) + 页面爬取(1) + 社交(4) + 搜索(4)
│   │   ├── ai/bailian.js      # 阿里云百炼（OpenAI 兼容）
│   │   ├── db/                # SQLite + 仓储（items / stories / migrate）
│   │   ├── routes/            # 11 个路由模块
│   │   ├── services/          # scheduler / daily / reports / topics / fulltext
│   │   └── app.js
│   └── tests/                 # node:test 单测
├── web/                       # 前端
│   ├── src/
│   │   ├── pages/             # 18 个页面（Home / All / Hot / Daily / Weekly / Monthly / Topics / Starred / Search / Keywords / Leaderboard / Agent / About / Changelog / Feedback / 详情页 …）
│   │   ├── components/        # TimelineCard / FeedPage / ReportView / Sparkline / StarButton / HotSidePanel / ModelPreview
│   │   ├── data/models.js     # 模型榜静态数据
│   │   ├── theme.jsx          # 深色 / 浅色 / 系统
│   │   └── api.js
│   └── vite.config.js
├── docs/                      # 对齐 AIHOT（aihot.virxact.com）实施方案
├── .env.example               # 后端配置样例
└── .gitignore
```

---

## 开发与测试

```bash
# 后端单测（需 Node 20.x）
cd server && npm test

# 前端构建（产物输出 web/dist，已 gitignore）
cd web && npm run build
```

> 数据库文件（`server/data/*.db`）与本地配置（`server/.env`）均已在 `.gitignore` 中排除，不会被提交。

---

## License

MIT
