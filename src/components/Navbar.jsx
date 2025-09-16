import React from "react";
import styled from "styled-components";
import { useNavigate, useLocation } from "react-router-dom";
import icon from "../assets/icon.png";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menu = [
    { label: "사용자 관리", path: "/users" },
    { label: "팀 관리", path: "/teams" },
    { label: "매치 관리", path: "/creatematch" },
    { label: "공지 관리", path: "/alerts" },
  ];

  const handleLogout = () => {
    alert("로그아웃되었습니다.");
    navigate("/");
  };

  return (
    <Container>
      <Logo onClick={() => navigate("/")}>
        <img src={icon} alt="logo" />
      </Logo>

      <Menu>
  {menu.map((item) =>
    item.label === "매치 관리" ? (
      <DropdownWrapper key={item.label}>
        <MenuItem active={location.pathname.startsWith("/creatematch")}>
          {item.label}
        </MenuItem>
        <DropdownMenu>
          <DropdownItem onClick={() => navigate("/creatematch")}>
            매치 등록
          </DropdownItem>
          <DropdownItem onClick={() => navigate("/adminmatchimport")}>
            엑셀 업로드
          </DropdownItem>
          <DropdownItem onClick={() => navigate("/matches")}>
            분석된 매치 관리
          </DropdownItem>
        </DropdownMenu>
      </DropdownWrapper>
    ) : (
      <MenuItem
        key={item.label}
        active={location.pathname === item.path}
        onClick={() => navigate(item.path)}
      >
        {item.label}
      </MenuItem>
    )
  )}
</Menu>


      <LogoutButton onClick={handleLogout}>logout</LogoutButton>
    </Container>
  );
};

export default Navbar;


//style-components--------------------------------------------
const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 36px;
  background-color: white;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  img {
    height: 40px;
    cursor: pointer;
  }
`;

const Menu = styled.div`
  display: flex;
  gap: 40px;
`;

const MenuItem = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: ${(props) => (props.active ? "#FF7400" : "#0F172A")};
  cursor: pointer;
  border-bottom: ${(props) => (props.active ? "2px solid #FF7400" : "none")};
  padding-bottom: 4px;

  &:hover {
    color: #FF7400;
  }
`;

const LogoutButton = styled.button`
  background-color: #21213F;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background-color: #5c40e5;
  }
`;


const DropdownWrapper = styled.div`
  position: relative;
  display: inline-block;

  &:hover div {
    display: block;
  }
`;

const DropdownMenu = styled.div`
  display: none;
  position: absolute;
  top: 28px;
  left: 0;
  background-color: white;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  border:2px solid #21213F;
  z-index: 100;
  min-width: 140px;
  padding: 8px 0;
  color: #21213F;
`;

const DropdownItem = styled.div`
  padding: 10px 16px;
  font-size: 14px;
  color: #0f172a;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    background-color: #f3f4f6;
    color: #21213F;
  }
`;
