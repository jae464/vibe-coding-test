"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useSocket } from "@/hooks/useSocket";
import { roomsAPI, submissionsAPI } from "@/lib/api";
import { Room, Problem, Submission, ChatMessage, User } from "@/types";
import Navigation from "@/components/layout/Navigation";
import {
  Send,
  Play,
  Users,
  MessageSquare,
  Code,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";

// Monaco Editor를 동적으로 로드
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id as string;

  const { user, isAuthenticated } = useAuthStore();
  const [room, setRoom] = useState<Room | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "problem" | "chat" | "submissions"
  >("problem");

  // WebSocket 연결
  const { sendCodeChange, sendChatMessage, connected } = useSocket({
    roomId,
    onCodeChange: (newCode: string, userId: string) => {
      if (userId !== user?.id) {
        setCode(newCode);
      }
    },
    onUserJoined: (user: User) => {
      setParticipants((prev) => [...prev, user]);
    },
    onUserLeft: (user: User) => {
      setParticipants((prev) => prev.filter((p) => p.id !== user.id));
    },
    onChatMessage: (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    },
    onSubmissionResult: (result: any) => {
      // 제출 결과 처리
      console.log("제출 결과:", result);
    },
  });

  // 방 정보 로드
  useEffect(() => {
    const loadRoom = async () => {
      try {
        const response = await roomsAPI.getById(roomId);
        if (response.success && response.data) {
          setRoom(response.data);
          if (response.data.problem) {
            setProblem(response.data.problem);
          }
        }
      } catch (error) {
        console.error("방 정보 로드 실패:", error);
      }
    };

    if (roomId) {
      loadRoom();
    }
  }, [roomId]);

  // 참가자 목록 로드
  useEffect(() => {
    const loadParticipants = async () => {
      try {
        const response = await roomsAPI.getParticipants(roomId);
        if (response.success && response.data) {
          setParticipants(response.data);
        }
      } catch (error) {
        console.error("참가자 목록 로드 실패:", error);
      }
    };

    if (roomId) {
      loadParticipants();
    }
  }, [roomId]);

  // 제출 목록 로드
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const response = await submissionsAPI.getByRoom(roomId);
        if (response.success && response.data) {
          setSubmissions(response.data);
        }
      } catch (error) {
        console.error("제출 목록 로드 실패:", error);
      }
    };

    if (roomId) {
      loadSubmissions();
    }
  }, [roomId]);

  // 코드 변경 시 WebSocket으로 전송
  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      if (value !== undefined) {
        setCode(value);
        sendCodeChange(value);
      }
    },
    [sendCodeChange]
  );

  // 채팅 메시지 전송
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendChatMessage(newMessage);
      setNewMessage("");
    }
  };

  // 코드 제출
  const handleSubmit = async () => {
    if (!code.trim() || !user?.id) return;

    setIsSubmitting(true);
    try {
      const response = await submissionsAPI.create({
        roomId,
        problemId: problem?.id || "",
        userId: user.id,
        code,
        language,
      });

      if (response.success && response.data) {
        setSubmissions((prev) => [response.data!, ...prev]);
      }
    } catch (error) {
      console.error("제출 실패:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="flex h-screen pt-16">
        {/* 왼쪽 패널 - 코드 에디터 */}
        <div className="flex-1 flex flex-col">
          {/* 헤더 */}
          <div className="bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {room.name}
                </h1>
                <p className="text-sm text-gray-600">
                  {problem?.title} • {participants.length}명 참가
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      connected ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  <span className="text-sm text-gray-600">
                    {connected ? "연결됨" : "연결 중..."}
                  </span>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !code.trim()}
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>{isSubmitting ? "제출 중..." : "제출"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 코드 에디터 */}
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language={language}
              value={code}
              onChange={handleCodeChange}
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

        {/* 오른쪽 패널 */}
        <div className="w-96 bg-white border-l flex flex-col">
          {/* 탭 헤더 */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("problem")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "problem"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Code className="h-4 w-4 inline mr-2" />
              문제
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "chat"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <MessageSquare className="h-4 w-4 inline mr-2" />
              채팅
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "submissions"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <CheckCircle className="h-4 w-4 inline mr-2" />
              제출
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="flex-1 overflow-hidden">
            {activeTab === "problem" && (
              <div className="p-4 h-full overflow-y-auto">
                {problem ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      {problem.title}
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-3 rounded-md">
                        <h4 className="font-medium mb-2">문제 설명</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {problem.description}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-md">
                          <h4 className="font-medium mb-1">시간 제한</h4>
                          <p className="text-sm text-gray-600">
                            {problem.timeLimit}ms
                          </p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <h4 className="font-medium mb-1">메모리 제한</h4>
                          <p className="text-sm text-gray-600">
                            {problem.memoryLimit}MB
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    문제 정보를 불러오는 중...
                  </div>
                )}
              </div>
            )}

            {activeTab === "chat" && (
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((message) => (
                    <div key={message.id} className="flex space-x-2">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-600">
                          {message.user?.username?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {message.user?.username}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-primary-600 text-white p-2 rounded-md hover:bg-primary-700"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "submissions" && (
              <div className="p-4 h-full overflow-y-auto">
                <div className="space-y-3">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {submission.user?.username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(submission.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {submission.status === "ACCEPTED" ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : submission.status === "PENDING" ||
                          submission.status === "RUNNING" ? (
                          <Clock className="h-4 w-4 text-blue-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="text-sm text-gray-700">
                          {submission.status}
                        </span>
                      </div>
                      {submission.executionTime && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Zap className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {submission.executionTime}ms
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
