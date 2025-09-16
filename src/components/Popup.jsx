// ✅ src/components/Popup.jsx
import React from "react";
import styled from "styled-components";

const Popup = ({ title, message, onClose }) => {
  return (
    <Backdrop>
      <PopupBox>
        <PopupTitle>{title}</PopupTitle>
        <PopupMessage>{message}</PopupMessage>
        <OkayButton onClick={onClose}>
          <span>Okay</span>
        </OkayButton>
      </PopupBox>
    </Backdrop>
  );
};

export default Popup;

// ---------- Styled Components ----------
const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(52, 64, 83, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const PopupBox = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  min-width: 360px;
  box-shadow: 0px 8px 8px rgba(16, 24, 40, 0.05);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const PopupTitle = styled.span`
  font-size: 18px;
  font-weight: bold;
  color: #0f1728;
  margin-bottom: 8px;
`;

const PopupMessage = styled.span`
  font-size: 14px;
  color: #667084;
  margin-bottom: 32px;
`;

const OkayButton = styled.button`
  width: 100%;
  padding: 10px 0;
  border: 1px solid #7474c3ff;
  border-radius: 48px;
  background-color: #21213F;
  color: #ffffff;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
`;
