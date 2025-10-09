import styled from "styled-components";

/* ----- styled components (동일) ----- */
export const Wrapper = styled.div`
  padding: 40px 80px;
  background: #fff;
`;
export const Title = styled.h1`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 24px;
`;
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;
export const Th = styled.th`
  background: #21213f;
  color: white;
  font-weight: bold;
  padding: 12px;
  text-align: left;
`;
export const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #ddd;
`;
export const DeleteButton = styled.button`
  background-color: #b6b6e1ff;
  border: none;
  padding: 6px 14px;
  border-radius: 8px;
  color: #21213f;
  font-weight: bold;
  cursor: pointer;
  font-size: 13px;
  &:hover {
    background-color: #8c8caeff;
  }
   &:disabled {
   opacity: 0.5;
   cursor: not-allowed;
   background-color: #b6b6e1ff; /* hover 변화를 막기 위해 동일 색상 */
 }
`;

export const PrimaryButton = styled.button`
  padding: 10px 14px;
  border-radius: 10px;
  background: #21213f;
  color: #fff;
  font-weight: 700;
  border: none;
  cursor: pointer;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;


export const ConfirmBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
`;
export const ConfirmModal = styled.div`
  background: #fff;
  padding: 32px;
  border-radius: 16px;
  text-align: center;
  min-width: 360px;
`;
export const PopupTitle = styled.h2`
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
`;
export const PopupDesc = styled.p`
  font-size: 14px;
  color: #667084;
  margin-bottom: 24px;
`;
export const ModalActions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
`;
export const CancelButton = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 9999px;
  background: white;
  border: 1px solid #d0d5dd;
  color: #344054;
  font-weight: 600;
`;
export const ConfirmButton = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 9999px;
  background: #21213f;
  border: none;
  color: white;
  font-weight: 600;
  cursor: pointer;
`;

 export const RoleBadge = styled.span`
   display: inline-block;
   padding: 4px 10px;
   border-radius: 9999px;
   font-size: 12px;
   font-weight: 700;
   background: ${(p) => (p.$admin ? "#EDEBFF" : "#eee")};
   color: ${(p) => (p.$admin ? "#4f46e5" : "#333")};
   border: 1px solid ${(p) => (p.$admin ? "#c7b8ff" : "#ddd")};
 `;

 export const SmallButton = styled.button`
   background-color: #f3f4f6;
   border: 1px solid #e5e7eb;
   padding: 6px 10px;
   border-radius: 8px;
   color: #111827;
   font-weight: 600;
   font-size: 12px;
   margin-right: 8px;
   cursor: pointer;
   &:hover { background-color: #e5e7eb; }
   &:disabled { opacity: 0.6; cursor: not-allowed; }
 `;
export const Pagination = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
`;
export const PageButton = styled.button`
  padding: 8px 12px;
  border-radius: 8px;
  background: #eee;
  border: none;
  cursor: pointer;
  font-weight: 600;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
export const PageNumber = styled(PageButton)`
  background: ${(p) => (p.$active || p.isActive ? "#21213f" : "#eee")};
  color: ${(p) => (p.$active || p.isActive ? "white" : "black")};
`;
 
export const TitleRow = styled.div`
  display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;
`;
export const SearchBar = styled.div`
  display:flex; gap:8px; align-items:center;
  input {
    width: 260px; padding:8px 10px; border:1px solid #e5e7eb; border-radius:10px; font-weight:700;
  }
`;
export const ClearBtn = styled.button`
  padding:8px 10px; border:1px solid #e5e7eb; background:#f3f4f6; border-radius:10px; font-weight:700; cursor:pointer;
  &:hover{ background:#e5e7eb; }
`;

export const Muted= styled.div`
float:right
`;


export const ErrorText = styled.div`
  color: #dc2626;
  font-weight: 700;
  font-size: 13px;
`;