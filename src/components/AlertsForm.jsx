import React, { useState } from "react";
import styled from "styled-components";
import api from "../api/api";

const AlertsForm = ({ onClose, onSend }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false); // ✅ 중복 전송 방지
  const [error, setError] = useState("");

  const openConfirm = () => {
    const t = (title || "").trim();
    const c = (content || "").trim();
    if (!t || !c) {
      setError("제목과 내용을 모두 입력하세요.");
      return;
    }
    setError("");
    setShowConfirm(true);
  };

  const handleFinalSend = async () => {
    if (submitting) return;
    setSubmitting(true);

    const payload = { title: (title || "공지").trim(), content: content.trim() };

    try {
      const res = await api.post("/api/admin/notices", payload);
      const ok =
        (res.status === 201 || res.status === 200) &&
        (res?.data?.code === "SU" || res?.data?.success === true || res?.data?.success === undefined);

      if (!ok) {
        throw new Error(res?.data?.message || "전송 실패");
      }

      // 서버가 반환한 상세 DTO
      const created = res?.data?.data ?? res?.data;

      // 리스트에 추가할 요약 형태로 매핑
      onSend?.({
        id: created.id,
        title: created.title,
        createdAt: String(created.createdAt),      // 표시는 리스트 컴포넌트에서 KST로 포맷
        authorId: created.authorId ?? null,
        authorNickName: created.authorNickName ?? "",
      });

      // 폼 닫기
      onClose?.();
    } catch (e) {
      alert("에러 발생: " + (e?.message || "전송 실패"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Backdrop>
      <Modal>
        <Brand>
          <PurpleText>FinePlay</PurpleText>
        </Brand>

        <SectionTitle>MESSAGE</SectionTitle>
        <Desc>메시지를 작성한 후 사용자들에게 메시지를 보내세요!</Desc>

        <FormGroup>
          <Label>제목</Label>
          <Input
            placeholder="Write your title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormGroup>

        <FormGroup>
          <Label>메시지 (내용)</Label>
          <Textarea
            placeholder="Write your content..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </FormGroup>

        {error && <ErrorText>{error}</ErrorText>}

        <SendButton onClick={openConfirm} disabled={submitting}>
          {submitting ? "Sending..." : "Send"}
        </SendButton>
      </Modal>

      {showConfirm && (
        <ConfirmBackdrop>
          <ConfirmModal>
            <PopupTitle>메시지를 전송하시겠습니까?</PopupTitle>
            <PopupDesc>확인을 누르시면 메시지 수정이 불가능합니다.</PopupDesc>
            <ModalActions>
              <CancelButton onClick={() => setShowConfirm(false)} disabled={submitting}>
                Cancel
              </CancelButton>
              <ConfirmButton onClick={handleFinalSend} disabled={submitting}>
                {submitting ? "Sending..." : "Yes"}
              </ConfirmButton>
            </ModalActions>
          </ConfirmModal>
        </ConfirmBackdrop>
      )}
    </Backdrop>
  );
};

export default AlertsForm;

/* --- styles (기존 그대로, 아래 1개만 추가) --- */
const ErrorText = styled.div`
  color:#b91c1c; font-weight:700; font-size:13px; margin: 6px 0 10px;
`;


// 💅 스타일 컴포넌트 그대로 유지
const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;

const Modal = styled.div`
  width: 640px;
  background: #c7c7eaff;
  border-radius: 30px;
  padding: 48px 40px 40px 40px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
`;

const Brand = styled.div`
  display: flex;
  justify-content: center;
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 24px;
`;



const PurpleText = styled.span`
  color: #21213F;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: bold;
  color: #0f172a;
  margin-bottom: 6px;
`;

const Desc = styled.p`
  font-size: 15px;
  color: #475569;
  margin-bottom: 32px;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: bold;
  color: #344053;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #cfd4dc;
  font-size: 16px;
  background: #ffffff;
  box-sizing: border-box;
`;

const Textarea = styled.textarea`
  width: 100%;
  height: 120px;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid #cfd4dc;
  font-size: 16px;
  background: #ffffff;
  resize: none;
  box-sizing: border-box;
`;

const SendButton = styled.button`
  width: 100%;
  background: #21213F;
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
  padding: 16px 0;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  &:hover {
    background: #5b40df;
  }
`;

const ConfirmBackdrop = styled(Backdrop)``;

const ConfirmModal = styled.div`
  background: #fff;
  padding: 32px;
  border-radius: 16px;
  text-align: center;
  min-width: 360px;
`;

const PopupTitle = styled.h2`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
`;

const PopupDesc = styled.p`
  font-size: 14px;
  color: #667084;
  margin-bottom: 24px;
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 9999px;
  background: white;
  border: 1px solid #d0d5dd;
  color: #344054;
  font-weight: 600;
`;

const ConfirmButton = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 9999px;
  background: #21213F;
  border: none;
  color: white;
  font-weight: 600;
  cursor: pointer;
`;
