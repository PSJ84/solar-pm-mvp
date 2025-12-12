// apps/web/lib/api/client.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const normalizedApiBase = (() => {
  const trimmed = API_URL.replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) {
    return trimmed;
  }
  return `${trimmed}/api`;
})();

export const api = axios.create({
  baseURL: normalizedApiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 인증 토큰 인터셉터
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 에러 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('API 401 Unauthorized', error.response?.data);
      // TODO: 나중에 진짜 로그인 페이지 만들고 여기서 redirect 처리
    }
    return Promise.reject(error);
  },
);
