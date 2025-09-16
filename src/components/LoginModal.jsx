import React, { useState } from "react";
import styled from "styled-components";
import Popup from "./Popup";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import icon from "../assets/icon.png";

const LoginModal = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [popupVisible, setPopupVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

    const looksLikeJwt = (t) =>
    typeof t === "string" &&
    t.trim().length > 0 &&
    t.split(".").length === 3;

const handleLogin = async () => {
      if (loading) return;
    setLoading(true);

  try {
    const res = await api.post("/api/auth/sign-in", {
      email: email,
      password: password,
      adminLogin: true, // ✅ 관리자 로그인 플래그
    });

    const d = res.data;          // { success, code, message, data ... (프로젝트 포맷) }
    // 아래는 프로젝트 응답 구조에 맞게 사용
    const token =
        d?.accessToken ||
        d?.token ||
        d?.data?.accessToken ||
        d?.data?.token;

      const nickname =
        d?.userNickname ||
        d?.nickname ||
        d?.data?.userNickname ||
        d?.data?.nickname;

    if (!looksLikeJwt(token)) {
        // 문제 재발 방지: 여기서 바로 중단
        console.error("Invalid token from server:", token);
        alert("로그인 토큰 형식이 올바르지 않습니다.");
        return;
      }

      localStorage.setItem("adminToken", token);
      console.log("adminToken:", token, token?.split(".").length);
      
      if (nickname) localStorage.setItem("adminNickname", nickname);
      setPopupVisible(true);
            console.log("adminToken:", token, token?.split(".").length);

    } catch (error) {
      const status = error.response?.status;
      const code = error.response?.data?.code;

      if (status === 403 || code === "NP") {
        alert("관리자 권한이 없습니다.");
      } else if (status === 401) {
        alert("이메일/비밀번호가 올바르지 않습니다.");
      } else {
        alert("로그인 실패: " + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePopupOkay = () => {
    setPopupVisible(false);
    onClose(); // 모달 닫기
    navigate("/users"); // 👉 로그인 성공 후 /users 이동
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };
  
  return (
    <>
      <Wrapper onKeyDown={onKeyDown}>
        <LoginBox>
          <CloseButton onClick={onClose}>×</CloseButton>
          <LeftSide><CenterLogo
          src={icon} alt="logo" /></LeftSide>
          <RightSide>
            <Title>LOGIN</Title>
            <Subtitle>로그인 후 편리하게 FinePlay를 관리하세요!</Subtitle>

            <Label>Email</Label>
            <Input
              placeholder="admin@admin.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Label>Password</Label>
            <Input
              placeholder="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <LoginButton onClick={handleLogin} disabled={loading}>
              <LoginText>{loading ? "로그인 중..." : "로그인"}</LoginText>
            </LoginButton>
          </RightSide>
        </LoginBox>
      </Wrapper>

      {popupVisible && (
        <Popup
          title="로그인 성공"
          message="로그인에 성공하였습니다!"
          onClose={handlePopupOkay}
        />
      )}
    </>
  );
};

export default LoginModal;

// ---------- Styled Components ----------
const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
`;

const LoginBox = styled.div`
  display: flex;
  position: relative;
  background: #fff;
  border-radius: 30px;
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  width: 900px;
  max-width: 95%;
`;

const LeftSide = styled.div`
  width: 280px;
  background: #21213F;
  flex-shrink: 0;
`;

const RightSide = styled.div`
  display: flex;
  flex-direction: column;
  padding: 60px 50px;
  flex: 1;
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: bold;
  color: #0f172a;
  margin-bottom: 24px;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: #475569;
  margin-bottom: 48px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: bold;
  color: #344053;
  margin-bottom: 6px;
`;

const Input = styled.input`
  background: #fff;
  border: 1px solid #cfd4dc;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 16px;
  margin-bottom: 24px;
  color: #667084;
  box-shadow: 0px 1px 2px rgba(16, 24, 40, 0.05);
`;

const LoginButton = styled.button`
  background-color: #21213F;
  color: #fff;
  font-weight: bold;
  padding: 16px;
  border: none;
  border-radius: 48px;
  font-size: 16px;
  cursor: pointer;
`;

const LoginText = styled.span`
  font-size: 16px;
  font-weight: bold;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  font-size: 28px;
  color: #888;
  border: none;
  cursor: pointer;
  z-index: 10;
  &:hover {
    color: #333;
  }
`;
 const CenterLogo = styled.img`
  height: 200px;
  position: absolute;
  left: 5% ;
  transform: translateY(70%);

`;