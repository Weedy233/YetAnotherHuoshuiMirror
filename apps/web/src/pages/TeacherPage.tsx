import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, ThumbsDown, ThumbsUp } from "lucide-react";
import { Link, useParams } from "react-router";
import { Badge, Card } from "../components/ui";
import { fetchTeacher, fetchTeacherReviews, type Review } from "../lib/api";

function formatScore(score: number | null | undefined) {
  return typeof score === "number" ? score.toFixed(2) : "暂无";
}

export function TeacherPage() {
  const { id } = useParams();
  const teacher = useQuery({
    queryKey: ["teacher", id],
    queryFn: () => fetchTeacher(id ?? ""),
    enabled: Boolean(id),
  });
  const reviews = useQuery({
    queryKey: ["teacher", id, "reviews"],
    queryFn: () => fetchTeacherReviews(id ?? ""),
    enabled: Boolean(id),
  });

  if (!id) {
    return <DetailMessage message="缺少教师 ID。" />;
  }

  if (teacher.isPending) {
    return <DetailMessage message="正在加载教师信息…" />;
  }

  if (teacher.isError) {
    return <DetailMessage message="教师信息加载失败，请稍后重试。" />;
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
                教师
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {teacher.data.name}
              </h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
                教师编号 #{teacher.data.id}
              </p>
            </div>
            <Badge>{teacher.data.reviewCount} 条评价</Badge>
          </div>
        </Card>

        <Card className="grid grid-cols-2 gap-3 p-5 md:grid-cols-1">
          <Metric label="平均总评" value={formatScore(teacher.data.averageTotal)} />
          <Metric label="评价数量" value={String(teacher.data.reviewCount)} />
        </Card>
      </section>

      <section className="mt-4">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">教师评价</h2>
            {reviews.isFetching ? (
              <span className="text-xs text-zinc-500 dark:text-zinc-500">正在刷新…</span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3">
            {reviews.isPending ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-500">正在加载评价…</p>
            ) : reviews.isError ? (
              <p className="text-sm text-red-600">评价加载失败，请稍后重试。</p>
            ) : reviews.data.items.length ? (
              reviews.data.items.map((review) => <ReviewCard key={review.id} review={review} />)
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-500">暂无评价。</p>
            )}
          </div>
        </Card>
      </section>
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

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="rounded-md border border-zinc-200 p-4 transition-colors dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          className="inline-flex items-center text-sm font-medium text-zinc-800 transition hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-zinc-50"
          to={`/courses/${review.courseId}`}
        >
          <BookOpen className="mr-2 size-4" />
          {review.courseName ?? `课程 #${review.courseId}`}
        </Link>
        <Badge>总评 {formatScore(review.rateTotal)}</Badge>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-300">
        {review.comment || "暂无文字评价。"}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-500">
        <span>专业 {formatScore(review.rateProfessionalism)}</span>
        <span>表达 {formatScore(review.rateExpressive)}</span>
        <span>友善 {formatScore(review.rateFriendliness)}</span>
        <span className="inline-flex items-center gap-1">
          <ThumbsUp className="size-3.5" />
          {review.upVote}
        </span>
        <span className="inline-flex items-center gap-1">
          <ThumbsDown className="size-3.5" />
          {review.downVote}
        </span>
      </div>
    </article>
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
