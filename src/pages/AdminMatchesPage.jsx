// src/pages/AdminMatchesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import api from "../api/api";

// ── UI atoms (너 스타일에 맞춤) ────────────────────────────────────────────────
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
  position: fixed; right: 0; top: 0; width: 980px; height: 100vh;
  background: #fff; border-left: 1px solid #eaeaea; box-shadow: -4px 0 24px rgba(0,0,0,.06);
  transform: translateX(${p=>p.open?0:100}%); transition: transform .25s ease; z-index: 30; padding: 20px; overflow-y:auto;
`;
const Section = styled.section`margin-top:18px;`;

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────

const resultLabel = (m) => {
  if (m.result === -1) return "무";
  if (m.result === 0) return "예외";
  if (m.result === m.homeTeamId) return "홈승";
  if (m.result === m.awayTeamId) return "원정승";
  return String(m.result);
};


  const toUtcDate = (raw) => {
  if (!raw) return null;
  const s = String(raw).replace(" ", "T");
  const hasTZ = /Z|[+-]\d{2}:\d{2}$/.test(s);
  return new Date(hasTZ ? s : `${s}Z`);
};

// UTC Date를 'Asia/Seoul'로 포맷 (YYYY-MM-DD HH:mm)
const formatKST = (d) => {
  if (!d) return "";
  const f = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Seoul",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(d);
  // sv-SE → "YYYY-MM-DD HH:mm:ss" 형태인데 초가 없는 환경도 있음 → 공백 기준 split
  return f.replace(",", "");
};

// 리스트 표시에 사용
const fmtDateTime = (v) => formatKST(toUtcDate(v));

function FormationImageUploader({ matchId, type, imageUrl, onUploaded }) {
  const [preview, setPreview] = useState(imageUrl || "");
  const [loading, setLoading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.post(`/api/matches/${matchId}/formation-image/${type}`, formData);
      // 업로드 후 최신 이미지 GET
      const r = await api.get(`/api/matches/${matchId}/formation-image/${type}`);
      const url = r?.data?.url || "";
      setPreview(url);
      onUploaded?.(url);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPreview(imageUrl || "");
  }, [imageUrl]);

  return (
    <div style={{marginBottom:12}}>
      <div style={{fontWeight:600, marginBottom:4}}>{type === "home" ? "HOME" : "AWAY"} 포메이션 이미지</div>
      {preview && (
        <div style={{marginBottom:8}}>
          <img src={preview} alt={`${type} formation`} style={{maxWidth:320, maxHeight:180, borderRadius:8, border:"1px solid #eee"}} />
        </div>
      )}
      <label style={{display:"inline-block"}}>
        <Input type="file" accept="image/*" style={{width:"auto"}} disabled={loading} onChange={handleFile} />
      </label>
      {loading && <span style={{marginLeft:8, color:"#888"}}>업로드 중...</span>}
    </div>
  );
}


 function DetailDrawer({ open, detail, edit, report, scorers, players, groupedPlayers,
  setOpenDetail, setEdit, setReport, setScorers, setPlayers,
  resultLabel, saveCore, saveReport, saveScorers, savePlayers, onDelete }) {
   const [homeFormationImg, setHomeFormationImg] = useState("");
  const [awayFormationImg, setAwayFormationImg] = useState("");

  useEffect(() => {
    if (!detail?.matchId) return;
    (async () => {
      try {
        const homeRes = await api.get(`/api/matches/${detail.matchId}/formation-image/home`);
        setHomeFormationImg(homeRes?.data?.url || "");
      } catch {}
      try {
        const awayRes = await api.get(`/api/matches/${detail.matchId}/formation-image/away`);
        setAwayFormationImg(awayRes?.data?.url || "");
      } catch {}
    })();
  }, [detail?.matchId]);

   if (!detail) return null;
   return (
     <Drawer open={open}>
      <Row style={{justifyContent:"space-between", alignItems:"start"}}>
        <div>
          <h3 style={{margin:"4px 0 8px"}}>매치 상세 #{detail.matchId}</h3>
          <div style={{opacity:.7}}>결과: {resultLabel(detail)}</div>
        </div>
        <div style={{display:"flex", gap:8}}>
          <Btn onClick={()=>setOpenDetail(false)}>닫기</Btn>
          <Btn onClick={()=>onDelete(detail.matchId)} style={{background:"#b00020"}}>삭제</Btn>
        </div>
      </Row>

      

      {/* 개요 */}
      <Section>
        <h4>개요</h4>
        <Row>
          <div>
            <div>일시</div>
            <Row>
              <Input type="date" value={edit.date} onChange={e=>setEdit(s=>({...s, date:e.target.value}))} />
              <Input type="time" value={edit.time} onChange={e=>setEdit(s=>({...s, time:e.target.value}))} />
            </Row>
          </div>
          <div>
            <div>장소</div>
            <Input value={edit.location} onChange={e=>setEdit(s=>({...s, location:e.target.value}))} />
          </div>
          <div>
            <div>홈팀</div>
            <Row>
              <Input disabled value={`${detail.homeTeamName ?? ""} (#${edit.homeTeamId})`} />
              <Input type="number" style={{width:96}} value={edit.homeScore}
                     onChange={e=>setEdit(s=>({...s, homeScore:e.target.value}))} />
              <Input placeholder="예: 4-3-3" value={edit.homeFormation}
                     onChange={e=>setEdit(s=>({...s, homeFormation:e.target.value}))} />
            </Row>
          </div>
          <div>
            <div>원정팀</div>
            <Row>
              <Input disabled value={`${detail.awayTeamName ?? ""} (#${edit.awayTeamId})`} />
              <Input type="number" style={{width:96}} value={edit.awayScore}
                     onChange={e=>setEdit(s=>({...s, awayScore:e.target.value}))} />
              <Input placeholder="예: 3-5-2" value={edit.awayFormation}
                     onChange={e=>setEdit(s=>({...s, awayFormation:e.target.value}))} />
            </Row>
          </div>
        </Row>
        <Row style={{marginTop:10}}>
          <Btn onClick={saveCore}>개요 저장</Btn>
        </Row>
      </Section>
<Section>
        <h4>매치 포메이션 이미지</h4>
        <Row>
          <FormationImageUploader
            matchId={detail.matchId}
            type="home"
            imageUrl={homeFormationImg}
            onUploaded={setHomeFormationImg}
          />
          <FormationImageUploader
            matchId={detail.matchId}
            type="away"
            imageUrl={awayFormationImg}
            onUploaded={setAwayFormationImg}
          />
        </Row>
      </Section>
      {/* 리포트 */}
      <Section>
        <h4>리포트</h4>
        {!report ? <div>로딩...</div> : (
          <>
            <Row>
              <Card>
                <div style={{fontWeight:600, marginBottom:6}}>HOME</div>
                <Row>
                  {["homeGoals","homeShots","homeShotsOnTarget","homePossession","homePasses","homeTackles","homeFouls","homeCards","homeRatings"].map(k=>(
                    <div key={k} style={{display:"flex", flexDirection:"column"}}>
                      <div>{k.replace("home","")}</div>
                      <Input type="number" style={{width:100}} value={report[k]??0} onChange={e=>setReport(r=>({...r, [k]: +e.target.value||0}))}/>
                    </div>
                  ))}
                </Row>
              </Card>
              <Card>
                <div style={{fontWeight:600, marginBottom:6}}>AWAY</div>
                <Row>
                  {["awayGoals","awayShots","awayShotsOnTarget","awayPossession","awayPasses","awayTackles","awayFouls","awayCards","awayRatings"].map(k=>(
                    <div key={k} style={{display:"flex", flexDirection:"column"}}>
                      <div>{k.replace("away","")}</div>
                      <Input type="number" style={{width:100}} value={report[k]??0} onChange={e=>setReport(r=>({...r, [k]: +e.target.value||0}))}/>
                    </div>
                  ))}
                </Row>
              </Card>
            </Row>
            <Row style={{marginTop:10}}>
              <Btn onClick={saveReport}>리포트 저장</Btn>
            </Row>
          </>
        )}
      </Section>

      {/* 득점자 */}
      <Section>
        <h4>득점자</h4>
        <Row>
          <Btn onClick={()=>setScorers(prev=>[...prev, { id:null, userName:"", time:"", isHome:true }])}>행 추가</Btn>
        </Row>
        <Table style={{marginTop:8}}>
          <thead>
            <tr><th>#</th><th>팀</th><th>선수명</th><th>시간</th><th>액션</th></tr>
          </thead>
          <tbody>
            {scorers.map((s, i)=>(
              <tr key={i}>
                <td>{i+1}</td>
                <td>
                  <Select value={s.isHome ? "home" : "away"} onChange={e=>{
                    const v = e.target.value==="home";
                    setScorers(list=>list.map((x,idx)=>idx===i?{...x, isHome:v}:x));
                  }}>
                    <option value="home">HOME</option>
                    <option value="away">AWAY</option>
                  </Select>
                </td>
                <td><Input value={s.userName||""} onChange={e=>setScorers(list=>list.map((x,idx)=>idx===i?{...x, userName:e.target.value}:x))} /></td>
                <td><Input placeholder="예: 12' 또는 90+2'" value={s.time||""} onChange={e=>setScorers(list=>list.map((x,idx)=>idx===i?{...x, time:e.target.value}:x))} /></td>
                <td>
                  <Btn onClick={()=>setScorers(list=>list.filter((_,idx)=>idx!==i))} style={{background:"#b00020"}}>삭제</Btn>
                </td>
              </tr>
            ))}
            {scorers.length===0 && <tr><td colSpan={5}>-</td></tr>}
          </tbody>
        </Table>
        <Row style={{marginTop:10}}>
          <Btn onClick={saveScorers}>득점자 저장</Btn>
        </Row>
      </Section>

      {/* 선수 스탯 */}
      <Section>
        <h4>선수 스탯</h4>
        <Row style={{opacity:.7, fontSize:13}}>숫자 칸은 빈칸 → 0으로 처리됩니다.</Row>
        {groupedPlayers.map((g, gi)=>(
          <Card key={gi}>
            <div style={{fontWeight:600, marginBottom:6}}>{g.group}</div>


{g.rows.map((p, i)=>(
  <Card key={p.userId} style={{marginBottom:16}}>
    <Row style={{fontWeight:600, marginBottom:8}}>
      <div>userId: {p.userId}</div>
      <div>이름: {p.userName||"-"}</div>
      <div>포지션: {p.position||"-"}</div>
      <div>
        매치포지션: <Select value={p.matchPosition||""}
          onChange={e=>setPlayers(list=>list.map(x=>x.userId===p.userId?{...x, matchPosition:e.target.value}:x))}>
          <option value="">-</option>
          <option value="FW">FW</option>
          <option value="MF">MF</option>
          <option value="DF">DF</option>
        </Select>
      </div>
      <div>run: <Input type="number" min="0" value={p.runTime??""} onChange={e=>setPlayers(list=>list.map(x=>x.userId===p.userId?{...x, runTime:e.target.value}:x))}/></div>
      <div>G: <Input type="number" min="0" value={p.score??""} onChange={e=>setPlayers(list=>list.map(x=>x.userId===p.userId?{...x, score:e.target.value}:x))}/></div>
      <div>A: <Input type="number" min="0" value={p.assist??""} onChange={e=>setPlayers(list=>list.map(x=>x.userId===p.userId?{...x, assist:e.target.value}:x))}/></div>
      <div>rating: <Input type="number" min="0" step="0.1" value={p.rating??""} onChange={e=>setPlayers(list=>list.map(x=>x.userId===p.userId?{...x, rating:e.target.value}:x))}/></div>
    </Row>
    <Row style={{flexWrap:"wrap", gap:12}}>
      {["SPD","PAS","PAC","SHO","DRV","DEC","DRI","TAC","BLD","CRO","HED","FST","ACT","OFF","TEC","COP"].map(k=>(
        <div key={k} style={{minWidth:80}}>
          <div style={{fontSize:12, opacity:.7}}>{k}</div>
          <Input type="number" min="0" value={p[k]??""}
            onChange={e=>{
              const v = e.target.value;
              setPlayers(list=>list.map(x=>x.userId===p.userId?{...x, [k]: v}:x));
            }}/>
        </div>
      ))}
    </Row>
  </Card>
))}

          </Card>
        ))}
        <Row style={{marginTop:10, marginBottom:30}}>
          <Btn onClick={savePlayers}>선수 스탯 저장</Btn>
        </Row>
      </Section>
    </Drawer>
  );
}

