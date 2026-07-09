import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router";
import { Badge, Card } from "../components/ui";
import { fetchCourse } from "../lib/api";

function formatScore(score: number | null | undefined) {
  return typeof score === "number" ? score.toFixed(2) : "暂无";
}

export function CoursePage() {
  const { id } = useParams();
  const course = useQuery({
    queryKey: ["course", id],
    queryFn: () => fetchCourse(id ?? ""),
    enabled: Boolean(id),
  });

  if (!id) {
    return <DetailMessage message="缺少课程 ID。" />;
  }

  if (course.isPending) {
    return <DetailMessage message="正在加载课程信息…" />;
  }

  if (course.isError) {
    return <DetailMessage message="课程信息加载失败，请稍后重试。" />;
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <Link
        className="inline-flex items-center text-sm text-zinc-600 transition hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        to="/search"
      >
        <ArrowLeft className="mr-2 size-4" />
        返回搜索
      </Link>

      <section className="mt-5 grid gap-4 md:grid-cols-[1fr_260px]">
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-500">
                课程
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {course.data.name}
              </h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
                课程编号 #{course.data.id}
              </p>
            </div>
            <Badge>{course.data.reviewCount} 条评价</Badge>
          </div>
        </Card>

        <Card className="grid grid-cols-2 gap-3 p-5 md:grid-cols-1">
          <Metric label="平均总评" value={formatScore(course.data.averageTotal)} />
          <Metric label="评价数量" value={String(course.data.reviewCount)} />
        </Card>
      </section>

      <Card className="mt-4 p-5">
        <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">课程详情</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          该课程的评价列表暂未整理完成，当前先展示课程汇总信息。
        </p>
      </Card>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500 dark:text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
        {value}
      </div>
    </div>
  );
}

function DetailMessage({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <Card className="p-5">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
        <Link
          className="mt-4 inline-flex text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
          to="/search"
        >
          返回搜索
        </Link>
      </Card>
    </main>
  );
}
