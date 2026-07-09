import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, Search } from "lucide-react";
import { type ComponentType, type FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Button, Card, Input } from "../components/ui";
import { searchCatalog } from "../lib/api";
import { cn } from "../lib/utils";

type SearchMode = "teachers" | "courses";

const modeOptions: Array<{
  mode: SearchMode;
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  {
    mode: "teachers",
    href: "/search/teachers",
    label: "教师搜索",
    Icon: GraduationCap,
  },
  {
    mode: "courses",
    href: "/search/courses",
    label: "课程搜索",
    Icon: BookOpen,
  },
];

const modeCopy = {
  teachers: {
    title: "教师搜索",
    placeholder: "搜索教师姓名，例如：陈继兰",
    basePath: "/search/teachers",
  },
  courses: {
    title: "课程搜索",
    placeholder: "搜索课程名称，例如：高等数学",
    basePath: "/search/courses",
  },
} satisfies Record<SearchMode, { title: string; placeholder: string; basePath: string }>;

export function SearchPage({ mode = "teachers" }: { mode?: SearchMode }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get("q")?.trim() ?? "";
  const [draft, setDraft] = useState(q);
  const copy = modeCopy[mode];
  const result = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchCatalog(q),
    enabled: q.length > 0,
  });
  const errorMessage = "暂时无法获取搜索结果，请稍后重试。";

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = draft.trim();
    navigate(next ? `${copy.basePath}?q=${encodeURIComponent(next)}` : copy.basePath);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <section className="rounded-md border border-zinc-200 bg-zinc-50/70 p-4 transition-colors dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {copy.title}
            </h1>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {modeOptions.map((option) => (
              <ModeLink key={option.mode} option={option} q={q} selected={option.mode === mode} />
            ))}
          </div>
        </div>
        <form onSubmit={submit} className="flex gap-2">
          <Input
            className="mt-4"
            onChange={(event) => setDraft(event.target.value)}
            placeholder={copy.placeholder}
            value={draft}
          />
          <Button aria-label="搜索" className="mt-4 h-10 w-10 shrink-0 px-0" type="submit">
            <Search className="size-4" />
          </Button>
        </form>
      </section>

      <section>
        {mode === "teachers" ? (
          <ResultList
            basePath="/teachers"
            errorMessage={result.isError ? errorMessage : undefined}
            isLoading={result.isPending && q.length > 0}
            items={result.data?.teachers ?? []}
            title="教师"
          />
        ) : (
          <ResultList
            basePath="/courses"
            errorMessage={result.isError ? errorMessage : undefined}
            isLoading={result.isPending && q.length > 0}
            items={result.data?.courses ?? []}
            title="课程"
          />
        )}
      </section>
    </main>
  );
}

function ModeLink({
  option,
  selected,
  q,
}: {
  option: (typeof modeOptions)[number];
  selected: boolean;
  q: string;
}) {
  const href = q ? `${option.href}?q=${encodeURIComponent(q)}` : option.href;
  const Icon = option.Icon;

  return (
    <Link
      className={cn(
        "rounded-md border px-3 py-2 text-sm transition",
        selected
          ? "border-zinc-950 bg-zinc-950 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-950"
          : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-zinc-50",
      )}
      to={href}
    >
      <span className="flex items-center gap-2 font-medium">
        <Icon className="size-4" />
        {option.label}
      </span>
    </Link>
  );
}

function ResultList({
  title,
  items,
  basePath,
  isLoading,
  errorMessage,
}: {
  title: string;
  items: Array<{ id: number; name: string }>;
  basePath: string;
  isLoading: boolean;
  errorMessage?: string;
}) {
  return (
    <Card className="mt-4 p-4">
      <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{title}</h2>
      <div className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
        {isLoading ? (
          <p className="py-2 text-sm text-zinc-500 dark:text-zinc-500">正在搜索…</p>
        ) : errorMessage ? (
          <p className="py-2 text-sm text-red-600">搜索失败：{errorMessage}</p>
        ) : items.length ? (
          items.map((item) => (
            <Link
              className="block py-2 text-sm text-zinc-700 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
              key={item.id}
              to={`${basePath}/${item.id}`}
            >
              {item.name}
            </Link>
          ))
        ) : (
          <p className="py-2 text-sm text-zinc-500 dark:text-zinc-500">暂无结果</p>
        )}
      </div>
    </Card>
  );
}
