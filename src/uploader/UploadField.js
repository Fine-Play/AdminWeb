// src/uploader/UploadField.jsx
import React, { useRef, useState } from "react";
import styled from "styled-components";
import api from "../api/api";
import { validateFile, uploadImage } from "./adapter";

const Box = styled.label`
  display:flex; align-items:center; justify-content:center; text-align:center;
  border:2px dashed ${p => p.active ? '#111' : '#ccc'}; border-radius:12px; cursor:pointer;
  height:${p => p.h || 140}px; background:${p => p.active ? '#fafafa' : '#fff'};
`;
const Row = styled.div`display:flex; gap:8px; align-items:center; flex-wrap:wrap;`;
const Thumb = styled.img`width:72px; height:72px; object-fit:cover; border-radius:10px; border:1px solid #eee;`;

export default function UploadField({
  label, initialUrl = "", endpoint, onUploaded, height = 120 }) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [pct, setPct] = useState(0);
  const inputRef = useRef(null);

  const pick = () => inputRef.current?.click();

  const onChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 간단 검증
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
      alert("PNG/JPG/WebP 이미지만 업로드 가능합니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("용량은 5MB 이하로 업로드해주세요.");
      return;
    }

    const fd = new FormData();
    fd.append("file", file); // 🔴 백엔드도 'file'로 받도록 합의

    try {
      setLoading(true);
      setPct(0);
      const res = await api.post(endpoint, fd, {
        // Content-Type 은 axios가 자동으로 boundary 포함해 세팅 → 명시 불필요
        onUploadProgress: (evt) => {
          if (!evt.total) return;
          setPct(Math.round((evt.loaded / evt.total) * 100));
        },
      });

            // 서버 응답 형태 폭넓게 허용
      const data = res?.data?.data ?? res?.data ?? {};
      const candidate =
        data.url ||
        data.teamImg ||     // ✅ 팀 API에서 쓰던 키
        data.imageUrl ||
        data.fileUrl ||
        (data.path ?? "");  // path만 오면 CDN prefix를 붙일 수도 있음

      if (candidate) {
        const finalUrl = `${candidate}${candidate.includes("?") ? "&" : "?"}t=${Date.now()}`;
        setUrl(finalUrl);
        onUploaded?.({ url: finalUrl });
      } else {
        // URL이 없어도 에러로 처리하지 않고, 상위에서 재조회하도록 신호만 보냄
        onUploaded?.({ url: "" });
      }
    } catch (err) {
      console.error(err);
      alert("업로드에 실패했습니다.");
    } finally {
      setLoading(false);
      setPct(0);
      // 같은 파일 다시 선택 가능하도록 input 리셋
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontWeight: 600 }}>{label}</div>
      <div
        onClick={pick}
        role="button"
        tabIndex={0}
        style={{
          height,
          border: "1px dashed #d1d5db",
          borderRadius: 10,
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          overflow: "hidden",
          background: "#fafafa",
        }}
      >
        {url ? (
          <img src={url} alt={label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ color: "#6b7280" }}>{loading ? `업로드 중... ${pct}%` : "이미지 선택"}</span>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        style={{ display: "none" }}
      />

      {loading && <progress max="100" value={pct} />}
      {url && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a href={url} target="_blank" rel="noreferrer">열기</a>
          <button onClick={() => navigator.clipboard.writeText(url)}>URL 복사</button>
        </div>
      )}
    </div>
  );
}