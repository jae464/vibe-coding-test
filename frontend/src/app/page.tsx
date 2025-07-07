"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import Navigation from "@/components/layout/Navigation";
import { Code, Trophy, Users, ArrowRight, Play } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { checkAuth, logout } = useAuthStore();

  useEffect(() => {
    checkAuth();

    // 인증 만료 이벤트 감지
    const handleAuthLogout = () => {
      logout();
      router.push("/login");
    };

    window.addEventListener("auth:logout", handleAuthLogout);

    return () => {
      window.removeEventListener("auth:logout", handleAuthLogout);
    };
  }, [checkAuth, logout, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
              실시간 협업
              <span className="text-primary-600"> 알고리즘 대회</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              여러 명이 함께 문제를 풀고, 실시간으로 코드를 공유하며, 서로의
              아이디어를 나누는 새로운 알고리즘 대회 플랫폼입니다.
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              <Link
                href="/contests"
                className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 flex items-center space-x-2"
              >
                <Play className="h-5 w-5" />
                <span>대회 참가하기</span>
              </Link>
              <Link
                href="/rooms"
                className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 flex items-center space-x-2"
              >
                <Users className="h-5 w-5" />
                <span>방 만들기</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">주요 기능</h2>
            <p className="mt-4 text-lg text-gray-600">
              실시간 협업과 효율적인 문제 풀이를 위한 다양한 기능을 제공합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-6">
                <Code className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                실시간 코드 편집
              </h3>
              <p className="text-gray-600">
                여러 명이 동시에 같은 코드를 편집하고, 실시간으로 변경사항을
                확인할 수 있습니다.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-6">
                <Trophy className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                자동 채점 시스템
              </h3>
              <p className="text-gray-600">
                코드를 제출하면 즉시 자동으로 채점되어 결과를 실시간으로 확인할
                수 있습니다.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-sm border">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-6">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                실시간 채팅
              </h3>
              <p className="text-gray-600">
                팀원들과 실시간으로 의견을 나누고, 문제 해결 과정을 함께 논의할
                수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              지금 시작해보세요
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              새로운 방식의 알고리즘 대회를 경험해보세요.
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/signup"
                className="bg-white text-primary-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 flex items-center space-x-2"
              >
                <span>회원가입</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/contests"
                className="border border-white text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 flex items-center space-x-2"
              >
                <span>대회 둘러보기</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Code className="h-8 w-8 text-primary-400" />
                <span className="text-xl font-bold">알고리즘 대회</span>
              </div>
              <p className="text-gray-400">
                실시간 협업 알고리즘 문제 풀이 플랫폼
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">서비스</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/contests" className="hover:text-white">
                    대회
                  </Link>
                </li>
                <li>
                  <Link href="/problems" className="hover:text-white">
                    문제
                  </Link>
                </li>
                <li>
                  <Link href="/rooms" className="hover:text-white">
                    방
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">계정</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/login" className="hover:text-white">
                    로그인
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-white">
                    회원가입
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">문의</h3>
              <p className="text-gray-400">support@algorithm-contest.com</p>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 알고리즘 대회 플랫폼. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
