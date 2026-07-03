import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Link, Route, BrowserRouter as Router, Routes } from "react-router";
import { HomePage } from "./pages/HomePage";
import { SearchPage } from "./pages/SearchPage";
import "./styles.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-white text-zinc-950">
          <header className="border-b border-zinc-200 bg-white">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
              <Link className="font-mono text-sm font-semibold tracking-tight" to="/">
                HuoshuiMirror
              </Link>
              <nav className="flex items-center gap-4 text-sm text-zinc-600">
                <Link className="hover:text-zinc-950" to="/search">
                  Search
                </Link>
                <a className="hover:text-zinc-950" href="/docs">
                  API Docs
                </a>
              </nav>
            </div>
          </header>
          <Routes>
            <Route element={<HomePage />} path="/" />
            <Route element={<SearchPage />} path="/search" />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

const root = document.getElementById("root");

if (!root) throw new Error("Root element not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
