"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Problem } from "@/types";
import { problemsAPI } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
  const router = useRouter();
  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    fetchProblems();
  }, [token, page, searchTerm, difficultyFilter]);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const response = await problemsAPI.getAll(page, 20);
      if (response.success && response.data) {
        let filteredProblems = response.data.data;

        // 검색어 필터링
        if (searchTerm) {
          filteredProblems = filteredProblems.filter(
            (problem) =>
              problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              problem.description
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
          );
        }

        // 난이도 필터링
        if (difficultyFilter !== "ALL") {
          filteredProblems = filteredProblems.filter(
            (problem) => problem.difficulty === difficultyFilter
          );
        }

        setProblems(filteredProblems);
        setTotalPages(response.data.totalPages);
      } else {
        setError(response.message || "문제 목록을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError("문제 목록을 불러오는데 실패했습니다.");
      console.error("Error fetching problems:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProblemClick = (problemId: string) => {
    router.push(`/problems/${problemId}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HARD":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "쉬움";
      case "MEDIUM":
        return "보통";
      case "HARD":
        return "어려움";
      default:
        return difficulty;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">문제 목록</h1>
          <p className="mt-2 text-gray-600">
            다양한 알고리즘 문제를 풀어보세요
          </p>
        </div>

        {/* 필터 및 검색 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="문제 제목이나 설명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 난이도 필터 */}
            <div className="sm:w-48">
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">모든 난이도</option>
                <option value="EASY">쉬움</option>
                <option value="MEDIUM">보통</option>
                <option value="HARD">어려움</option>
              </select>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* 문제 목록 */}
        {!problems || problems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              문제를 찾을 수 없습니다
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || difficultyFilter !== "ALL"
                ? "검색 조건을 변경해보세요."
                : "등록된 문제가 없습니다."}
            </p>
            {(searchTerm || difficultyFilter !== "ALL") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setDifficultyFilter("ALL");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {problems.map((problem) => (
              <div
                key={problem.id}
                onClick={() => handleProblemClick(problem.id)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {problem.title}
                      </h3>
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${getDifficultyColor(
                          problem.difficulty
                        )}`}
                      >
                        {getDifficultyText(problem.difficulty)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {problem.description}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">시간 제한:</span>
                        <span>{problem.timeLimit}ms</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">메모리 제한:</span>
                        <span>{problem.memoryLimit}MB</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}
