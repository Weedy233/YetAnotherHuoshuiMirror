export type Meta = {
  teachers: number;
  courses: number;
  reviews: number;
};

export type SearchResponse = {
  teachers: Array<{ id: number; name: string }>;
  courses: Array<{ id: number; name: string }>;
};

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function fetchMeta() {
  return getJson<Meta>("/api/meta");
}

export function searchCatalog(q: string) {
  return getJson<SearchResponse>(`/api/search?q=${encodeURIComponent(q)}`);
}
