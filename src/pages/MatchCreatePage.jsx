// src/pages/AdminMatchCreatePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import api from "../api/api";

const Wrap = styled.div`padding: 24px;`;
const H1 = styled.h1`font-size: 20px; margin: 0 0 16px;`;
const Row = styled.div`display:flex; gap:12px; align-items:center; flex-wrap:wrap;`;
const Btn = styled.button`
  padding:10px 14px; border-radius:8px; border:1px solid #ddd; background:#111; color:#fff; cursor:pointer;
  &:disabled{opacity:.4; cursor:not-allowed;}
`;
const Input = styled.input`padding:8px 10px; border:1px solid #ccc; border-radius:8px;`;
const Select = styled.select`padding:8px 10px; border:1px solid #ccc; border-radius:8px;`;
const Card = styled.div`border:1px solid #eee; border-radius:12px; padding:16px; margin:12px 0;`;
const Table = styled.table`
  width:100%; border-collapse:collapse; font-size:14px;
  th, td { border-bottom:1px solid #eee; padding:8px; text-align:left; }
  th { background:#fafafa; }
`;

const Drawer = styled.div`
  position: fixed; right: 0; top: 0; width: 520px; height: 100vh;
  background: #fff; border-left: 1px solid #eaeaea; box-shadow: -4px 0 24px rgba(0,0,0,.06);
  transform: translateX(${p=>p.open?0:100}%); transition: transform .25s ease; z-index: 30; padding: 20px; overflow-y:auto;
`;
const ModalBg = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,.35); display:${p=>p.open?'block':'none'}; z-index: 40;
`;
const Modal = styled.div`
  position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%);
  width: 860px; max-height: 80vh; overflow: auto; background: #fff; border-radius: 12px; padding: 20px; z-index: 41;
