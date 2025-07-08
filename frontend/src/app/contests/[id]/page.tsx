"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { roomsAPI, contestsAPI, problemsAPI } from "@/lib/api";
import { Contest, Room, Problem } from "@/types";
import Navigation from "@/components/layout/Navigation";
import { io, Socket } from "socket.io-client";

export default function ContestDetailPage() {
  const [contest, setContest] = useState<Contest | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "problems" | "rooms">(
    "overview"
  );

  const router = useRouter();
  const params = useParams();
  const { token, user } = useAuthStore();
  const contestId = params.id as string;
  const socketRef = useRef<Socket | null>(null);

  // WebSocket 연결 및 이벤트 리스너
  useEffect(() => {
    if (!token) return;

    // WebSocket 연결
    socketRef.current = io("http://localhost:3001/rooms", {
      auth: { token },
      transports: ["websocket"],
    });

    // 연결 성공 시
    socketRef.current.on("connect", () => {
      console.log("대회 상세 WebSocket 연결됨");
    });

    // 방 업데이트 이벤트 리스너
    const handleRoomUpdate = (data: any) => {
      console.log("대회 상세 방 업데이트 수신:", data);
      // 방 목록을 새로고침하여 최신 상태를 반영
      const refreshRooms = async () => {
        try {
          const roomsResponse = await roomsAPI.getAll(1, 10, contestId);
          if (roomsResponse.success && roomsResponse.data) {
            setRooms(roomsResponse.data);
          }
        } catch (error) {
          console.error("방 목록 새로고침 실패:", error);
        }
      };
      refreshRooms();
    };

    // 방 목록 업데이트 이벤트 리스너
    const handleRoomListUpdate = (data: any) => {
      console.log("대회 상세 방 목록 업데이트 수신:", data);
      // 특정 방의 참가자 수만 업데이트
      setRooms((prevRooms) =>
        prevRooms.map((room) => {
          if (room.id === data.roomId) {
            return {
              ...room,
              participantCount: data.participantCount,
            };
          }
          return room;
        })
      );
    };

    socketRef.current.on("room_updated", handleRoomUpdate);
    socketRef.current.on("room_list_updated", handleRoomListUpdate);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("room_updated", handleRoomUpdate);
        socketRef.current.off("room_list_updated", handleRoomListUpdate);
        socketRef.current.disconnect();
      }
    };
  }, [token, contestId]);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    if (contestId) {
      fetchContestData();
    }
  }, [token, contestId]);

  const fetchContestData = async () => {
    try {
      setLoading(true);
      setError(null);

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
        setProblems(problemsResponse.data);
      }

      // 방 목록 가져오기
      const roomsResponse = await roomsAPI.getAll(1, 50, contestId);
      if (roomsResponse.success && roomsResponse.data) {
        setRooms(roomsResponse.data);
      }
    } catch (err) {
      setError("데이터를 불러오는데 실패했습니다.");
      console.error("Error fetching contest data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProblem = () => {
    router.push(`/contests/${contestId}/problems/create`);
  };

  const handleCreateRoom = () => {
    router.push(`/contests/${contestId}/rooms/create`);
  };

  const handleProblemClick = (problemId: string) => {
    router.push(`/problems/${problemId}`);
  };

  const handleRoomClick = async (roomId: number) => {
    try {
      // 방에 참가
      await roomsAPI.join(roomId.toString(), user?.id || 0);
      router.push(`/rooms/${roomId}`);
    } catch (error: any) {
      console.error("방 참가 실패:", error);

      // 이미 참가 중인 경우 방으로 바로 이동
      if (error.response?.status === 409) {
        router.push(`/rooms/${roomId}`);
        return;
      }

      alert("방 참가에 실패했습니다.");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR");
  };

  const getContestStatus = (contest: Contest) => {
    const now = new Date();
    const startTime = new Date(contest.startTime);
    const endTime = new Date(contest.endTime);

    if (now < startTime) {
      return {
        status: "예정",
        color: "bg-blue-100 text-blue-800",
        timeLeft: Math.ceil(
          (startTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
      };
    } else if (now >= startTime && now <= endTime) {
      return {
        status: "진행중",
        color: "bg-green-100 text-green-800",
        timeLeft: Math.ceil(
          (endTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        ),
      };
    } else {
      return {
        status: "종료",
        color: "bg-gray-100 text-gray-800",
        timeLeft: 0,
      };
    }
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

  if (error || !contest) {
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
                {error || "대회를 찾을 수 없습니다."}
              </p>
              <button
                onClick={() => router.push("/contests")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
              >
                대회 목록으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const contestStatus = getContestStatus(contest);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="mb-8">
            <button
              onClick={() => router.push("/contests")}
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
              대회 목록으로 돌아가기
            </button>

            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {contest.title}
                  </h1>
                  <span
                    className={`px-3 py-1 text-sm font-medium rounded-full ${contestStatus.color}`}
                  >
                    {contestStatus.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-4">{contest.description}</p>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">시작:</span>
                    <span>{formatDate(contest.startTime)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">종료:</span>
                    <span>{formatDate(contest.endTime)}</span>
                  </div>
                  {contestStatus.timeLeft > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">남은 시간:</span>
                      <span>{contestStatus.timeLeft}일</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "overview", label: "개요" },
                { id: "problems", label: "문제" },
                { id: "rooms", label: "방" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 탭 컨텐츠 */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 문제 요약 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">문제</h3>
                  <button
                    onClick={handleCreateProblem}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    문제 추가
                  </button>
                </div>
                <div className="space-y-3">
                  {!problems || problems.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      등록된 문제가 없습니다.
                    </p>
                  ) : (
                    problems.slice(0, 5).map((problem) => (
                      <div
                        key={problem.id}
                        onClick={() => handleProblemClick(problem.id)}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                      >
                        <span className="font-medium text-gray-900">
                          {problem.title}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(
                            problem.difficulty
                          )}`}
                        >
                          {problem.difficulty}
                        </span>
                      </div>
                    ))
                  )}
                  {problems && problems.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      외 {problems.length - 5}개 더...
                    </p>
                  )}
                </div>
              </div>

              {/* 방 요약 */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">방</h3>
                  <button
                    onClick={handleCreateRoom}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    방 만들기
                  </button>
                </div>
                <div className="space-y-3">
                  {!rooms || rooms.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      생성된 방이 없습니다.
                    </p>
                  ) : (
                    rooms.slice(0, 5).map((room) => (
                      <div
                        key={room.id}
                        onClick={() => handleRoomClick(room.id)}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                      >
                        <span className="font-medium text-gray-900">
                          {room.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {room.participantCount ||
                            room.participants?.length ||
                            0}
                          /{room.maxParticipants}
                        </span>
                      </div>
                    ))
                  )}
                  {rooms && rooms.length > 5 && (
                    <p className="text-sm text-gray-500 text-center">
                      외 {rooms.length - 5}개 더...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "problems" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    문제 목록
                  </h3>
                  <button
                    onClick={handleCreateProblem}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    문제 추가
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {!problems || problems.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="text-gray-400 text-4xl mb-2">📝</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      등록된 문제가 없습니다
                    </h3>
                    <p className="text-gray-600 mb-4">
                      첫 번째 문제를 추가해보세요!
                    </p>
                    <button
                      onClick={handleCreateProblem}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      문제 추가
                    </button>
                  </div>
                ) : (
                  problems.map((problem) => (
                    <div
                      key={problem.id}
                      onClick={() => handleProblemClick(problem.id)}
                      className="p-6 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 mb-2">
                            {problem.title}
                          </h4>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {problem.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span
                            className={`px-3 py-1 text-sm font-medium rounded-full ${getDifficultyColor(
                              problem.difficulty
                            )}`}
                          >
                            {problem.difficulty}
                          </span>
                          <div className="text-sm text-gray-500">
                            <div>시간: {problem.timeLimit}ms</div>
                            <div>메모리: {problem.memoryLimit}MB</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === "rooms" && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    방 목록
                  </h3>
                  <button
                    onClick={handleCreateRoom}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                  >
                    방 만들기
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {!rooms || rooms.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="text-gray-400 text-4xl mb-2">🏠</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      생성된 방이 없습니다
                    </h3>
                    <p className="text-gray-600 mb-4">
                      첫 번째 방을 만들어보세요!
                    </p>
                    <button
                      onClick={handleCreateRoom}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                    >
                      방 만들기
                    </button>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <div
                      key={room.id}
                      onClick={() => handleRoomClick(room.id)}
                      className="p-6 hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900 mb-2">
                            {room.name}
                          </h4>
                          {room.problem && (
                            <p className="text-gray-600 text-sm">
                              문제: {room.problem.title}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span
                            className={`px-3 py-1 text-sm font-medium rounded-full ${
                              room.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {room.isActive ? "활성" : "비활성"}
                          </span>
                          <div className="text-sm text-gray-500">
                            참가자: {room.participants?.length || 0}/
                            {room.maxParticipants}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
