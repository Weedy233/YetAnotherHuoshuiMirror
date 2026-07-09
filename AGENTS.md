# AGENTS.md

## 项目概括

- 这是一个面向终端用户的教师、课程与评价查询站点，核心路径是搜索教师或课程，并查看对应评分与评价摘要。
- 仓库是 Bun monorepo：`apps/web` 是 React + Vite 前端，`apps/api` 是 Hono/OpenAPI 风格的 Cloudflare Workers API，数据来自 D1 导入快照。
- 前端使用 React Router、TanStack Query、Tailwind CSS v4，并支持深色模式。
- 后端负责搜索、教师详情、教师评价、课程详情等 JSON 数据接口。

## 面向用户界面约束

- 用户界面必须以普通用户视角写文案，避免暴露实现细节。
- 不要在用户可见页面展示 `API Docs`、`OpenAPI`、`Cloudflare`、`Worker`、`D1`、`localhost`、`本地 API`、`接口` 等开发或平台词汇，除非页面明确是开发者文档页。
- 不要添加面向开发者的导航框、文档入口、调试入口或平台说明到普通用户页面。
- 普通页面优先使用中文文案；按钮、标题、错误提示应短、明确、可行动。
- 错误提示应说明用户能理解的状态，例如“暂时无法获取搜索结果，请稍后重试”，不要直接展示底层异常文本。
- 搜索是核心体验：搜索框、结果列表、详情页要保持简洁，避免干扰性说明。

## 视觉与交互约束

- 保持现有极简、低噪声、深浅色兼容的视觉方向。
- 新增 UI 必须同时考虑 `dark:` 样式，避免只在浅色模式可读。
- 图标按钮必须保留可访问名称，例如 `aria-label="搜索"`。
- 搜索按钮与输入框高度应一致，图标按钮优先使用固定宽高。

## 开发约束

- 修改前端功能时同步补充或更新 Vitest 测试。
- 不要为了终端用户功能引入开发者入口或内部平台品牌文案。
- 优先复用 `apps/web/src/components/ui.tsx` 中的基础组件。
- 保持 Biome 格式化结果，不手写与格式化器冲突的排版。

## 常用验证命令

- `bun run --cwd apps/web test`
- `bun run --cwd apps/web typecheck`
- `bun run --cwd apps/api typecheck`
- `bun run lint`