// ── 페이지 컴포넌트 ──────────────────────────────────────────────────────────
export default function AdminMatchesPage(){
  // 리스트 상태
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  // 상세 상태
  const [openDetail, setOpenDetail] = useState(false);
  const [detail, setDetail] = useState(null);



  // 개요 수정 상태
  const [edit, setEdit] = useState({
    location: "", date: "", time: "",
    homeTeamId: null, awayTeamId: null,
    homeScore: 0, awayScore: 0,
    homeFormation: "", awayFormation: "",
  });

  // 리포트/득점자/선수 스탯 편집 로컬 상태
  const [report, setReport] = useState(null);
  const [scorers, setScorers] = useState([]);
  const [players, setPlayers] = useState([]);
   

   const groupedPlayers = useMemo(() => {
    if (!players?.length) return [];
    const withTeamName = players.some(p => !!p.teamName);
    if (!withTeamName) return [{ group: "전체", rows: players }];
    const map = {};
    players.forEach(p => {
      const key = p.teamName || "미지정";
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return Object.entries(map).map(([group, rows]) => ({ group, rows }));
  }, [players]);

  // ── 리스트 로드 ────────────────────────────────────────────────────────────
  useEffect(()=>{ (async()=>{
    setLoading(true);
    try {
      const r = await api.get("/api/admin/matches", { params: { page, size }});
      setItems(r.data?.content ?? r.data?.data?.content ?? []);
      setTotalPages(r.data?.totalPages ?? r.data?.data?.totalPages ?? 0);
    } finally { setLoading(false); }
  })(); }, [page, size]);

  const reloadRow = async (matchId) => {
    // 저장 후 리스트 일부만 갱신하고 싶으면 여기서 detail 재호출→리스트 반영 로직 작성 가능(간단히 전체 리로드 권장)
    const r = await api.get("/api/admin/matches", { params: { page, size }});
    setItems(r.data?.content ?? []);
    setTotalPages(r.data?.totalPages ?? 0);
  };

  // ── 상세 로드 ──────────────────────────────────────────────────────────────
  const openMatch = async (matchId) => {
    const r = await api.get(`/api/admin/matches/${matchId}/detail`);
    const d = r.data?.data || r.data;
    setDetail(d);

 

    // ✅ KST(+09:00)로 강제 표시 (편집폼에 넣을 값)
  const kstStr = formatKST(toUtcDate(d.matchDate)); // "YYYY-MM-DD HH:mm"
  const [dPart, tPart] = (kstStr || "").split(" ");

  setEdit({
    location: d.location ?? "",
    date: dPart || "",
    time: (tPart || "").substring(0, 5),
    homeTeamId: d.homeTeamId,
    awayTeamId: d.awayTeamId,
    homeScore: d.homeScore ?? 0,
    awayScore: d.awayScore ?? 0,
    homeFormation: d.homeFormation ?? "",
    awayFormation: d.awayFormation ?? "",
  });
    // 리포트/득점자/플레이어 로컬 복제
    setReport({ ...(d.report || {
      homeGoals:0,homeShots:0,homeShotsOnTarget:0,homePossession:0,homePasses:0,homeTackles:0,homeFouls:0,homeCards:0,homeRatings:0,
      awayGoals:0,awayShots:0,awayShotsOnTarget:0,awayPossession:0,awayPasses:0,awayTackles:0,awayFouls:0,awayCards:0,awayRatings:0
    })});
    setScorers([...(d.scorers||[])]);
    setPlayers([...(d.players||[])]);

    setOpenDetail(true);
  };

  // ── 저장 액션들 ────────────────────────────────────────────────────────────
  const saveCore = async () => {
    if (!detail) return;
    if (!edit.location.trim()) return alert("장소를 입력하세요.");
    if (!edit.date || !edit.time) return alert("일시를 입력하세요.");

    const payload = {
      matchDate: `${edit.date}T${edit.time}:00`,
      homeTeamId: edit.homeTeamId,
      homeScore: Number(edit.homeScore),
      homeFormation: edit.homeFormation,
      awayTeamId: edit.awayTeamId,
      awayScore: Number(edit.awayScore),
      awayFormation: edit.awayFormation,
    };
    await api.patch(`/api/admin/matches/${detail.matchId}`, payload);
    await openMatch(detail.matchId); // result/전적 반영 재조회
    await reloadRow(detail.matchId);
    alert("개요 저장 완료 (result/팀 전적 재반영)");
  };

  const saveReport = async () => {
    if (!detail) return;
    await api.put(`/api/admin/matches/${detail.matchId}/report`, report);
    alert("리포트 저장 완료");
  };

  const saveScorers = async () => {
    if (!detail) return;
    // 간단 검증: time은 문자열 허용(예: "12'", "90+2'")
    const payload = scorers.map(s=>({
      id: s.id, userName: s.userName||"", time: s.time||"", isHome: !!s.isHome
    }));
    await api.put(`/api/admin/matches/${detail.matchId}/scorers`, payload);
    alert("득점자 저장 완료");
  };

  const savePlayers = async () => {
    if (!detail) return;
    // 숫자 필드는 Number 변환
    const payload = players.map(p=>({
      userId: p.userId,
      userName: p.userName, position: p.position,
      matchPosition: p.matchPosition,
      SPD:+p.SPD||0, PAS:+p.PAS||0, PAC:+p.PAC||0, SHO:+p.SHO||0, DRV:+p.DRV||0,
      DEC:+p.DEC||0, DRI:+p.DRI||0, TAC:+p.TAC||0, BLD:+p.BLD||0, CRO:+p.CRO||0, HED:+p.HED||0,
      FST:+p.FST||0, ACT:+p.ACT||0, OFF:+p.OFF||0, TEC:+p.TEC||0, COP:+p.COP||0,
      runTime:+p.runTime||0, score:+p.score||0, assist:+p.assist||0, rating:+p.rating||0
    }));
    await api.put(`/api/admin/matches/${detail.matchId}/players`, payload);
    alert("선수 스탯 저장 완료 (사용자/팀 OVR 재계산)");
  };

  const onDelete = async (matchId) => {
    if (!window.confirm(`정말 삭제할까요? (matchId=${matchId})\n리포트/득점자/선수스탯 모두 함께 삭제됩니다.`)) return;
    await api.delete(`/api/admin/matches/${matchId}`);
    setItems(prev => prev.filter(x=>x.matchId!==matchId));
    setOpenDetail(false);
    alert("삭제 완료");
  };


  

  // ── 상세 Drawer UI ─────────────────────────────────────────────────────────


  // ── 렌더 ───────────────────────────────────────────────────────────────────
  return (
    <Wrap>
      <H1>분석 완료된 매치</H1>
      <Row>
        <div>페이지 크기</div>
        <Select value={size} onChange={e=>{ setSize(Number(e.target.value)); setPage(0); }}>
          {[10,20,30,50].map(n=><option key={n} value={n}>{n}</option>)}
        </Select>
        <Btn disabled={page===0} onClick={()=>setPage(p=>p-1)}>Prev</Btn>
        <div>{page+1} / {Math.max(totalPages,1)}</div>
        <Btn disabled={page+1>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</Btn>
      </Row>

      <Card>
        {loading ? <div>로딩 중…</div> : (
          <Table>
            <thead>
              <tr>
                <th style={{width:88}}>matchId</th>
                <th style={{width:160}}>일시</th>
                <th>장소</th>
                <th>홈</th>
                <th style={{width:88}}>스코어</th>
                <th>원정</th>
                <th style={{width:92}}>결과</th>
                <th style={{width:220}}>액션</th>
              </tr>
            </thead>
            <tbody>
              {items.map(m=>(
                <tr key={m.matchId}>
                  <td>{m.matchId}</td>
                  <td>{fmtDateTime(m.matchDate)}</td>
                  <td>{m.location}</td>
                  <td>{m.homeTeamName ?? `#${m.homeTeamId}`}</td>
                  <td>{m.homeScore} : {m.awayScore}</td>
                  <td>{m.awayTeamName ?? `#${m.awayTeamId}`}</td>
                  <td>{resultLabel(m)}</td>
                  <td>
                    <Row>
                      <Btn onClick={()=>openMatch(m.matchId)}>자세히/수정</Btn>
                      <Btn style={{background:"#b00020"}} onClick={()=>onDelete(m.matchId)}>삭제</Btn>
                    </Row>
                  </td>
                </tr>
              ))}
              {items.length===0 && (
                <tr><td colSpan={8}>표시할 매치가 없습니다.</td></tr>
              )}
            </tbody>
          </Table>
        )}
      </Card>

          <DetailDrawer
      open={openDetail}
      detail={detail}
      edit={edit}
      report={report}
      scorers={scorers}
      players={players}
      groupedPlayers={groupedPlayers}
      setOpenDetail={setOpenDetail}
      setEdit={setEdit}
      setReport={setReport}
      setScorers={setScorers}
      setPlayers={setPlayers}
      resultLabel={resultLabel}
      saveCore={saveCore}
      saveReport={saveReport}
      saveScorers={saveScorers}
      savePlayers={savePlayers}
      onDelete={onDelete}
    />
    </Wrap>
  );
}
