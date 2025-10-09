// src/pages/UsersPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import * as U from "../styles/UsersPageSC";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  // --- 신규: 생성 모달 상태 ---
  const [showCreate, setShowCreate] = useState(false);
  const [isDummy, setIsDummy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    realName: "",
    nickName: "",
    password: "",
    password2: "",
    email: "",
    phoneNumber: "",
    birth: "",
    position: "FW",
    boolcert1: true,  // 필수 약관
    boolcert2: false,
    boolcert3: false,
    boolcert4: false,
  });
  const [formError, setFormError] = useState("");

  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => { fetchUsers(); /* eslint-disable-next-line */ }, []);

  const myEmail = useMemo(() => {
    try {
      const t = localStorage.getItem("adminToken");
      if (!t) return null;
      const payload = JSON.parse(atob(t.split(".")[1]));
      return payload?.sub || null;
    } catch {
      return null;
    }
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/users");
      if (res.data.success && Array.isArray(res.data.data)) {
        const cleaned = res.data.data.filter((user) => user.email !== "admin@admin.com");
        setUsers(cleaned);
      } else {
        alert("사용자 정보를 불러오는 데 실패했습니다.");
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        alert("세션 만료/권한 없음. 다시 로그인해 주세요.");
        navigate("/");
      } else {
        alert("서버 연결 실패: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await api.delete(`/api/admin/users?userId=${deleteTargetId}`);
      if (res.data.success) {
        alert("삭제 성공: " + res.data.message);
        const updatedUsers = users.filter((u) => u.userId !== deleteTargetId);
        setUsers(updatedUsers);
        const lastPage = Math.max(1, Math.ceil(updatedUsers.length / itemsPerPage));
        if (currentPage > lastPage) setCurrentPage(lastPage);
      } else {
        alert("삭제 실패: " + (res.data.message || "알 수 없는 오류"));
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        alert("권한이 없습니다. 다시 로그인해 주세요.");
        navigate("/");
      } else {
        alert("서버 오류: " + err.message);
      }
    } finally {
      setShowConfirm(false);
      setDeleteTargetId(null);
    }
  };

  const handleToggleAdmin = async (user) => {
    const makeAdmin = user.role !== "ADMIN";
    try {
      const res = await api.patch(`/api/admin/users/${user.userId}/role`, {
        role: makeAdmin ? "ADMIN" : "USER",
      });
      if (res.data?.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.userId === user.userId ? { ...u, role: makeAdmin ? "ADMIN" : "USER" } : u
          )
        );
      } else {
        alert("권한 변경 실패: " + (res.data?.message || "알 수 없는 오류"));
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        alert("권한이 없습니다. 다시 로그인해 주세요.");
        navigate("/");
      } else {
        alert("서버 오류: " + err.message);
      }
    }
  };

  const orderedUsers = useMemo(
    () => [...users].sort((a, b) => Number(a.userId) - Number(b.userId)),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return orderedUsers;
    return orderedUsers.filter((u) => {
      const hay = [
        u.userNickname ?? u.nickName ?? "",
        u.email ?? "",
        u.phoneNumber ?? "",
        String(u.userId ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [orderedUsers, q]);

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
    const onlyDigits = String(num).replace(/\D/g, "");
    if (onlyDigits.startsWith("000") && onlyDigits.length >= 11) {
      // 더미는 000-0000-0000 포맷
      return onlyDigits.replace(/(\d{3})(\d{4})(\d{4}).*/, "$1-$2-$3");
    }
    if (onlyDigits.length === 11) {
      return onlyDigits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    } else if (onlyDigits.length === 10) {
      return onlyDigits.replace(/(\d{2,3})(\d{3,4})(\d{4})/, "$1-$2-$3");
    }
    return num;
  };

  const getPaginatedUsers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  };

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));

  // --------- 생성 모달 로직 ---------
  const suggestNextDummy = () => {
    // users 중 000… 번호 최댓값 +1 제안
    const dummyNums = users
      .map((u) => String(u.phoneNumber || ""))
      .filter((p) => /^\s*0{3}\d{8,}/.test(p))
      .map((p) => p.replace(/\D/g, ""))
      .map((p) => Number(p.slice(3, 11)) || 0);
    const nextSeq = (dummyNums.length ? Math.max(...dummyNums) : 0) + 1;
    const phone = "000" + String(nextSeq).padStart(8, "0"); // 11자리 보장
    const nick = `dummy_user_${String(nextSeq).padStart(3, "0")}`;
    const mail = `dummy${String(nextSeq).padStart(3, "0")}@fineplay.kr`;
    setForm((f) => ({
      ...f,
      phoneNumber: phone,
      nickName: f.nickName || nick,
      email: f.email || mail,
      realName: f.realName || `더미유저${nextSeq}`,
      password: f.password || `password${nextSeq}`,
      password2: f.password2 || `password${nextSeq}`,
    }));
  };

  const openCreateModal = () => {
    setFormError("");
    setShowCreate(true);
    // 초기값 리셋은 유지
  };

  const closeCreateModal = () => {
    setShowCreate(false);
    setCreating(false);
    setFormError("");
    setIsDummy(false);
    setForm({
      realName: "",
      nickName: "",
      password: "",
      password2: "",
      email: "",
      phoneNumber: "",
      birth: "",
      position: "FW",
      boolcert1: true,
      boolcert2: false,
      boolcert3: false,
      boolcert4: false,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const validateForm = () => {
    if (!form.realName || !form.nickName || !form.email || !form.phoneNumber || !form.birth || !form.position) {
      return "필수 입력값이 비어 있습니다.";
    }
    if (form.password.length < 8 || form.password.length > 20) {
      return "비밀번호는 8~20자여야 합니다.";
    }
    if (form.password !== form.password2) {
      return "비밀번호 확인이 일치하지 않습니다.";
    }
    if (!form.boolcert1) {
      return "필수 약관(boolcert1)을 체크해야 합니다.";
    }
    if (!/^[0-9]{11,13}$/.test(String(form.phoneNumber).replace(/\D/g, ""))) {
      return "전화번호 형식이 올바르지 않습니다. 숫자 11~13자리.";
    }
    // birth는 yyyy-MM-dd 형식 권장
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birth)) {
      return "생년월일은 YYYY-MM-DD 형식으로 입력하세요.";
    }
    return "";
  };

  const submitCreate = async () => {
    const errMsg = validateForm();
    if (errMsg) {
      setFormError(errMsg);
      return;
    }
    setCreating(true);
    setFormError("");
    try {
      const payload = {
        realName: form.realName,
        nickName: form.nickName,
        password: form.password,
        email: form.email,
        phoneNumber: String(form.phoneNumber).replace(/\D/g, ""),
        birth: form.birth, // 백엔드에서 java.util.Date로 파싱됨(yyyy-MM-dd 권장)
        position: form.position,
        boolcert1: !!form.boolcert1,
        boolcert2: !!form.boolcert2,
        boolcert3: !!form.boolcert3,
        boolcert4: !!form.boolcert4,
      };

      const res = await api.post("/api/admin/users", payload);

      if (res.data?.success) {
        alert("사용자를 생성했습니다.");
        closeCreateModal();
        fetchUsers();
      } else {
        // AdminResponseDto.fail 케이스
        const msg = res.data?.message || "생성 실패";
        setFormError(msg);
      }
    } catch (err) {
      const status = err.response?.status;
      const apiMsg = err.response?.data?.message || "";
      if (status === 409) {
        // 중복 매핑
        if (apiMsg.includes("DUPLICATED_EMAIL")) setFormError("이미 존재하는 이메일입니다.");
        else if (apiMsg.includes("DUPLICATED_NICKNAME")) setFormError("이미 존재하는 닉네임입니다.");
        else if (apiMsg.includes("DUPLICATED_PHONENUMBER")) setFormError("이미 존재하는 전화번호입니다.");
        else setFormError("중복 데이터가 있습니다.");
      } else if (status === 400) {
        setFormError(apiMsg || "입력값 검증에 실패했습니다.");
      } else if (status === 401 || status === 403) {
        alert("권한이 없습니다. 다시 로그인해 주세요.");
        navigate("/");
      } else {
        setFormError("서버 오류: " + (apiMsg || err.message));
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <U.Wrapper>
      <U.TitleRow>
        <U.Title>사용자 관리</U.Title>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <U.PrimaryButton onClick={openCreateModal}>+ 사용자 추가</U.PrimaryButton>
          <U.SearchBar>
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="이메일 / 닉네임 / 휴대폰 / ID 검색"
            />
            {q && <U.ClearBtn onClick={() => setQ("")}>지우기</U.ClearBtn>}
          </U.SearchBar>
        </div>
      </U.TitleRow>

      <U.Muted style={{ margin: "4px 8px" }}>
        {q ? `검색 결과: ${filteredUsers.length}건` : `총 ${users.length}명`}
      </U.Muted>

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <>
          <U.Table>
            <thead>
              <tr>
                <U.Th>No.</U.Th>
                <U.Th>userId</U.Th>
                <U.Th>nickName</U.Th>
                <U.Th>email</U.Th>
                <U.Th>phoneNumber</U.Th>
                <U.Th>birth</U.Th>
                <U.Th>role</U.Th>
                <U.Th>actions</U.Th>
                <U.Th>details</U.Th>
              </tr>
            </thead>
            <tbody>
              {getPaginatedUsers().map((user, index) => (
                <tr key={user.userId}>
                  <U.Td>{(currentPage - 1) * itemsPerPage + index + 1}</U.Td>
                  <U.Td>{user.userId}</U.Td>
                  <U.Td>{user.userNickname ?? user.nickName}</U.Td>
                  <U.Td>{user.email}</U.Td>
                  <U.Td>{formatPhone(user.phoneNumber) || "-"}</U.Td>
                  <U.Td>{formatYMD(user.birth)}</U.Td>
                  <U.Td>
                    <U.RoleBadge $admin={user.role === "ADMIN"}>
                      {user.role || "-"}
                    </U.RoleBadge>
                  </U.Td>
                  <U.Td>
                    <U.SmallButton
                      onClick={() => handleToggleAdmin(user)}
                      disabled={user.email === myEmail && user.role === "ADMIN"}
                      title={
                        user.email === myEmail && user.role === "ADMIN"
                          ? "자기 자신은 강등할 수 없습니다."
                          : ""
                      }
                    >
                      {user.role === "ADMIN" ? "관리자 권한 취소" : "관리자 권한 부여"}
                    </U.SmallButton>
                    <U.DeleteButton
                      disabled={user.role === "ADMIN" || user.email === myEmail}
                      title={
                        user.email === myEmail
                          ? "본인 계정은 삭제할 수 없습니다."
                          : user.role === "ADMIN"
                          ? "관리자 계정은 삭제할 수 없습니다."
                          : ""
                      }
                      onClick={() => {
                        if (user.role === "ADMIN" || user.email === myEmail) return;
                        setDeleteTargetId(user.userId);
                        setShowConfirm(true);
                      }}
                    >
                      ✔ Delete
                    </U.DeleteButton>
                  </U.Td>
                  <U.Td>
                    <U.SmallButton onClick={() => navigate(`/users/${user.userId}`)}>
                      세부 정보 보기
                    </U.SmallButton>
                  </U.Td>
                </tr>
              ))}
            </tbody>
          </U.Table>

          <U.Pagination>
            <U.PageButton
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              이전
            </U.PageButton>
            {[...Array(totalPages)].map((_, index) => (
              <U.PageNumber
                key={index}
                isActive={index + 1 === currentPage}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </U.PageNumber>
            ))}
            <U.PageButton
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              다음
            </U.PageButton>
          </U.Pagination>
        </>
      )}

      {/* 삭제 확인 모달 */}
      {showConfirm && (
        <U.ConfirmBackdrop>
          <U.ConfirmModal>
            <U.PopupTitle>사용자를 삭제하시겠습니까?</U.PopupTitle>
            <U.PopupDesc>확인을 누르시면 되돌릴 수 없습니다.</U.PopupDesc>
            <U.ModalActions>
              <U.CancelButton
                onClick={() => {
                  setShowConfirm(false);
                  setDeleteTargetId(null);
                }}
              >
                Cancel
              </U.CancelButton>
              <U.ConfirmButton onClick={handleDelete}>Yes</U.ConfirmButton>
            </U.ModalActions>
          </U.ConfirmModal>
        </U.ConfirmBackdrop>
      )}

      {/* 생성 모달 */}
      {showCreate && (
        <U.ConfirmBackdrop>
          <U.ConfirmModal style={{ maxWidth: 640, width: "96%" }}>
            <U.PopupTitle>사용자 추가</U.PopupTitle>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={isDummy}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setIsDummy(val);
                    if (val) suggestNextDummy();
                  }}
                />
                더미 계정(000…)
              </label>
              {isDummy && (
                <U.SmallButton type="button" onClick={suggestNextDummy}>
                  다음 번호 제안
                </U.SmallButton>
              )}
            </div>

            {formError && <U.ErrorText style={{ marginBottom: 12 }}>{formError}</U.ErrorText>}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                이름
                <input name="realName" value={form.realName} onChange={handleChange} />
              </label>
              <label>
                닉네임
                <input name="nickName" value={form.nickName} onChange={handleChange} />
              </label>
              <label>
                이메일
                <input name="email" value={form.email} onChange={handleChange} />
              </label>
              <label>
                전화번호(숫자만, 11~13)
                <input
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder={isDummy ? "00000000001" : "01012345678"}
                />
              </label>
              <label>
                생년월일(YYYY-MM-DD)
                <input
                  name="birth"
                  value={form.birth}
                  onChange={handleChange}
                  placeholder="1995-01-01"
                />
              </label>
              <label>
                포지션
                <select name="position" value={form.position} onChange={handleChange}>
                  <option value="FW">FW</option>
                  <option value="MF">MF</option>
                  <option value="DF">DF</option>
                  <option value="GK">GK</option>
                </select>
              </label>
              <label>
                비밀번호(8~20)
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                />
              </label>
              <label>
                비밀번호 확인
                <input
                  name="password2"
                  type="password"
                  value={form.password2}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <label>
                <input
                  type="checkbox"
                  name="boolcert1"
                  checked={form.boolcert1}
                  onChange={handleChange}
                />
                필수 동의
              </label>
              <label>
                <input
                  type="checkbox"
                  name="boolcert2"
                  checked={form.boolcert2}
                  onChange={handleChange}
                />
                선택1
              </label>
              <label>
                <input
                  type="checkbox"
                  name="boolcert3"
                  checked={form.boolcert3}
                  onChange={handleChange}
                />
                선택2
              </label>
              <label>
                <input
                  type="checkbox"
                  name="boolcert4"
                  checked={form.boolcert4}
                  onChange={handleChange}
                />
                선택3
              </label>
            </div>

            <U.ModalActions style={{ marginTop: 16 }}>
              <U.CancelButton onClick={closeCreateModal} disabled={creating}>
                취소
              </U.CancelButton>
              <U.ConfirmButton onClick={submitCreate} disabled={creating}>
                {creating ? "생성 중..." : "생성"}
              </U.ConfirmButton>
            </U.ModalActions>
          </U.ConfirmModal>
        </U.ConfirmBackdrop>
      )}
    </U.Wrapper>
  );
};

export default UsersPage;
