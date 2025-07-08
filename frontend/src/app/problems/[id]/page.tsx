"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Problem, Submission } from "@/types";
import { problemsAPI, submissionsAPI } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import Navigation from "@/components/layout/Navigation";
import dynamic from "next/dynamic";

// Monaco Editor를 동적으로 로드
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

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
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="py-8">
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
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="py-8">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/problems")}
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
              문제 목록으로 돌아가기
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
                    {problem.difficulty === "EASY"
                      ? "쉬움"
                      : problem.difficulty === "MEDIUM"
                      ? "보통"
                      : "어려움"}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{problem.description}</p>
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

          {/* 메인 콘텐츠 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 문제 설명 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                문제 설명
              </h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {problem.description}
                </p>
              </div>
            </div>

            {/* 코드 에디터 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    코드 작성
                  </h2>
                  <div className="flex items-center space-x-4">
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !code.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      {submitting ? "제출 중..." : "제출"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-96">
                <MonacoEditor
                  height="100%"
                  language={language}
                  value={code}
                  onChange={(value) => setCode(value || "")}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
          </div>

          {/* 테스트케이스 정보 */}
          {problem && problem.testcases && problem.testcases.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                예시 테스트케이스
              </h2>
              <div className="space-y-4">
                {problem.testcases
                  .filter(tc => tc.isSample)
                  .map((testcase, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        예시 {index + 1}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-1">입력</div>
                          <pre className="bg-gray-50 p-2 rounded text-xs text-gray-700 overflow-x-auto">{testcase.input}</pre>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-700 mb-1">출력</div>
                          <pre className="bg-gray-50 p-2 rounded text-xs text-gray-700 overflow-x-auto">{testcase.output}</pre>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* 제출 결과 */}
          {submissionResult && (
            <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                제출 결과
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                      submissionResult.status
                    )}`}
                  >
                    {getStatusText(submissionResult.status)}
                  </span>
                  {submissionResult.executionTime && (
                    <span className="text-sm text-gray-600">
                      실행 시간: {submissionResult.executionTime}ms
                    </span>
                  )}
                  {submissionResult.memoryUsed && (
                    <span className="text-sm text-gray-600">
                      메모리 사용량: {submissionResult.memoryUsed}MB
                    </span>
                  )}
                </div>
                
                {/* 상세 결과 메시지 */}
                {submissionResult.resultMessage && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {submissionResult.resultMessage}
                    </pre>
                  </div>
                )}
                
                {submissionResult.status === "WRONG_ANSWER" && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-red-800 mb-2">
                      오답입니다
                    </h3>
                    <p className="text-sm text-red-700">
                      코드를 다시 확인하고 수정해보세요. 위의 상세 정보를 참고하세요.
                    </p>
                  </div>
                )}
                {submissionResult.status === "ACCEPTED" && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-green-800 mb-2">
                      정답입니다!
                    </h3>
                    <p className="text-sm text-green-700">
                      축하합니다! 문제를 성공적으로 해결했습니다.
                    </p>
                  </div>
                )}
                {submissionResult.status === "TIME_LIMIT_EXCEEDED" && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">
                      시간 초과
                    </h3>
                    <p className="text-sm text-yellow-700">
                      코드의 시간 복잡도를 개선해보세요.
                    </p>
                  </div>
                )}
                {submissionResult.status === "RUNTIME_ERROR" && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h3 className="text-sm font-medium text-red-800 mb-2">
                      런타임 에러
                    </h3>
                    <p className="text-sm text-red-700">
                      코드 실행 중 오류가 발생했습니다. 위의 상세 정보를 참고하세요.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
