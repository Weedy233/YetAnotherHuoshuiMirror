import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, MessageSquare, Search } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, Input } from "../components/ui";
import { fetchMeta } from "../lib/api";

export function HomePage() {
  const [teacherQuery, setTeacherQuery] = useState("");
  const [courseQuery, setCourseQuery] = useState("");
  const navigate = useNavigate();
  const meta = useQuery({ queryKey: ["meta"], queryFn: fetchMeta });

  function submitTeacher(event: FormEvent) {
    event.preventDefault();
    const q = teacherQuery.trim();
    navigate(q ? `/search/teachers?q=${encodeURIComponent(q)}` : "/search/teachers");
  }

  function submitCourse(event: FormEvent) {
    event.preventDefault();
    const q = courseQuery.trim();
    navigate(q ? `/search/courses?q=${encodeURIComponent(q)}` : "/search/courses");
  }

  return (
    <main>
      <section className="border-b border-zinc-200 bg-zinc-50/70 transition-colors dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-[1fr_300px] md:px-6 md:py-12">
          <div>
            <p className="text-sm font-medium tracking-[0.2em] text-zinc-500 dark:text-zinc-500">
              教师评价查询
            </p>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-zinc-950 md:text-5xl dark:text-zinc-50">
              查找教师与课程评价
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              分别按教师姓名或课程名称查询评分与评价摘要。
            </p>

            <div className="mt-6 grid max-w-3xl gap-4 md:grid-cols-2">
              <SearchPanel
                icon={<GraduationCap className="size-5" />}
                onChange={setTeacherQuery}
                onSubmit={submitTeacher}
                placeholder="搜索教师姓名，例如：陈继兰"
                title="教师搜索"
                value={teacherQuery}
              />
              <SearchPanel
                icon={<BookOpen className="size-5" />}
                onChange={setCourseQuery}
                onSubmit={submitCourse}
                placeholder="搜索课程名称，例如：高等数学"
                title="课程搜索"
                value={courseQuery}
              />
            </div>
          </div>
          <Card className="p-4">
            <h2 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">数据概览</h2>
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
                icon={<MessageSquare className="size-4" />}
                label="评价"
                value={meta.data?.reviews}
              />
            </dl>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-6 md:grid-cols-2 md:px-6">
        <QuickEntry
          href="/search/teachers"
          icon={<GraduationCap className="size-5" />}
          title="按教师浏览"
        />
        <QuickEntry
          href="/search/courses"
          icon={<BookOpen className="size-5" />}
          title="按课程浏览"
        />
      </section>
    </main>
  );
}

function SearchPanel({
  title,
  icon,
  placeholder,
  value,
  onChange,
  onSubmit,
}: {
  title: string;
  icon: ReactNode;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-700 transition-colors dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          {icon}
        </span>
        <h2 className="font-medium text-zinc-950 dark:text-zinc-50">{title}</h2>
      </div>
      <form className="mt-4 flex gap-2" onSubmit={onSubmit}>
        <Input
          aria-label={title}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          value={value}
        />
        <Button aria-label={title} className="h-10 w-10 shrink-0 px-0" type="submit">
          <Search className="size-4" />
        </Button>
      </form>
    </Card>
  );
}

function QuickEntry({ href, icon, title }: { href: string; icon: ReactNode; title: string }) {
  return (
    <a
      className="flex items-center justify-between rounded-md border border-zinc-200 bg-white p-4 text-zinc-950 transition hover:border-zinc-400 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-50 dark:hover:border-zinc-600"
      href={href}
    >
      <span className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          {icon}
        </span>
        <span className="font-medium">{title}</span>
      </span>
      <span className="text-sm text-zinc-500 dark:text-zinc-500">进入</span>
    </a>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value?: number }) {
  return (
    <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
      <dt className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
        {icon}
        {label}
      </dt>
      <dd className="font-mono text-sm font-medium text-zinc-950 dark:text-zinc-50">
        {value?.toLocaleString() ?? "—"}
      </dd>
    </div>
  );
}
