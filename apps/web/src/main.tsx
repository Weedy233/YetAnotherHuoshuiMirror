import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Link, Navigate, Route, BrowserRouter as Router, Routes, useLocation } from "react-router";
import { ThemeToggle } from "./components/ThemeToggle";
import { ThemeProvider } from "./lib/theme";
import { CoursePage } from "./pages/CoursePage";
import { HomePage } from "./pages/HomePage";
import { SearchPage } from "./pages/SearchPage";
import { TeacherPage } from "./pages/TeacherPage";
import "./styles.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <div className="min-h-screen bg-white text-zinc-950 transition-colors dark:bg-zinc-950 dark:text-zinc-50">
            <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur transition-colors dark:border-zinc-800 dark:bg-zinc-950/85">
              <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
                <Link
                  className="font-mono text-sm font-semibold tracking-tight text-zinc-950 transition hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
                  to="/"
                >
                  HuoshuiMirror
                </Link>
                <nav className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
                  <Link
                    className="transition hover:text-zinc-950 dark:hover:text-zinc-50"
                    to="/search/teachers"
                  >
                    教师
                  </Link>
                  <Link
                    className="transition hover:text-zinc-950 dark:hover:text-zinc-50"
                    to="/search/courses"
                  >
                    课程
                  </Link>
                  <ThemeToggle />
                </nav>
              </div>
            </header>
            <Routes>
              <Route element={<HomePage />} path="/" />
              <Route element={<SearchRedirect />} path="/search" />
              <Route element={<SearchPage mode="teachers" />} path="/search/teachers" />
              <Route element={<SearchPage mode="courses" />} path="/search/courses" />
              <Route element={<TeacherPage />} path="/teachers/:id" />
              <Route element={<CoursePage />} path="/courses/:id" />
            </Routes>
          </div>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function SearchRedirect() {
  const location = useLocation();
  return <Navigate replace to={`/search/teachers${location.search}`} />;
}

const root = document.getElementById("root");

if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
