"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { useSocket } from "@/hooks/useSocket";
import {
  roomsAPI,
  submissionsAPI,
  chatAPI,
  terminalAPI,
  problemsAPI,
} from "@/lib/api";
import {
  Room,
  Problem,
  Submission,
  ChatMessage,
  User,
  TerminalSession,
  TerminalCommand,
} from "@/types";
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
  Terminal,
  Square,
  FileText,
  Settings,
  Trash2,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import dynamic from "next/dynamic";

// Monaco Editor를 동적으로 로드
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

export default function RoomPage() {
  const [room, setRoom] = useState<Room | null>(null);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<
    "problem" | "chat" | "submissions"
  >("problem");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSubmissions, setPendingSubmissions] = useState<Set<number>>(
    new Set()
  );
  const [terminalSession, setTerminalSession] =
    useState<TerminalSession | null>(null);
  const [terminalCommands, setTerminalCommands] = useState<TerminalCommand[]>(
    []
  );
  const [currentCommand, setCurrentCommand] = useState("");
  const [isTerminalLoading, setIsTerminalLoading] = useState(false);

  // 사이드바 관련 상태 추가
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const params = useParams();
  const { user, token } = useAuthStore();
  const roomId = params.id as string;
  const terminalRef = useRef<HTMLDivElement>(null);

  // WebSocket 연결
  const { connected, emit, sendCodeChange, leaveRoom, sendChatMessage } =
    useSocket({
      roomId,
      onCodeChange: (newCode: string) => {
        setCode(newCode);
      },
      onUserJoined: (user: User) => {
        console.log("사용자 참가:", user);
        // 참가자 목록에 추가
        setParticipants((prev) => [...prev, user]);
      },
      onUserLeft: (user: User) => {
        console.log("사용자 퇴장:", user);
        // 참가자 목록에서 제거
        setParticipants((prev) => prev.filter((p) => p.id !== user.id));
      },
      onRoomParticipants: (participants: any[]) => {
        console.log("방 참가자 목록:", participants);
        // 참가자 목록 업데이트
        setParticipants(participants);
      },
      onRoomCodeState: (code: string) => {
        console.log("방 코드 상태:", code);
        setCode(code);
      },
      onChatMessage: (message: ChatMessage) => {
        setChatMessages((prev) => [...prev, message]);
      },
      onSubmissionResult: (result: any) => {
        console.log("제출 결과:", result);
        // 제출 결과 처리
        if (result.submissionId) {
          setSubmissions((prev) =>
            prev.map((submission) =>
              submission.id === result.submissionId
                ? {
                    ...submission,
                    status: result.status,
                    executionTime: result.executionTime,
                    memoryUsed: result.memoryUsed,
                    resultMessage: result.resultMessage,
                  }
                : submission
            )
          );
          // Pending 상태에서 제거
          setPendingSubmissions((prev) => {
            const newSet = new Set(prev);
            newSet.delete(result.submissionId);
            return newSet;
          });
        }
      },
    });

  // 페이지 벗어날 때 방 나가기
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user?.id) {
        // 페이지를 벗어날 때 방에서 나가기
        roomsAPI.leave(roomId, user.id).catch((error: any) => {
          // 404 오류는 무시 (이미 방에서 나간 상태)
          if (error.response?.status !== 404) {
            console.error("방 퇴장 실패:", error);
          }
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && user?.id) {
        // 페이지가 숨겨질 때 방에서 나가기
        roomsAPI.leave(roomId, user.id).catch((error: any) => {
          // 404 오류는 무시 (이미 방에서 나간 상태)
          if (error.response?.status !== 404) {
            console.error("방 퇴장 실패:", error);
          }
        });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // 컴포넌트 언마운트 시 방에서 나가기
      if (user?.id) {
        roomsAPI.leave(roomId, user.id).catch((error: any) => {
          // 404 오류는 무시 (이미 방에서 나간 상태)
          if (error.response?.status !== 404) {
            console.error("방 퇴장 실패:", error);
          }
        });
      }
    };
  }, [user?.id, roomId]);

  // 터미널 세션 생성
  const createTerminalSession = async () => {
    try {
      setIsTerminalLoading(true);
      const response = await terminalAPI.createSession(language);
      if (response.success && response.data) {
        setTerminalSession(response.data);
        setTerminalCommands([]);
      }
    } catch (error) {
      console.error("터미널 세션 생성 실패:", error);
    } finally {
      setIsTerminalLoading(false);
    }
  };

  // 명령어 실행
  const executeCommand = async () => {
    if (!currentCommand.trim() || !terminalSession) return;

    const command = currentCommand.trim();
    setCurrentCommand("");

    try {
      const response = await terminalAPI.executeCommand(
        terminalSession.id,
        command
      );
      if (response.success && response.data) {
        setTerminalCommands((prev) => [
          ...prev,
          {
            sessionId: terminalSession.id,
            command,
            output: response.data.output,
            error: response.data.error,
            exitCode: response.data.exitCode,
          },
        ]);
      }
    } catch (error) {
      console.error("명령어 실행 실패:", error);
      setTerminalCommands((prev) => [
        ...prev,
        {
          sessionId: terminalSession.id,
          command,
          output: "",
          error: "명령어 실행 중 오류가 발생했습니다.",
          exitCode: 1,
        },
      ]);
    }

    // 터미널 스크롤을 맨 아래로
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 100);
  };

  // 코드 실행
  const runCode = async () => {
    if (!code.trim() || !terminalSession) return;

    const filename = `main.${getFileExtension(language)}`;

    try {
      // 새로운 runCode API 사용
      const response = await terminalAPI.runCode(
        terminalSession.id,
        language,
        filename,
        code
      );

      if (response.success && response.data) {
        setTerminalCommands((prev) => [
          ...prev,
          {
            sessionId: terminalSession.id,
            command: response.data.command,
            output: response.data.output,
            error: response.data.error,
            exitCode: response.data.exitCode,
          },
        ]);
      }
    } catch (error) {
      console.error("코드 실행 실패:", error);
      setTerminalCommands((prev) => [
        ...prev,
        {
          sessionId: terminalSession.id,
          command: `run ${filename}`,
          output: "",
          error: "코드 실행 중 오류가 발생했습니다.",
          exitCode: 1,
        },
      ]);
    }

    // 터미널 스크롤을 맨 아래로
    setTimeout(() => {
      if (terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
      }
    }, 100);
  };

  // 파일 확장자 가져오기
  const getFileExtension = (lang: string) => {
    const extensions: Record<string, string> = {
      python: "py",
      javascript: "js",
      nodejs: "js",
      typescript: "ts",
      java: "java",
      cpp: "cpp",
      c: "c",
      go: "go",
      rust: "rs",
      bash: "sh",
      shell: "sh",
    };
    return extensions[lang] || "txt";
  };

  // 데이터 로드
  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const loadData = async () => {
      try {
        const loadRoom = async () => {
          const response = await roomsAPI.getById(roomId);
          if (response.success && response.data) {
            setRoom(response.data);
            if (response.data.problemId) {
              const problemResponse = await problemsAPI.getById(
                String(response.data.problemId)
              );
              if (problemResponse.success && problemResponse.data) {
                setProblem(problemResponse.data);
              }
            }
          }
        };

        const loadParticipants = async () => {
          // WebSocket을 통해 참가자 정보를 받으므로 초기 로드 제거
          // const response = await roomsAPI.getParticipants(roomId);
          // if (response.success && response.data) {
          //   setParticipants(response.data);
          // }
        };

        const loadSubmissions = async () => {
          const response = await submissionsAPI.getByRoom(roomId);
          if (response.success && response.data) {
            setSubmissions(response.data);
          }
        };

        const loadChatMessages = async () => {
          const response = await chatAPI.getMessages(roomId);
          if (response.success && response.data) {
            setChatMessages(response.data.data);
          }
        };

        const loadSupportedLanguages = async () => {
          try {
            const response = await terminalAPI.getSupportedLanguages();
            if (response.success && response.data) {
              setSupportedLanguages(response.data);
              // 첫 번째 언어를 기본값으로 설정 (python이 있으면 python, 없으면 첫 번째)
              if (response.data.includes("python")) {
                setLanguage("python");
              } else if (response.data.length > 0) {
                setLanguage(response.data[0]);
              }
            }
          } catch (error) {
            console.error("지원 언어 목록 로드 실패:", error);
            // 기본 언어 목록 사용
            setSupportedLanguages([
              "bash",
              "python",
              "javascript",
              "java",
              "cpp",
            ]);
          }
        };

        await Promise.all([
          loadRoom(),
          loadParticipants(),
          loadSubmissions(),
          loadChatMessages(),
          loadSupportedLanguages(),
        ]);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      }
    };

    loadData();
  }, [token, roomId, router]);

  // 코드 변경 핸들러
  const handleCodeChange = useCallback(
    (value: string | undefined) => {
      const newCode = value || "";
      setCode(newCode);
      sendCodeChange(newCode);
    },
    [sendCodeChange]
  );

  // 채팅 메시지 전송
  const handleSendMessage = () => {
    if (!newMessage.trim() || !connected) return;

    sendChatMessage(newMessage.trim());
    setNewMessage("");
  };

  // 코드 제출
  const handleSubmit = async () => {
    if (!code.trim() || !problem) return;

    try {
      setIsSubmitting(true);
      const response = await submissionsAPI.create({
        problemId: problem.id,
        roomId: parseInt(roomId, 10),
        code,
        language,
        userId: user?.id || 0,
      });

      if (response.success && response.data) {
        const newSubmission = response.data;
        setSubmissions([newSubmission, ...submissions]);
        setPendingSubmissions(
          (prev) => new Set(Array.from(prev).concat(newSubmission.id))
        );
        console.log("제출 성공:", newSubmission);

        // 채점 요청
        try {
          const judgeResponse = await fetch(
            `/api/judge/submission/${newSubmission.id}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (!judgeResponse.ok) {
            console.error("채점 요청 실패");
          }
        } catch (error) {
          console.error("채점 요청 중 오류:", error);
        }
      }
    } catch (error) {
      console.error("제출 실패:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 키보드 이벤트 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand();
    }
  };

  // 사이드바 리사이즈 관련 함수들
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;

      const containerWidth = window.innerWidth;
      const newWidth = containerWidth - e.clientX;

      // 최소/최대 너비 제한
      const minWidth = 200;
      const maxWidth = Math.min(500, containerWidth * 0.6);

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    },
    [isResizing]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener("mousemove", handleResizeMove);
    document.removeEventListener("mouseup", handleResizeEnd);
  }, [handleResizeMove]);

  // 사이드바 토글
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  // 방 퇴장
  const handleLeaveRoom = async () => {
    if (!confirm("정말로 방을 나가시겠습니까?")) {
      return;
    }

    try {
      await roomsAPI.leave(roomId, user?.id || 0);
      router.push("/rooms");
    } catch (error: any) {
      console.error("방 퇴장 실패:", error);

      // 404 오류는 이미 방에서 나간 것으로 간주하고 페이지 이동
      if (error.response?.status === 404) {
        console.log("이미 방에서 나간 상태입니다.");
        router.push("/rooms");
        return;
      }

      alert("방 퇴장에 실패했습니다.");
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">방 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* 헤더 - 고정 */}
        <div className="bg-white border-b px-6 py-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
              <p className="text-gray-600 mt-1">
                {problem?.title || "문제가 선택되지 않음"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {participants.length}명 참가
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              {/* 방 퇴장 버튼 */}
              <button
                onClick={handleLeaveRoom}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                방 나가기
              </button>
              {/* 사이드바 토글 버튼 */}
              <button
                onClick={toggleSidebar}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100"
                title={sidebarVisible ? "사이드바 숨기기" : "사이드바 표시"}
              >
                {sidebarVisible ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeftOpen className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 왼쪽 패널 - 코드 에디터 */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* 코드 에디터 */}
            <div className="flex-1 bg-white border-r">
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

            {/* 터미널 패널 */}
            <div className="h-64 bg-white border-t border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between p-3 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-900">
                    터미널
                  </span>
                  {terminalSession && (
                    <span className="text-xs text-gray-500">
                      ({terminalSession.id.slice(0, 8)}...)
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {!terminalSession ? (
                    <button
                      onClick={createTerminalSession}
                      disabled={isTerminalLoading}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs font-medium flex items-center space-x-1"
                    >
                      <Terminal className="h-3 w-3" />
                      <span>세션 시작</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={runCode}
                        disabled={!code.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-xs font-medium flex items-center space-x-1"
                      >
                        <Play className="h-3 w-3" />
                        <span>실행</span>
                      </button>
                      <button
                        onClick={() => setTerminalCommands([])}
                        className="text-gray-500 hover:text-gray-700 p-1"
                        title="출력 지우기"
                      >
                        <Square className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 터미널 출력 */}
              <div
                ref={terminalRef}
                className="h-40 bg-black text-green-400 p-3 font-mono text-xs overflow-y-auto"
              >
                {!terminalSession ? (
                  <div className="text-gray-500">
                    터미널 세션을 시작하여 코드를 실행하세요.
                  </div>
                ) : (
                  <>
                    <div className="mb-2">
                      <span className="text-blue-400">$</span> 터미널 세션이
                      시작되었습니다.
                    </div>

                    {terminalCommands.map((cmd, index) => (
                      <div key={index} className="mb-2">
                        <div className="mb-1">
                          <span className="text-blue-400">$</span> {cmd.command}
                        </div>
                        {cmd.output && (
                          <div className="text-green-400 whitespace-pre-wrap">
                            {cmd.output}
                          </div>
                        )}
                        {cmd.error && (
                          <div className="text-red-400 whitespace-pre-wrap">
                            {cmd.error}
                          </div>
                        )}
                        {cmd.exitCode !== 0 && (
                          <div className="text-red-400">
                            Exit code: {cmd.exitCode}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* 명령어 입력 */}
              {terminalSession && (
                <div className="border-t border-gray-700 p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-400 font-mono text-xs">$</span>
                    <input
                      type="text"
                      value={currentCommand}
                      onChange={(e) => setCurrentCommand(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="명령어를 입력하세요..."
                      className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono text-xs"
                    />
                    <button
                      onClick={executeCommand}
                      disabled={!currentCommand.trim()}
                      className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      <Play className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽 패널 - 사이드바 */}
          {sidebarVisible && (
            <>
              <div
                ref={sidebarRef}
                className="bg-white border-l border-gray-200 flex-shrink-0 flex flex-col"
                style={{ width: `${sidebarWidth}px` }}
              >
                <div className="flex border-b border-gray-200 flex-shrink-0">
                  <button
                    onClick={() => setActiveTab("problem")}
                    className={`flex-1 px-4 py-3 text-sm font-medium ${
                      activeTab === "problem"
                        ? "text-blue-600 border-b-2 border-blue-600"
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
                        ? "text-blue-600 border-b-2 border-blue-600"
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
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Zap className="h-4 w-4 inline mr-2" />
                    제출
                  </button>
                </div>

                <div className="flex-1 overflow-hidden">
                  {activeTab === "problem" && (
                    <div className="h-full overflow-y-auto p-4">
                      {problem ? (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">
                            {problem.title}
                          </h3>
                          <div className="prose prose-sm max-w-none">
                            <div
                              dangerouslySetInnerHTML={{
                                __html: problem.description || "",
                              }}
                            />
                          </div>
                          <div className="mt-4">
                            <button
                              onClick={handleSubmit}
                              disabled={isSubmitting || !code.trim()}
                              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center justify-center space-x-2"
                            >
                              {isSubmitting ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>제출 중...</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4" />
                                  <span>제출</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500">
                          <Code className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>문제가 선택되지 않았습니다.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "chat" && (
                    <div className="h-full flex flex-col">
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.map((message, index) => {
                          const isOwnMessage = message.userId === user?.id;
                          return (
                            <div
                              key={index}
                              className={`flex ${
                                isOwnMessage ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-xs px-3 py-2 rounded-lg ${
                                  isOwnMessage
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-900"
                                }`}
                              >
                                <div
                                  className={`text-xs mb-1 ${
                                    isOwnMessage
                                      ? "text-blue-100"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {isOwnMessage ? "나" : message.username}
                                </div>
                                <div className="text-sm break-words">
                                  {message.message}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex-shrink-0 p-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" && handleSendMessage()
                            }
                            placeholder="메시지를 입력하세요..."
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || !connected}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "submissions" && (
                    <div className="h-full overflow-y-auto p-4 space-y-3">
                      {submissions.map((submission) => {
                        const isPending = pendingSubmissions.has(submission.id);
                        return (
                          <div
                            key={submission.id}
                            className={`border rounded-lg p-3 ${
                              isPending
                                ? "border-blue-200 bg-blue-50"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                제출 #{String(submission.id).slice(0, 8)}
                              </span>
                              <div className="flex items-center space-x-1">
                                {isPending ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                    <span className="text-xs font-medium text-blue-600">
                                      채점 중...
                                    </span>
                                  </>
                                ) : submission.status === "ACCEPTED" ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-xs font-medium text-green-600">
                                      {submission.status}
                                    </span>
                                  </>
                                ) : submission.status === "WRONG_ANSWER" ? (
                                  <>
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-xs font-medium text-red-600">
                                      {submission.status}
                                    </span>
                                  </>
                                ) : submission.status ===
                                  "TIME_LIMIT_EXCEEDED" ? (
                                  <>
                                    <Clock className="h-4 w-4 text-orange-500" />
                                    <span className="text-xs font-medium text-orange-600">
                                      시간 초과
                                    </span>
                                  </>
                                ) : submission.status ===
                                  "MEMORY_LIMIT_EXCEEDED" ? (
                                  <>
                                    <Clock className="h-4 w-4 text-orange-500" />
                                    <span className="text-xs font-medium text-orange-600">
                                      메모리 초과
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-4 w-4 text-gray-500" />
                                    <span className="text-xs font-medium text-gray-600">
                                      {submission.status}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mb-2">
                              {new Date(submission.createdAt).toLocaleString()}
                            </div>
                            {submission.executionTime && (
                              <div className="text-xs text-gray-500">
                                실행 시간: {submission.executionTime}ms
                              </div>
                            )}
                            {submission.memoryUsed && (
                              <div className="text-xs text-gray-500">
                                메모리 사용량: {submission.memoryUsed}MB
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              {/* 리사이즈 핸들 */}
              <div
                ref={resizeRef}
                className="w-1 bg-gray-300 hover:bg-gray-400 cursor-col-resize flex-shrink-0"
                onMouseDown={handleResizeStart}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
