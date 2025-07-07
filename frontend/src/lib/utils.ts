import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// className을 병합하는 유틸리티 함수
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 날짜 포맷팅 함수
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 시간 포맷팅 함수
export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 상대 시간 표시 함수
export function timeAgo(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return '방금 전';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}시간 전`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}일 전`;
  }
}

// 난이도 색상 반환 함수
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'EASY':
      return 'text-green-600 bg-green-100';
    case 'MEDIUM':
      return 'text-yellow-600 bg-yellow-100';
    case 'HARD':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// 상태 색상 반환 함수
export function getStatusColor(status: string): string {
  switch (status) {
    case 'ACCEPTED':
      return 'text-green-600 bg-green-100';
    case 'WRONG_ANSWER':
      return 'text-red-600 bg-red-100';
    case 'TIME_LIMIT_EXCEEDED':
      return 'text-orange-600 bg-orange-100';
    case 'MEMORY_LIMIT_EXCEEDED':
      return 'text-purple-600 bg-purple-100';
    case 'RUNTIME_ERROR':
      return 'text-red-600 bg-red-100';
    case 'COMPILATION_ERROR':
      return 'text-red-600 bg-red-100';
    case 'PENDING':
      return 'text-blue-600 bg-blue-100';
    case 'RUNNING':
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// 상태 텍스트 반환 함수
export function getStatusText(status: string): string {
  switch (status) {
    case 'ACCEPTED':
      return '정답';
    case 'WRONG_ANSWER':
      return '오답';
    case 'TIME_LIMIT_EXCEEDED':
      return '시간 초과';
    case 'MEMORY_LIMIT_EXCEEDED':
      return '메모리 초과';
    case 'RUNTIME_ERROR':
      return '런타임 에러';
    case 'COMPILATION_ERROR':
      return '컴파일 에러';
    case 'PENDING':
      return '대기 중';
    case 'RUNNING':
      return '실행 중';
    default:
      return '알 수 없음';
  }
}

// 난이도 텍스트 반환 함수
export function getDifficultyText(difficulty: string): string {
  switch (difficulty) {
    case 'EASY':
      return '쉬움';
    case 'MEDIUM':
      return '보통';
    case 'HARD':
      return '어려움';
    default:
      return '알 수 없음';
  }
}

// 문자열을 안전하게 자르는 함수
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// 랜덤 ID 생성 함수
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// 로컬 스토리지 유틸리티
export const storage = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // 에러 무시
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // 에러 무시
    }
  },
}; 