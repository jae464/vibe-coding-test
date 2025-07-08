"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { roomsAPI, contestsAPI } from "@/lib/api";
import { Room, Contest } from "@/types";
import Navigation from "@/components/layout/Navigation";
import { io, Socket } from "socket.io-client";
import {
  Plus,
  Users,
  Calendar,
  Clock,
  Search,
  Filter,
  ArrowRight,
  Code,
  Trophy,
} from "lucide-react";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContest, setSelectedContest] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    contestId: "",
    problemId: "",
    maxParticipants: 10,
  });
  const [joiningRooms, setJoiningRooms] = useState<Set<number>>(new Set());

  const router = useRouter();
  const { user, token } = useAuthStore();
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
      console.log("방 목록 WebSocket 연결됨");
    });

    // 방 업데이트 이벤트 리스너
    const handleRoomUpdate = (data: any) => {
      console.log("방 업데이트 수신:", data);
      // 방 목록을 새로고침하여 최신 상태를 반영
      const refreshRooms = async () => {
        try {
          console.log("방 목록 새로고침 시작");
          const roomsResponse = await roomsAPI.getAll();
          if (roomsResponse.success && roomsResponse.data) {
            console.log("새로운 방 목록:", roomsResponse.data);
            setRooms(roomsResponse.data);
          }
        } catch (error) {
          console.error("방 목록 새로고침 실패:", error);
        }
      };
      refreshRooms();
    };

    socketRef.current.on("room_updated", handleRoomUpdate);
    socketRef.current.on("room_list_updated", handleRoomUpdate);

    return () => {
      if (socketRef.current) {
        socketRef.current.off("room_updated", handleRoomUpdate);
        socketRef.current.off("room_list_updated", handleRoomUpdate);
        socketRef.current.disconnect();
      }
    };
  }, [token]);

  // 데이터 로드
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [roomsResponse, contestsResponse] = await Promise.all([
          roomsAPI.getAll(),
          contestsAPI.getAll(),
        ]);

        if (roomsResponse.success && roomsResponse.data) {
          setRooms(roomsResponse.data);
        }

        if (contestsResponse.success && contestsResponse.data) {
          setContests(contestsResponse.data);
        }
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, router]);

  // 필터링된 방 목록
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesContest =
      !selectedContest || room.contestId.toString() === selectedContest;
    return matchesSearch && matchesContest;
  });

  // 방 생성
  const handleCreateRoom = async () => {
    if (!createForm.name || !createForm.contestId || !createForm.problemId) {
      alert("모든 필드를 입력해주세요.");
      return;
    }

    try {
      const response = await roomsAPI.create({
        name: createForm.name,
        contestId: parseInt(createForm.contestId, 10),
        problemId: parseInt(createForm.problemId, 10),
        createdBy: user?.id || 0,
        maxParticipants: createForm.maxParticipants,
      });

      if (response.success && response.data) {
        // 방 목록 새로고침
        const roomsResponse = await roomsAPI.getAll();
        if (roomsResponse.success && roomsResponse.data) {
          setRooms(roomsResponse.data);
        }
        setShowCreateModal(false);
        setCreateForm({
          name: "",
          contestId: "",
          problemId: "",
          maxParticipants: 10,
        });
      }
    } catch (error) {
      console.error("방 생성 실패:", error);
      alert("방 생성에 실패했습니다.");
    }
  };

  // 방 참가
  const handleJoinRoom = async (roomId: number) => {
    // 이미 참가 중인지 확인
    const isAlreadyJoined = rooms
      .find((room) => room.id === roomId)
      ?.participants?.some((participant) => participant.userId === user?.id);

    if (isAlreadyJoined) {
      router.push(`/rooms/${roomId}`);
      return;
    }

    try {
      setJoiningRooms((prev) => new Set(Array.from(prev).concat(roomId)));
      const response = await roomsAPI.join(roomId.toString(), user?.id || 0);
      if (response.success) {
        // 방 목록 새로고침
        const roomsResponse = await roomsAPI.getAll();
        if (roomsResponse.success && roomsResponse.data) {
          setRooms(roomsResponse.data);
        }
        // 잠시 대기 후 방으로 이동
        setTimeout(() => {
          router.push(`/rooms/${roomId}`);
        }, 500);
      }
    } catch (error: any) {
      console.error("방 참가 실패:", error);

      // 이미 참가 중인 경우 방으로 바로 이동
      if (error.response?.status === 409) {
        router.push(`/rooms/${roomId}`);
        return;
      }

      alert("방 참가에 실패했습니다.");
    } finally {
      setJoiningRooms((prev) => {
        const newSet = new Set(prev);
        newSet.delete(roomId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">방 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">방 목록</h1>
              <p className="text-gray-600 mt-2">
                다른 사용자들과 함께 문제를 풀어보세요
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>방 만들기</span>
            </button>
          </div>

          {/* 검색 및 필터 */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="방 이름으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-64">
              <select
                value={selectedContest}
                onChange={(e) => setSelectedContest(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">모든 대회</option>
                {contests.map((contest) => (
                  <option key={contest.id} value={contest.id}>
                    {contest.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 방 목록 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {room.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {contests.find((c) => c.id === room.contestId)?.title ||
                        "대회 정보 없음"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <Users className="h-4 w-4" />
                    <span>
                      {room.participantCount || room.participants?.length || 0}
                      명
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Code className="h-4 w-4 mr-2" />
                    <span>문제 ID: {room.problemId}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{new Date(room.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{new Date(room.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        room.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {room.isActive ? "활성" : "비활성"}
                    </span>
                    <span className="text-xs text-gray-500">
                      최대 {room.maxParticipants}명
                    </span>
                  </div>
                  {(() => {
                    const isAlreadyJoined = room.participants?.some(
                      (participant) => participant.userId === user?.id
                    );
                    const isJoining = joiningRooms.has(room.id);

                    if (isAlreadyJoined) {
                      return (
                        <button
                          onClick={() => router.push(`/rooms/${room.id}`)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm"
                        >
                          <span>참가 중</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      );
                    }

                    return (
                      <button
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={isJoining}
                        className={`px-4 py-2 rounded-lg flex items-center space-x-2 text-sm ${
                          isJoining
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                      >
                        {isJoining ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>참가 중...</span>
                          </>
                        ) : (
                          <>
                            <span>참가</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Users className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              방이 없습니다
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedContest
                ? "검색 조건에 맞는 방이 없습니다."
                : "아직 생성된 방이 없습니다."}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              첫 번째 방 만들기
            </button>
          </div>
        )}
      </div>

      {/* 방 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">새 방 만들기</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  방 이름
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="방 이름을 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  대회 선택
                </label>
                <select
                  value={createForm.contestId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, contestId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">대회를 선택하세요</option>
                  {contests.map((contest) => (
                    <option key={contest.id} value={contest.id}>
                      {contest.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  문제 ID
                </label>
                <input
                  type="number"
                  value={createForm.problemId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, problemId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="문제 ID를 입력하세요"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최대 참가자 수
                </label>
                <input
                  type="number"
                  value={createForm.maxParticipants}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      maxParticipants: parseInt(e.target.value, 10),
                    })
                  }
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                취소
              </button>
              <button
                onClick={handleCreateRoom}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                방 만들기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
