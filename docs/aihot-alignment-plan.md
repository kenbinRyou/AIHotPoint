# AIHotPoint 对齐 AIHOT（aihot.virxact.com）实施方案

> 生成日期：2026-08-21
> 状态：方案已确认，待实施
> 已确认决策：① 全文翻译完全对齐（入库自动翻译）；② /search、/keywords 移出侧栏（搜索并入 /all，关键词监控仅保留后端）；③ 默认主题改深色

---

## 一、目标站结构参考（实测抓取结果）

### 1. 页面清单（14 页 + 4 条 RSS）

| 路由 | 内容 | 当前状态 |
|---|---|---|
| `/` | 精选时间线（分类 tab + 搜索 + 模型榜预览） | ✅ 基本对齐，缺细节 |
| `/all` | 全部 AI 动态（含页内搜索 `#search`） | ✅ 基本对齐 |
| `/hot` | 热点榜（48 小时报道密度） | ✅ 已对齐 |
| `/daily` | AI 日报（每日 8 时更新） | ⚠️ 需重构 |
| `/weekly` | AI 周报（主题分节聚合） | ❌ 缺失 |
| `/monthly` | AI 月报（主题分节聚合） | ❌ 缺失 |
| `/topics` | 主题索引 | ✅ 已对齐 |
| `/starred` | 收藏 | ✅ 已对齐 |
| `/leaderboard` | 模型榜 | ❌ 缺失 |
| `/agent` | Agent 接入说明 | ❌ 缺失 |
| `/about` | 关于 / 关注 | ❌ 缺失 |
| `/changelog` | 更新日志（带未读红点） | ❌ 缺失 |
| `/feedback` | 反馈 / 想法 | ❌ 缺失 |
| `/items/:id` | 条目详情（AI 导读 + 推荐理由 + 全文翻译） | ⚠️ 缺全文 |
| `/feed.xml` 等 | RSS 输出（精选/全部/日报/分类） | ❌ 缺失 |

### 2. 侧栏结构（三组 + 底部）

```
内容：精选 · 全部 AI 动态 · 热点榜 · AI 日报 · 主题 · 收藏
模型：模型榜
更多：Agent 接入 · 关于 · 更新日志(未读点) · 反馈
底部：主题切换（深色/系统/浅色）+ 备案链接
```

### 3. 首页时间线卡片 DOM（对齐基准）

```
timeline-day: 日期 h2 + 折叠按钮 + "星期X · N 条"
timeline-item: 时间(04:27) + rail/圆点 + 卡片
卡片: 信源(Claude：Blog（网页）) + 精选徽章 + AI 评分 63/100 + 收藏按钮
      → 标题链接 → 摘要(3行截断)
      → "另有 N 家信源报道"(悬浮 dup-tooltip 列出信源)
      → 分割线 → 推荐理由：xxx
```

### 4. 日报页面结构

```
导航：日报 / 周报 / 月报 tab + 日期快捷导航（今天/昨天/更早）
标题：VOL.2026.08.21 · 17 STORIES + "17 篇报道 · 约 7 分钟阅读"
统计栏（四指标）：今日事件 17 · 一手报道 15 · 新模型 2 · 信源 11
正文：五栏目分节（模型发布/更新 · 产品发布/更新 · 行业动态 · 论文研究 · 技巧与观点）
     每节：标题 + 篇数 + 条目列表（标题 + 信源）
右侧：按月分组的归档列表（月标题 + 日期列表）+ "全部日报"入口
底部：推广位 + 前一天/历史/后一天导航 + "AIHOT DAILY · 每早八时更新"
```

### 5. 周报/月报页面结构

```
标题：AIHOT 周报 / 月报 + 主题名（如"智能体走向主流"）
导语：AI 生成的本期主线综述段落
统计栏：独立事件 N · 条精选 N · 期日报浓缩 N · ≈3 min 读完本页
目录：编号主题列表（01 智能体模型密集发布 5 篇 …）
正文：每主题一节 = AI 段落摘要 + 条目列表（标题 + 信源名）
底部：往期归档（周报 2026-W19~W32 / 月报 2026-05~06）
```

### 6. 视觉规范（目标站 CSS 实测值）

