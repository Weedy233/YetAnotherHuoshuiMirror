# YetAnotherHuoshuiMirror

问渠那得清如许，为有源头活水来

## 部署

### Cloudflare 首次配置

```bash
bun install
bunx wrangler login
bunx wrangler d1 create huoshui-mirror
cp apps/api/.env.example apps/api/.env
```

填写 `apps/api/.env`：

```dotenv
CF_D1_DATABASE_ID=<database_id>
CF_D1_DATABASE_NAME=huoshui-mirror
```

```bash
bun run --cwd apps/api wrangler:config
bunx wrangler d1 execute DB --config apps/api/wrangler.generated.json --remote --file d1/import.sql
bunx wrangler pages project create huoshui-mirror-web --production-branch main
```

### 手动部署

```bash
bun run deploy
```

### GitHub Actions

Repository Secrets：

```text
CF_API_TOKEN
CF_ACCOUNT_ID
CF_D1_DATABASE_ID
```

Repository Variables：

```text
CF_D1_DATABASE_NAME=huoshui-mirror
CF_PAGES_PROJECT_NAME=huoshui-mirror-web
```

推送到 `main`，或手动运行 `Deploy Cloudflare mirror`。
