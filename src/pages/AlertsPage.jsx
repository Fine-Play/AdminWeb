import React, { useEffect, useState } from "react";
import styled from "styled-components";
import api from "../api/api";
import AlertsForm from "../components/AlertsForm";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // 🔽 상세 모달 상태
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/api/admin/notices", { params: { page: 0, size: 1000 } });
      if (res.data?.success) {
        setNotifications(res.data.data); // NoticeSummaryDto[]
      } else {
        alert("공지 불러오기 실패: " + (res.data?.message || ""));
      }
    } catch (error) {
      console.error("공지 조회 에러:", error);
    }
  };

  const handleSend = (newNotification) => {
    setNotifications((prev) => [newNotification, ...prev]);
  };

  // 🔽 상세 조회
  const openDetail = async (row) => {
    const id = row?.id ?? row?.noticeId; // 서버 리스트 필드명 어느 쪽이든 대응
    if (!id) return;
    setShowDetail(true);
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/admin/notices/${id}`);
      // 백엔드: ResponseEntity<AdminResponseDto<?>> 이므로 success/data 구조 가정
      if (res.data?.success) {
        setDetail(res.data.data); // NoticeDetailDto
      } else {
        setDetailError(res.data?.message || "상세 조회 실패");
      }
    } catch (e) {
      setDetailError("상세 조회 중 오류가 발생했습니다.");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setShowDetail(false);
    setDetail(null);
    setDetailError("");
  };

  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  const currentData = notifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <Wrapper>
        <Top>
          <Title>공지 관리</Title>
          <SendButton onClick={() => setShowForm(true)}>공지 전송하기</SendButton>
        </Top>

        <Table>
          <thead>
            <tr>
              <Th style={{ width: 160 }}>AUTHOR</Th>
              <Th>TITLE</Th>
              <Th style={{ width: 220 }}>DATE</Th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((n, index) => (
              <Row key={index} onClick={() => openDetail(n)} title="클릭하여 상세 보기">
                <Td>{n.authorNickName || n.authorId || "-"}</Td>
                {/* 🔽 제목은 시각적으로 링크처럼 */}
                <Td>
                  <TitleLink type="button" onClick={(e) => { e.stopPropagation(); openDetail(n); }}>
                    {n.title}
                  </TitleLink>
                </Td>
                <Td>{formatDate(n.createdAt)}</Td>
              </Row>
            ))}
          </tbody>
        </Table>

        {totalPages > 1 && (
          <Pagination>
            <PageButton onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
              ◀
            </PageButton>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <PageButton key={num} onClick={() => setCurrentPage(num)} active={num === currentPage}>
                {num}
              </PageButton>
            ))}
            <PageButton onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              ▶
            </PageButton>
          </Pagination>
        )}
      </Wrapper>

      {showForm && <AlertsForm onClose={() => setShowForm(false)} onSend={handleSend} />}

      {/* 🔽 상세 모달 */}
      {showDetail && (
        <ModalBackdrop onClick={closeDetail}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <PopupTitle>공지 상세</PopupTitle>

            {detailLoading && <PopupMessage>불러오는 중…</PopupMessage>}
            {!!detailError && <PopupMessage style={{ color: "#d92d20" }}>{detailError}</PopupMessage>}

            {detail && (
              <DetailWrap>
                <DetailRow>
                  <DetailLabel>제목</DetailLabel>
                  <DetailValue>{detail.title || "-"}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>작성자</DetailLabel>
                  <DetailValue>{detail.authorNickName || detail.authorId || "-"}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>작성일</DetailLabel>
                  <DetailValue>{formatDate(detail.createdAt)}</DetailValue>
                </DetailRow>
                <DetailRow>
                  <DetailLabel>내용</DetailLabel>
                  <DetailValuePre>{detail.content || "-"}</DetailValuePre>
                </DetailRow>

                {/* 첨부가 있다면(배열 가정) */}
                {Array.isArray(detail.attachments) && detail.attachments.length > 0 && (
                  <DetailRow>
                    <DetailLabel>첨부</DetailLabel>
                    <DetailValue>
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {detail.attachments.map((f, i) => (
                          <li key={i}>
                            <a href={f.url || "#"} target="_blank" rel="noreferrer">
                              {f.name || f.url}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </DetailValue>
                  </DetailRow>
                )}
              </DetailWrap>
            )}

            <ModalActions style={{ marginTop: 24 }}>
              <ConfirmButton onClick={closeDetail}>닫기</ConfirmButton>
            </ModalActions>
          </ModalBox>
        </ModalBackdrop>
      )}
    </>
  );
}

function formatDate(isoish) {
  if (!isoish) return "-";
  const hasTZ = /[zZ]|[+\-]\d{2}:\d{2}$/.test(isoish);
  let d = new Date(isoish);
  if (!hasTZ) {
    // 서버가 TZ 없는 UTC 문자열을 내려보낼 때만 -9h 보정
    d = new Date(d.getTime() - 9 * 60 * 60 * 1000);
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(d);
}

// 스타일
const Wrapper = styled.div`
  padding: 40px 80px;
  background: #fff;
`;
const Top = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;
const Title = styled.h1`
  font-size: 36px;
  font-weight: bold;
`;
const SendButton = styled.button`
  background: #ee9804ff;
  color: #21213F;
  font-weight: bold;
  padding: 12px 18px;
  border-radius: 48px;
  border: none;
  cursor: pointer;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;
const Th = styled.th`
  background: #21213F;
  color: white;
  font-weight: bold;
  padding: 12px;
  text-align: left;
`;
const Row = styled.tr`
  cursor: pointer;
  &:hover td {
    background: #f7f7fa;
  }
`;
const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #ddd;
  font-size: 14px;
  color: #242c31;
`;
const TitleLink = styled.button`
  padding: 0;
  margin: 0;
  border: none;
  background: transparent;
  text-decoration: underline;
  color: #1f3aed;
  cursor: pointer;
  font-size: 14px;
  &:hover { opacity: .8; }
`;
const Pagination = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 8px;
`;
const PageButton = styled.button`
  padding: 6px 12px;
  border: none;
  background: ${(props) => (props.active ? "#21213F" : "#eee")};
  color: ${(props) => (props.active ? "white" : "#333")};
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  &:hover { background: #21213F; color: white; }
  &:disabled { background: #ccc; cursor: not-allowed; }
`;
const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(52, 64, 83, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;
const ModalBox = styled.div`
  background: #fff;
  padding: 32px;
  border-radius: 12px;
  min-width: 560px;
  max-width: 860px;
  max-height: 80vh;
  overflow: auto;
  text-align: left;
`;
const PopupTitle = styled.h2`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 12px;
`;
const PopupMessage = styled.p`
  color: #667084;
  font-size: 14px;
  margin-bottom: 12px;
`;
const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;
const ConfirmButton = styled.button`
  padding: 10px 16px;
  border-radius: 9999px;
  background: #21213F;
  border: none;
  color: white;
  font-weight: 600;
  cursor: pointer;
`;

// 상세 레이아웃
const DetailWrap = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  row-gap: 10px;
  column-gap: 16px;
`;
const DetailRow = styled.div`
  display: contents;
`;
const DetailLabel = styled.div`
  color: #667084;
  font-weight: 600;
`;
const DetailValue = styled.div``;
const DetailValuePre = styled.pre`
  white-space: pre-wrap;
  margin: 0;
`;
