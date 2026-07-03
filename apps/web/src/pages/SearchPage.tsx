import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button, Card, Input } from "../components/ui";
import { searchCatalog } from "../lib/api";

export function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get("q")?.trim() ?? "";
  const [draft, setDraft] = useState(q);
  const result = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchCatalog(q),
    enabled: q.length > 0,
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = draft.trim();
    navigate(next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-[240px_1fr] md:px-6">
      <aside className="h-fit rounded-md border border-zinc-200 bg-white p-4 text-sm">
        <h2 className="font-medium text-zinc-950">过滤器</h2>
        <p className="mt-2 text-zinc-600">初版搜索覆盖教师和课程名称</p>
      </aside>
      <section>
        <form onSubmit={submit} className="flex gap-2">
          <Input
            onChange={(event) => setDraft(event.target.value)}
            placeholder="搜索教师或课程"
            value={draft}
          />
          <Button type="submit">
            <Search className="mr-2 size-4" />
            搜索
          </Button>
        </form>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <ResultList title="教师" items={result.data?.teachers ?? []} basePath="/teachers" />
          <ResultList title="课程" items={result.data?.courses ?? []} basePath="/courses" />
        </div>
      </section>
    </main>
  );
}

function ResultList({
  title,
  items,
  basePath,
}: {
  title: string;
  items: Array<{ id: number; name: string }>;
  basePath: string;
}) {
  return (
    <Card className="p-4">
      <h2 className="text-sm font-medium text-zinc-950">{title}</h2>
      <div className="mt-3 divide-y divide-zinc-100">
        {items.length ? (
          items.map((item) => (
            <Link
              className="block py-2 text-sm text-zinc-700 hover:text-zinc-950"
              key={item.id}
              to={`${basePath}/${item.id}`}
            >
              {item.name}
            </Link>
          ))
        ) : (
          <p className="py-2 text-sm text-zinc-500">暂无结果</p>
        )}
      </div>
    </Card>
  );
}
