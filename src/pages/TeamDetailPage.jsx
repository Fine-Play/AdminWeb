import React, { useEffect, useState } from "react";
import styled from "styled-components";
import api from "../api/api";
import { useParams, useNavigate } from "react-router-dom";
import UploadField from "../uploader/UploadField";

/** Admin Team Detail Page (요약↔상세를 한 모달에서 전환) */
const TeamDetailPage = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();

  const [detail, setDetail] = useState(null);
  const [teamImgUrl, setTeamImgUrl] = useState(""); 

  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState("stat"); // stat | members | matches | requests | edit
  const [loading, setLoading] = useState(true);

  // matches
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);

  // API 응답 구조에 맞춘 상태:
  // /full → 풍부한 정보(날짜, 장소, 득점자, 라인업 등)
  const [matchFull, setMatchFull] = useState(null);
  // /detail → 요약 팀스탯(home/away, 팀명)
  const [matchSlim, setMatchSlim] = useState(null);

  const [view, setView] = useState(null); // 'summary' | 'detail' | null
  const [modalLoading, setModalLoading] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dRes, mRes, rRes] = await Promise.all([
        api.get(`/api/admin/teams/${teamId}`),
        api.get(`/api/admin/teams/${teamId}/members`),
        api.get(`/api/admin/teams/${teamId}/join-requests`),
      ]);

      if (dRes.data?.success) {setDetail(dRes.data.data);
        setTeamImgUrl(dRes.data?.data?.teamImg ?? "");
      }
      if (mRes.data?.success) setMembers(mRes.data.data || []);
      if (rRes.data?.success) setRequests(rRes.data.data || []);
    } catch (e) {
      console.error(e);
      alert("팀 데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  //   const fetchTeamImage = async () => {
  //   try {
  //       const r = await api.get(`/api/team/${teamId}/profile-image`);
  //  const url = r?.data?.url || "";  // ✅ 응답이 {url: "..."}
  //  setTeamImgUrl(url);
  //   } catch (e) {
  //     console.warn("팀 이미지 불러오기 실패", e);
  //     setTeamImgUrl("");
  //   }
  // };


  useEffect(() => {
    if (!teamId) return;
    loadAll();
      // fetchTeamImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const reloadDetailOnly = async () => {
    try {
      const dRes = await api.get(`/api/admin/teams/${teamId}`);
      if (dRes.data?.success) setDetail(dRes.data.data);
       setTeamImgUrl(dRes.data?.data?.teamImgUrl ?? "");
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecount = async () => {
    try {
      const res = await api.post(`/api/admin/teams/${teamId}/recount`);
      if (res.data?.success) {
        await reloadDetailOnly();
        alert("멤버 수를 재계산했습니다.");
      } else {
        throw new Error(res.data?.message || "recount 실패");
      }
    } catch (e) {
      console.error(e);
      alert("재계산에 실패했습니다.");
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm("이 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    try {
      const res = await api.delete(`/api/admin/teams/${teamId}`);
      if (res.data?.success) {
        alert("팀이 삭제되었습니다.");
        navigate("/admin/teams");
      } else {
        throw new Error(res.data?.message || "삭제 실패");
      }
    } catch (e) {
      console.error(e);
      alert("팀 삭제에 실패했습니다.");
    }
  };

  const handleKick = async (userId) => {
    if (!window.confirm("해당 팀원을 강제 탈퇴시키겠습니까?")) return;
    try {
      const res = await api.delete(`/api/admin/teams/${teamId}/members/${userId}`);
      if (res.data?.success) {
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
        await reloadDetailOnly();
      } else {
        const msg = res.data?.message;
        if (msg === "CANNOT_KICK_LEADER_SET_ANOTHER_LEADER_FIRST") {
          alert("팀장은 먼저 다른 사람에게 위임해야 합니다.");
        } else {
          alert("강제 탈퇴 실패");
        }
      }
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message;
      if (msg === "CANNOT_KICK_LEADER_SET_ANOTHER_LEADER_FIRST") {
        alert("팀장은 먼저 다른 사람에게 위임해야 합니다.");
      } else {
        alert("강제 탈퇴 실패");
      }
    }
  };

  const handleSetLeader = async (userId) => {
    if (!window.confirm("이 사용자에게 팀장을 지정할까요?")) return;
    try {
      const res = await api.post(`/api/admin/teams/${teamId}/leader/${userId}`);
      if (res.data?.success) {
        await loadAll();
      } else {
        const msg = res.data?.message;
        if (msg === "NEW_LEADER_NOT_IN_TEAM") alert("해당 사용자는 팀원이 아닙니다.");
        else alert("팀장 지정 실패");
      }
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message;
      if (msg === "NEW_LEADER_NOT_IN_TEAM") alert("해당 사용자는 팀원이 아닙니다.");
      else alert("팀장 지정 실패");
    }
  };

  const handleAccept = async (userId) => {
    try {
      const res = await api.post(`/api/admin/teams/${teamId}/join-requests/${userId}/accept`);
      if (res.data?.success) {
        const result = res.data.data; // "JOIN_ACCEPTED" | "ALREADY_IN_TEAM"
        setRequests((prev) => prev.filter((r) => r.userId !== userId));
        const [mRes, dRes] = await Promise.all([
          api.get(`/api/admin/teams/${teamId}/members`),
          api.get(`/api/admin/teams/${teamId}`),
        ]);
        if (mRes.data?.success) setMembers(mRes.data.data || []);
        if (dRes.data?.success) setDetail(dRes.data.data);
        if (result === "ALREADY_IN_TEAM") alert("이미 팀 소속이라 요청을 정리했습니다.");
      } else {
        throw new Error(res.data?.message || "승인 실패");
      }
    } catch (e) {
      console.error(e);
      alert("승인에 실패했습니다.");
    }
  };

  const handleReject = async (userId) => {
    try {
      const res = await api.post(`/api/admin/teams/${teamId}/join-requests/${userId}/reject`);
      if (res.data?.success) {
        setRequests((prev) => prev.filter((r) => r.userId !== userId));
      } else {
        throw new Error(res.data?.message || "거절 실패");
      }
    } catch (e) {
      console.error(e);
      alert("거절에 실패했습니다.");
    }
  };

  const handleUpdate = async (payload) => {
    try {
      const res = await api.patch(`/api/admin/teams/${teamId}`, payload);
    if (res.data?.success) {
        const dRes = await api.get(`/api/admin/teams/${teamId}`);
        if (dRes.data?.success) setDetail(dRes.data.data);
        setTab("stat");
        alert("팀 정보가 수정되었습니다.");
      } else {
        const msg = res.data?.message;
        if (msg === "DUPLICATE_TEAM_NAME") alert("중복 팀명입니다.");
        else alert("수정 실패");
      }
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message;
      if (msg === "DUPLICATE_TEAM_NAME") alert("중복 팀명입니다.");
      else alert("수정 실패");
    }
  };

  // ===== matches =====
  useEffect(() => {
    if (tab === "matches") loadAllMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, teamId]);

  const loadAllMatches = async () => {
    try {
      const res = await api.get(`/api/admin/teams/${teamId}/matches`);
      if (res.data?.success && res.data?.data?.matchResultList) {
        setMatches(res.data.data.matchResultList);
        return;
      }
      if (res.data?.matchResultList) {
        setMatches(res.data.matchResultList);
        return;
      }
      if (Array.isArray(res.data)) {
        setMatches(res.data);
        return;
      }
      setMatches([]);
    } catch (e) {
      console.error(e);
      alert("경기 목록을 불러오지 못했습니다.");
    }
  };

  // 요약(/full) 열기: 날짜/장소/스코어/득점자/라인업 모두 포함
  const openMatchSummary = async (matchId) => {
    try {
      setSelectedMatch(matchId);
      setView("summary");
      setModalLoading(true);
      setMatchFull(null);
      setMatchSlim(null);

      const res = await api.get(`/api/admin/teams/${teamId}/matches/${matchId}/full`);
      const payload = res.data?.success ? res.data.data : res.data;
      setMatchFull(payload);
    } catch (e) {
      console.error(e);
      alert("경기 요약을 불러오지 못했습니다.");
    } finally {
      setModalLoading(false);
    }
  };

  // 상세(/detail)로 전환: 팀스탯(home/away)의 수치 중심
  const openMatchDetail = async (matchId) => {
    try {
      setView("detail");
      setModalLoading(true);

      const res = await api.get(`/api/admin/teams/${teamId}/matches/${matchId}/detail`);
      const payload = res.data?.success ? res.data.data : res.data;
      setMatchSlim(payload);
    } catch (e) {
      console.error(e);
      alert("경기 상세를 불러오지 못했습니다.");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedMatch(null);
    setMatchFull(null);
    setMatchSlim(null);
    setView(null);
    setModalLoading(false);
  };

  if (loading) return <Wrapper><p>불러오는 중...</p></Wrapper>;
  if (!detail) return <Wrapper><p>팀 정보를 불러오지 못했습니다.</p></Wrapper>;

  const region = detail.region || "";
  const regionSplit = region.split(" ");
  const region1 = regionSplit[0] || "";
  const region2 = regionSplit[1] || "";

  return (
    <Wrapper>
      <HeaderRow>
        <div>
          <Back onClick={() => navigate(-1)}>← 돌아가기</Back>
          <Title>{detail.teamName}</Title>
          <Muted>{detail.region} · {detail.teamType} · 인원 {detail.memberNum ?? 0}명</Muted>
        </div>
         {teamImgUrl && (
          <img
            src={teamImgUrl}
            alt="team"
            style={{ width: 48, height: 48, borderRadius: 10, objectFit: "cover", border: "1px solid #eee" }}
          />
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={handleRecount}>Recount</Button>
          <DangerButton onClick={handleDeleteTeam}>팀 삭제</DangerButton>
        </div>
      </HeaderRow>

      <Tabs>
        <TabButton active={tab==="stat"} onClick={()=>setTab("stat")}>스탯</TabButton>
        <TabButton active={tab==="members"} onClick={()=>setTab("members")}>팀원</TabButton>
        <TabButton active={tab==="matches"} onClick={()=>setTab("matches")}>경기</TabButton>
        <TabButton active={tab==="requests"} onClick={()=>setTab("requests")}>가입 요청</TabButton>
        <TabButton active={tab==="edit"} onClick={()=>setTab("edit")}>팀 정보 수정</TabButton>
      </Tabs>

      {tab === "stat" && (
        <Card>
          <h2>팀 스탯</h2>
          <ul style={{ lineHeight: "1.8" }}>
            <li><b>OVR</b>: {detail.teamOVR}</li>
            <li><b>FW</b> {detail.fw} / <b>MF</b> {detail.mf} / <b>DF</b> {detail.df}</li>
            <li><b>SPD</b> {detail.spd} / <b>PAS</b> {detail.pas} / <b>PAC</b> {detail.pac}</li>
          </ul>
          <h3 style={{ marginTop: 16 }}>전적</h3>
          <div>{detail.totalWin}승 {detail.totalDraw}무 {detail.totalLose}패</div>
          <div style={{ marginTop: 12 }}>팀장 ID: {detail.leaderId ?? "-"}</div>
        </Card>
      )}

      {tab === "members" && (
        <Card>
          <h2>팀원 관리</h2>
          <Table>
            <thead>
              <tr>
                <Th>유저ID</Th>
                <Th>닉네임</Th>
                <Th>포지션</Th>
                <Th>OVR</Th>
                <Th>리더</Th>
                <Th>액션</Th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.userId}>
                  <Td>{m.userId}</Td>
                  <Td>{m.nickName}</Td>
                  <Td>{m.position || "-"}</Td>
                  <Td>{m.ovr}</Td>
                  <Td>{m.leader ? "✔" : ""}</Td>
                  <Td>
                    <RowActions>
                      {!m.leader && (
                        <>
                          <SmallButton onClick={() => handleKick(m.userId)}>강제 탈퇴</SmallButton>
                          <SmallButton onClick={() => handleSetLeader(m.userId)}>팀장 지정</SmallButton>
                        </>
                      )}
                    </RowActions>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {tab === "matches" && (
        <Card>
          <h2>전체 경기</h2>
          {matches.length === 0 ? (
            <Muted>경기 데이터가 없습니다.</Muted>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>날짜</Th>
                  <Th>홈</Th>
                  <Th>스코어</Th>
                  <Th>어웨이</Th>
                  <Th>결과</Th>
                  <Th>상세</Th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m.matchId}>
                    <Td>{m.date}</Td>
                    <Td>{m.hometeam}</Td>
                    <Td>{m.homeScore} : {m.awayScore}</Td>
                    <Td>{m.awayteam}</Td>
                    <Td>{m.result}</Td>
                    <Td>
                      <SmallButton onClick={() => openMatchSummary(m.matchId)}>보기</SmallButton>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {tab === "requests" && (
        <Card>
          <h2>가입 요청</h2>
          {requests.length === 0 ? (
            <Muted>대기 중인 요청이 없습니다.</Muted>
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>유저ID</Th>
                  <Th>닉네임</Th>
                  <Th>포지션</Th>
                  <Th>OVR</Th>
                  <Th>액션</Th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.userId}>
                    <Td>{r.userId}</Td>
                    <Td>{r.nickName}</Td>
                    <Td>{r.position || "-"}</Td>
                    <Td>{r.ovr}</Td>
                    <Td>
                      <RowActions>
                        <SmallButton onClick={() => handleAccept(r.userId)}>승인</SmallButton>
                        <SmallButton onClick={() => handleReject(r.userId)}>거절</SmallButton>
                      </RowActions>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {tab === "edit" && (
        <Card>
          <h2>팀 정보 수정</h2>
          <EditForm
          teamId={teamId}
            defaultName={detail.teamName || ""}
            defaultRegion1={region1}
            defaultRegion2={region2}
            defaultType={detail.teamType || ""}
           defaultImg={teamImgUrl}     
            onSubmit={handleUpdate}
           
         // 업로드 응답 url을 그대로 헤더 프리뷰에 반영
        onImageChanged={async (urlFromUpload) => {
  if (urlFromUpload) {
     setTeamImgUrl(urlFromUpload);
   } else {
     // 업로드 성공했지만 URL을 안 내려주는 BE → 상세 재조회로 최신 teamImg 반영
     await reloadDetailOnly();
   }
 }}
          />
        </Card>
      )}

      {/* ===== 단일 모달: /full 요약 ↔ /detail 상세 ===== */}
      {selectedMatch && (
        <Modal2 onClose={closeModal}>
          {modalLoading && <div style={{ padding: 20 }}>불러오는 중...</div>}

          {!modalLoading && view === "summary" && matchFull && (
            <>
              <h3 style={{ marginTop: 0 }}>
                {matchFull.homeTeamName} {matchFull.homeScore} : {matchFull.awayScore} {matchFull.awayTeamName}
              </h3>
              <Muted>{matchFull.matchDate} · {matchFull.location}</Muted>

              <div style={{ marginBottom: 12, color: "#6b7280" }}>팀 스탯 요약</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <DetailCard title="Home" data={matchFull.home} />
                <DetailCard title="Away" data={matchFull.away} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <ScorerCard title="Home Scorers" list={matchFull.homeScorers} />
                <ScorerCard title="Away Scorers" list={matchFull.awayScorers} />
              </div>

              {/* (선택) 요약에서도 라인업을 조금 보여주고 싶다면 일부만 표시 가능 */}
              {/* <Muted style={{ marginTop: 8 }}>라인업은 상세에서 전체 확인</Muted> */}

              <div style={{ marginTop: 16, textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Button onClick={() => openMatchDetail(selectedMatch)}>더보기</Button>
                <PrimaryButton onClick={closeModal}>닫기</PrimaryButton>
              </div>
            </>
          )}

          {!modalLoading && view === "detail" && matchFull && (
            <>
              <h3 style={{ marginTop: 0 }}>
                {matchFull.homeTeamName} {matchFull.homeScore} : {matchFull.awayScore} {matchFull.awayTeamName}
              </h3>
              <Muted>{matchFull.matchDate} · {matchFull.location}</Muted>

              <div style={{ marginBottom: 12, color: "#6b7280" }}>팀 스탯 상세</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* 스탯은 /detail에서 온 값이 더 최신일 수 있으므로 우선 사용, 없으면 /full fallback */}
                <DetailCard title="Home" data={matchSlim?.home || matchFull.home} />
                <DetailCard title="Away" data={matchSlim?.away || matchFull.away} />
              </div>

              <div style={{ marginTop: 12 }}>
                <b>Formation</b>: {matchFull.formation || "-"}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <ScorerCard title="Home Scorers" list={matchFull.homeScorers} />
                <ScorerCard title="Away Scorers" list={matchFull.awayScorers} />
              </div>

              <h4 style={{ marginTop: 16 }}>라인업</h4>
              {(!matchFull?.lineup || matchFull.lineup.length === 0) ? (
                <Muted>라인업 데이터가 없습니다.</Muted>
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>유저ID</Th>
                      <Th>닉네임</Th>
                      <Th>포지션</Th>
                      <Th>경기포지션</Th>
                      <Th>평점</Th>
                      <Th>시간</Th>
                      <Th>Goals</Th>
                      <Th>Assists</Th>
                      <Th>선택</Th>
                      <Th>CRO</Th><Th>HED</Th><Th>FST</Th><Th>ACT</Th><Th>OFF</Th><Th>TEC</Th><Th>COP</Th>
                      <Th>PAC</Th><Th>PAS</Th><Th>SPD</Th>
                      <Th>SHO</Th><Th>DRV</Th><Th>DEC</Th><Th>DRI</Th><Th>TAC</Th><Th>BLD</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchFull.lineup.map((p) => (
                      <tr key={p.userId}>
                        <Td>{p.userId}</Td>
                        <Td>{p.nickName}</Td>
                        <Td>{p.position || "-"}</Td>
                        <Td>{p.matchPosition || "-"}</Td>
                        <Td>{p.rating}</Td>
                        <Td>{p.runTime}</Td>
                        <Td>{p.goals}</Td>
                        <Td>{p.assists}</Td>
                        <Td>{p.selectedStat}</Td>
                        <Td>{p.cro}</Td><Td>{p.hed}</Td><Td>{p.fst}</Td><Td>{p.act}</Td><Td>{p.off}</Td><Td>{p.tec}</Td><Td>{p.cop}</Td>
                        <Td>{p.pac}</Td><Td>{p.pas}</Td><Td>{p.spd}</Td>
                        <Td>{p.sho}</Td><Td>{p.drv}</Td><Td>{p.dec}</Td><Td>{p.dri}</Td><Td>{p.tac}</Td><Td>{p.bld}</Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}

              <div style={{ marginTop: 16, textAlign: "right", display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <Button onClick={() => setView("summary")}>요약으로</Button>
                <PrimaryButton onClick={closeModal}>닫기</PrimaryButton>
              </div>
            </>
          )}
        </Modal2>
      )}
    </Wrapper>
  );
};

export default TeamDetailPage;

/* ====== Edit Form ====== */
/* ====== Edit Form (업로드=DB반영 원샷) ====== */
function EditForm({
  teamId,
  defaultName,
  defaultRegion1,
  defaultRegion2,
  defaultType,
  defaultImg,
  onSubmit,
  onImageChanged,
}) {
  const [teamName, setTeamName] = useState(defaultName);
  const [homeTown1, setHomeTown1] = useState(defaultRegion1);
  const [homeTown2, setHomeTown2] = useState(defaultRegion2);
  const [teamType, setTeamType] = useState(defaultType);

  // 업로드 응답 url을 미리보기로만 사용 (PATCH로는 절대 보내지 않음)
  const [previewImg, setPreviewImg] = useState(defaultImg || "");
   useEffect(() => { setPreviewImg(defaultImg || ""); }, [defaultImg]);

  const submit = (e) => {
    e.preventDefault();
    const payload = {};
    if (teamName !== defaultName) payload.teamName = teamName;
    if (homeTown1 !== defaultRegion1) payload.homeTown1 = homeTown1;
    if (homeTown2 !== defaultRegion2) payload.homeTown2 = homeTown2;
    if (teamType !== defaultType) payload.teamType = teamType;

    // ❌ teamImg는 서버 업로드에서 DB저장 끝! PATCH에 포함 금지
    // if (previewImg !== defaultImg) ... ← 절대 넣지 말 것

    if (Object.keys(payload).length === 0) {
      alert("변경 사항이 없습니다.");
      return;
    }
    onSubmit(payload);
  };

  // useEffect(() => {
  //   (async () => {
  //     try {
  //       const r = await api.get(`/api/team/${teamId}/profile-image`);
  //       const url =  r?.data?.url || "";
  //       if (url) setPreviewImg(url);
  //     } catch {
  //       // 실패 시 defaultImg 유지
  //     }
  //       })();
  // }, [teamId]);

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 12, maxWidth: 560 }}>
      <label>
        팀명
        <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} />
      </label>

      <LabelRow>
        <label style={{ flex: 1 }}>
          지역(시/도)
          <Input value={homeTown1} onChange={(e) => setHomeTown1(e.target.value)} />
        </label>
        <label style={{ flex: 1 }}>
          지역(시/군/구)
          <Input value={homeTown2} onChange={(e) => setHomeTown2(e.target.value)} />
        </label>
      </LabelRow>

      <label>
        종목
        <Input value={teamType} onChange={(e) => setTeamType(e.target.value)} />
      </label>

      {/* ✅ 팀 이미지: 업로드=DB 저장. 프론트는 미리보기만 갱신 */}
      <div>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>팀 이미지</div>
        {previewImg ? (
          <img
            src={previewImg}
            alt="team"
            style={{
              width: 96,
              height: 96,
              borderRadius: 12,
              objectFit: "cover",
              border: "1px solid #eee",
              marginBottom: 8,
            }}
          />
        ) : (
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 12,
              border: "1px dashed #e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
              color: "#9CA3AF",
              fontSize: 12,
            }}
          >
            미리보기 없음
          </div>
        )}

        <UploadField
          label="이미지 선택"
        
          endpoint={`/api/team/${teamId}/profile-image`} // 멀티파트 POST, 서버가 S3+DB 저장
           onUploaded={({ url }) => {
       // 업로드 응답의 url만으로 즉시 반영 (캐시 회피용 ts 쿼리 붙여도 됨)
       const fresh = url ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}` : "";
       setPreviewImg(fresh);
       onImageChanged?.(fresh); // 부모에도 전달
     }}
        />

        <div style={{ color: "#6b7280", fontSize: 12, marginTop: 6 }}>
          업로드하면 즉시 저장돼요. 저장 버튼을 누를 필요가 없습니다.
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <PrimaryButton type="submit">수정</PrimaryButton>
      </div>
    </form>
  );
}

/* ====== Small Components ====== */
function ScorerCard({ title, list }) {
  return (
    <div style={{ border:"1px solid #e5e7eb", borderRadius:12, padding:12 }}>
      <h4 style={{margin:"4px 0 12px"}}>{title}</h4>
      {(!list || list.length===0) ? (
        <Muted>득점자 없음</Muted>
      ) : (
        <ul style={{margin:0, paddingLeft:16}}>
          {list.map((s, i) => (
            <li key={i}>{s.time} — {s.userName}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DetailCard({ title, data }) {
  // data 키: score, shooting, onTarget, possession, pass, tackle, foul, card, rating (문자/숫자 혼재 가능)
  const rows = [
    ["득점", data?.score],
    ["슈팅", data?.shooting],
    ["유효슈팅", data?.onTarget],
    ["점유율", data?.possession],
    ["패스", data?.pass],
    ["태클", data?.tackle],
    ["파울", data?.foul],
    ["카드", data?.card],
    ["평점", data?.rating],
  ];
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 12 }}>
      <h4 style={{ margin: "4px 0 12px" }}>{title}</h4>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td style={{ padding: "6px 8px", color: "#6b7280" }}>{k}</td>
              <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 600 }}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ====== styles ====== */
const Wrapper = styled.div`padding:40px 80px;background:#fff;display:grid;gap:16px;`;
const HeaderRow = styled.div`display:flex;align-items:center;justify-content:space-between;`;
const Title = styled.h1`font-size:28px;font-weight:800;margin:2px 0;`;
const Back = styled.button`
  margin-bottom:8px;background:none;border:none;color:#6b7280;cursor:pointer;font-size:14px;
  &:hover{color:#111827;}
`;
const Muted = styled.div`color:#6b7280;margin-top:4px;`;
const Tabs = styled.div`display:flex;gap:8px;`;
const TabButton = styled.button`
  padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;cursor:pointer;background:#f9fafb;
  ${({active}) => active && `background:#21213f;color:#fff;border-color:#21213f;`}
`;
const Card = styled.div`border:1px solid #e5e7eb;border-radius:12px;padding:16px;`;
const Button = styled.button`
  padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;background:#f3f4f6;cursor:pointer;
  &:hover{background:#e5e7eb;}
`;
const DangerButton = styled(Button)`background:#d9534f;color:white;border-color:#d9534f;&:hover{opacity:0.9;}`;
const PrimaryButton = styled(Button)`background:#21213f;color:#fff;border-color:#21213f;`;
const SmallButton = styled(Button)`padding:6px 10px;font-size:12px;`;
const Table = styled.table`width:100%;border-collapse:collapse;margin-top:8px;`;
const Th = styled.th`text-align:left;padding:10px;border-bottom:2px solid #1b1b33;background:#21213f;color:#fff;`;
const Td = styled.td`padding:10px;border-bottom:1px solid #eee;font-size:14px;color:#242c31;vertical-align:middle;`;
const RowActions = styled.div`display:flex;gap:8px;`;
const Input = styled.input`width:100%;padding:8px 10px;border:1px solid #e5e7eb;border-radius:8px;`;
const LabelRow = styled.div`display:flex;gap:8px;`;

/* ====== Modal ====== */
function Modal2({ children, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 9999,
      }}
    >
      <div
        role="dialog" aria-modal="true"
        style={{
          background: "#fff", borderRadius: 12, width: "100%",
          maxWidth: "min(960px, 95vw)", maxHeight: "90vh",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        <div style={{ padding: 12, borderBottom: "1px solid #eee", textAlign: "right" }}>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer" }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div style={{ padding: 16, overflowY: "auto", overflowX: "hidden", flex: 1 }}>
          <div style={{ overflowX: "auto" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
