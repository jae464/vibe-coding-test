import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  User, 
  Contest, 
  Problem, 
  Room, 
  Submission, 
  ChatMessage,
  ApiResponse,
  PaginatedResponse 
} from '@/types';

// API 클라이언트 설정
const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 인증 API
export const authAPI = {
  login: async (email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (username: string, email: string, password: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.post('/auth/register', { username, email, password });
    return response.data;
  },

  me: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },
};

// 사용자 API
export const usersAPI = {
  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },
};

// 대회 API
export const contestsAPI = {
  getAll: async (page = 1, limit = 10): Promise<ApiResponse<PaginatedResponse<Contest>>> => {
    const response = await apiClient.get(`/contests?page=${page}&limit=${limit}`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Contest>> => {
    const response = await apiClient.get(`/contests/${id}`);
    return response.data;
  },

  create: async (data: Omit<Contest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Contest>> => {
    const response = await apiClient.post('/contests', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Contest>): Promise<ApiResponse<Contest>> => {
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
  getAll: async (page = 1, limit = 10, contestId?: string): Promise<ApiResponse<PaginatedResponse<Problem>>> => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (contestId) params.append('contestId', contestId);
    const response = await apiClient.get(`/problems?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Problem>> => {
    const response = await apiClient.get(`/problems/${id}`);
    return response.data;
  },

  create: async (data: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Problem>> => {
    const response = await apiClient.post('/problems', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Problem>): Promise<ApiResponse<Problem>> => {
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
  getAll: async (page = 1, limit = 10, contestId?: string): Promise<ApiResponse<PaginatedResponse<Room>>> => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (contestId) params.append('contestId', contestId);
    const response = await apiClient.get(`/rooms?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Room>> => {
    const response = await apiClient.get(`/rooms/${id}`);
    return response.data;
  },

  create: async (data: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Room>> => {
    const response = await apiClient.post('/rooms', data);
    return response.data;
  },

  join: async (roomId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/rooms/${roomId}/join`);
    return response.data;
  },

  leave: async (roomId: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.post(`/rooms/${roomId}/leave`);
    return response.data;
  },

  getParticipants: async (roomId: string): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(`/rooms/${roomId}/participants`);
    return response.data;
  },
};

// 제출 API
export const submissionsAPI = {
  getAll: async (page = 1, limit = 10, roomId?: string): Promise<ApiResponse<PaginatedResponse<Submission>>> => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (roomId) params.append('roomId', roomId);
    const response = await apiClient.get(`/submissions?${params}`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Submission>> => {
    const response = await apiClient.get(`/submissions/${id}`);
    return response.data;
  },

  create: async (data: Omit<Submission, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'executionTime' | 'memoryUsed'>): Promise<ApiResponse<Submission>> => {
    const response = await apiClient.post('/submissions', data);
    return response.data;
  },

  getByRoom: async (roomId: string): Promise<ApiResponse<Submission[]>> => {
    const response = await apiClient.get(`/submissions/room/${roomId}`);
    return response.data;
  },
};

// 채팅 API
export const chatAPI = {
  getMessages: async (roomId: string, page = 1, limit = 50): Promise<ApiResponse<PaginatedResponse<ChatMessage>>> => {
    const response = await apiClient.get(`/chat/${roomId}?page=${page}&limit=${limit}`);
    return response.data;
  },
};

export default apiClient; 