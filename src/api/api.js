// src/api/api.js
import axios from "axios";

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL) ||
  process.env.REACT_APP_API_BASE_URL ||
  "http://localhost:8080"; // ⚠️ 프록시가 없다면 8080로 직접 보냅니다.

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// 모듈 로드 확인
console.log("[api] axios instance created with baseURL:", BASE_URL);

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;

  // 항상 로그
  console.log("[api] request ->", (config.method || "GET").toUpperCase(), config.url);
  console.log("[api] token present?:", !!token, "tokenLen:", token?.length);

  // 헤더 객체 보장 (Axios v1에서 AxiosHeaders 객체가 올 수도 있음)
  if (!config.headers) config.headers = {};

  if (token && token.split(".").length === 3) {
    // 대소문자 구분없이 안전하게 세팅
    config.headers["Authorization"] = `Bearer ${token}`;
    console.log("[api] Authorization set");
  } else {
    console.warn("[api] no/invalid token, Authorization not set");
  }

  return config;
});

export default api;
