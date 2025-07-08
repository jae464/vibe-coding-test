"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { problemsAPI, contestsAPI } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Contest } from "@/types";

interface TestCase {
  input: string;
  output: string;
  isSample: boolean;
}

export default function CreateProblemPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "EASY" as "EASY" | "MEDIUM" | "HARD",
    timeLimit: 1000,
    memoryLimit: 128,
  });
  const [testCases, setTestCases] = useState<TestCase[]>([{
    input: "",
    output: "",
    isSample: true,
  }]);
  const [contest, setContest] = useState<Contest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const { token } = useAuthStore();
  const contestId = params.id as string;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    if (contestId) {
      fetchContest();
    }
  }, [token, contestId]);

  const fetchContest = async () => {
    try {
      const response = await contestsAPI.getById(contestId);
      if (response.success && response.data) {
        setContest(response.data);
      } else {
        setError("대회 정보를 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError("대회 정보를 불러오는데 실패했습니다.");
      console.error("Error fetching contest:", err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "timeLimit" || name === "memoryLimit"
          ? parseInt(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      router.push("/login");
      return;
    }

    // 유효성 검사
    if (!formData.title.trim()) {
      setError("문제 제목을 입력해주세요.");
      return;
    }

    if (!formData.description.trim()) {
      setError("문제 설명을 입력해주세요.");
      return;
    }

    if (formData.timeLimit < 100 || formData.timeLimit > 10000) {
      setError("시간 제한은 100ms에서 10000ms 사이여야 합니다.");
      return;
    }

    if (formData.memoryLimit < 16 || formData.memoryLimit > 512) {
      setError("메모리 제한은 16MB에서 512MB 사이여야 합니다.");
      return;
    }

    // 테스트케이스 유효성 검사
    if (testCases.length === 0) {
      setError("최소 1개의 테스트케이스를 입력해주세요.");
      return;
    }

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      if (!tc.input.trim()) {
        setError(`테스트케이스 ${i + 1}의 입력을 입력해주세요.`);
        return;
      }
      if (!tc.output.trim()) {
        setError(`테스트케이스 ${i + 1}의 출력을 입력해주세요.`);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const response = await problemsAPI.create({
        title: formData.title.trim(),
        description: formData.description.trim(),
        difficulty: formData.difficulty,
        timeLimit: formData.timeLimit,
        memoryLimit: formData.memoryLimit,
        contestId: parseInt(contestId),
        testcases: testCases.map((tc, index) => ({
          input: tc.input.trim(),
          output: tc.output.trim(),
          isSample: tc.isSample,
          orderIndex: index,
        })),
      });

      if (response.success && response.data) {
        router.push(`/problems/${response.data.id}`);
      } else {
        setError(response.message || "문제 생성에 실패했습니다.");
      }
    } catch (err) {
      setError("문제 생성에 실패했습니다.");
      console.error("Error creating problem:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!contest) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">대회 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={handleCancel}
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
          <h1 className="text-3xl font-bold text-gray-900">새 문제 만들기</h1>
          <p className="mt-2 text-gray-600">
            대회 "{contest.title}"에 새로운 문제를 추가합니다
          </p>
        </div>

        {/* 폼 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* 문제 제목 */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                문제 제목 *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="문제 제목을 입력하세요"
                required
              />
            </div>

            {/* 문제 설명 */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                문제 설명 *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="문제에 대한 상세한 설명을 입력하세요. 입력 형식, 출력 형식, 예시 등을 포함해주세요."
                required
              />
            </div>

            {/* 난이도 */}
            <div>
              <label
                htmlFor="difficulty"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                난이도 *
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="EASY">쉬움</option>
                <option value="MEDIUM">보통</option>
                <option value="HARD">어려움</option>
              </select>
            </div>

            {/* 시간 제한 */}
            <div>
              <label
                htmlFor="timeLimit"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                시간 제한 (ms) *
              </label>
              <input
                type="number"
                id="timeLimit"
                name="timeLimit"
                value={formData.timeLimit}
                onChange={handleInputChange}
                min="100"
                max="10000"
                step="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                100ms에서 10000ms 사이의 값을 입력하세요.
              </p>
            </div>

            {/* 메모리 제한 */}
            <div>
              <label
                htmlFor="memoryLimit"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                메모리 제한 (MB) *
              </label>
              <input
                type="number"
                id="memoryLimit"
                name="memoryLimit"
                value={formData.memoryLimit}
                onChange={handleInputChange}
                min="16"
                max="512"
                step="16"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                16MB에서 512MB 사이의 값을 입력하세요.
              </p>
            </div>

            {/* 테스트케이스 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  테스트케이스 *
                </label>
                <button
                  type="button"
                  onClick={() => setTestCases([...testCases, { input: "", output: "", isSample: false }])}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  + 테스트케이스 추가
                </button>
              </div>
              
              {testCases.map((testCase, index) => (
                <div key={index} className="mb-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      테스트케이스 {index + 1}
                    </h4>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={testCase.isSample}
                          onChange={(e) => {
                            const newTestCases = [...testCases];
                            newTestCases[index].isSample = e.target.checked;
                            setTestCases(newTestCases);
                          }}
                          className="mr-1"
                        />
                        샘플 테스트케이스
                      </label>
                      {testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newTestCases = testCases.filter((_, i) => i !== index);
                            setTestCases(newTestCases);
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        입력
                      </label>
                      <textarea
                        value={testCase.input}
                        onChange={(e) => {
                          const newTestCases = [...testCases];
                          newTestCases[index].input = e.target.value;
                          setTestCases(newTestCases);
                        }}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="테스트케이스 입력을 입력하세요"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        출력
                      </label>
                      <textarea
                        value={testCase.output}
                        onChange={(e) => {
                          const newTestCases = [...testCases];
                          newTestCases[index].output = e.target.value;
                          setTestCases(newTestCases);
                        }}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="예상 출력을 입력하세요"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 버튼 */}
            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "생성 중..." : "문제 생성"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
