import React, { useEffect, useState } from "react";
import styled from "styled-components";

const AIVersions = () => {
  const [versions, setVersions] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("aiVersions") || "[]");
    setVersions(saved.reverse());
  }, []);

  return (
    <Container>
      <StyledTable>
        <thead>
          <tr>
            <Th>ID</Th>
            <Th>모델 이름</Th>
            <Th>업데이트 날짜</Th>
            <Th>버전</Th>
          </tr>
        </thead>
        <tbody>
          {versions.map((v, i) => (
            <tr key={v.no}>
              <Td>{i + 1}</Td>
              <Td>{v.name}</Td>
              <Td>{v.date}</Td>
              <Td>{v.version}</Td>
            </tr>
          ))}
        </tbody>
      </StyledTable>
    </Container>
  );
};

export default AIVersions;

// --- Styled Components ---

const Container = styled.div`
  background: #ffffff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 880px;
  overflow-x: auto;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
  min-width: 600px;

  th, td {
    text-align: left;
    padding: 14px 12px;
  }

  tbody tr:hover {
    background-color: #f9f9ff;
  }
`;

const Th = styled.th`
  background-color: #21213F;
  color: #ffffff;
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.5px;
`;

const Td = styled.td`
  border-bottom: 1px solid #eeeeee;
  color: #333;
`;