| 项 | 深色（默认） | 浅色 |
|---|---|---|
| 背景 bg-0/1/2 | `#10151c` / `#171d26` / `#1b2230` | `#f4f5f6` / `#eff1f2` / `#e2e4e7` |
| 卡片 | `#171d26`（无边框阴影） | `#ffffff`（阴影极浅） |
| 文字 text-0/1/2 | `#e8ebf2` / `#98a2b3` / `#7b869a` | `#1c2733` / `#5c6672` / `#6b7684` |
| 边框 | `rgba(255,255,255,0.08)` | `#e2e4e7` |
| accent | cyan `#4fa3b3` | `#135e6b`（当前项目浅色已一致） |
| 辅助色 | amber `#d3b26a` · rose `#d86a52` · emerald `#5fc79a` | amber `#b8873a` · rose `#b3402a` · emerald `#2f7d5c` |
| 排名色 | 1:`#d86a52` 2:`#d18a5e` 3:`#d3b26a` rest:`#7b869a` | 1:`#b3402a` 2:`#a3642f` 3:`#96702e` rest:`#6b7684` |

布局参数：内容容器 feed 720px / 详情 720px / 侧栏 180px；圆角 12px（卡片）8px（小件）16px（大容器）；字体 system-ui + PingFang SC 栈；卡片无阴影、hover 换底色（`#1b2230`）。

---

## 二、已确认的产品决策

| 决策点 | 结论 | 影响 |
|---|---|---|
| 全文翻译 | **完全对齐**：入库时自动抓全文 + AI 翻译存储 | token 成本最高项，需加开关与限流（见 P6） |
| /search、/keywords | **移出侧栏**：搜索并入 /all 页内，关键词监控仅后端 | 路由保留可直接访问 |
| 默认主题 | **深色** | theme.jsx 默认值改 dark |

---

## 三、分阶段实施计划

### P1 视觉体系对齐（纯前端）

改动文件：`web/src/styles/index.css`、`web/src/theme.jsx`、`web/src/App.jsx`

1. 深色主题变量替换为目标站实测值（见上表）；`--accent` 深色 `#43b9a5` → `#4fa3b3`，bg `#101418` → `#10151c` 等
2. `theme.jsx` 默认模式改 `dark`
3. 内容容器 `max-w-[900px]` → `max-w-[720px]`；侧栏 `w-[212px]` → `w-[180px]`
4. 卡片去 hover 阴影，改为 hover 换底色（深色 `#1b2230`）
5. 侧栏改三组：内容（现有六项）/ 模型（模型榜）/ 更多（Agent 接入、关于、更新日志、反馈）；工具组移除，`/search` `/keywords` 路由保留
6. 更新日志项带未读红点（localStorage 记录已读版本号）

验收：深浅两主题下与目标站截图肉眼对比无明显色差；侧栏分组一致。

### P2 首页与卡片细节对齐（前端 + 少量后端）

改动文件：`server/src/db/items.js`、`server/src/routes/items.js`、`web/src/components/TimelineCard.jsx`、`web/src/components/FeedPage.jsx`

1. **items API 返回 dup 信息**：列表查询 LEFT JOIN story 关联条目，返回 `dup_count` + `dup_sources`（同 story 其余条目的信源名数组）
2. TimelineCard 增加卡片级"另有 N 家信源报道"，hover 显示信源列表 tooltip（对齐 `dup-tooltip` 交互）
3. "精选"徽章：featured 模式下 ai_importance 为 high/urgent 的条目显示 `timeline-selected-badge`
4. FeedPage 页头副标题改为"2026年8月21日星期五 · AI 筛选的今日重点"格式；分类 tab 命名对齐（模型/产品/行业/论文/教程/观点）
5. 搜索表单并入 /all 页头（对齐 `#search` 锚点行为）
6. 首页右侧模型榜预览模块（数据依赖 P5，可先占位）

### P3 AI 日报重构（前后端各半）

后端（`server/src/services/daily.js`、`server/src/routes/daily.js`、`db/daily.js`）：

1. dailies 表结构化：新增 `stats`（JSON：event_count/first_hand/new_models/source_count）与 `sections`（JSON：五栏目分组，每节含条目 id 列表）
2. 日报生成任务（每日 08:00）：取前一日 high+ 条目 → 按栏目分组 → 统计四指标 → AI 生成导语 → 落库
3. API：`GET /api/daily/latest`、`/api/daily/:date` 返回结构化数据；`GET /api/daily?month=YYYY-MM` 返回按月归档

