import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";
import { authAPI } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
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
      isLoading: false,
      error: null,

      // 액션
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(email, password);
          if (response.success && response.data) {
            const { access_token, user } = response.data;
            console.log("로그인 성공:", { user, access_token });
            set({
              user,
              token: access_token,
              isLoading: false,
            });
            console.log("상태 업데이트 완료");
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
        set({
          user: null,
          token: null,
          error: null,
        });
      },

      checkAuth: async () => {
        const token = get().token;
        if (!token) {
          console.log("토큰이 없음, 인증 상태: false");
          return false;
        }

        set({ isLoading: true });
        try {
          const response = await authAPI.me();
          if (response.success && response.data) {
            console.log("토큰 유효, 인증 상태: true");
            set({
              user: response.data,
              token,
              isLoading: false,
            });
            return true;
          } else {
            console.log("토큰 무효, 인증 상태: false");
            set({
              user: null,
              token: null,
              isLoading: false,
            });
            return false;
          }
        } catch (error) {
          console.log("토큰 검증 실패, 인증 상태: false");
          set({
            user: null,
            token: null,
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
      }),
    }
  )
);
