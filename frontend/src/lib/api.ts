import axios, { AxiosInstance, AxiosResponse } from "axios";
import {
  User,
  Contest,
  Problem,
  Room,
  Submission,
  ChatMessage,
  ApiResponse,
  PaginatedResponse,
} from "@/types";

// API 클라이언트 설정
const apiClient: AxiosInstance = axios.create({
  baseURL: "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터 - 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    // Zustand store에서 토큰 가져오기
    const authStore = JSON.parse(localStorage.getItem("auth-storage") || "{}");
    const token = authStore.state?.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // 로그인 API에서의 401 에러는 정상적인 응답이므로 처리하지 않음
    if (
      error.response?.status === 401 &&
      !error.config.url?.includes("/auth/login")
    ) {
      // 새로고침 대신 라우터 이동을 위해 이벤트 발생
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }
    return Promise.reject(error);
  }
);

// 인증 API
export const authAPI = {
  login: async (
    email: string,
    password: string
  ): Promise<ApiResponse<{ access_token: string; user: User }>> => {
    const response = await apiClient.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (
    username: string,
    email: string,
    password: string
  ): Promise<ApiResponse<User>> => {
    const response = await apiClient.post("/auth/register", {
      username,
      email,
      password,
    });
    return response.data;
  },

  me: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },
};

// 사용자 API
export const usersAPI = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get("/users/profile");
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.put("/users/profile", data);
    return response.data;
  },
};

// 대회 API
export const contestsAPI = {
  getAll: async (): Promise<ApiResponse<Contest[]>> => {
    const response = await apiClient.get("/contests");
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Contest>> => {
    const response = await apiClient.get(`/contests/${id}`);
    return response.data;
  },

  create: async (
    data: Omit<Contest, "id" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<Contest>> => {
    const response = await apiClient.post("/contests", data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<Contest>
  ): Promise<ApiResponse<Contest>> => {
    const response = await apiClient.put(`/contests/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/contests/${id}`);
    return response.data;
  },
};

// 문제 API
export const problemsAPI = {
  getAll: async (
    page = 1,
    limit = 10,
    contestId?: string
  ): Promise<ApiResponse<Problem[]>> => {
    const params = new URLSearchParams();
    if (contestId) params.append("contestId", contestId);
    const response = await apiClient.get(`/problems?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Problem>> => {
    const response = await apiClient.get(`/problems/${id}`);
    return response.data;
  },

  create: async (
    data: Omit<Problem, "id" | "createdAt" | "updatedAt">
  ): Promise<ApiResponse<Problem>> => {
    const response = await apiClient.post("/problems", data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<Problem>
  ): Promise<ApiResponse<Problem>> => {
    const response = await apiClient.put(`/problems/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/problems/${id}`);
    return response.data;
  },
};

// 방 API
export const roomsAPI = {
  getAll: async (
    page = 1,
    limit = 10,
    contestId?: string
  ): Promise<ApiResponse<Room[]>> => {
    const params = new URLSearchParams();
    if (contestId) params.append("contestId", contestId);
    const response = await apiClient.get(`/rooms?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Room>> => {
    const response = await apiClient.get(`/rooms/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<ApiResponse<Room>> => {
    const response = await apiClient.post("/rooms", data);
    return response.data;
  },

  join: async (roomId: string, userId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/rooms/${roomId}/join`, { userId });
    return response.data;
  },

  leave: async (roomId: string, userId: number): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/rooms/${roomId}/leave`, { userId });
    return response.data;
  },

  getParticipants: async (roomId: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/rooms/${roomId}/participants`);
    return response.data;
  },
};

// 제출 API
export const submissionsAPI = {
  getAll: async (
    page = 1,
    limit = 10,
    roomId?: string
  ): Promise<ApiResponse<PaginatedResponse<Submission>>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (roomId) params.append("roomId", roomId);
    const response = await apiClient.get(`/submissions?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Submission>> => {
    const response = await apiClient.get(`/submissions/${id}`);
    return response.data;
  },

  create: async (data: {
    problemId: number;
    roomId: number;
    userId: number;
    code: string;
    language: string;
  }): Promise<ApiResponse<Submission>> => {
    const response = await apiClient.post("/submissions", data);
    return response.data;
  },

  getByRoom: async (roomId: string): Promise<ApiResponse<Submission[]>> => {
    const response = await apiClient.get(`/submissions/room/${roomId}`);
    return response.data;
  },
};

// 채팅 API
export const chatAPI = {
  getMessages: async (
    roomId: string,
    page = 1,
    limit = 50
  ): Promise<ApiResponse<PaginatedResponse<ChatMessage>>> => {
    const response = await apiClient.get(
      `/chat/${roomId}?page=${page}&limit=${limit}`
    );
    return response.data;
  },
};

// 터미널 API
export const terminalAPI = {
  createSession: async (language?: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.post("/terminal/sessions", { language });
    return response.data;
  },

  getSessions: async (): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get("/terminal/sessions");
    return response.data;
  },

  getSession: async (sessionId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(`/terminal/sessions/${sessionId}`);
    return response.data;
  },

  executeCommand: async (
    sessionId: string,
    command: string
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(
      `/terminal/sessions/${sessionId}/execute`,
      { command }
    );
    return response.data;
  },

  createFile: async (
    sessionId: string,
    filename: string,
    content: string
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(
      `/terminal/sessions/${sessionId}/files`,
      { filename, content }
    );
    return response.data;
  },

  readFile: async (
    sessionId: string,
    filename: string
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(
      `/terminal/sessions/${sessionId}/files/${filename}`
    );
    return response.data;
  },

  destroySession: async (sessionId: string): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete(`/terminal/sessions/${sessionId}`);
    return response.data;
  },

  destroyUserSessions: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.delete("/terminal/sessions");
    return response.data;
  },

  getSystemInfo: async (): Promise<ApiResponse<any>> => {
    const response = await apiClient.get("/terminal/system/info");
    return response.data;
  },

  getSupportedLanguages: async (): Promise<ApiResponse<string[]>> => {
    const response = await apiClient.get("/terminal/languages");
    return response.data;
  },

  runCode: async (
    sessionId: string,
    language: string,
    filename: string,
    code: string
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(
      `/terminal/sessions/${sessionId}/run`,
      { language, filename, code }
    );
    return response.data;
  },
};

export default apiClient;
