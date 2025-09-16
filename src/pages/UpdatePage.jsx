import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";

export default function UpdatePage() {
  const [updates, setUpdates] = useState([]);

  useEffect(() => {
    fetchUpdateData();
  }, []);

  const fetchUpdateData = async () => {
    try {
      const res = await axios.get("/api/admin/model/update");
      if (res.data.success && Array.isArray(res.data.data)) {
        const formatted = res.data.data.map((item, index) => ({
          id: index + 1,
          nickname: item.nickname,
          date: new Date(item.createdAt).toLocaleDateString("ko-KR"), // e.g., 2025. 5. 20.
          version: item.version,
        }));
        setUpdates(formatted);
      } else {
        alert("업데이트 데이터를 불러오는 데 실패했습니다.");
      }
    } catch (error) {
      console.error("업데이트 정보 불러오기 오류:", error);
      alert("서버와의 통신 중 오류가 발생했습니다.");
    }
  };

  return (
    <Wrapper>
      <Title>모델 버전 모니터링</Title>
      <SubText>
          기기에 업데이트되는 모델의 버전 정보를 확인할 수 있습니다.
        </SubText>
      <Table>
        <thead>
          <tr>
            <Th>NO</Th>
            <Th>NICKNAME</Th>
            <Th>UPDATE DATE</Th>
            <Th>VERSION</Th>
          </tr>
        </thead>
        <tbody>
          {updates.map((row) => (
            <tr key={row.id}>
              <Td>{row.id}</Td>
              <Td>{row.nickname}</Td>
              <Td>{row.date}</Td>
              <Td>{row.version}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Wrapper>
  );
}

// 스타일 컴포넌트
const Wrapper = styled.div`
  padding: 40px 80px;
  background: #fff;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 24px;
`;

const SubText = styled.p`
  color: #757575;
  font-size: 16px;
  margin-bottom: 16px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background: #21213F;
  color: white;
  font-weight: bold;
  padding: 12px;
  text-align: left;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #ddd;
  font-size: 14px;
  color: #242c31;
`;
