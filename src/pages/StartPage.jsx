// src/pages/StartPage.jsx
import React, { useState } from "react";
import * as S from "../styles/StartPageSC";
import icon from "../assets/icon.png";
import page from "../assets/page.png";
import LoginModal from "../components/LoginModal"; // 모달 컴포넌트 import

const StartPage = () => {
  const [showModal, setShowModal] = useState(false);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <>
      <S.Container>
        <S.TopBar>
          <S.LeftText>
           
          </S.LeftText>

          <S.CenterLogo src={icon} alt="logo" />

          <S.LoginButton onClick={openModal}>
            <S.LoginText>login</S.LoginText>
          </S.LoginButton>
        </S.TopBar>

        <S.MainSection>
          <S.LeftBlock>
            <S.Title>
              <span className="purple">FinePlay</span> ADMIN Web
            </S.Title>
            <S.Description>
              Fine Play는 자신의 파인플레이를 쉽게 확인하고, 공유하고, 분석할 수 있는 서비스를 만들어 ‘모두가 자신의 파인플레이를 즐길 수 있도록’ 하는 앱입니다.
            </S.Description>
            <S.ActionButton onClick={openModal}>
              <S.ActionText>로그인하고 관리하기</S.ActionText>
          
            </S.ActionButton>
          </S.LeftBlock>

          <S.PageImage src={page} alt="page" />
        </S.MainSection>
      </S.Container>

      {showModal && <LoginModal onClose={closeModal} />}
    </>
  );
};

export default StartPage;
