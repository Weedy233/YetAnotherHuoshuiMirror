# 配置与部署指南

## 项目结构

```text
apps/api  Cloudflare Worker API，使用 Hono、Zod OpenAPI、D1
apps/web  Cloudflare Pages 前端，使用 Vite、React、Tailwind
D1 数据   d1/import.sql
```

## 本地检查

```bash
bun install
bun run typecheck
bun run lint
bun run test
bun run build
```

## Cloudflare 一次性配置

1. 登录 Cloudflare：

   ```bash
   bunx wrangler login
   ```

2. 创建 D1 数据库：

   ```bash
   bunx wrangler d1 create huoshui-mirror
   ```

3. 把返回的 `database_id` 写入 `apps/api/wrangler.jsonc`。

4. 导入数据：

   ```bash
   bunx wrangler d1 execute huoshui-mirror --remote --file d1/import.sql
   ```

5. 创建 Cloudflare Pages 项目，默认项目名建议为 `huoshui-mirror-web`。

## 手动部署

```bash
bun run deploy:api
bun run deploy:web
```

## GitHub 自动部署

`.github/workflows/deploy.yml` 会在 `main` 更新时自动执行：安装依赖、类型检查、lint、测试、构建、部署 Worker、部署 Pages。

需要在 GitHub 仓库中配置 Secrets：

- `CF_API_TOKEN`
- `CF_ACCOUNT_ID`

可选配置 Repository Variable：

- `CF_PAGES_PROJECT_NAME`，不填时 workflow 使用 `huoshui-mirror-web`。

## 注意事项

- 不要把 Cloudflare token 提交到仓库，也不要粘贴到普通聊天或 issue 中。
- `apps/api/wrangler.jsonc` 中的 D1 `database_id` 必须替换为真实值后才能部署 Worker。
- `d1/import.sql` 是当前快照数据源；重新生成数据后需要重新导入 D1。
