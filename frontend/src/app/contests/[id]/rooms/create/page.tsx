"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { roomsAPI, contestsAPI, problemsAPI } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { Contest, Problem } from "@/types";

export default function CreateRoomPage() {
  const [formData, setFormData] = useState({
    name: "",
    problemId: "",
    maxParticipants: 4,
  });
  const [contest, setContest] = useState<Contest | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
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
      fetchData();
    }
  }, [token, contestId]);

  const fetchData = async () => {
    try {
      // 대회 정보 가져오기
      const contestResponse = await contestsAPI.getById(contestId);
      if (contestResponse.success && contestResponse.data) {
        setContest(contestResponse.data);
      } else {
        setError("대회 정보를 불러오는데 실패했습니다.");
        return;
      }

      // 문제 목록 가져오기
      const problemsResponse = await problemsAPI.getAll(1, 50, contestId);
      if (problemsResponse.success && problemsResponse.data) {
        setProblems(problemsResponse.data.data);
      }
    } catch (err) {
      setError("데이터를 불러오는데 실패했습니다.");
      console.error("Error fetching data:", err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "maxParticipants" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      router.push("/login");
      return;
    }

    // 유효성 검사
    if (!formData.name.trim()) {
      setError("방 이름을 입력해주세요.");
      return;
    }

    if (!formData.problemId) {
      setError("문제를 선택해주세요.");
      return;
    }

    if (formData.maxParticipants < 2 || formData.maxParticipants > 10) {
      setError("최대 참가자 수는 2명에서 10명 사이여야 합니다.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await roomsAPI.create({
        name: formData.name.trim(),
        contestId: contestId,
        problemId: formData.problemId,
        maxParticipants: formData.maxParticipants,
        isActive: true,
      });

      if (response.success && response.data) {
        router.push(`/rooms/${response.data.id}`);
      } else {
        setError(response.message || "방 생성에 실패했습니다.");
      }
    } catch (err) {
      setError("방 생성에 실패했습니다.");
      console.error("Error creating room:", err);
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
          <h1 className="text-3xl font-bold text-gray-900">새 방 만들기</h1>
          <p className="mt-2 text-gray-600">
            대회 "{contest.title}"에 새로운 방을 생성합니다
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

            {/* 방 이름 */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                방 이름 *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="방 이름을 입력하세요"
                required
              />
            </div>

            {/* 문제 선택 */}
            <div>
              <label
                htmlFor="problemId"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                문제 선택 *
              </label>
              {!problems || problems.length === 0 ? (
                <div className="text-center py-6 border border-gray-300 rounded-md bg-gray-50">
                  <div className="text-gray-400 text-4xl mb-2">📝</div>
                  <p className="text-gray-600 mb-4">등록된 문제가 없습니다.</p>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/contests/${contestId}/problems/create`)
                    }
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    문제 추가하기
                  </button>
                </div>
              ) : (
                <select
                  id="problemId"
                  name="problemId"
                  value={formData.problemId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">문제를 선택하세요</option>
                  {problems.map((problem) => (
                    <option key={problem.id} value={problem.id}>
                      {problem.title} ({problem.difficulty})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 최대 참가자 수 */}
            <div>
              <label
                htmlFor="maxParticipants"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                최대 참가자 수 *
              </label>
              <input
                type="number"
                id="maxParticipants"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                min="2"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                2명에서 10명 사이의 값을 입력하세요.
              </p>
            </div>

            {/* 선택된 문제 정보 */}
            {formData.problemId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  선택된 문제 정보
                </h4>
                {(() => {
                  const selectedProblem = problems.find(
                    (p) => p.id === formData.problemId
                  );
                  if (!selectedProblem) return null;

                  return (
                    <div className="text-sm text-blue-800">
                      <p>
                        <strong>제목:</strong> {selectedProblem.title}
                      </p>
                      <p>
                        <strong>난이도:</strong> {selectedProblem.difficulty}
                      </p>
                      <p>
                        <strong>시간 제한:</strong> {selectedProblem.timeLimit}
                        ms
                      </p>
                      <p>
                        <strong>메모리 제한:</strong>{" "}
                        {selectedProblem.memoryLimit}MB
                      </p>
                      <p className="mt-2 text-xs line-clamp-3">
                        {selectedProblem.description}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

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
                disabled={loading || !problems || problems.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "생성 중..." : "방 생성"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
