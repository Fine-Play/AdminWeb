import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import api from "../api/api";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 10;

const TeamPage = () => {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);         // UI 1-based
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("teamId,asc"); // 서버 규격과 동일
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // 디바운스된 검색어
  const [debouncedQ, setDebouncedQ] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/teams", {
        params: {
          q: debouncedQ,
          page: page - 1,     // 서버 0-based
          size: PAGE_SIZE,
          sort,
        },
      });

      if (res.data?.success) {
        const pr = res.data.data; // PageResponse
        setRows(pr.content ?? []);
        setTotalElements(pr.totalElements ?? 0);
        setTotalPages(Math.max(1, pr.totalPages ?? 1));

        // 현재 페이지가 마지막보다 크면 보정
        if (page > (pr.totalPages ?? 1)) setPage(Math.max(1, pr.totalPages ?? 1));
      } else {
        console.error("데이터 조회 실패:", res.data?.message);
      }
    } catch (err) {
      console.error("API 요청 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  // q / page / sort 변경 시 재조회
  useEffect(() => { fetchTeams(); /* eslint-disable-next-line */ }, [debouncedQ, page, sort]);

  const handleSortChange = (e) => {
    setSort(e.target.value);
    setPage(1);
  };

  return (
    <Wrapper>
      <TitleRow>
        <Title>팀 관리</Title>

        <RightBox>
          <Select value={sort} onChange={handleSortChange} title="정렬">
            <option value="teamId,asc">ID ↑</option>
            <option value="teamId,desc">ID ↓</option>
            <option value="teamName,asc">팀명 ↑</option>
            <option value="teamName,desc">팀명 ↓</option>
            <option value="memberNum,desc">인원 ↓</option>
            <option value="memberNum,asc">인원 ↑</option>
            <option value="totalWin,desc">승수 ↓</option>
            <option value="totalWin,asc">승수 ↑</option>
          </Select>

          <SearchBar>
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="팀명/지역/유형/팀장 검색"
            />
            {q && <ClearBtn onClick={() => setQ("")}>지우기</ClearBtn>}
          </SearchBar>
        </RightBox>
      </TitleRow>

      <Muted>{`총 ${totalElements}팀`}{debouncedQ ? ` · 검색: "${debouncedQ}"` : ""}</Muted>

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th style={{ width: 80 }}>ID</Th>
                <Th>팀명</Th>
                <Th style={{ width: 110 }}>유형</Th>
                <Th style={{ width: 140 }}>지역</Th>
                <Th style={{ width: 120 }}>팀장</Th>
                <Th style={{ width: 90 }}>인원</Th>
                <Th style={{ width: 140 }}>전적(W/D/L)</Th>
                <Th style={{ width: 120 }}>자세히</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.teamId}>
                  <Td>{t.teamId}</Td>
                  <Td>{t.teamName}</Td>
                  <Td>{t.teamType || "-"}</Td>
                  <Td>{t.region || "-"}</Td>
                  <Td>
                    {t.teamLeaderNickName
                      ? `${t.teamLeaderNickName} (#${t.teamLeaderId})`
                      : "-"}
                  </Td>
                  <Td>{t.memberNum ?? 0}</Td>
                  <Td>
                    {(t.totalWin ?? 0)}/{(t.totalDraw ?? 0)}/{(t.totalLose ?? 0)}
                  </Td>
              
                  <Td>
                    <SmallButton onClick={() => navigate(`/teams/${t.teamId}`)}>
                      세부 정보
                    </SmallButton>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Pagination>
            <PageButton
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              이전
            </PageButton>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <PageNumber
                key={num}
                isActive={num === page}
                onClick={() => setPage(num)}
              >
                {num}
              </PageNumber>
            ))}
            <PageButton
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              다음
            </PageButton>
          </Pagination>
        </>
      )}
    </Wrapper>
  );
};

export default TeamPage;

/* 스타일 */
const Wrapper = styled.div`padding:40px 80px;background:#fff;`;
const TitleRow = styled.div`display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;`;
const RightBox = styled.div`display:flex;gap:8px;align-items:center;`;
const Title = styled.h1`font-size:32px;font-weight:bold;`;
const Muted = styled.div`color:#6b7280;margin:4px 0 12px;`;

const SearchBar = styled.div`
  display:flex;align-items:center;gap:8px;
  input{padding:8px 10px;border:1px solid #e5e7eb;border-radius:8px;}
`;
const ClearBtn = styled.button`
  background:#f3f4f6;border:1px solid #e5e7eb;padding:6px 10px;border-radius:8px;cursor:pointer;
  &:hover{background:#e5e7eb;}
`;
const Select = styled.select`
  padding:8px 10px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;
`;

const Table = styled.table`width:100%;border-collapse:collapse;`;
const Th = styled.th`
  background:#21213f;color:#fff;font-weight:bold;padding:12px;text-align:left;border-bottom:2px solid #1b1b33;
`;
const Td = styled.td`padding:12px;border-bottom:1px solid #eee;font-size:14px;color:#242c31;`;

const Pagination = styled.div`margin-top:24px;display:flex;justify-content:center;gap:8px;`;
const PageButton = styled.button`
  padding:6px 12px;border:none;background:#eee;color:#333;font-weight:bold;border-radius:4px;cursor:pointer;
  &:disabled{background:#ccc;cursor:not-allowed;}
`;
const PageNumber = styled.button`
  padding:6px 12px;border:none;border-radius:4px;cursor:pointer;
  background:${p=>p.isActive ? "#21213f" : "#eee"};
  color:${p=>p.isActive ? "white" : "#333"};
`;
const Thumb = styled.img`
  width:36px;height:36px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;
`;
const SmallButton = styled.button`
  background:#f3f4f6;border:1px solid #e5e7eb;padding:6px 10px;border-radius:8px;color:#111827;
  font-weight:600;font-size:12px;cursor:pointer;&:hover{background:#e5e7eb;}
`;
