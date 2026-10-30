"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";
import {
  Code2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Bookmark,
  BookmarkCheck,
  Flame,
  Trophy,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  LayoutGrid,
  TrendingUp,
  X,
} from "lucide-react";
import { AppHeader } from "@/components/shared/AppHeader";
import { DSA_TOPICS, TOPIC_LEARNING_PATHS, DSACategory } from "@/lib/dsa/taxonomy";
import { PublicDSAProblem } from "@/lib/dsa/types";

function ProblemsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL-driven query states
  const initialDifficulty = searchParams.get("difficulty") || "all";
  const initialTopic = searchParams.get("topic") || "all";
  const initialSearch = searchParams.get("search") || "";
  const initialStatus = searchParams.get("status") || "all";
  const initialBookmarked = searchParams.get("bookmarked") === "true";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [selectedCategory, setSelectedCategory] = useState<DSACategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(initialBookmarked);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [sortBy, setSortBy] = useState("order");

  // Data states
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [counts, setCounts] = useState({ total: 0, easy: 0, medium: 0, hard: 0, solved: 0 });
  const [stats, setStats] = useState<any>(null);
  const [dailyChallenge, setDailyChallenge] = useState<PublicDSAProblem | null>(null);
  const [showLearningPaths, setShowLearningPaths] = useState(false);

  // Sync state with URL
  const updateUrlParams = (updates: Record<string, string | number | boolean>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val === "all" || val === "" || val === false || (key === "page" && val === 1)) {
        params.delete(key);
      } else {
        params.set(key, String(val));
      }
    });
    router.replace(`/problems?${params.toString()}`);
  };

  // Fetch problems list
  const fetchProblems = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        difficulty,
        topic: selectedTopic,
        search: searchQuery,
        status: statusFilter,
        bookmarked: String(bookmarkedOnly),
        sort: sortBy,
        page: String(currentPage),
        limit: "25",
      });

      const res = await fetch(`/api/dsa/problems?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProblems(data.problems || []);
        setPagination(data.pagination || { total: 0, page: 1, limit: 25, totalPages: 1 });
        setCounts(data.counts || { total: 0, easy: 0, medium: 0, hard: 0, solved: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch problems:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats & daily challenge once
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [statsRes, dailyRes] = await Promise.all([
          fetch("/api/dsa/progress"),
          fetch("/api/dsa/daily"),
        ]);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.stats);
        }
        if (dailyRes.ok) {
          const dailyData = await dailyRes.json();
          setDailyChallenge(dailyData.challenge);
        }
      } catch (err) {
        console.error("Failed to load DSA metadata:", err);
      }
    };
    fetchMetadata();
  }, []);

  // Re-fetch on filter changes
  useEffect(() => {
    fetchProblems();
  }, [difficulty, selectedTopic, searchQuery, statusFilter, bookmarkedOnly, currentPage, sortBy]);

  // Toggle bookmark
  const toggleBookmark = async (e: React.MouseEvent, problemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch("/api/dsa/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problemId }),
      });
      if (res.ok) {
        const data = await res.json();
        setProblems((prev) =>
          prev.map((p) => (p.id === problemId ? { ...p, isBookmarked: data.isBookmarked } : p))
        );
      }
    } catch (err) {
      console.error("Failed to toggle bookmark:", err);
    }
  };

  const filteredTopics = useMemo(() => {
    if (selectedCategory === "all") return DSA_TOPICS;
    return DSA_TOPICS.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-slate-100 flex flex-col font-sans">
      <AppHeader
        title="DSA Practice School"
        icon={<Code2 className="w-4 h-4 text-amber-400" />}
        badge="600+ Problems"
      >
        <button
          onClick={() => setShowLearningPaths(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span>Learning Roadmaps</span>
        </button>
      </AppHeader>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Hero Section with Daily Challenge & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Daily Challenge Card */}
          <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/40 border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" /> Daily Challenge
                </span>
                <span className="text-xs text-slate-400">
                  {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                </span>
              </div>

              {dailyChallenge ? (
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                    {dailyChallenge.title}
                  </h2>
                  <p className="text-xs text-slate-300 line-clamp-2 mt-1">
                    {dailyChallenge.statement.replace(/[#*`]/g, "")}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        dailyChallenge.difficulty === "easy"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : dailyChallenge.difficulty === "medium"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {dailyChallenge.difficulty.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                      {dailyChallenge.primaryTopic}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Time: {dailyChallenge.expectedTimeComplexity} | Space: {dailyChallenge.expectedSpaceComplexity}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-xs text-slate-400">Loading today's challenge...</div>
              )}
            </div>

            {dailyChallenge && (
              <div className="relative z-10 pt-4 flex items-center gap-3">
                <Link
                  href={`/problems/${dailyChallenge.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-950/40 hover:scale-[1.02]"
                >
                  <span>Solve Today's Challenge</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}

            {/* Ambient Background Glow */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* User Progress Widget */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-bold text-sm text-white">Your Progress</h3>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 text-xs font-medium text-amber-400">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>{stats?.streak || 0} day streak</span>
                </div>
              </div>

              {/* Progress Counters */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <div className="text-base font-bold text-emerald-400">
                    {stats?.easy?.solved || 0}
                    <span className="text-[10px] text-slate-500 font-normal">/{stats?.easy?.total || counts.easy}</span>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Easy</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <div className="text-base font-bold text-amber-400">
                    {stats?.medium?.solved || 0}
                    <span className="text-[10px] text-slate-500 font-normal">/{stats?.medium?.total || counts.medium}</span>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Medium</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
                  <div className="text-base font-bold text-rose-400">
                    {stats?.hard?.solved || 0}
                    <span className="text-[10px] text-slate-500 font-normal">/{stats?.hard?.total || counts.hard}</span>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">Hard</div>
                </div>
              </div>

              {/* Solved Ratio Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Total Solved</span>
                  <span className="font-bold text-white">
                    {stats?.totalSolved || counts.solved || 0} / {counts.total || 600}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${((stats?.easy?.solved || 0) / (counts.total || 1)) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-amber-500"
                    style={{
                      width: `${((stats?.medium?.solved || 0) / (counts.total || 1)) * 100}%`,
                    }}
                  />
                  <div
                    className="h-full bg-rose-500"
                    style={{
                      width: `${((stats?.hard?.solved || 0) / (counts.total || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Bookmarked: {stats?.totalBookmarked || 0}</span>
              <span>Attempted: {stats?.totalAttempted || 0}</span>
            </div>
          </div>
        </div>

        {/* Category & Topic Filter Carousel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="font-bold text-sm text-white">Explore DSA Topics</h3>
            </div>

            {/* Category tabs */}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
              {(["all", "fundamentals", "data-structures", "algorithms", "advanced"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedTopic("all");
                    setCurrentPage(1);
                    updateUrlParams({ topic: "all", page: 1 });
                  }}
                  className={`px-2.5 py-1 rounded-md capitalize transition-all ${
                    selectedCategory === cat
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {cat === "all" ? "All" : cat.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            <button
              onClick={() => {
                setSelectedTopic("all");
                setCurrentPage(1);
                updateUrlParams({ topic: "all", page: 1 });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                selectedTopic === "all"
                  ? "bg-slate-100 text-slate-950 shadow-md"
                  : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              All Topics ({filteredTopics.length})
            </button>

            {filteredTopics.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTopic(t.id);
                  setCurrentPage(1);
                  updateUrlParams({ topic: t.id, page: 1 });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
                  selectedTopic === t.id
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm"
                    : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Tabs & Search Filter Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          {/* Difficulty Segmented Control */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs overflow-x-auto max-w-full shrink-0">
            <button
              onClick={() => {
                setDifficulty("all");
                setCurrentPage(1);
                updateUrlParams({ difficulty: "all", page: 1 });
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                difficulty === "all"
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All ({counts.total})
            </button>
            <button
              onClick={() => {
                setDifficulty("easy");
                setCurrentPage(1);
                updateUrlParams({ difficulty: "easy", page: 1 });
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                difficulty === "easy"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-emerald-400/70 hover:text-emerald-400"
              }`}
            >
              Easy ({counts.easy})
            </button>
            <button
              onClick={() => {
                setDifficulty("medium");
                setCurrentPage(1);
                updateUrlParams({ difficulty: "medium", page: 1 });
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                difficulty === "medium"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "text-amber-400/70 hover:text-amber-400"
              }`}
            >
              Medium ({counts.medium})
            </button>
            <button
              onClick={() => {
                setDifficulty("hard");
                setCurrentPage(1);
                updateUrlParams({ difficulty: "hard", page: 1 });
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                difficulty === "hard"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  : "text-rose-400/70 hover:text-rose-400"
              }`}
            >
              Hard ({counts.hard})
            </button>
          </div>

          {/* Search, Status, and Bookmark Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search problem or tag..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                  updateUrlParams({ search: e.target.value, page: 1 });
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Status dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
                updateUrlParams({ status: e.target.value, page: 1 });
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Status</option>
              <option value="solved">Solved</option>
              <option value="attempted">Attempted</option>
              <option value="unsolved">Unsolved</option>
            </select>

            {/* Bookmarked Filter Toggle */}
            <button
              onClick={() => {
                const nextVal = !bookmarkedOnly;
                setBookmarkedOnly(nextVal);
                setCurrentPage(1);
                updateUrlParams({ bookmarked: nextVal, page: 1 });
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                bookmarkedOnly
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${bookmarkedOnly ? "fill-amber-400 text-amber-400" : ""}`} />
              <span>Bookmarked</span>
            </button>
          </div>
        </div>

        {/* Problems Listing Table / Cards */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="inline-block w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Loading verified problems...</p>
            </div>
          ) : problems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <LayoutGrid className="w-8 h-8 text-slate-600 mx-auto" />
              <h4 className="font-bold text-sm text-slate-300">No matching problems found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing your search query or relaxing your difficulty and status filters.
              </p>
              <button
                onClick={() => {
                  setDifficulty("all");
                  setSelectedTopic("all");
                  setSearchQuery("");
                  setStatusFilter("all");
                  setBookmarkedOnly(false);
                  setCurrentPage(1);
                  router.replace("/problems");
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 w-12 text-center">Status</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4 w-28">Difficulty</th>
                    <th className="py-3 px-4 w-36">Topic</th>
                    <th className="py-3 px-4 w-32 hidden md:table-cell">Complexity</th>
                    <th className="py-3 px-4 w-24 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {problems.map((problem) => (
                    <tr
                      key={problem.id}
                      onClick={() => router.push(`/problems/${problem.slug}`)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Solved Status */}
                      <td className="py-3.5 px-4 text-center">
                        {problem.isSolved ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 inline-block fill-emerald-500/20" />
                        ) : problem.isAttempted ? (
                          <Clock className="w-4 h-4 text-amber-400 inline-block" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-700 mx-auto" />
                        )}
                      </td>

                      {/* Title & Tags */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {problem.title}
                          </span>
                          <button
                            onClick={(e) => toggleBookmark(e, problem.id)}
                            title={problem.isBookmarked ? "Remove Bookmark" : "Bookmark Problem"}
                            className="text-slate-600 hover:text-amber-400 transition-colors opacity-0 group-hover:opacity-100 p-0.5"
                          >
                            <Bookmark
                              className={`w-3.5 h-3.5 ${
                                problem.isBookmarked ? "opacity-100 fill-amber-400 text-amber-400" : ""
                              }`}
                            />
                          </button>
                        </div>
                      </td>

                      {/* Difficulty Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            problem.difficulty === "easy"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : problem.difficulty === "medium"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {problem.difficulty.toUpperCase()}
                        </span>
                      </td>

                      {/* Topic Pill */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] capitalize">
                          {problem.primaryTopic.replace(/-/g, " ")}
                        </span>
                      </td>

                      {/* Expected Complexity */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-400 font-mono text-[11px]">
                        {problem.expectedTimeComplexity}
                      </td>

                      {/* Solve Link */}
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          href={`/problems/${problem.slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-all"
                        >
                          <span>{problem.isSolved ? "Review" : "Solve"}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
              <div>
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} problems
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => {
                    const prev = Math.max(1, pagination.page - 1);
                    setCurrentPage(prev);
                    updateUrlParams({ page: prev });
                  }}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-2 font-bold text-white">
                  Page {pagination.page} of {pagination.totalPages}
                </span>

                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => {
                    const next = Math.min(pagination.totalPages, pagination.page + 1);
                    setCurrentPage(next);
                    updateUrlParams({ page: next });
                  }}
                  className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Learning Roadmap Modal */}
      {showLearningPaths && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0d0f17] border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">DSA Structured Learning Roadmaps</h3>
              </div>
              <button
                onClick={() => setShowLearningPaths(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {TOPIC_LEARNING_PATHS.map((path) => (
                <div
                  key={path.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-cyan-300">{path.title}</h4>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {path.targetAudience}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{path.description}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {path.topicIds.map((tId) => (
                      <button
                        key={tId}
                        onClick={() => {
                          setSelectedTopic(tId);
                          setShowLearningPaths(false);
                          setCurrentPage(1);
                          updateUrlParams({ topic: tId, page: 1 });
                        }}
                        className="px-2 py-1 rounded-md bg-slate-800 hover:bg-cyan-500/20 hover:text-cyan-300 text-[11px] font-medium text-slate-300 transition-colors capitalize"
                      >
                        {tId.replace(/-/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProblemsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0b0e] text-slate-100 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ProblemsContent />
    </Suspense>
  );
}
