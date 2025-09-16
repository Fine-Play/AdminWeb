// src/pages/UserDetailPageUX.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api/api";
import * as UD from "../styles/UsersDetailSC";
import {useParams, useLocation, useNavigate } from "react-router-dom";

/** Helpers */
const formatYMD = (v) => {
  if (!v) return "-";
  if (typeof v === "string") {
    const m = v.match(/^\d{4}-\d{2}-\d{2}/);
    if (m) return m[0];
  }
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatPhone = (num) => {
  if (!num) return "-";
  const only = String(num).replace(/\D/g, "");
  if (only.length === 11)
    return only.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  if (only.length === 10)
    return only.replace(/(\d{2,3})(\d{3,4})(\d{4})/, "$1-$2-$3");
  return num;
};

// ✅ 파라미터를 사용하는 버전 (user에 직접 접근하지 않음)
const initials = (nameOrEmail) => {
  if (!nameOrEmail) return "U";
  const base = String(nameOrEmail).trim();
  const parts = base.split(" ");
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return base[0];
};

// 안전한 JWT payload 추출 (base64url)
const getJwtPayload = (t) => {
  try {
    const b = t.split(".")[1];
    if (!b) return null;
    const pad = "=".repeat((4 - (b.length % 4)) % 4);
    return JSON.parse(atob((b + pad).replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
};

const formatStat = (s) => s || "-";

const normalizeStat = (s) => !s ? null : ({
  SPD: s.SPD ?? s.spd ?? 0,
  PAS: s.PAS ?? s.pas ?? 0,
  PAC: s.PAC ?? s.pac ?? 0,
  SHO: s.SHO ?? s.sho ?? 0,
  DRV: s.DRV ?? s.drv ?? 0,
  DEC: s.DEC ?? s.dec ?? 0,
  DRI: s.DRI ?? s.dri ?? 0,
  TAC: s.TAC ?? s.tac ?? 0,
  BLD: s.BLD ?? s.bld ?? 0,
  CRO: s.CRO ?? s.cro ?? 0,
  HED: s.HED ?? s.hed ?? 0,
  FST: s.FST ?? s.fst ?? 0,
  ACT: s.ACT ?? s.act ?? 0,
  OFF: s.OFF ?? s.off ?? 0,
  TEC: s.TEC ?? s.tec ?? 0,
  COP: s.COP ?? s.cop ?? 0,
  OVR: s.OVR ?? s.ovr ?? 0,
  selectedStat: s.selectedStat ?? s.selected_stat ?? null,
});

// setStat(payload ?? null) 대신:



const UserDetailPageUX = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(location.state?.user ?? null);
  const [loading, setLoading] = useState(!location.state?.user);
  const [error, setError] = useState("");

  const [stat, setStat] = useState(null);
  const [statLoading, setStatLoading] = useState(true);
  const [statError, setStatError] = useState("");

  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState("");

   const fetchStats = async () => {
   try {
     setStatLoading(true);
     const res = await api.get(`/api/admin/users/${userId}/stats`);
     const payload = res?.data?.data ?? res?.data; // 래퍼/비래퍼 대응
     setStat(normalizeStat(payload));
   } catch (e) {
     setStatError(e?.response?.data?.message || "스탯 불러오기 실패");
   } finally {
     setStatLoading(false);
   }
 };

  useEffect(() => {
    if (location.state?.user) return; // state로 넘어온 경우 요청 생략
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/admin/users/${userId}`);
        // 상세는 래퍼 없음. 혹시 공통화되면 res.data.data에도 대비
        const payload = res?.data?.data ?? res?.data;
        if (!ignore) setUser(payload ?? null);
      } catch (e) {
        if (!ignore) setError(e?.response?.data?.message || "불러오기 실패");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, [userId, location.state]);

  

    // ✅ 스탯 불러오기
  useEffect(() => {
   fetchStats();
   // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [userId]);



  const [activeTab, setActiveTab] = useState("profile"); // profile | teams | agreements | activity
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);
  const [editNick, setEditNick] = useState("");

   useEffect(() => {
   if (activeTab === "teams") fetchTeams();
 }, [activeTab, userId]);

  // 로그인한 관리자 이메일 (자기 자신 강등 방지)
  const myEmail = useMemo(() => {
    try {
      const t = localStorage.getItem("adminToken");
      const p = t ? getJwtPayload(t) : null;
      return p?.sub || null;
    } catch {
      return null;
    }
  }, []);

  const highlightSet = useMemo(() => {
    const pos = user?.position;
    switch (pos) {
      case "FW": return new Set(["SHO","DRV"]);
      case "MF": return new Set(["DEC","DRI"]);
      case "DF": return new Set(["TAC","BLD"]);
          default:   return new Set();
    }
  }, [user?.position]);

  const copy = async (text, label = "복사 완료") => {
    try {
      await navigator.clipboard.writeText(String(text ?? ""));
      setToast(label);
      setTimeout(() => setToast(""), 1800);
    } catch {
      setToast("복사 실패");
      setTimeout(() => setToast(""), 1800);
    }
  };


   const fetchTeams = async () => {
   try {
     setTeamsLoading(true);
     const res = await api.get(`/api/admin/users/${userId}/teams`);
     const payload = res?.data?.data ?? res?.data ?? [];
     // 혹시 서버가 current로 보낼 경우 대비
     const norm = payload.map(t => ({ ...t, isCurrent: t.isCurrent ?? t.current ?? false }));
     setTeams(norm);
   } catch (e) {
     setTeamsError(e?.response?.data?.message || "소속팀 불러오기 실패");
   } finally {
     setTeamsLoading(false);
   }
 };


  /** ---------- Early return: null 방어 ---------- */
  if (loading) {
    return (
      <UD.PageWrapper>
        <UD.StickyHeader>
          <UD.Breadcrumb>
            <UD.Crumb to="/users">사용자 관리</UD.Crumb>
            <UD.CrumbSep>/</UD.CrumbSep>
            <UD.CrumbCurrent>상세</UD.CrumbCurrent>
          </UD.Breadcrumb>
          <UD.HeaderRight>
            <UD.OutlineBtn onClick={() => navigate(-1)}>← 뒤로</UD.OutlineBtn>
          </UD.HeaderRight>
        </UD.StickyHeader>
        <UD.Muted>불러오는 중...</UD.Muted>
      </UD.PageWrapper>
    );
  }

  if (error) {
    return (
      <UD.PageWrapper>
        <UD.StickyHeader>
          <UD.Breadcrumb>
            <UD.Crumb to="/users">사용자 관리</UD.Crumb>
            <UD.CrumbSep>/</UD.CrumbSep>
            <UD.CrumbCurrent>상세</UD.CrumbCurrent>
          </UD.Breadcrumb>
          <UD.HeaderRight>
            <UD.OutlineBtn onClick={() => navigate(-1)}>← 뒤로</UD.OutlineBtn>
          </UD.HeaderRight>
        </UD.StickyHeader>
        <UD.Muted style={{ color: "#b91c1c" }}>{error}</UD.Muted>
      </UD.PageWrapper>
    );
  }

  if (!user) {
    return (
      <UD.PageWrapper>
        <UD.StickyHeader>
          <UD.Breadcrumb>
            <UD.Crumb to="/users">사용자 관리</UD.Crumb>
            <UD.CrumbSep>/</UD.CrumbSep>
            <UD.CrumbCurrent>상세</UD.CrumbCurrent>
          </UD.Breadcrumb>
          <UD.HeaderRight>
            <UD.OutlineBtn onClick={() => navigate(-1)}>← 뒤로</UD.OutlineBtn>
          </UD.HeaderRight>
        </UD.StickyHeader>
        <UD.Muted>데이터가 없습니다.</UD.Muted>
      </UD.PageWrapper>
    );
  }

  /** ---------- 여기부터는 user가 확실히 존재 ---------- */
  const isAdmin = user.role === "ADMIN";
  const displayNick = user.nickName ?? user.userNickname ?? "-";
  const isSelfAdminDemote = user.email === myEmail && isAdmin; // 자기 자신 ADMIN → USER 금지

  // 관리자 권한 토글
  const handleToggleAdmin = async () => {
    if (isSelfAdminDemote) {
      setToast("자기 자신은 강등할 수 없습니다.");
      setTimeout(() => setToast(""), 1500);
      return;
    }
    try {
      setSaving(true);
      const nextRole = isAdmin ? "USER" : "ADMIN";
      const res = await api.patch(`/api/admin/users/${user.userId}/role`, {
        role: nextRole,
      });
      const data = res?.data?.data ?? res?.data;
      setUser((u) => ({ ...u, role: data?.role ?? nextRole }));
      setToast(
        nextRole === "ADMIN" ? "관리자 권한 부여됨" : "관리자 권한 취소됨"
      );
    } catch (e) {
      setToast(e?.response?.data?.message || "권한 변경 실패");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 1500);
    }
  };

  // 포지션 토글 (MF/DF/FW)
  const handleChangePosition = async (pos) => {
    if (user.position === pos) return;
    try {
      setSaving(true);
      const res = await api.patch(`/api/admin/users/${user.userId}/position`, {
        position: pos,
      });
      const data = res?.data?.data ?? res?.data;
      setUser((u) => ({ ...u, position: data?.position ?? pos }));
      setToast(`포지션이 ${pos}로 변경되었습니다.`);
      await fetchStats();
    } catch (e) {
      setToast(e?.response?.data?.message || "포지션 변경 실패");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 1500);
    }
  };

  // 닉네임 저장
  const handleSaveNick = async () => {
    const v = (editNick ?? "").trim();
    if (!v) {
      setToast("닉네임을 입력하세요.");
      setTimeout(() => setToast(""), 1200);
      return;
    }
    if (v === user.nickName) {
      setToast("변경 사항이 없습니다.");
      setTimeout(() => setToast(""), 1200);
      return;
    }
    try {
      setSaving(true);
      const res = await api.patch(`/api/admin/users/${user.userId}/nickname`, {
        nickName: v,
      });
      const data = res?.data?.data ?? res?.data;
      setUser((u) => ({
        ...u,
        nickName: data?.nickName ?? v,
        userNickname: data?.nickName ?? v,
      }));
      setEditNick("");
      setToast("닉네임이 변경되었습니다.");
    } catch (e) {
      const msg = e?.response?.data?.message || "";
      if (e?.response?.status === 409 || /DUPLICATED|EXIST/i.test(msg)) {
        setToast("이미 사용 중인 닉네임입니다.");
      } else {
        setToast("닉네임 변경 실패");
      }
    } finally {
      setSaving(false);
      setTimeout(() => setToast(""), 1500);
    }
  };

   const handleSetCurrentTeam = async (teamId) => {
   try {
     await api.patch(`/api/admin/users/${user.userId}/teams/current`, { teamId });
     setTeams(prev => prev.map(t => ({ ...t, isCurrent: t.teamId === teamId })));
     setToast("대표팀이 설정되었습니다.");
   } catch (e) {
     setToast(e?.response?.data?.message || "대표팀 설정 실패");
   } finally {
     setTimeout(()=>setToast(""), 1500);
   }
 };

 const handleRemoveTeam = async (teamId) => {
   if (!window.confirm("이 유저를 해당 팀에서 탈퇴 처리하시겠어요?")) return;
   try {
     await api.delete(`/api/admin/users/${user.userId}/teams/${teamId}`);
     setTeams(prev => prev.filter(t => t.teamId !== teamId));
     setToast("탈퇴 처리 완료");
   } catch (e) {
     setToast(e?.response?.data?.message || "탈퇴 처리 실패");
   } finally {
     setTimeout(()=>setToast(""), 1500);
   }
 };


  

  return (
    <UD.PageWrapper>
      {/* Header */}
      <UD.StickyHeader>
        <UD.Breadcrumb>
          <UD.Crumb to="/users">사용자 관리</UD.Crumb>
          <UD.CrumbSep>/</UD.CrumbSep>
          <UD.CrumbCurrent>상세</UD.CrumbCurrent>
        </UD.Breadcrumb>
        <UD.HeaderRight>
          <UD.OutlineBtn onClick={() => navigate(-1)}>← 뒤로</UD.OutlineBtn>
        </UD.HeaderRight>
      </UD.StickyHeader>

      {/* Title & Identity */}
      <UD.TopRow>
        <UD.Avatar aria-label="avatar">
          {user.profileImg ? (
            <img alt="avatar" src={user.profileImg} />
          ) : user.avatarUrl ? (
            <img alt="avatar" src={user.avatarUrl} />
          ) : (
            initials(displayNick || user.email)
          )}
        </UD.Avatar>

        <div>
          <UD.H1>
            {displayNick}{" "}
            <UD.Chip $tone={isAdmin ? "indigo" : "gray"}>{user.role || "-"}</UD.Chip>
          </UD.H1>
          <UD.MetaRow>
            <UD.K>userId</UD.K>
            <UD.V>
              {user.userId ?? "-"}{" "}
              <UD.CopyBtn onClick={() => copy(user.userId, "userId 복사됨")}>
                복사
              </UD.CopyBtn>
            </UD.V>
          </UD.MetaRow>
          <UD.MetaRow>
            <UD.K>email</UD.K>
            <UD.V>
              {user.email || "-"}{" "}
              <UD.CopyBtn onClick={() => copy(user.email, "email 복사됨")}>
                복사
              </UD.CopyBtn>
            </UD.V>
          </UD.MetaRow>
        </div>

        <UD.ActionCluster>
          <UD.ActionBtn
            onClick={handleToggleAdmin}
            disabled={saving || isSelfAdminDemote}
            title={isSelfAdminDemote ? "자기 자신은 강등할 수 없습니다." : ""}
          >
            {isAdmin ? "관리자 권한 취소" : "관리자 권한 부여"}
          </UD.ActionBtn>
          <UD.DangerBtn onClick={() => setShowDeleteModal(true)}>
            계정 삭제
          </UD.DangerBtn>
        </UD.ActionCluster>
      </UD.TopRow>

      {/* Tabs */}
      <UD.TabBar role="tablist" aria-label="유저 상세 탭">
        <UD.Tab
          $active={activeTab === "profile"}
          onClick={() => setActiveTab("profile")}
          role="tab"
          aria-selected={activeTab === "profile"}
        >
          프로필
        </UD.Tab>
        <UD.Tab
          $active={activeTab === "teams"}
          onClick={() => setActiveTab("teams")}
          role="tab"
          aria-selected={activeTab === "teams"}
        >
          소속 팀
        </UD.Tab>
        <UD.Tab
          $active={activeTab === "agreements"}
          onClick={() => setActiveTab("agreements")}
          role="tab"
          aria-selected={activeTab === "agreements"}
        >
          약관 동의
        </UD.Tab>
        <UD.Tab
          $active={activeTab === "activity"}
          onClick={() => setActiveTab("activity")}
          role="tab"
          aria-selected={activeTab === "activity"}
        >
          활동 이력
        </UD.Tab>
      </UD.TabBar>

      {/* Profile */}
      {activeTab === "profile" && (
        <UD.Grid>
          <UD.Card>
            <UD.CardTitle>기본 정보</UD.CardTitle>

            <UD.KV>
              <dt>userId</dt>
              <dd>
                {user.userId ?? "-"}{" "}
                <UD.CopyBtn onClick={() => copy(user.userId, "userId 복사됨")}>
                  복사
                </UD.CopyBtn>
              </dd>
            </UD.KV>
            <UD.KV>
              <dt>email</dt>
              <dd>
                {user.email || "-"}{" "}
                <UD.CopyBtn onClick={() => copy(user.email, "email 복사됨")}>
                  복사
                </UD.CopyBtn>
              </dd>
            </UD.KV>
            <UD.KV>
   <dt>nickName</dt>
   <dd style={{gap:10}}>
     <input
       value={editNick === "" ? (user.nickName ?? user.userNickname ?? "") : editNick}
       onChange={(e)=>setEditNick(e.target.value)}
       placeholder="닉네임"
       style={{padding:"6px 8px", border:"1px solid #e5e7eb", borderRadius:8, fontWeight:700}}
     />
     <UD.SmallBtn onClick={handleSaveNick} disabled={saving}>저장</UD.SmallBtn>
   </dd>
 </UD.KV>
            <UD.KV>
              <dt>realName</dt>
              <dd>{user.realName || "-"}</dd>
            </UD.KV>
            <UD.KV>
              <dt>phoneNumber</dt>
              <dd>{formatPhone(user.phoneNumber)}</dd>
            </UD.KV>
             <UD.KV>
   <dt>position</dt>
   <dd>
     <UD.Segmented>
       {["MF","DF","FW"].map(p => (
         <UD.SegBtn key={p} $active={user.position===p} onClick={()=>handleChangePosition(p)} disabled={saving}>
           {p}
         </UD.SegBtn>
       ))}
     </UD.Segmented>
   </dd>
 </UD.KV>
            <UD.KV>
              <dt>birth</dt>
              <dd>{formatYMD(user.birth)}</dd>
            </UD.KV>
            <UD.KV>
              <dt>role</dt>
              <dd>
                <UD.Chip $tone={isAdmin ? "indigo" : "gray"}>
                  {user.role || "-"}
                </UD.Chip>
              </dd>
            </UD.KV>

            <UD.KV>
              <dt>profileImg</dt>
              <dd style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {user.profileImg ? (
                  <>
                    <img
                      src={user.profileImg}
                      alt="profile"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        objectFit: "cover",
                        border: "1px solid #eee",
                      }}
                    />
                    <a href={user.profileImg} target="_blank" rel="noreferrer">
                      <UD.CopyBtn
                        as="span"
                        style={{ textDecoration: "underline" }}
                      >
                        열기
                      </UD.CopyBtn>
                    </a>
                    <UD.CopyBtn
                      onClick={() => copy(user.profileImg, "이미지 URL 복사됨")}
                    >
                      URL 복사
                    </UD.CopyBtn>
                  </>
                ) : (
                  <span>-</span>
                )}
              </dd>
            </UD.KV>
          </UD.Card>

          <UD.Card>
  <UD.CardTitle>능력치</UD.CardTitle>

  {statLoading && <UD.Muted>스탯 불러오는 중...</UD.Muted>}
  {statError && <UD.Muted style={{color:"#b91c1c"}}>{statError}</UD.Muted>}
  {!statLoading && !statError && !stat && <UD.Muted>스탯 데이터 없음</UD.Muted>}

  {stat && (
    <>
      <UD.OvrBox>
        <UD.OvrLabel>OVR</UD.OvrLabel>
        <UD.OvrValue>{formatStat(stat.OVR ?? 0)}</UD.OvrValue>
      </UD.OvrBox>

      <UD.SectionTitle>공통 지표</UD.SectionTitle>
      <UD.StatTable>
        <tbody>
          <UD.StatRow $variant={user?.position} $highlight={false}><td>스피드(SPD)</td><td className="val">{formatStat(stat.SPD)}</td></UD.StatRow>
          <UD.StatRow $variant={user?.position} $highlight={false}><td>패스(PAS)</td><td className="val">{formatStat(stat.PAS)}</td></UD.StatRow>
          <UD.StatRow $variant={user?.position} $highlight={false}><td>체력(PAC)</td><td className="val">{formatStat(stat.PAC)}</td></UD.StatRow>
        </tbody>
      </UD.StatTable>

      <UD.SectionTitle>포지션 지표</UD.SectionTitle>
      <UD.StatTable>
        <tbody>
          {/* FW 지표 */}
          <UD.StatRow $variant={user?.position} $highlight={highlightSet.has("SHO")}><td>슛(SHO)</td><td className="val">{formatStat(stat.SHO)}</td></UD.StatRow>
          <UD.StatRow $variant={user?.position} $highlight={highlightSet.has("DRV")}><td>돌파(DRV)</td><td className="val">{formatStat(stat.DRV)}</td></UD.StatRow>
          {/* MF 지표 */}
          <UD.StatRow $variant={user?.position} $highlight={highlightSet.has("DEC")}><td>판단력(DEC)</td><td className="val">{formatStat(stat.DEC)}</td></UD.StatRow>
          <UD.StatRow $variant={user?.position} $highlight={highlightSet.has("DRI")}><td>드리블(DRI)</td><td className="val">{formatStat(stat.DRI)}</td></UD.StatRow>
          {/* DF 지표 */}
          <UD.StatRow $variant={user?.position} $highlight={highlightSet.has("TAC")}><td>태클(TAC)</td><td className="val">{formatStat(stat.TAC)}</td></UD.StatRow>
          <UD.StatRow $variant={user?.position} $highlight={highlightSet.has("BLD")}><td>빌드업(BLD)</td><td className="val">{formatStat(stat.BLD)}</td></UD.StatRow>
        </tbody>
      </UD.StatTable>

      <UD.SectionTitle>개인 지표</UD.SectionTitle>
      <UD.StatTable>
        <tbody>
          <UD.StatRow $variant={user?.position} $highlight={false}><td>크로스(CRO)</td><td className="val">{formatStat(stat.CRO)}</td></UD.StatRow>
          <UD.StatRow $variant={user?.position} $highlight={false}><td>헤딩(HED)</td><td className="val">{formatStat(stat.HED)}</td></UD.StatRow>
          <UD.StatRow $variant={user?.position} $highlight={false}><td>퍼스트 터치(FST)</td><td className="val">{formatStat(stat.FST)}</td></UD.StatRow>
          <UD.StatRow $variant={user?.position} $highlight={false}><td>적극성(ACT)</td><td className="val">{formatStat(stat.ACT)}</td></UD.StatRow>
          <UD.StatRow $variant={user?.position} $highlight={false}><td>오프 더 볼(OFF)</td><td className="val">{formatStat(stat.OFF)}</td></UD.StatRow>
          <UD.StatRow $variant={user?.position} $highlight={false}><td>개인기(TEC)</td><td className="val">{formatStat(stat.TEC)}</td></UD.StatRow>
          <UD.StatRow $variant={user?.position} $highlight={false}><td>연계(COP)</td><td className="val">{formatStat(stat.COP)}</td></UD.StatRow>
        </tbody>
      </UD.StatTable>
    </>
  )}
</UD.Card>

        </UD.Grid>
      )}

      {/* Teams */}
      {activeTab === "teams" && (
        <UD.Card>
          <UD.CardTitle>소속 팀</UD.CardTitle>
          {teamsLoading && <UD.Muted>소속팀 불러오는 중...</UD.Muted>}
   {teamsError && <UD.Muted style={{color:"#b91c1c"}}>{teamsError}</UD.Muted>}
           {!teamsLoading && !teamsError && teams.length > 0 ? (
            <UD.MiniTable>
              <thead>
                <tr>
                  <th>teamId</th>
                  <th>teamName</th>
                  <th>region</th>
                  <th>memberNum</th>
                   <th>joinedAt</th>
                   <th>역할</th>
                  <th>isCurrent</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => {
                    const isLeader = t?.teamLeader?.userId === user.userId; // ✅ 비교
    return (
                  <tr key={t.teamId}>
                    <td>{t.teamId}</td>
                      <td style={{display:'flex',alignItems:'center',gap:8}}>
                     {t.teamImg && <img src={t.teamImg} alt="" style={{width:24,height:24,borderRadius:6,objectFit:'cover',border:'1px solid #eee'}} />}
                    {t.teamName}</td>
                    <td>{t.region || "-"}</td>
                    <td>{t.memberNum}</td>
                    <td>{(t.joinedAt || "").replace("T"," ").slice(0,16)}</td>

                     <td>
          {t?.teamLeader?.userId ? (
            isLeader ? <UD.RoleTag $leader>팀장</UD.RoleTag> : <UD.RoleTag>팀원</UD.RoleTag>
          ) : (
            <span>-</span>  // teamLeader 정보가 없을 때 안전 처리
          )}
        </td>

                    <td> {t.isCurrent ? <UD.Tag>대표팀</UD.Tag> : <span>-</span>}</td>
                    <td>
                       {!t.isCurrent && (
                 <UD.SmallBtn onClick={() => handleSetCurrentTeam(t.teamId)}>
                   대표팀 설정
                 </UD.SmallBtn>
               )}
                      <UD.SmallBtn onClick={() => handleRemoveTeam(t.teamId)}>
                  탈퇴 처리
                </UD.SmallBtn>
                    </td>
                  </tr>
                )})}
              </tbody>
            </UD.MiniTable>
          ) : (
            <UD.Muted>연결된 팀이 없습니다.</UD.Muted>
          )}
        </UD.Card>
      )}

      {/* Agreements */}
      {activeTab === "agreements" && (
        <UD.Card>
          <UD.CardTitle>약관 동의</UD.CardTitle>

          <UD.MiniTable>
            <thead>
              <tr>
                <th>항목</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>만 14세 이상입니다(필수)</td>
                <td>
                  <UD.Chip $tone={user.boolcert1 ? "green" : "red"}>
                    {user.boolcert1 ? "동의" : "미동의"}
                  </UD.Chip>
                </td>
              </tr>
              <tr>
                <td>이용약관 동의(필수)</td>
                <td>
                  <UD.Chip $tone={user.boolcert2 ? "green" : "red"}>
                    {user.boolcert2 ? "동의" : "미동의"}
                  </UD.Chip>
                </td>
              </tr>
              <tr>
                <td>개인정보 수집 및 이용 동의(필수)</td>
                <td>
                  <UD.Chip $tone={user.boolcert3 ? "green" : "red"}>
                    {user.boolcert3 ? "동의" : "미동의"}
                  </UD.Chip>
                </td>
              </tr>
              <tr>
                <td>이벤트/마케팅 수신 동의(선택)</td>
                <td>
                  <UD.Chip $tone={user.boolcert4 ? "green" : "red"}>
                    {user.boolcert4 ? "동의" : "미동의"}
                  </UD.Chip>
                </td>
              </tr>
            </tbody>
          </UD.MiniTable>
        </UD.Card>
      )}

      {/* Activity */}
      {activeTab === "activity" && (
        <UD.Card>
          <UD.CardTitle>활동 타임라인</UD.CardTitle>
          <UD.Timeline>
            {(user.activity ?? []).map((e, idx) => (
              <li key={idx}>
                <UD.Dot />
                <UD.Time>{e.ts.replace("T", " ").slice(0, 16)}</UD.Time>
                <UD.EventText>{e.text}</UD.EventText>
              </li>
            ))}
          </UD.Timeline>
          {(!user.activity || user.activity.length === 0) && (
            <UD.Muted>기록이 없습니다.</UD.Muted>
          )}
        </UD.Card>
      )}

      {/* Delete Confirm Modal (데모) */}
      {showDeleteModal && (
        <UD.ModalBackdrop>
          <UD.ModalCard>
            <UD.ModalTitle>계정을 삭제하시겠어요?</UD.ModalTitle>
            <UD.ModalText>이 작업은 되돌릴 수 없습니다.</UD.ModalText>
            <UD.ModalRow>
              <UD.OutlineBtn onClick={() => setShowDeleteModal(false)}>
                취소
              </UD.OutlineBtn>
              <UD.DangerBtn title="(데모)">삭제</UD.DangerBtn>
            </UD.ModalRow>
          </UD.ModalCard>
        </UD.ModalBackdrop>
      )}

      {toast && <UD.Toast>{toast}</UD.Toast>}
    </UD.PageWrapper>
  );
};

export default UserDetailPageUX;
