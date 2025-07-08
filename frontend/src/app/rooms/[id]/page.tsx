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
  const [language, setLanguage] = useState("javascript");
  const [activeTab, setActiveTab] = useState<
    "problem" | "chat" | "submissions"
  >("problem");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const { connected, emit, sendCodeChange } = useSocket({
    roomId,
    onCodeChange: (newCode: string) => {
      setCode(newCode);
    },
    onChatMessage: (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    },
    onSubmissionResult: (result: any) => {
      console.log("제출 결과:", result);
      // 제출 결과 처리
    },
  });

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

  // 코드 저장 및 실행
  const saveAndRunCode = async () => {
    if (!code.trim() || !terminalSession) return;

    const filename = `main.${getFileExtension(language)}`;
    const installCommand = getInstallAndRunCommand(language, filename);
    const runCommand = getRunCommand(language, filename);

    try {
      // 파일 저장
      await terminalAPI.createFile(terminalSession.id, filename, code);

      // 설치 및 실행 명령어 실행
      const response = await terminalAPI.executeCommand(
        terminalSession.id,
        installCommand
      );
      if (response.success && response.data) {
        setTerminalCommands((prev) => [
          ...prev,
          {
            sessionId: terminalSession.id,
            command: installCommand,
            output: response.data.output,
            error: response.data.error,
            exitCode: response.data.exitCode,
          },
        ]);

        // 실행 명령어도 실행
        if (response.data.exitCode === 0) {
          const runResponse = await terminalAPI.executeCommand(
            terminalSession.id,
            runCommand
          );
          if (runResponse.success && runResponse.data) {
            setTerminalCommands((prev) => [
              ...prev,
              {
                sessionId: terminalSession.id,
                command: runCommand,
                output: runResponse.data.output,
                error: runResponse.data.error,
                exitCode: runResponse.data.exitCode,
              },
            ]);
          }
        }
      }
    } catch (error) {
      console.error("코드 실행 실패:", error);
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
    switch (lang) {
      case "javascript":
        return "js";
      case "python":
        return "py";
      case "java":
        return "java";
      case "cpp":
        return "cpp";
      case "bash":
        return "sh";
      default:
        return "js";
    }
  };

  // 설치 및 실행 명령어 가져오기
  const getInstallAndRunCommand = (lang: string, filename: string) => {
    switch (lang) {
      case "javascript":
        return `apt-get install -y nodejs && node ${filename}`;
      // return `npm install -g node && node ${filename}`;
      case "python":
        return `apt-get install -y python3 && python3 ${filename}`;
      case "java":
        return `apt-get install -y openjdk-17-jdk && javac ${filename} && java Main`;
      // return `javac ${filename} && java Main`;
      case "cpp":
        return `apt-get install -y g++ && g++ -o main ${filename} && ./main`;
      // return `g++ -o main ${filename} && ./main`;
      case "bash":
        return `chmod +x ${filename} && ./${filename}`;
      default:
        return `node ${filename}`;
    }
  };

  // 실행 명령어 가져오기
  const getRunCommand = (lang: string, filename: string) => {
    switch (lang) {
      case "javascript":
        return `node ${filename}`;
      case "python":
        return `python3 ${filename}`;
      case "java":
        return `java Main`;
      case "cpp":
        return `./main`;
      case "bash":
        return `./${filename}`;
      default:
        return `node ${filename}`;
    }
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
                response.data.problemId
              );
              if (problemResponse.success && problemResponse.data) {
                setProblem(problemResponse.data);
              }
            }
          }
        };

        const loadParticipants = async () => {
          const response = await roomsAPI.getParticipants(roomId);
          if (response.success && response.data) {
            setParticipants(response.data);
          }
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

        await Promise.all([
          loadRoom(),
          loadParticipants(),
          loadSubmissions(),
          loadChatMessages(),
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

    emit("chat_message", {
      roomId,
      message: newMessage.trim(),
    });

    setNewMessage("");
  };

  // 코드 제출
  const handleSubmit = async () => {
    if (!code.trim() || !problem) return;

    try {
      setIsSubmitting(true);
      const response = await submissionsAPI.create({
        problemId: problem.id,
        roomId,
        code,
        language,
        userId: user?.id || "",
      });

      if (response.success && response.data) {
        setSubmissions([response.data, ...submissions]);
        console.log("제출 성공:", response.data);
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
        {/* 헤더 */}
        <div className="bg-white border-b px-6 py-4">
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
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="bash">Bash</option>
                </select>
              </div>
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
        <div className="flex-1 flex">
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
            <div className="h-64 bg-white border-t border-gray-200">
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
                        onClick={saveAndRunCode}
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
                className="bg-white border-l border-gray-200 flex-shrink-0"
                style={{ width: `${sidebarWidth}px` }}
              >
                <div className="flex border-b border-gray-200">
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

                <div className="p-4 h-full overflow-y-auto">
                  {activeTab === "problem" && (
                    <div>
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
                      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                        {chatMessages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${
                              message.userId === user?.id
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-xs px-3 py-2 rounded-lg ${
                                message.userId === user?.id
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-200 text-gray-900"
                              }`}
                            >
                              <div className="text-xs opacity-75 mb-1">
                                {message.username}
                              </div>
                              <div className="text-sm">{message.message}</div>
                            </div>
                          </div>
                        ))}
                      </div>
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
                  )}

                  {activeTab === "submissions" && (
                    <div className="space-y-3">
                      {submissions.map((submission) => (
                        <div
                          key={submission.id}
                          className="border border-gray-200 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              제출 #{submission.id.slice(0, 8)}
                            </span>
                            <div className="flex items-center space-x-1">
                              {submission.status === "ACCEPTED" ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : submission.status === "WRONG_ANSWER" ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-yellow-500" />
                              )}
                              <span
                                className={`text-xs font-medium ${
                                  submission.status === "ACCEPTED"
                                    ? "text-green-600"
                                    : submission.status === "WRONG_ANSWER"
                                    ? "text-red-600"
                                    : "text-yellow-600"
                                }`}
                              >
                                {submission.status}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(submission.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                      {submissions.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                          <Zap className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p>아직 제출된 코드가 없습니다.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 리사이즈 핸들 */}
              <div
                ref={resizeRef}
                className="w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize flex-shrink-0"
                onMouseDown={handleResizeStart}
                style={{ cursor: isResizing ? "col-resize" : "default" }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
