export type Meta = {
  teachers: number;
  courses: number;
  reviews: number;
};

export type SearchResponse = {
  teachers: Array<{ id: number; name: string }>;
  courses: Array<{ id: number; name: string }>;
};

export type TeacherDetail = {
  id: number;
  name: string;
  reviewCount: number;
  averageTotal: number | null;
};

export type CourseDetail = {
  id: number;
  name: string;
  reviewCount: number;
  averageTotal: number | null;
};

export type Review = {
  id: string;
  teacherId: number;
  courseId: number;
  teacherName?: string;
  courseName?: string;
  comment: string;
  rateProfessionalism: number;
  rateExpressive: number;
  rateFriendliness: number;
  rateTotal: number;
  upVote: number;
  downVote: number;
};

function getApiBase() {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (!apiBase) {
    throw new Error("Missing VITE_API_BASE_URL");
  }
  return apiBase.replace(/\/+$/, "");
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBase()}${path}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    const detail = body ? `: ${body}` : "";
    throw new Error(`API request failed: ${response.status}${detail}`);
  }

  return response.json() as Promise<T>;
}

export function fetchMeta() {
  return getJson<Meta>("/api/meta");
}

export function searchCatalog(q: string) {
  return getJson<SearchResponse>(`/api/search?q=${encodeURIComponent(q)}`);
}

export function fetchTeacher(id: string | number) {
  return getJson<TeacherDetail>(`/api/teachers/${id}`);
}

export function fetchTeacherReviews(id: string | number, page = 1, pageSize = 20) {
  return getJson<{ items: Review[] }>(
    `/api/teachers/${id}/reviews?page=${page}&pageSize=${pageSize}`,
  );
}

export function fetchCourse(id: string | number) {
  return getJson<CourseDetail>(`/api/courses/${id}`);
}