`;

export default function MatchCreatePage(){
  const [showForm, setShowForm] = useState(false);

  // team search
  const [homeQuery, setHomeQuery] = useState("");
  const [awayQuery, setAwayQuery] = useState("");
  const [homeResults, setHomeResults] = useState([]);
  const [awayResults, setAwayResults] = useState([]);

  const [homeTeam, setHomeTeam] = useState(null);
  const [awayTeam, setAwayTeam] = useState(null); // {teamId, teamName} or {teamId:0, teamName:'미가입팀'}

  const [homeMembers, setHomeMembers] = useState([]);
  const [awayMembers, setAwayMembers] = useState([]);

  const [homeSelected, setHomeSelected] = useState({}); // userId -> {checked, uniformNum}
  const [awaySelected, setAwaySelected] = useState({});

  const [location, setLocation] = useState("");
  const [date, setDate] = useState(""); // yyyy-mm-dd
  const [time, setTime] = useState(""); // HH:mm

  const [submitting, setSubmitting] = useState(false);
  const [pendingList, setPendingList] = useState([]);

  const [openDetail, setOpenDetail] = useState(false);
  const [detail, setDetail] = useState(null); // 서버에서 받은 ScheduleDetailDto
  const [openEdit, setOpenEdit] = useState(false);

  const mapMemberAdmin = (m) => ({
  userId: m.userId ?? m.id,
  nickname: m.nickName ?? "",
  userName: m.realName ?? "",
})

  // 초기 '분석대기' 리스트
  useEffect(() => { reloadPending(); }, []);
  const reloadPending = async () => {
    const r = await api.get("/api/admin/schedules/pending?page=0&size=50");
    setPendingList(r.data.content || []);
  };

  // 팀 검색 (디바운스 간단)
  // AdminMatchCreatePage.jsx - 홈팀 검색 useEffect 부분 교체
useEffect(() => {
  const t = setTimeout(async () => {
    if (!homeQuery.trim()) { setHomeResults([]); return; }
    // ✅ 백엔드 컨트롤러 시그니처에 맞춤: SearchContent 파라미터명 주의
    const res = await api.get("/api/team/search", {
      params: { SearchContent: homeQuery }
    });
    // ApiResponse<T> 래퍼 → data.data 에 실제 배열이 들어있음
    setHomeResults(res.data?.data ?? []);
  }, 250);
  return () => clearTimeout(t);
}, [homeQuery]);


  // 원정팀 검색 useEffect 도 동일
useEffect(() => {
  const t = setTimeout(async () => {
    if (!awayQuery.trim()) { setAwayResults([]); return; }
    const res = await api.get("/api/team/search", {
      params: { SearchContent: awayQuery }
    });
    setAwayResults(res.data?.data ?? []);
  }, 250);
  return () => clearTimeout(t);
}, [awayQuery]);


  // 팀 선택 시 멤버 불러오기
  // 홈팀 멤버 로드
useEffect(() => {
  (async () => {
    if (!homeTeam?.teamId) { setHomeMembers([]); setHomeSelected({}); return; }
    try {
      // ✅ AdminTeamController: GET /api/admin/teams/{teamId}/members
      const res = await api.get(`/api/admin/teams/${homeTeam.teamId}/members`);
      const members = (res.data?.data ?? []).map(mapMemberAdmin);
      setHomeMembers(members);
      setHomeSelected({});
    } catch (e) {
      console.error(e);
      setHomeMembers([]);
    }
  })();
}, [homeTeam]);

// 원정팀 멤버 로드 (미가입팀이면 스킵)
useEffect(() => {
  (async () => {
    if (!awayTeam?.teamId || awayTeam.teamId === 0) {
      setAwayMembers([]); setAwaySelected({}); return;
    }
    try {
      const res = await api.get(`/api/admin/teams/${awayTeam.teamId}/members`);
      const members = (res.data?.data ?? []).map(mapMemberAdmin);
      setAwayMembers(members);
      setAwaySelected({});
    } catch (e) {
      console.error(e);
      setAwayMembers([]);
    }
  })();
}, [awayTeam]);

  // 선택 핸들러
  const toggleHome = (u) => {
    setHomeSelected(prev => {
      const cur = prev[u.userId] || {checked:false, uniformNum:""};
      const nxt = {...prev, [u.userId]: {...cur, checked: !cur.checked}};
      return nxt;
    });
  };
  const setHomeNum = (uId, val) => {
    setHomeSelected(prev => ({...prev, [uId]: {...(prev[uId]||{checked:true}), uniformNum: val}}));
  };

  const toggleAway = (u) => {
    setAwaySelected(prev => {
      const cur = prev[u.userId] || {checked:false, uniformNum:""};
      const nxt = {...prev, [u.userId]: {...cur, checked: !cur.checked}};
      return nxt;
    });
  };
  const setAwayNum = (uId, val) => {
    setAwaySelected(prev => ({...prev, [uId]: {...(prev[uId]||{checked:true}), uniformNum: val}}));
  };

  // 등번호 중복 체크(팀 내)
  const homeNumErrors = useMemo(() => {
    const used = {};
    for (const [uId, v] of Object.entries(homeSelected)) {
      if (!v.checked) continue;
      const num = String(v.uniformNum||"").trim();
      if (!num) continue;
      used[num] = (used[num]||0) + 1;
    }
    return Object.entries(used).filter(([,c]) => c>1).map(([n])=>n);
  }, [homeSelected]);

  const awayNumErrors = useMemo(() => {
    const used = {};
    for (const [uId, v] of Object.entries(awaySelected)) {
      if (!v.checked) continue;
      const num = String(v.uniformNum||"").trim();
      if (!num) continue;
      used[num] = (used[num]||0) + 1;
    }
    return Object.entries(used).filter(([,c]) => c>1).map(([n])=>n);
  }, [awaySelected]);

  // 제출
  const onSubmit = async () => {
    if (!homeTeam) { alert("홈 팀을 선택하세요."); return; }
    if (!location.trim()) { alert("경기 장소를 입력하세요."); return; }
    if (!date || !time) { alert("경기 일시를 입력하세요."); return; }

    if (homeNumErrors.length) { alert(`홈팀 등번호 중복: ${homeNumErrors.join(", ")}`); return; }
    if (awayTeam?.teamId && awayTeam.teamId !== 0 && awayNumErrors.length) {
      alert(`원정팀 등번호 중복: ${awayNumErrors.join(", ")}`); return;
    }

    const matchDate = `${date}T${time}:00`;  // 로컬 → 서버(LocalDateTime)로 전송
    const rosterHome = Object.entries(homeSelected)
      .filter(([,v]) => v.checked && v.uniformNum)
      .map(([userId, v]) => ({ userId: Number(userId), uniformNum: Number(v.uniformNum) }));

    const rosterAway = (awayTeam?.teamId && awayTeam.teamId !== 0)
      ? Object.entries(awaySelected)
          .filter(([,v]) => v.checked && v.uniformNum)
          .map(([userId, v]) => ({ userId: Number(userId), uniformNum: Number(v.uniformNum) }))
      : [];

    const payload = {
      homeTeamId: homeTeam.teamId,
      awayTeamId: awayTeam?.teamId ?? 0,
      location,
      matchDate, // ISO로 나감 → Spring이 LocalDateTime으로 파싱
      rosterHome,
      rosterAway
    };

    

    try {
      setSubmitting(true);
      const r = await api.post("/api/admin/schedules", payload);
      setSubmitting(false);
      alert(`등록 완료! scheduledId=${r.data.scheduledId}`);
      setShowForm(false);
      // 폼 리셋
      setHomeQuery(""); setAwayQuery("");
      setHomeTeam(null); setAwayTeam(null);
      setHomeMembers([]); setAwayMembers([]);
      setHomeSelected({}); setAwaySelected({});
      setLocation(""); setDate(""); setTime("");
      // 대기 리스트 갱신
      reloadPending();
    } catch(e){
      console.error(e);
      setSubmitting(false);
      alert("등록 실패. 콘솔을 확인하세요.");
    }
  };



  // 자세히 보기 핸들러
  const onView = async (scheduledId) => {
    const r = await api.get(`/api/admin/schedules/${scheduledId}`);
    const d = r.data?.data || r.data; // 래퍼 다양성 방어
    setDetail(d);
    setOpenDetail(true);
  };

  // 수정 열기: 상세를 먼저 로딩(필요 시)
  const onEdit = async (scheduledId) => {
    if (!detail || detail.scheduledId !== scheduledId) {
      await onView(scheduledId);
    }
    setOpenDetail(false);
    setOpenEdit(true);
  };

  // 상세 드로어 UI
  const DetailDrawer = () => (
    <Drawer open={openDetail}>
      <h3>매치 상세</h3>
      {!detail ? <div>로딩...</div> : (
        <>
          <div style={{marginBottom:8}}>scheduledId: {detail.scheduledId}</div>
          <div>일시: {String(detail.matchDate).replace('T',' ')}</div>
          <div>장소: {detail.location}</div>
          <div>홈팀: #{detail.homeTeamId} / 원정팀: {detail.awayTeamId===0 ? "미가입(0)" : `#${detail.awayTeamId}`}</div>
          <div>상태: {detail.status} / confirmed: {detail.confirmed}</div>

          <h4 style={{marginTop:16}}>홈 로스터</h4>
          <Table>
            <thead><tr><th>userId</th><th>닉네임</th><th>이름</th><th>등번호</th></tr></thead>
            <tbody>
              {detail.rosterHome?.map(r=>(
                <tr key={r.scheduledPlayerId}>
                  <td>{r.userId}</td><td>{r.nickname||""}</td><td>{r.userName||""}</td><td>{r.uniformNum}</td>
                </tr>
              ))}
              {!detail.rosterHome?.length && <tr><td colSpan={4}>-</td></tr>}
            </tbody>
          </Table>

          <h4 style={{marginTop:16}}>원정 로스터</h4>
          <Table>
            <thead><tr><th>userId</th><th>닉네임</th><th>이름</th><th>등번호</th></tr></thead>
            <tbody>
              {detail.awayTeamId!==0 ? (detail.rosterAway?.map(r=>(
                <tr key={r.scheduledPlayerId}>
                  <td>{r.userId}</td><td>{r.nickname||""}</td><td>{r.userName||""}</td><td>{r.uniformNum}</td>
                </tr>
              ))) : (<tr><td colSpan={4}>미가입팀</td></tr>)}
              {!detail.rosterAway?.length && detail.awayTeamId!==0 && <tr><td colSpan={4}>-</td></tr>}
            </tbody>
          </Table>

          <div style={{display:'flex', gap:8, marginTop:16}}>
            <Btn onClick={()=>setOpenDetail(false)}>닫기</Btn>
            <Btn onClick={()=>onEdit(detail.scheduledId)}>수정</Btn>
                          <Btn style={{marginLeft:6, background:'#b00020'}} onClick={()=>onDelete(detail.scheduledId)}>삭제</Btn>
                          <Btn style={{marginLeft:6}} onClick={()=>downloadExcel(detail.scheduledId)}>엑셀 Export</Btn>

          </div>
        </>
      )}
    </Drawer>
  );

  // ── 수정 모달 상태 ─────────────────────────────────────────
  const [editLocation, setEditLocation] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editAwayTeamId, setEditAwayTeamId] = useState(null);
  const [editHomeSel, setEditHomeSel] = useState({}); // userId -> uniformNum
  const [editAwaySel, setEditAwaySel] = useState({});

  useEffect(()=> {
    if (!openEdit || !detail) return;
    setEditLocation(detail.location || "");
    // 날짜/시간 분해
    const dt = String(detail.matchDate).replace(" ", "T");
    const [dPart, tPartRaw] = dt.split("T");
    const tPart = (tPartRaw||"").substring(0,5);
    setEditDate(dPart || "");
    setEditTime(tPart || "");
    setEditAwayTeamId(detail.awayTeamId);

    // 로스터 -> 맵
    const h = {};
    (detail.rosterHome||[]).forEach(r => { h[r.userId] = r.uniformNum; });
    setEditHomeSel(h);
    const a = {};
    (detail.rosterAway||[]).forEach(r => { a[r.userId] = r.uniformNum; });
    setEditAwaySel(a);
  }, [openEdit, detail]);

  const homeDup = useMemo(()=>{
    const used = {};
    Object.values(editHomeSel).forEach(v=>{
      if (v===null || v===undefined || v==="") return;
      const k = String(v);
      used[k] = (used[k]||0)+1;
    });
    return Object.entries(used).filter(([,c])=>c>1).map(([n])=>n);
  }, [editHomeSel]);

  const awayDup = useMemo(()=>{
    const used = {};
    Object.values(editAwaySel).forEach(v=>{
      if (v===null || v===undefined || v==="") return;
      const k = String(v);
      used[k] = (used[k]||0)+1;
    });
    return Object.entries(used).filter(([,c])=>c>1).map(([n])=>n);
  }, [editAwaySel]);

  const onSave = async () => {
    if (!detail) return;
    if (!editLocation.trim()) { alert("장소를 입력하세요."); return; }
    if (!editDate || !editTime) { alert("일시를 입력하세요."); return; }
    if (homeDup.length) { alert(`홈팀 등번호 중복: ${homeDup.join(", ")}`); return; }
    if (editAwayTeamId!==0 && awayDup.length) { alert(`원정팀 등번호 중복: ${awayDup.join(", ")}`); return; }

    // 전체 교체 페이로드
    const payload = {
      awayTeamId: editAwayTeamId, // 0 허용
      location: editLocation,
      matchDate: `${editDate}T${editTime}:00`, // 로컬 문자열로 전송(±9h 방지)
      rosterHome: Object.entries(editHomeSel)
        .filter(([,num]) => num!=="" && num!==null && num!==undefined)
        .map(([userId, num]) => ({ userId: Number(userId), uniformNum: Number(num) })),
      rosterAway: editAwayTeamId===0 ? [] :
        Object.entries(editAwaySel)
          .filter(([,num]) => num!=="" && num!==null && num!==undefined)
          .map(([userId, num]) => ({ userId: Number(userId), uniformNum: Number(num) })),
    };

    try {
      await api.put(`/api/admin/schedules/${detail.scheduledId}`, payload);
      alert("저장 완료");
      setOpenEdit(false);
      await reloadPending();
      await onView(detail.scheduledId); // 상세 재로딩
    } catch (e) {
      console.error(e);
      alert("저장 실패");
    }
  };

  const onDelete = async (scheduledId) => {
  if (!window.confirm(`정말 삭제하시겠어요? (scheduledId=${scheduledId})`)) return;
  try {
    await api.delete(`/api/admin/schedules/${scheduledId}`);
    // 로컬 리스트에서 제거
    setPendingList(prev => prev.filter(x => x.scheduledId !== scheduledId));
    // 상세/수정 열려 있으면 닫기
    setOpenDetail(false);
    setOpenEdit(false);
    alert("삭제 완료");
  } catch (e) {
    console.error(e);
    const msg = e?.response?.data?.message || e?.response?.data?.error || e.message;
    alert(`삭제 실패: ${msg}`);
  }
};


  const EditModal = () => (!openEdit ? null : (
    <>
      <ModalBg open={openEdit} onClick={()=>setOpenEdit(false)} />
      <Modal>
        <h3>매치 수정</h3>
        {!detail ? <div>로딩...</div> : (
          <>
            <Row>
              <div>
                <div>장소</div>
                <Input value={editLocation} onChange={(e)=>setEditLocation(e.target.value)} />
              </div>
              <div>
                <div>날짜/시간</div>
                <Row>
                  <Input type="date" value={editDate} onChange={(e)=>setEditDate(e.target.value)} />
                  <Input type="time" value={editTime} onChange={(e)=>setEditTime(e.target.value)} />
                </Row>
              </div>
              <div>
                <div>원정팀</div>
                <Row>
                  <Select value={editAwayTeamId ?? detail.awayTeamId}
                          onChange={(e)=>setEditAwayTeamId(Number(e.target.value))}>
                    {/* 간단히 현재 값만 보이게. 필요 시 검색 박스 붙이면 됨 */}
                    <option value={detail.awayTeamId}>
                      {detail.awayTeamId===0 ? "미가입팀(0)" : `#${detail.awayTeamId}`}
                    </option>
                    <option value={0}>미가입팀(0)</option>
                  </Select>
                </Row>
              </div>
            </Row>

            <h4 style={{marginTop:16}}>홈 로스터</h4>
            <Table>
              <thead><tr><th style={{width:140}}>userId</th><th>등번호</th></tr></thead>
              <tbody>
              {(detail.rosterHome||[]).map(r=>(
                <tr key={r.userId}>
                  <td>{r.userId} {r.nickname?`(${r.nickname})`:""}</td>
                  <td>
                    <Input type="number" min="0"
                           value={editHomeSel[r.userId] ?? ""}
                           onChange={(e)=>setEditHomeSel(p=>({...p,[r.userId]: e.target.value}))} />
                  </td>
                </tr>
              ))}
              </tbody>
            </Table>
            {homeDup.length>0 && <div style={{color:"#c00"}}>홈 등번호 중복: {homeDup.join(", ")}</div>}

            <h4 style={{marginTop:16}}>원정 로스터</h4>
            {editAwayTeamId===0 ? (
              <div style={{opacity:.7}}>미가입팀은 로스터가 비워집니다.</div>
            ) : (
              <>
                <Table>
                  <thead><tr><th style={{width:140}}>userId</th><th>등번호</th></tr></thead>
                  <tbody>
                  {(detail.rosterAway||[]).map(r=>(
                    <tr key={r.userId}>
                      <td>{r.userId} {r.nickname?`(${r.nickname})`:""}</td>
                      <td>
                        <Input type="number" min="0"
                               value={editAwaySel[r.userId] ?? ""}
                               onChange={(e)=>setEditAwaySel(p=>({...p,[r.userId]: e.target.value}))} />
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </Table>
                {awayDup.length>0 && <div style={{color:"#c00"}}>원정 등번호 중복: {awayDup.join(", ")}</div>}
              </>
            )}

            <Row style={{marginTop:16}}>
              <Btn onClick={()=>setOpenEdit(false)}>취소</Btn>
              <Btn onClick={onSave}>저장</Btn>
              <Btn style={{marginLeft:6, background:'#b00020'}} onClick={()=>onDelete(detail.scheduledId)}>삭제</Btn>
              <Btn style={{marginLeft:6}} onClick={()=>downloadExcel(detail.scheduledId)}>엑셀 Export</Btn>
            </Row>
          </>
        )}
      </Modal>
    </>
  ));

  // (파일 상단 임포트 그대로)

// ── 파일 내 함수들 위쪽 아무 곳에 추가 ─────────────────────────
const downloadExcel = async (scheduledId) => {
  try {
    const res = await api.get(`/api/admin/matches/${scheduledId}/export`, {
      responseType: "blob",
    });

    // 파일명 파싱 (백엔드가 Content-Disposition 내려줌)
    let filename = `match_export_${scheduledId}.xlsx`;
    const cd = res.headers?.["content-disposition"] || res.headers?.get?.("content-disposition");
    if (cd) {
      const m = cd.match(/filename="(.+?)"/i);
      if (m && m[1]) filename = decodeURIComponent(m[1]);
    }

    const blob = new Blob([res.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error(e);
    alert("엑셀 다운로드 중 오류가 발생했습니다.");
  }
};



  return (
    <Wrap>
      <H1>매치 등록</H1>
      <Row>
        <Btn onClick={()=>setShowForm(s=>!s)}>{showForm ? "폼 닫기" : "매치 등록"}</Btn>
      </Row>

      {showForm && (
        <Card>
          <h3>기본 정보</h3>
          <Row>
            <div>
              <div>홈 팀 검색</div>
              <Input placeholder="팀 이름"
                     value={homeQuery}
                     onChange={(e)=>setHomeQuery(e.target.value)} />
              <div>
                <Select onChange={(e)=>{
                  const idx = e.target.value;
                  if (idx==="") { setHomeTeam(null); return; }
                  setHomeTeam(homeResults[idx]);
                }}>
                  <option value="">검색 결과 선택</option>
                  {homeResults.map((t, i)=>(
                    <option key={t.teamId} value={i}>{t.teamName} (#{t.teamId})</option>
                  ))}
                </Select>
              </div>
              {homeTeam && <div>선택: {homeTeam.teamName} (#{homeTeam.teamId})</div>}
            </div>

            <div>
              <div>원정 팀 검색</div>
              <Input placeholder="팀 이름"
                     value={awayQuery}
                     onChange={(e)=>setAwayQuery(e.target.value)} />
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <Select onChange={(e)=>{
                  const idx = e.target.value;
                  if (idx==="") { setAwayTeam(null); return; }
                  setAwayTeam(awayResults[idx]);
                }}>
                  <option value="">검색 결과 선택</option>
                  {awayResults.map((t, i)=>(
                    <option key={t.teamId} value={i}>{t.teamName} (#{t.teamId})</option>
                  ))}
                </Select>
                <Btn type="button" onClick={()=>setAwayTeam({teamId:0, teamName:"미가입팀"})}>
                  미가입팀 선택
                </Btn>
              </div>
              {awayTeam && <div>선택: {awayTeam.teamName} (#{awayTeam.teamId})</div>}
            </div>

            <div>
              <div>장소</div>
              <Input placeholder="서울월드컵경기장"
                     value={location}
                     onChange={(e)=>setLocation(e.target.value)} />
            </div>

            <div>
              <div>날짜/시간</div>
              <Row>
                <Input type="date" value={date} onChange={(e)=>setDate(e.target.value)} />
                <Input type="time" value={time} onChange={(e)=>setTime(e.target.value)} />
              </Row>
            </div>
          </Row>

          <h3 style={{marginTop:16}}>홈 팀 명단</h3>
          <Table>
            <thead>
              <tr>
                <th style={{width:60}}>선택</th>
                <th>userId</th><th>닉네임</th><th>이름</th>
                <th style={{width:120}}>등번호</th>
              </tr>
            </thead>
            <tbody>
              {homeMembers.map(u=>(
                <tr key={u.userId}>
                  <td><input type="checkbox"
                             checked={!!homeSelected[u.userId]?.checked}
                             onChange={()=>toggleHome(u)} /></td>
                  <td>{u.userId}</td>
                  <td>{u.nickname}</td>
                  <td>{u.userName}</td>
                  <td>
                    <Input type="number" min="0" placeholder="예: 7"
                           value={homeSelected[u.userId]?.uniformNum ?? ""}
                           onChange={(e)=>setHomeNum(u.userId, e.target.value)} />
                  </td>
                </tr>
              ))}
              {homeMembers.length===0 && (
                <tr><td colSpan={5}>홈 팀을 선택하면 멤버가 나타납니다.</td></tr>
              )}
            </tbody>
          </Table>
          {homeNumErrors.length>0 && (
            <div style={{color:"#c00", marginTop:6}}>
              홈팀 등번호 중복: {homeNumErrors.join(", ")}
            </div>
          )}

          <h3 style={{marginTop:16}}>원정 팀 명단</h3>
          {awayTeam?.teamId === 0 ? (
            <div style={{opacity:.7}}>미가입팀은 명단 입력을 건너뜁니다.</div>
          ) : (
            <Table>
              <thead>
              <tr>
                <th style={{width:60}}>선택</th>
                <th>userId</th><th>닉네임</th><th>이름</th>
                <th style={{width:120}}>등번호</th>
              </tr>
              </thead>
              <tbody>
              {awayMembers.map(u=>(
                <tr key={u.userId}>
                  <td><input type="checkbox"
                             checked={!!awaySelected[u.userId]?.checked}
                             onChange={()=>toggleAway(u)} /></td>
                  <td>{u.userId}</td>
                  <td>{u.nickname}</td>
                  <td>{u.userName}</td>
                  <td>
                    <Input type="number" min="0" placeholder="예: 10"
                           value={awaySelected[u.userId]?.uniformNum ?? ""}
                           onChange={(e)=>setAwayNum(u.userId, e.target.value)} />
                  </td>
                </tr>
              ))}
              {awayMembers.length===0 && (
                <tr><td colSpan={5}>원정 팀을 선택하면 멤버가 나타납니다.</td></tr>
              )}
              </tbody>
            </Table>
          )}
          {awayTeam?.teamId !== 0 && awayNumErrors.length>0 && (
            <div style={{color:"#c00", marginTop:6}}>
              원정팀 등번호 중복: {awayNumErrors.join(", ")}
            </div>
          )}

          <Row style={{marginTop:16}}>
            <Btn onClick={onSubmit} disabled={submitting}>
              {submitting ? "등록 중..." : "폼 작성 완료 → 매치 등록"}
            </Btn>
          </Row>
        </Card>
      )}

      <h3 style={{marginTop:24}}>분석되지 않은 매치</h3>
      <Card>
        <Table>
          <thead>
            <tr>
                 <th>scheduledId</th><th>일시</th><th>장소</th>
              <th>홈팀</th><th>원정팀</th><th>상태</th><th>엑셀 파일로 변환</th><th>액션</th>
            </tr>
          </thead>
          <tbody>
            {pendingList.map(m => (
              <tr key={m.scheduledId}>
                <td>{m.scheduledId}</td>
                <td>{String(m.matchDate).replace('T',' ')}</td>
                <td>{m.location}</td>
                <td>{m.homeTeamName}(#{m.homeTeamId})</td>
                <td>{m.awayTeamId===0 ? "미가입팀(0)" : `${m.awayTeamName}(#${m.awayTeamId})`}</td>
                <td>{m.status}</td>
                <td>
                  <Btn onClick={() => downloadExcel(m.scheduledId)}>Export</Btn>
                  </td>
                <td>
                  <Btn onClick={()=>onView(m.scheduledId)}>자세히</Btn>
                  <Btn style={{marginLeft:6}} onClick={()=>onEdit(m.scheduledId)}>수정</Btn>
                  <Btn style={{marginLeft:6, background:'#b00020'}} onClick={()=>onDelete(m.scheduledId)}>삭제</Btn>
                </td>
              </tr>
            ))}
            {pendingList.length===0 && (
              <tr><td colSpan={7}>아직 등록된 ‘분석대기’ 매치가 없습니다.</td></tr>
            )}
          </tbody>
        </Table>
      </Card>
      <Card>⁙ 엑셀 파일로 변환한 후, 해당 엑셀에 매치 정보를 입력하여 활용하세요. </Card>
      <DetailDrawer />
      <EditModal />
    </Wrap>
  );
}

