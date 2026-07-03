# Cloudflare Serverless 镜像站方案

## 1. 本仓库数据结构分析

当前仓库只有一个 SQLite 数据库文件 `reviews.db`。数据库大小约 4.4 MB，适合直接导入 Cloudflare D1 的免费额度内。结构如下：

| 表 | 行数 | 说明 |
| --- | ---: | --- |
| `teachers` | 1,900 | 教师维表，`id` 为整数主键，`name` 唯一且非空。 |
| `courses` | 1,793 | 课程维表，`id` 为整数主键，`name` 唯一且非空。 |
| `reviews` | 15,928 | 评价事实表，`id` 为文本主键，关联教师、课程，保存评论、三项评分、总分、赞踩数。 |
| `sqlite_sequence` | 2 | SQLite 自增序列表，由 `teachers`/`courses` 的历史导入产生，业务侧无需直接使用。 |

字段要点：

- `teachers(id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE)`。
- `courses(id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE)`。
- `reviews(id TEXT NOT NULL PRIMARY KEY, teacher_id INTEGER NOT NULL, course_id INTEGER NOT NULL, comment TEXT NOT NULL, rate_professionalism INTEGER NOT NULL, rate_expressive INTEGER NOT NULL, rate_friendliness INTEGER NOT NULL, rate_total INTEGER NOT NULL, up_vote INTEGER NOT NULL, down_vote INTEGER NOT NULL)`。
- `reviews.teacher_id` 与 `reviews.course_id` 已增加 `NOT NULL` 约束；所有评分、赞踩和评论字段也已根据现有完整数据增加 `NOT NULL` 约束，且外键都能在 `teachers`/`courses` 中找到对应记录。
- 评分范围：三项分数为 1–5，总分为 3–15；`rate_total` 可以视为三项评分之和。
- 目前只有主键/唯一索引，缺少按教师、课程、搜索字段过滤时需要的二级索引。

## 2. Cloudflare 免费额度适配判断

截至 2026-07-03 查询到的 Cloudflare 官方文档要点（参考：Cloudflare Workers Pricing、D1 Pricing、Pages Limits 官方文档）：

- Workers Free：每天 100,000 次 Worker 请求，单次调用 10 ms CPU；静态资源请求免费且不限量。
- D1 Free：每天 5,000,000 行读取、100,000 行写入、总存储 5 GB；D1 不收数据传输费用。
- Pages Free：每月 500 次构建、单站点最多 20,000 个文件、单文件最大 25 MiB；Pages Functions 请求会计入 Workers 配额。

本仓库数据量很小，D1 存储压力低；主要约束会是高峰访问时的 Worker 请求次数和 D1 rows read。因此方案应尽量把公开页面、搜索入口、热门榜单做成静态资源或边缘缓存，把 D1 查询限定为分页、索引命中、短 TTL 缓存后的 API 请求。

## 3. 推荐目标架构

```text
Browser
  ├─ Cloudflare Pages 静态前端
  │    ├─ 首页、说明页、排行榜预渲染 JSON
  │    └─ JS/CSS/图片由 Pages 全球边缘直接托管
  └─ Pages Functions / Worker API
       ├─ Cache API：缓存匿名 GET API 响应
       ├─ D1：存储教师、课程、评价数据
       └─ 可选 KV：缓存搜索热词、热门教师摘要、构建版本号
```

推荐优先级：

1. **Pages 承载静态站点**：页面壳、前端资源、静态 JSON 摘要完全走 Pages，避免 Worker 配额消耗。
2. **Pages Functions 或独立 Worker 提供 API**：路径如 `/api/search`、`/api/teachers/:id`、`/api/courses/:id`、`/api/reviews/:id`。
3. **D1 作为只读主数据源**：镜像站以查询为主，不开放写评价；赞踩如果要支持，应单独设计限流与写入预算。
4. **Cache API 做短 TTL 缓存**：对匿名查询根据 URL 缓存 5–30 分钟，对教师详情缓存 1–24 小时。
5. **预构建高频数据**：把教师列表、课程列表、热门教师、评分统计导出为静态 JSON，搜索时先前端本地过滤或走轻量 API。

## 4. D1 表结构与索引建议

D1 可直接兼容 SQLite，但建议导入前补充索引与视图/派生表：

```sql
CREATE INDEX IF NOT EXISTS idx_reviews_teacher_id ON reviews(teacher_id);
CREATE INDEX IF NOT EXISTS idx_reviews_course_id ON reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_teacher_course ON reviews(teacher_id, course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rate_total ON reviews(rate_total);
CREATE INDEX IF NOT EXISTS idx_teachers_name ON teachers(name);
CREATE INDEX IF NOT EXISTS idx_courses_name ON courses(name);
```

如果需要中文模糊搜索，Cloudflare D1/SQLite 的普通 `LIKE '%关键词%'` 在无 FTS 的情况下会扫描大量行。由于当前数据只有约 1.6 万条评价，可以接受低频后台查询，但公开高峰建议采用以下策略之一：

