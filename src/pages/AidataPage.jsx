import React from "react";
import { useNavigate } from "react-router-dom";
import DataList from "../components/AIData/DataList";
import styled from "styled-components";

const AIDataPage = () => {
  const navigate = useNavigate();

  const handleModelChangeComplete = () => {
    navigate("/aidata");
  };

  return (
    <Wrapper>
      <Section>
        <SectionTitle>데이터 관리</SectionTitle>
        <SubText>
          학습에 사용되는 이미지 및 라벨 데이터를 확인하고 관리할 수 있습니다. 해당 데이터들은 AI 학습에 활용될 train 데이터입니다.
        </SubText>
        <DataList />
      </Section>
    </Wrapper>
  );
};

export default AIDataPage;

// --- styled-components ---
const Wrapper = styled.div`
  background-color: white;
`;

const Section = styled.section`
  padding: 40px 80px;
  margin-bottom: 60px;
`;

const SectionTitle = styled.h2`
  font-size: 28px;
  font-weight: bold;
  color: #242c31;
  margin-bottom: 4px;
`;

const SubText = styled.p`
  color: #757575;
  font-size: 16px;
  margin-bottom: 16px;
`;




