// src/pages/AdminMatchImportPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import api from "../api/api";

const Wrap = styled.div`padding:24px;`;
const H1 = styled.h1`font-size:20px; margin:0 0 16px;`;
const Row = styled.div`display:flex; gap:12px; align-items:center; flex-wrap:wrap;`;
const Btn = styled.button`
  padding:10px 14px; border-radius:8px; border:1px solid #ddd; background:#111; color:#fff; cursor:pointer;
  &:disabled{opacity:.4; cursor:not-allowed;}
`;
const LightBtn = styled(Btn)`background:#fff; color:#111;`;
const Card = styled.div`border:1px solid #eee; border-radius:12px; padding:16px; margin:12px 0;`;
const Table = styled.table`
  width:100%; border-collapse:collapse; font-size:14px;
  th, td { border-bottom:1px solid #eee; padding:8px; text-align:left; }
  th { background:#fafafa; }
`;
const Drop = styled.label`
  display:flex; align-items:center; justify-content:center; text-align:center;
  height:140px; border:2px dashed ${p=>p.active?'#111':'#ccc'}; border-radius:12px; cursor:pointer;
  background:${p=>p.active?'#fafafa':'#fff'};
`;

export default function AdminMatchImportPage() {
  // 업로드 상태
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 서버 응답(요약)
  const [summary, setSummary] = useState(null);
  const [createdIds, setCreatedIds] = useState([]);
  const [errors, setErrors] = useState([]); // [{scheduledId, sheet, row, code, message}]

  // 에러 스케줄 목록(“문제 발생”)
  const [errPage, setErrPage] = useState(0);
  const [errSize, setErrSize] = useState(20);
  const [errList, setErrList] = useState([]);
  const [errTotal, setErrTotal] = useState(0);
  const totalErrPages = useMemo(() => Math.ceil(errTotal / errSize), [errTotal, errSize]);

  // 템플릿 URL (필요 시 환경변수/상수로 교체)

  // ================== 파일 드롭/선택 ==================
  const inputRef = useRef();
  const onFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
  };
  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };
  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
  const onDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); };

  // ================== 업로드 호출 ==================
  const onUpload = async () => {
    if (!file) { alert("엑셀 파일을 선택하세요 (.xlsx)"); return; }
    const form = new FormData();
    form.append("file", file);

    try {
      setUploading(true);
      setSummary(null);
      setErrors([]);
      setCreatedIds([]);

      // POST /api/admin/matches/import (multipart/form-data)
      const res = await api.post("/api/admin/matches/import", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // 응답 래퍼 대비
      const data = res.data?.data || res.data;
      const created = data?.created ?? 0;
      const deletedSchedules = data?.deletedSchedules ?? 0;
      const failed = data?.failed ?? 0;
      const createdMatchIds = data?.createdMatchIds ?? data?.createdIds ?? [];
      const errs = data?.errors ?? [];

      setSummary({ created, deletedSchedules, failed });
      setCreatedIds(createdMatchIds);
      setErrors(errs);

      // 에러 스케줄 목록 새로고침
      loadErrorSchedules(0, errSize);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.message || "업로드 실패";
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  // ================== 에러 스케줄 목록 ==================
  const loadErrorSchedules = async (page = errPage, size = errSize) => {
    try {
      const r = await api.get("/api/admin/schedules/errors", { params: { page, size } });
      // 페이지 응답 형태 가변 방지
      // 백엔드가 Page<ScheduledMatch> 직접 리턴하면 content/totalElements,
      // 또는 래퍼(Map.of("content",..., "total",...)) 형태일 수 있음
      const body = r.data?.data || r.data;
      const content = body?.content ?? body?.items ?? [];
      const total = body?.total ?? body?.totalElements ?? 0;
      setErrList(content);
      setErrTotal(total);
      setErrPage(page);
      setErrSize(size);
    } catch (e) {
      console.error(e);
      setErrList([]);
      setErrTotal(0);
    }
  };
  useEffect(() => { loadErrorSchedules(0, errSize); /* 최초 로딩 */ }, []); // eslint-disable-line

  const onReset = async (scheduledId) => {
    if (!window.confirm(`에러 상태를 SCHEDULED로 되돌릴까요? (scheduledId=${scheduledId})`)) return;
    try {
      await api.patch(`/api/admin/schedules/${scheduledId}/reset`);
      alert("리셋 완료");
      loadErrorSchedules(errPage, errSize);
    } catch (e) {
      console.error(e);
      alert("리셋 실패");
    }
  };
  const onDelete = async (scheduledId) => {
    if (!window.confirm(`삭제 하시겠어요? (scheduledId=${scheduledId})`)) return;
    try {
      await api.delete(`/api/admin/importsschedules/${scheduledId}`);
      alert("삭제 완료");
      loadErrorSchedules(errPage, errSize);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.response?.data?.error || e.message;
      alert(`삭제 실패: ${msg}`);
    }
  };

  // ================== 유틸: CSV 다운로드 ==================
  const downloadErrorCsv = () => {
    if (!errors?.length) { alert("다운로드할 에러가 없습니다."); return; }
    const header = ["scheduledId","sheet","row","code","message"];
    const toCell = (v) => {
      if (v == null) return "";
      const s = String(v).replace(/"/g,'""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const lines = [
      header.join(","),
      ...errors.map(e => [e.scheduledId, e.sheet, e.row, e.code, e.message].map(toCell).join(","))
    ].join("\n");

    const blob = new Blob([lines], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import_errors_${new Date().toISOString().slice(0,19).replace(/[:T]/g,"-")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // ================== 렌더 ==================
  return (
    <Wrap>
      <H1>매치 엑셀 업로드</H1>

      <Card>
        <Row style={{justifyContent:"space-between"}}>
          <div>
            <div style={{fontWeight:600, marginBottom:8}}>엑셀 템플릿</div>
            <div style={{fontSize:13, color:"#666"}}>
              모든 시트에 <code>scheduledId</code> 컬럼이 포함되어야 하며, 동일 <code>scheduledId</code>끼리 한 경기로 묶입니다.
            </div>
          </div>
        </Row>

        <div style={{height:12}} />

        <Drop
          active={dragActive}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          htmlFor="excel-file"
          title="엑셀 파일을 드래그하거나 클릭해서 선택"
        >
          {file
            ? <div>
                <div style={{fontWeight:600}}>{file.name}</div>
                <div style={{fontSize:12, color:"#666"}}>{(file.size/1024/1024).toFixed(2)} MB</div>
              </div>
            : <div style={{color:"#777"}}>여기로 드래그하거나 클릭해서 .xlsx 파일을 선택하세요</div>}
        </Drop>
        <input
          id="excel-file"
          ref={inputRef}
          onChange={onFileSelect}
          style={{display:"none"}}
          type="file"
          accept=".xlsx"
        />

        <Row style={{marginTop:12}}>
          <Btn onClick={onUpload} disabled={!file || uploading}>
            {uploading ? "업로드 중..." : "업로드 & 임포트 실행"}
          </Btn>
          {errors?.length > 0 && (
            <LightBtn onClick={downloadErrorCsv}>에러 CSV 다운로드</LightBtn>
          )}
        </Row>
      </Card>

      {/* 결과 요약 */}
      {summary && (
        <Card>
          <h3>결과 요약</h3>
          <Row>
            <div>생성된 경기 수: <b>{summary.created}</b></div>
            <div>삭제된 스케줄 수: <b>{summary.deletedSchedules}</b></div>
            <div>실패 수: <b style={{color: summary.failed ? "#b00020" : "inherit"}}>{summary.failed}</b></div>
          </Row>

          {createdIds?.length > 0 && (
            <>
              <div style={{marginTop:12, fontWeight:600}}>생성된 matchId</div>
              <div style={{fontSize:13}}>{createdIds.join(", ")}</div>
            </>
          )}

          {errors?.length > 0 && (
            <>
              <div style={{marginTop:16, fontWeight:600}}>실패 상세</div>
              <Table>
                <thead>
                  <tr>
                    <th>scheduledId</th><th>sheet</th><th>row</th><th>code</th><th>message</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((e, i)=>(
                    <tr key={i}>
                      <td>{e.scheduledId}</td>
                      <td>{e.sheet || "-"}</td>
                      <td>{e.row ?? "-"}</td>
                      <td>{e.code}</td>
                      <td style={{whiteSpace:"pre-wrap"}}>{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </>
          )}
        </Card>
      )}

      {/* 문제 발생 섹션 */}
      <h3 style={{marginTop:24}}>분석 중 문제 발생한 매치</h3>
      <Card>
        <Row style={{justifyContent:"space-between", marginBottom:8}}>
          <div style={{fontSize:13, color:"#666"}}>status=ERROR</div>
          <div style={{fontSize:13, color:"#666"}}>총 {errTotal}건</div>
        </Row>
        <Table>
          <thead>
            <tr>
              <th>scheduledId</th>
              <th>일시</th>
              <th>장소</th>
              <th>홈팀</th>
              <th>원정팀</th>
              <th>에러코드</th>
              <th>메시지</th>
              <th>최종시도</th>
              <th>시도횟수</th>
              <th>액션</th>
            </tr>
          </thead>
          <tbody>
            {errList.map(m=>(
              <tr key={m.scheduledId}>
                <td>{m.scheduledId}</td>
                <td>{String(m.matchDate||"").replace("T"," ")}</td>
                <td>{m.location}</td>
                <td>{m.homeTeamName ? `${m.homeTeamName}(#${m.homeTeamId})` : `#${m.homeTeamId}`}</td>
                <td>{m.awayTeamId===0 ? "미가입팀(0)" : (m.awayTeamName ? `${m.awayTeamName}(#${m.awayTeamId})` : `#${m.awayTeamId}`)}</td>
                <td>{m.lastErrorCode || "-"}</td>
                <td style={{whiteSpace:"pre-wrap"}}>{m.lastErrorMsg || "-"}</td>
                <td>{m.lastAttemptAt ? String(m.lastAttemptAt).replace("T"," ") : "-"}</td>
                <td>{m.attempts ?? "-"}</td>
                <td>
                  <Btn onClick={()=>onReset(m.scheduledId)}>리셋</Btn>
                  <Btn style={{marginLeft:6, background:"#b00020"}} onClick={()=>onDelete(m.scheduledId)}>삭제</Btn>
                </td>
              </tr>
            ))}
            {!errList.length && (
              <tr><td colSpan={10}>현재 에러 상태의 스케줄이 없습니다.</td></tr>
            )}
          </tbody>
        </Table>

        {/* 페이지네이션 */}
        <Row style={{justifyContent:"space-between", marginTop:12}}>
          <div>
            <label>페이지 크기: </label>
            <select
              value={errSize}
              onChange={(e)=>loadErrorSchedules(0, Number(e.target.value))}
            >
              {[10,20,50,100].map(n=> <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <Row>
            <LightBtn disabled={errPage<=0} onClick={()=>loadErrorSchedules(errPage-1, errSize)}>이전</LightBtn>
            <div style={{padding:"8px 6px"}}>{errPage+1} / {Math.max(totalErrPages,1)}</div>
            <LightBtn disabled={errPage+1>=totalErrPages} onClick={()=>loadErrorSchedules(errPage+1, errSize)}>다음</LightBtn>
          </Row>
        </Row>
      </Card>

      <Card style={{color:"#666"}}>
        <div>⁙ 엑셀 업로드 성공 시 해당 <code>scheduledId</code>의 스케줄은 DB에서 하드딜리트 됩니다.</div>
        <div>⁙ 실패 시 스케줄은 <code>ERROR</code>로 전환되며, 위 목록에서 리셋/삭제할 수 있습니다.</div>
      </Card>
    </Wrap>
  );
}
