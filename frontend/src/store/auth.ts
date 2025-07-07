import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";
import { authAPI } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // 상태
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 액션
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(email, password);
          if (response.success && response.data) {
            const { token, user } = response.data;
            localStorage.setItem("token", token);
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          } else {
            set({
              error: response.message || "로그인에 실패했습니다.",
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          set({
            error: "로그인 중 오류가 발생했습니다.",
            isLoading: false,
          });
          return false;
        }
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.register(username, email, password);
          if (response.success) {
            set({
              isLoading: false,
            });
            return true;
          } else {
            set({
              error: response.message || "회원가입에 실패했습니다.",
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          set({
            error: "회원가입 중 오류가 발생했습니다.",
            isLoading: false,
          });
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem("token");
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem("token");
        if (!token) {
          set({ isAuthenticated: false });
          return false;
        }

        set({ isLoading: true });
        try {
          const response = await authAPI.me();
          if (response.success && response.data) {
            set({
              user: response.data,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          } else {
            localStorage.removeItem("token");
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          localStorage.removeItem("token");
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return false;
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
