// src/components/StartPageSC.jsx
import styled from "styled-components";

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  min-height: 100vh;
  font-family: 'Pretendard', sans-serif;
`;

export const TopBar = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2vh 4vw;
  height: 10vh;
`;

export const LeftText = styled.div`
  font-size: 1rem;
  font-weight: bold;
  display: flex;
  align-items: center;

  .black {
    color: #0f172a;
  }

  .purple {
    color: #FF7400;
  }
`;

export const CenterLogo = styled.img`
  height: 48px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
`;

export const LoginButton = styled.button`
  background-color: #FF7400;
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 48px;
  cursor: pointer;
  z-index: 10;           // 다른 요소보다 위로
  position: relative;    // z-index 적용 위해 필요
`;

export const LoginText = styled.span`
  font-size: 0.9rem;
  font-weight: bold;
  color: #ffffff;
`;

export const MainSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4vh 4vw 4vh 6vw;
  flex: 1;
  gap: 4vw;
`;

export const LeftBlock = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 48%;
`;

export const Title = styled.h1`
  font-size: 4rem;
  font-weight: bold;
  margin-bottom: 2rem;

  .black {
    color: #0f172a;
  }

  .purple {
    color: #FF7400;
  }
`;

export const Description = styled.p`
  font-size: 1.2rem;
  color: #475569;
  line-height: 1.6;
  margin-bottom: 2.5rem;
`;

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  background-color: #FF7400;
  padding: 0.9rem 1.5rem;
  border: none;
  border-radius: 48px;
  box-shadow: 0px 4px 14px #f6ceadff;
  width: fit-content;
  cursor: pointer;
  margin: 0 auto;
`;

export const ActionText = styled.span`
  font-size: 1rem;
  font-weight: bold;
  color: #ffffff;
  margin-right: 0.5rem;
`;

export const ActionIcon = styled.img`
  width: 16px;
  height: 16px;
  object-fit: contain;
`;

export const PageImage = styled.img`
  position: absolute;
  bottom: 0;
  right: 4vw;
  height: 95vh;
  object-fit: cover;
  z-index: 1;
  filter: drop-shadow(0px 12px 24px rgba(0, 0, 0, 0.12));
  align-self: flex-end;
`;

