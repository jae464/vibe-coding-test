"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { contestsAPI } from "@/lib/api";
import { useAuthStore } from "@/store/auth";

export default function CreateContestPage() {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startTime: "",
    endTime: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { token } = useAuthStore();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
      setError("대회 제목을 입력해주세요.");
      return;
    }

    if (!formData.description.trim()) {
      setError("대회 설명을 입력해주세요.");
      return;
    }

    if (!formData.startTime) {
      setError("시작 시간을 입력해주세요.");
      return;
    }

    if (!formData.endTime) {
      setError("종료 시간을 입력해주세요.");
      return;
    }

    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);

    if (startTime >= endTime) {
      setError("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await contestsAPI.create({
        title: formData.title.trim(),
        description: formData.description.trim(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        isActive: true,
      });

      if (response.success && response.data) {
        router.push(`/contests/${response.data.id}`);
      } else {
        setError(response.message || "대회 생성에 실패했습니다.");
      }
    } catch (err) {
      setError("대회 생성에 실패했습니다.");
      console.error("Error creating contest:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  // 현재 시간을 기준으로 최소 시작 시간 설정 (1시간 후)
  const getMinStartTime = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

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
          <h1 className="text-3xl font-bold text-gray-900">새 대회 만들기</h1>
          <p className="mt-2 text-gray-600">
            새로운 알고리즘 대회를 생성합니다
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

            {/* 대회 제목 */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                대회 제목 *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="대회 제목을 입력하세요"
                required
              />
            </div>

            {/* 대회 설명 */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                대회 설명 *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="대회에 대한 설명을 입력하세요"
                required
              />
            </div>

            {/* 시작 시간 */}
            <div>
              <label
                htmlFor="startTime"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                시작 시간 *
              </label>
              <input
                type="datetime-local"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                min={getMinStartTime()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                최소 1시간 후부터 시작할 수 있습니다.
              </p>
            </div>

            {/* 종료 시간 */}
            <div>
              <label
                htmlFor="endTime"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                종료 시간 *
              </label>
              <input
                type="datetime-local"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                min={formData.startTime || getMinStartTime()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                시작 시간보다 늦어야 합니다.
              </p>
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
                {loading ? "생성 중..." : "대회 생성"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
