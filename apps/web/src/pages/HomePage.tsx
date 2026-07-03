import { useQuery } from "@tanstack/react-query";
import { BookOpen, Database, GraduationCap, Search } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Badge, Button, Card, Input } from "../components/ui";
import { fetchMeta } from "../lib/api";

export function HomePage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const meta = useQuery({ queryKey: ["meta"], queryFn: fetchMeta });

  function submit(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <main>
      <section className="border-b border-zinc-200 bg-zinc-50/70">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-[1fr_320px] md:px-6 md:py-14">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge>Cloudflare Worker API</Badge>
              <Badge>D1 snapshot</Badge>
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-zinc-950 md:text-5xl">
              高校教师与课程评价的只读镜像站
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 md:text-base">
              采用 GitHub Repository 风格的信息台布局，优先提供稳定搜索、教师详情、课程详情与标准
              OpenAPI。
            </p>
            <form onSubmit={submit} className="mt-6 flex max-w-2xl gap-2">
              <Input
                aria-label="搜索教师或课程"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索教师或课程，例如：高等数学"
                value={query}
              />
              <Button type="submit">
                <Search className="mr-2 size-4" />
                搜索
              </Button>
            </form>
          </div>
          <Card className="p-4">
            <h2 className="text-sm font-medium text-zinc-950">数据快照</h2>
            <dl className="mt-4 grid gap-3">
              <Metric
                icon={<GraduationCap className="size-4" />}
                label="教师"
                value={meta.data?.teachers}
              />
              <Metric
                icon={<BookOpen className="size-4" />}
                label="课程"
                value={meta.data?.courses}
              />
              <Metric
                icon={<Database className="size-4" />}
                label="评价"
                value={meta.data?.reviews}
              />
            </dl>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-[240px_1fr] md:px-6">
        <aside className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          <h2 className="mb-3 font-medium text-zinc-950">导航</h2>
          <nav className="grid gap-2">
            <Link to="/search" className="hover:text-zinc-950">
              搜索结果
            </Link>
            <a href="/docs" className="hover:text-zinc-950">
              API 文档
            </a>
            <a href="/openapi.json" className="hover:text-zinc-950">
              OpenAPI JSON
            </a>
          </nav>
        </aside>
        <div className="grid gap-4 md:grid-cols-2">
          <InfoCard
            title="稳定 API 契约"
            description="后端由独立 Worker 提供，网页端和第三方服务都通过同一套 OpenAPI 调用。"
          />
          <InfoCard
            title="高峰削峰"
            description="静态页面走 Pages，匿名 GET API 使用缓存，D1 查询保持分页和索引命中。"
          />
          <InfoCard
            title="前端可替换"
            description="React 仅消费 API client，后续调整 shadcn 组件和视觉风格不影响查询逻辑。"
          />
          <InfoCard
            title="只读镜像"
            description="评价数据来自快照导入，默认不开放写入，避免高峰期写入预算和滥用风险。"
          />
        </div>
      </section>
    </main>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value?: number }) {
  return (
    <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
      <dt className="flex items-center gap-2 text-zinc-600">
        {icon}
        {label}
      </dt>
      <dd className="font-mono text-sm font-medium text-zinc-950">
        {value?.toLocaleString() ?? "—"}
      </dd>
    </div>
  );
}

function InfoCard({ title, description }: { title: string; description: string }) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium text-zinc-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
    </Card>
  );
}