- **轻量方案**：构建时导出 `teachers.json`、`courses.json`，前端对名称做本地搜索；评论全文搜索只在详情页内分页展示，不做全站全文搜索。
- **D1 FTS 方案**：创建 FTS5 虚表存储 `teacher_name`、`course_name`、`comment`，搜索命中后再回表；部署前需在 D1 上验证 FTS5 可用性与中文分词效果。
- **静态索引方案**：构建时生成拼音/关键词倒排索引 JSON，适合教师/课程名称搜索，完全不消耗 D1 rows read。

## 5. API 设计建议

| 路径 | 方法 | 说明 | 缓存建议 |
| --- | --- | --- | --- |
| `/api/meta` | GET | 数据版本、教师数、课程数、评价数 | 24h |
| `/api/search?q=` | GET | 教师/课程名称搜索，返回最多 20 条 | 5–30min |
| `/api/teachers/:id` | GET | 教师详情、评分统计、关联课程 | 1–24h |
| `/api/teachers/:id/reviews?page=&pageSize=` | GET | 教师评价分页，默认 20 条/页 | 5–30min |
| `/api/courses/:id` | GET | 课程详情、评分统计、关联教师 | 1–24h |
| `/api/reviews/:id` | GET | 单条评价详情 | 1–24h |

查询应遵守：

- 所有列表接口强制 `LIMIT`，`pageSize` 最大 50。
- 不提供无条件全表评论列表。
- API 返回字段按页面需要裁剪，避免把全部评论文本一次性返回。
- 对 `q` 参数做长度限制、去首尾空格、拒绝过短/过长输入。
- 响应头设置 `Cache-Control: public, max-age=300, s-maxage=1800` 之类的边缘缓存策略。

## 6. 数据导入流程

建议把 `reviews.db` 保留为原始快照，新增可重复执行的导入脚本：

1. 本地导出 schema 和数据：
   ```bash
   sqlite3 reviews.db .dump > d1/import.sql
   ```
   当前仓库已导出 `d1/import.sql`，其 schema 包含修正后的 `rate_professionalism` 列名和 `reviews` 表的 `NOT NULL` 约束。
2. 在导入 SQL 末尾追加索引 SQL。
3. 创建 D1 数据库：
   ```bash
   npx wrangler d1 create huoshui-mirror
   ```
4. 本地预览导入：
   ```bash
   npx wrangler d1 execute huoshui-mirror --local --file d1/import.sql
   ```
5. 生产导入：
   ```bash
   npx wrangler d1 execute huoshui-mirror --remote --file d1/import.sql
   ```
6. 每次数据更新时生成新的 `import.sql`，使用迁移或重建临时库后切换绑定，避免线上半导入状态。

## 7. 实施路线图

### 阶段 A：最小可用镜像

- 初始化 Pages 前端，例如 Astro/SvelteKit/React Router 静态导出，或纯 Vite SPA。
- 使用 Pages Functions 绑定 D1。
- 实现教师/课程搜索、教师详情、课程详情、评价分页。
- 导入 `reviews.db` 到 D1，补充索引。
- 配置基本缓存头和错误页。

### 阶段 B：高峰优化

- 构建时导出 `teachers.json`、`courses.json`、`stats.json` 到静态目录。
- 热门教师/课程页面静态化，详情页 API 响应进入 Cache API。
- 对 API 做请求频率保护：按 IP/UA 对搜索接口做简单退避，或者使用 Cloudflare WAF Rate Limiting 规则。
- 增加 analytics 日志，只记录匿名聚合数据，避免收集敏感信息。

### 阶段 C：可维护与回滚

- 增加 `wrangler.toml`、D1 migration、数据导入脚本、CI 构建。
- 每次数据快照发布前运行完整性检查：行数、外键孤儿、评分范围、空评论、重复 ID。
- 保留上一版静态资源与 D1 快照，必要时回滚 Pages 部署或切换 D1 绑定。

## 8. 风险与注意事项

- **免费额度不是无限动态 API**：静态资源不限量更适合抗高峰，D1/Worker 应只承担必要动态查询。
- **D1 rows read 以扫描行计数**：未命中索引的查询即使只返回少量结果，也可能消耗大量 rows read。
- **隐私与合规**：教师评价文本可能包含个人信息或攻击性内容，镜像站应提供免责声明、投诉/删除渠道，并避免新增不可控 UGC。
- **原站压力缓解策略**：镜像站应明确展示“数据快照时间”，避免用户误以为是实时原站；必要时在低峰定时同步。
- **中文搜索质量**：如果不引入专门中文分词，全文搜索体验可能一般；推荐先满足教师/课程名称搜索。

## 9. 推荐下一步

1. 新增 `wrangler.toml`、`d1/schema.sql`、`scripts/inspect_db.py`、`scripts/export_static_json.py`。
2. 选择前端框架并搭建 Pages 项目。
3. 用 D1 本地模式跑通 API，再导入远程 D1。
4. 用一次压力测试估算 API 缓存命中率和 D1 rows read，再决定是否需要 KV 或更多静态化。
