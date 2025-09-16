
import styled from "styled-components";
import { Link} from "react-router-dom";



// ---------------- styled ----------------
export const PageWrapper = styled.div`
  padding: 24px 28px 80px;
  background: #fff;
`;

export const StickyHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 20;
  background: #fff;
  padding: 12px 0 16px;
  border-bottom: 1px solid #eef0f4;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const Breadcrumb = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
  a {
    color: #374151;
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
`;
export const Crumb = styled(Link)``;
export const CrumbSep = styled.span``;
export const CrumbCurrent = styled.span`
  color: #111827;
  font-weight: 700;
`;

export const HeaderRight = styled.div`
  display: flex;
  gap: 8px;
`;

export const OutlineBtn = styled.button`
  padding: 8px 12px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #d1d5db;
  font-weight: 700;
  cursor: pointer;
  &:hover {
    background: #f9fafb;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const PrimaryBtn = styled(OutlineBtn)`
  background: #21213f;
  color: #fff;
  border-color: #21213f;
  &:hover {
    opacity: 0.95;
  }
`;

export const TopRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
  margin-top: 16px;
`;

export const Avatar = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #edebff;
  color: #4f46e5;
  font-weight: 900;
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const H1 = styled.h1`
  font-size: 28px;
  font-weight: 900;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Chip = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 800;
  ${({ $tone }) => {
    switch ($tone) {
      case "green":
        return `background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0;`;
      case "red":
        return `background:#fef2f2; color:#991b1b; border:1px solid #fecaca;`;
      case "indigo":
        return `background:#EDEBFF; color:#4f46e5; border:1px solid #c7b8ff;`;
      default:
        return `background:#f3f4f6; color:#374151; border:1px solid #e5e7eb;`;
    }
  }}
`;

export const MetaRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 6px;
  font-size: 14px;
`;
export const K = styled.div`
  width: 80px;
  color: #6b7280;
  font-weight: 600;
`;
export const V = styled.div`
  color: #111827;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
`;
export const CopyBtn = styled.button`
  padding: 4px 8px;
  border-radius: 8px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  &:hover {
    background: #e5e7eb;
  }
`;

export const ActionCluster = styled.div`
  display: flex;
  gap: 8px;
`;
export const ActionBtn = styled(PrimaryBtn)`
  background: #f3f4f6;
  color: #111827;
  border-color: #e5e7eb;
`;
export const DangerBtn = styled(PrimaryBtn)`
  background: #b91c1c;
  border-color: #b91c1c;
`;

export const TabBar = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 18px;
  border-bottom: 1px solid #eef0f4;
`;
export const Tab = styled.button`
  padding: 10px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-weight: 800;
  border-bottom: 3px solid
    ${({ $active }) => ($active ? "#21213f" : "transparent")};
  color: ${({ $active }) => ($active ? "#21213f" : "#6b7280")};
  &:hover {
    color: #111827;
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

export const Card = styled.div`
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
`;
export const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 800;
  margin-bottom: 12px;
`;

export const KV = styled.dl`
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 8px 16px;
  align-items: center;
  margin: 10px 0;
  dt {
    color: #6b7280;
    font-weight: 700;
  }
  dd {
    color: #111827;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }
`;

export const Divider = styled.div`
  height: 1px;
  background: #f3f4f6;
  margin: 16px 0;
`;
export const InlineHint = styled.div`
  font-size: 12px;
  color: #6b7280;
`;

export const InlineActions = styled.div`
  display: flex;
  gap: 8px;
`;

export const Tag = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
`;

export const MiniTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  th,
  td {
    padding: 10px;
    border-bottom: 1px solid #f1f5f9;
    text-align: left;
  }
  thead th {
    background: #f8fafc;
    color: #111827;
    font-weight: 800;
  }
`;
export const SmallBtn = styled.button`
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 6px 10px;
  border-radius: 8px;
  color: #111827;
  font-weight: 700;
  font-size: 12px;
  margin-right: 8px;
  cursor: pointer;
  &:hover {
    background: #e5e7eb;
  }
`;

export const Segmented = styled.div`
  display:inline-flex; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;
`;
export const SegBtn = styled.button`
  padding:6px 12px; border:none; cursor:pointer; font-weight:800;
  background:${({$active})=>$active?"#21213f":"#fff"};
  color:${({$active})=>$active?"#fff":"#111827"};
  &:not(:last-child){ border-right:1px solid #e5e7eb; }
  &:disabled{ opacity:.6; cursor:not-allowed; }
`;

export const Muted = styled.div`
  color: #9ca3af;
  font-size: 14px;
  padding: 4px 0;
`;

export const Timeline = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
  li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px dashed #eef0f4;
  }
`;
export const Dot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #21213f;
  display: inline-block;
`;
export const Time = styled.time`
  font-size: 12px;
  color: #6b7280;
  width: 160px;
`;
export const EventText = styled.span`
  font-weight: 700;
  color: #111827;
`;

export const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;
export const ModalCard = styled.div`
  background: #fff;
  padding: 24px;
  border-radius: 16px;
  width: 360px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
`;
export const ModalTitle = styled.h3`
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 900;
`;
export const ModalText = styled.p`
  margin: 0 0 16px;
  color: #6b7280;
  font-size: 14px;
`;
export const ModalRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

export const Toast = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #111827;
  color: #fff;
  padding: 8px 12px;
  border-radius: 10px;
  font-weight: 800;
  z-index: 60;
`;


export const SectionTitle = styled.h3`
  margin: 14px 0 8px;
  font-size: 13px;
  font-weight: 900;
  color: #6b7280;
`;

export const StatTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  td { padding: 8px 10px; font-weight: 800; }
  td.val { text-align: right; }
`;

export const palette = {
  FW: { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b" }, // 빨강
  MF: { bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46" }, // 초록
  DF: { bg: "#eff6ff", border: "#93c5fd", text: "#1e40af" }, // 파랑
};

export const StatRow = styled.tr`
  ${({ $highlight, $variant }) => $highlight && `
    background: ${(palette[$variant]?.bg) || "#f3f4f6"};
    border-left: 4px solid ${(palette[$variant]?.border) || "#e5e7eb"};
    td, td.val { color: ${(palette[$variant]?.text) || "#111827"}; }
  `}
  &:not(:last-child) td { border-bottom: 1px dashed #eef0f4; }
`;

export const OvrBox = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 10px;
  background: #fafafa;
`;
export const OvrLabel = styled.span` font-weight: 900; color: #6b7280; `;
export const OvrValue = styled.span` font-weight: 900; font-size: 20px; color: #111827; `;

export const RoleTag = styled(Tag)`
  ${({ $leader }) =>
    $leader
      ? `background:#fef3c7; color:#92400e; border-color:#fcd34d;`  // 팀장 = 앰버(골드) 느낌
      : ``}
`;