前端（`web/src/pages/Daily.jsx`）：

1. 页头：VOL.YYYY.MM.DD · N STORIES + "N 篇报道 · 约 X 分钟阅读"
2. 统计栏四指标卡片
3. 五栏目分节渲染（节标题 + 篇数 + TimelineCard 精简列表）
4. 右侧按月分组归档（月份标题 + 日期列表，高亮当前）
5. 底部前一天/后一天导航 + "每早八时更新"页脚
6. 日报/周报/月报三 tab（周报月报 P4 前先禁用或隐藏）

### P4 周报 / 月报（前后端，工作量最大）

后端：

1. 新表 `weeklies` / `monthlies`：期号（2026-W32 / 2026-07）、主题标题、导语、统计、sections（每节：标题 + AI 段落摘要 + 条目 id 列表）
2. 生成任务：周报每周一、月报每月 1 日；取期内日报条目 → AI 两步生成（先聚类出 5-6 个主题，再逐主题写摘要段落）
3. AI 调用注意：一次 prompt 塞入期内全部标题+摘要（约几百条），需做长度截断与分批

前端：`Weekly.jsx` / `Monthly.jsx` / `WeeklyDetail.jsx` / `MonthlyDetail.jsx`：

1. 页头：刊名 + 本期主题 + AI 导语
2. 统计栏：独立事件 / 条精选 / 期日报浓缩 / ≈X min 读完
3. 编号目录（锚点跳转）+ 主题分节（摘要段落 + 条目列表）
4. 往期归档列表

### P5 模型榜 + 静态页 + RSS 输出

1. **模型榜 `/leaderboard`**：MVP 用人工维护的静态 JSON（模型名/厂商/发布时间/定位），前端渲染表格 + 首页预览模块；后续可接 AI 自动提取
2. **静态四页**：`/about`（项目介绍 + 关注方式）、`/changelog`（版本记录，配合侧栏未读点）、`/feedback`（表单，后端落库或跳转邮箱）、`/agent`（Agent 接入说明 + RSS/API 用法文档）
3. **RSS 输出**（`server/src/routes/feed.js`）：`/feed.xml`（精选）、`/feed/all.xml`、`/feed/daily.xml`、`/feed/category/:cat.xml`，手写 XML 模板即可，无需新依赖

### P6 全文翻译（完全对齐，成本最高）

1. `items` 表加 `full_text`（原文）与 `full_text_zh`（译文）字段
2. 抓取入库后异步任务：cheerio 抓正文（readability 算法）→ AI 翻译（分段翻译，超长文截断至 N 字）→ 落库
3. **成本控制（必须做）**：`.env` 加 `FULLTEXT_TRANSLATE=on/off` 开关；只对 high/urgent 或用户点击的条目翻译；单条上限约 8K 字；翻译失败降级为仅摘要
4. `ItemDetail.jsx` 渲染译文（对齐目标站"AI 导读 → 推荐理由 → 全文"三段式）
5. 预估 token：每条约 3-8K 输入 + 等量输出，日均 20 条 high 条目 ≈ 每日 30 万 token 级别，按百炼计费需评估

---

## 四、实施顺序与依赖

```
P1（纯前端，可独立交付）
P2（依赖 P1 的样式体系）
P3（后端先行，前端依赖后端结构化数据）
P4（依赖 P3 的日报数据与生成框架复用）
P5（静态页无依赖可并行；RSS 依赖 items API 已有）
P6（独立，随时可做，但建议最后开启以控制成本）
```

建议每阶段完成后：后端跑 `npm test` + 语法检查（用 Node 20.x），前端 `npm run build`（先 `rm -rf dist`），并截图与目标站对应页面对比。

## 五、风险清单

| 风险 | 应对 |
|---|---|
| 全文翻译 token 成本失控 | 开关 + 仅 high 条目 + 长度上限，先灰度观察一周 |
| 周报月报 AI 聚类质量不稳 | 主题数固定 5-6 个；失败时降级为按栏目分组（复用日报栏目） |
| OpenAI/Mistral 等官博 CSR 抓不到 | 已知限制，全文翻译对这些源自然降级为摘要 |
| better-sqlite3 版本兼容 | 始终用 Node 20.x（D:/software/nvm/nodejs/node.exe）跑后端 |
| 深色默认切换影响现有用户 | localStorage 已存偏好者优先，仅无偏好新用户默认深色 |
