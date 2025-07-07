"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Problem, Submission } from "@/types";
import { problemsAPI, submissionsAPI } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function ProblemDetailPage() {
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthStore();
  const problemId = params.id as string;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    if (problemId) {
      fetchProblem();
    }
  }, [token, problemId]);

  const fetchProblem = async () => {
    try {
      setLoading(true);
      const response = await problemsAPI.getById(problemId);
      if (response.success && response.data) {
        setProblem(response.data);
        // 기본 코드 템플릿 설정
        setCode(getDefaultCode(language));
      } else {
        setError("문제 정보를 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError("문제 정보를 불러오는데 실패했습니다.");
      console.error("Error fetching problem:", err);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultCode = (lang: string) => {
    switch (lang) {
      case "javascript":
        return `function solution(input) {
  // 여기에 코드를 작성하세요
  return input;
}

// 테스트
console.log(solution("test"));`;
      case "python":
        return `def solution(input):
    # 여기에 코드를 작성하세요
    return input

# 테스트
print(solution("test"))`;
      case "java":
        return `public class Solution {
    public static String solution(String input) {
        // 여기에 코드를 작성하세요
        return input;
    }
    
    public static void main(String[] args) {
        System.out.println(solution("test"));
    }
}`;
      case "cpp":
        return `#include <iostream>
#include <string>
using namespace std;

string solution(string input) {
    // 여기에 코드를 작성하세요
    return input;
}

int main() {
    cout << solution("test") << endl;
    return 0;
}`;
      default:
        return `// 코드를 작성하세요`;
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(getDefaultCode(newLanguage));
  };

  const handleSubmit = async () => {
    if (!token || !problem) return;

    try {
      setSubmitting(true);
      setError(null);
      setSubmissionResult(null);

      const response = await submissionsAPI.create({
        problemId: problem.id,
        roomId: "", // 문제 상세 페이지에서는 roomId가 없으므로 빈 문자열
        userId: "", // 백엔드에서 자동으로 설정
        code: code,
        language: language,
      });

      if (response.success && response.data) {
        setSubmissionResult(response.data);
        // 실제 환경에서는 WebSocket을 통해 실시간 결과를 받아야 함
        setTimeout(() => {
          if (response.data) {
            checkSubmissionStatus(response.data.id);
          }
        }, 1000);
      } else {
        setError(response.message || "제출에 실패했습니다.");
      }
    } catch (err) {
      setError("제출에 실패했습니다.");
      console.error("Error submitting code:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const checkSubmissionStatus = async (submissionId: string) => {
    try {
      const response = await submissionsAPI.getById(submissionId);
      if (response.success && response.data) {
        setSubmissionResult(response.data);
      }
    } catch (err) {
      console.error("Error checking submission status:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "text-green-600 bg-green-100";
      case "WRONG_ANSWER":
        return "text-red-600 bg-red-100";
      case "TIME_LIMIT_EXCEEDED":
        return "text-yellow-600 bg-yellow-100";
      case "MEMORY_LIMIT_EXCEEDED":
        return "text-orange-600 bg-orange-100";
      case "RUNTIME_ERROR":
        return "text-red-600 bg-red-100";
      case "COMPILATION_ERROR":
        return "text-red-600 bg-red-100";
      case "PENDING":
      case "RUNNING":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "정답";
      case "WRONG_ANSWER":
        return "오답";
      case "TIME_LIMIT_EXCEEDED":
        return "시간 초과";
      case "MEMORY_LIMIT_EXCEEDED":
        return "메모리 초과";
      case "RUNTIME_ERROR":
        return "런타임 에러";
      case "COMPILATION_ERROR":
        return "컴파일 에러";
      case "PENDING":
        return "대기 중";
      case "RUNNING":
        return "채점 중";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              오류가 발생했습니다
            </h3>
            <p className="text-gray-600 mb-6">
              {error || "문제를 찾을 수 없습니다."}
            </p>
            <button
              onClick={() => router.push("/problems")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              문제 목록으로 돌아가기
            </button>
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
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            뒤로 가기
          </button>

          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {problem.title}
                </h1>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${
                    problem.difficulty === "EASY"
                      ? "bg-green-100 text-green-800"
                      : problem.difficulty === "MEDIUM"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {problem.difficulty}
                </span>
              </div>
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 문제 설명 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              문제 설명
            </h2>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700">
                {problem.description}
              </div>
            </div>
          </div>

          {/* 코드 에디터 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">코드 작성</h2>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="코드를 작성하세요..."
            />

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "제출 중..." : "제출하기"}
              </button>
            </div>
          </div>
        </div>

        {/* 제출 결과 */}
        {submissionResult && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              제출 결과
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-medium">상태:</span>
                <span
                  className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                    submissionResult.status
                  )}`}
                >
                  {getStatusText(submissionResult.status)}
                </span>
              </div>

              {submissionResult.executionTime && (
                <div className="flex items-center gap-4">
                  <span className="font-medium">실행 시간:</span>
                  <span className="text-gray-700">
                    {submissionResult.executionTime}ms
                  </span>
                </div>
              )}

              {submissionResult.memoryUsed && (
                <div className="flex items-center gap-4">
                  <span className="font-medium">메모리 사용량:</span>
                  <span className="text-gray-700">
                    {submissionResult.memoryUsed}MB
                  </span>
                </div>
              )}

              {submissionResult.status === "COMPILATION_ERROR" && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">컴파일 에러</h4>
                  <pre className="text-sm text-red-700 whitespace-pre-wrap">
                    {submissionResult.errorMessage ||
                      "컴파일 에러가 발생했습니다."}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
