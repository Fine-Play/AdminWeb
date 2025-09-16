import React, { useEffect, useState,useMemo } from "react";
import api from "../api/api";
import { useNavigate } from "react-router-dom";
import * as U from "../styles/UsersPageSC"


const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const itemsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myEmail = useMemo(() => {
   try {
     const t = localStorage.getItem("adminToken");
     if (!t) return null;
     const payload = JSON.parse(atob(t.split(".")[1]));
     return payload?.sub || null; // 토큰 subject=email 기준
   } catch { return null; }
 }, []);

 

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/users");
      if (res.data.success && Array.isArray(res.data.data)) {
        const cleaned = res.data.data.filter(
          (user) => user.email !== "admin@admin.com"
        );
        setUsers(cleaned);
      } else {
        alert("사용자 정보를 불러오는 데 실패했습니다.");
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        alert("세션이 만료되었거나 권한이 없습니다. 다시 로그인해 주세요.");
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

  // 정렬된 목록은 그대로
const orderedUsers = useMemo(
  () => [...users].sort((a, b) => Number(a.userId) - Number(b.userId)),
  [users]
);

// 검색어 기반 필터 추가
const filteredUsers = useMemo(() => {
  const needle = q.trim().toLowerCase();
  if (!needle) return orderedUsers;

  return orderedUsers.filter(u => {
    const hay = [
      u.userNickname ?? u.nickName ?? "",
      u.email ?? "",
      u.phoneNumber ?? "",
      String(u.userId ?? "")
    ].join(" ").toLowerCase();
    return hay.includes(needle);
  });
}, [orderedUsers, q]);

// 페이징 대상도 filteredUsers 기준으로



const formatYMD = (v) => {
  if (!v) return "-";
  if (typeof v === "string") {
    // ISO 형태면 앞의 YYYY-MM-DD만 사용
    const m = v.match(/^\d{4}-\d{2}-\d{2}/);
    if (m) return m[0];
  }
  // 혹시 다른 형태면 Date로 파싱해 yyyy-mm-dd로
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const formatPhone = (num) => {
  if (!num) return "-";
  const onlyDigits = String(num).replace(/\D/g, ""); // 숫자만 추출

  if (onlyDigits.length === 11) {
    // 01012345678 → 010-1234-5678
    return onlyDigits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  } else if (onlyDigits.length === 10) {
    // 0212345678 → 02-1234-5678 (서울 번호 예시)
    return onlyDigits.replace(/(\d{2,3})(\d{3,4})(\d{4})/, "$1-$2-$3");
  }
  return num; // 그 외는 그대로 반환
};

  const getPaginatedUsers = () => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
};

const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));

  return (
    <U.Wrapper>
      <U.TitleRow>

      <U.Title>사용자 관리</U.Title>
      <U.SearchBar>
    <input
      value={q}
      onChange={(e) => { setQ(e.target.value); setCurrentPage(1); }}
      placeholder="이메일 / 닉네임 / 휴대폰 / ID 검색"
    />
    {q && <U.ClearBtn onClick={() => setQ("")}>지우기</U.ClearBtn>}
  </U.SearchBar>
  

        </U.TitleRow>
<U.Muted style={{margin:"4px 8px"}}>
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
                  <U.Td>{user.userNickname}</U.Td>
                  <U.Td>{user.email}</U.Td>
                  <U.Td>{formatPhone(user.phoneNumber) || "-"}</U.Td>
                  <U.Td>{formatYMD(user.birth) }</U.Td>
                  <U.Td>
                   <U.RoleBadge $admin={user.role === "ADMIN"}>
                     {user.role || "-"}
                   </U.RoleBadge>
                  </U.Td>
                  <U.Td>
                    <U.SmallButton
                     onClick={() => handleToggleAdmin(user)}
                     disabled={user.email === myEmail && user.role === "ADMIN"} // 자기자신 강등 방지
                     title={user.email === myEmail && user.role === "ADMIN" ? "자기 자신은 강등할 수 없습니다." : ""}
                   >
                     {user.role === "ADMIN" ? "관리자 권한 취소" : "관리자 권한 부여"}
                   </U.SmallButton>
                    <U.DeleteButton
                       disabled={user.role === "ADMIN" || user.email === myEmail}
                        title={
                          user.email === myEmail ? "본인 계정은 삭제할 수 없습니다.": 
                          user.role === "ADMIN" ? "관리자 계정은 삭제할 수 없습니다.": "" }
                           onClick={() => {    if (user.role === "ADMIN" || user.email === myEmail) return;
                            setDeleteTargetId(user.userId);
                            setShowConfirm(true); }}
                    >
                      ✔ Delete
                    </U.DeleteButton>
                  </U.Td>
                  <U.Td><U.SmallButton onClick={() => navigate(`/users/${user.userId}`)}>세부 정보 보기</U.SmallButton></U.Td>
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
    </U.Wrapper>
  );
};

export default UsersPage;