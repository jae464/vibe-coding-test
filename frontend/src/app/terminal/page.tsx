"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth";
import { useRouter } from "next/navigation";
import { terminalAPI } from "@/lib/api";
import { TerminalSession, TerminalCommand } from "@/types";
import Navigation from "@/components/layout/Navigation";
import {
  Terminal,
  Play,
  Square,
  FileText,
  Download,
  Upload,
  Settings,
  Trash2,
} from "lucide-react";

export default function TerminalPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const [sessions, setSessions] = useState<TerminalSession[]>([]);
  const [currentSession, setCurrentSession] = useState<TerminalSession | null>(
    null
  );
  const [commandHistory, setCommandHistory] = useState<TerminalCommand[]>([]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("bash");
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    loadSessions();
  }, [token]);

  useEffect(() => {
    // 터미널 출력이 업데이트될 때 자동 스크롤
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory]);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const response = await terminalAPI.getSessions();
      if (response.success && response.data) {
        setSessions(response.data);
      }
    } catch (error) {
      console.error("세션 로드 실패:", error);
      setError("세션을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await terminalAPI.createSession(selectedLanguage);
      if (response.success && response.data) {
        const newSession = response.data;
        setSessions((prev) => [...prev, newSession]);
        setCurrentSession(newSession);
        setCommandHistory([]);
      }
    } catch (error) {
      console.error("세션 생성 실패:", error);
      setError("세션 생성에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const executeCommand = async () => {
    if (!currentSession || !currentCommand.trim()) return;

    try {
      const command = currentCommand.trim();
      setCurrentCommand("");

      // 명령어 히스토리에 추가
      const commandEntry: TerminalCommand = {
        sessionId: currentSession.id,
        command,
        output: "",
        exitCode: 0,
      };
      setCommandHistory((prev) => [...prev, commandEntry]);

      const response = await terminalAPI.executeCommand(
        currentSession.id,
        command
      );
      if (response.success && response.data) {
        // 결과 업데이트
        setCommandHistory((prev) =>
          prev.map((cmd) =>
            cmd.command === command ? { ...cmd, ...response.data } : cmd
          )
        );
      }
    } catch (error) {
      console.error("명령어 실행 실패:", error);
      setError("명령어 실행에 실패했습니다.");
    }
  };

  const destroySession = async (sessionId: string) => {
    try {
      await terminalAPI.destroySession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setCommandHistory([]);
      }
    } catch (error) {
      console.error("세션 종료 실패:", error);
      setError("세션 종료에 실패했습니다.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      executeCommand();
    }
  };

  const getLanguageDisplayName = (language: string) => {
    const languageMap: { [key: string]: string } = {
      bash: "Bash",
      javascript: "JavaScript",
      python: "Python",
      java: "Java",
      cpp: "C++",
    };
    return languageMap[language] || language;
  };

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">터미널</h1>
                <p className="mt-2 text-gray-600">
                  독립된 실행 환경에서 코드를 테스트하고 실행해보세요
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="bash">Bash</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                </select>
                <button
                  onClick={createSession}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2"
                >
                  <Terminal className="h-4 w-4" />
                  <span>새 세션 생성</span>
                </button>
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 세션 목록 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  세션 목록
                </h2>
                <div className="space-y-3">
                  {sessions.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      생성된 세션이 없습니다.
                    </p>
                  ) : (
                    sessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          currentSession?.id === session.id
                            ? "bg-blue-50 border-blue-200"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                        onClick={() => {
                          setCurrentSession(session);
                          setCommandHistory([]);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <Terminal className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-gray-900">
                                {getLanguageDisplayName(session.language)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(session.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              destroySession(session.id);
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* 터미널 */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {currentSession ? (
                  <>
                    {/* 터미널 헤더 */}
                    <div className="border-b border-gray-200 p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Terminal className="h-5 w-5 text-green-500" />
                          <span className="font-medium text-gray-900">
                            {getLanguageDisplayName(currentSession.language)}{" "}
                            터미널
                          </span>
                          <span className="text-sm text-gray-500">
                            ({currentSession.id.slice(0, 8)}...)
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setCommandHistory([])}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            title="출력 지우기"
                          >
                            <Square className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 터미널 출력 */}
                    <div
                      ref={terminalRef}
                      className="h-96 bg-black text-green-400 p-4 font-mono text-sm overflow-y-auto"
                    >
                      <div className="mb-2">
                        <span className="text-blue-400">$</span> 터미널 세션이
                        시작되었습니다.
                      </div>

                      {commandHistory.map((cmd, index) => (
                        <div key={index} className="mb-2">
                          <div className="mb-1">
                            <span className="text-blue-400">$</span>{" "}
                            {cmd.command}
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
                    </div>

                    {/* 명령어 입력 */}
                    <div className="border-t border-gray-200 p-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-400 font-mono">$</span>
                        <input
                          type="text"
                          value={currentCommand}
                          onChange={(e) => setCurrentCommand(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="명령어를 입력하세요..."
                          className="flex-1 bg-transparent border-none outline-none text-green-400 font-mono"
                        />
                        <button
                          onClick={executeCommand}
                          disabled={!currentCommand.trim()}
                          className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-96 flex items-center justify-center">
                    <div className="text-center">
                      <Terminal className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        터미널 세션을 선택하세요
                      </h3>
                      <p className="text-gray-600">
                        세션을 생성하거나 기존 세션을 선택하여 터미널을
                        사용하세요.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
