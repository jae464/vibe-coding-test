"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { Code, Trophy, Users, LogOut, User, Terminal } from "lucide-react";

const Navigation = () => {
  const { user, token, logout } = useAuthStore();

  // token이 있으면 인증된 것으로 판단
  const isAuthenticated = !!token;

  console.log("Navigation 렌더링:", { isAuthenticated, user, token });

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Code className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                알고리즘 대회
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/contests"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
            >
              <Trophy className="h-4 w-4" />
              <span>대회</span>
            </Link>

            <Link
              href="/problems"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
            >
              <Code className="h-4 w-4" />
              <span>문제</span>
            </Link>

            <Link
              href="/rooms"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
            >
              <Users className="h-4 w-4" />
              <span>방</span>
            </Link>

            {isAuthenticated && (
              <Link
                href="/terminal"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
              >
                <Terminal className="h-4 w-4" />
                <span>터미널</span>
              </Link>
            )}

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {user?.username}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>로그아웃</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
