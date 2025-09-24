// src/uploader/adapter.js
import api from "../api/api";

/**
 * 업로드 전략 (지금은 mock; 서버 준비되면 real로 전환)
 * mode: "mock" | "direct" | "presigned"
 */
const MODE = process.env.REACT_APP_UPLOAD_MODE || "mock";

/**
 * 공통 유틸: 확장자/타입 체크
 */
export function validateFile(file, { maxMB = 5, accept = ["image/png","image/jpeg","image/webp"] } = {}) {
  if (!file) throw new Error("파일이 없습니다.");
  if (!accept.includes(file.type)) {
    throw new Error(`허용되지 않는 형식입니다. (${accept.join(", ")})`);
  }
  if (file.size > maxMB * 1024 * 1024) {
    throw new Error(`용량 초과: 최대 ${maxMB}MB`);
  }
}

/**
 * 업로드 어댑터
 * keyHint: 저장 키 힌트 (예: user/123/profile, user/123/stat/ACT, team/45/profile, matches/77/homeFormation)
 */
export async function uploadImage(file, { keyHint, kind = "generic" } = {}) {
  switch (MODE) {
    case "mock": {
      // 서버 없이 미리보기/흉내만: ObjectURL + 가짜 CDN URL 반환
      const fakeKey = `${keyHint || "uploads"}/${Date.now()}_${file.name}`;
      const objectUrl = URL.createObjectURL(file); // 즉시 미리보기 가능
      // 화면/임시 저장용 URL(objectUrl), 서버 달리면 cdnUrl만 사용
      return { key: fakeKey, cdnUrl: objectUrl, isMock: true };
    }
    case "direct": {
      // (예시) 서버 멀티파트 업로드
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      form.append("keyHint", keyHint || "");
      const res = await api.post("/api/admin/uploads", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = res.data?.data || res.data;
      return { key: data.key, cdnUrl: data.url, isMock: false };
    }
    case "presigned": {
      // (예시) presign → S3 PUT → commit
      const pres = await api.post("/api/admin/uploads/presign", {
        filename: file.name,
        mime: file.type,
        kind, keyHint
      });
      const { uploadUrl, key, headers } = pres.data?.data || pres.data;
      await fetch(uploadUrl, { method: "PUT", headers: headers || {}, body: file });
      await api.patch("/api/admin/uploads/commit", { key, kind, keyHint });
      // 서버가 CDN 도메인 붙여 반환한다고 가정
      const urlRes = await api.get(`/api/admin/uploads/url?key=${encodeURIComponent(key)}`);
      return { key, cdnUrl: (urlRes.data?.url || urlRes.data), isMock: false };
    }
    default:
      throw new Error("알 수 없는 업로드 모드");
  }
}
