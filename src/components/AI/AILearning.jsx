// React 코드: AILearning.jsx
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";

const SIZE_OPTIONS = [320, 416, 512, 640, 800, 960];
const SERVER_URL = "/api";

const AILearning = ({ onFinish }) => {
  const [model, setModel] = useState("yolov8n");
  const [batchSize, setBatchSize] = useState("8");
  const [sizeIndex, setSizeIndex] = useState(3);
  const [epoch, setEpoch] = useState("100");
  const [modelName, setModelName] = useState("EyeCatch");
  const [isTraining, setIsTraining] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [initialStatusChecked, setInitialStatusChecked] = useState(false);
  const [logs, setLogs] = useState([]);
const [isStopping, setIsStopping] = useState(false);

  const imageSize = SIZE_OPTIONS[sizeIndex];

useEffect(() => {
  if (!isTraining) return;

  const interval = setInterval(async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/admin/ai/train/logs`);
      setLogs(res.data);
    } catch (err) {
      console.error("로그 로딩 실패", err);
    }
  }, 1000);

  return () => clearInterval(interval);
}, [isTraining]);  // ✅ isTraining이 true일 때만 polling


      useEffect(() => {
  const checkStatus = async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/admin/ai/train/status`);
      if (res.data.status === "TRAINING") {
        setIsTraining(true);
      }
    } catch (err) {
      console.error("학습 상태 확인 실패", err);
    } finally {
      setInitialStatusChecked(true);
    }
  };
  checkStatus();
}, []);



const handleTraining = async () => {
  // 1. 버전명 유효성 검사
  const versionMatch = modelName.match(/(\d+\.\d+v)/);
  if (!versionMatch) {
    alert("모델명에 버전명이 포함되어야 합니다. 예: EyeCatch_0.01v");
    return;
  }

  const requestBody = {
    model,
    imgs: imageSize.toString(),
    epochs: epoch,
    batchsize: batchSize,
    modelname: modelName,
  };

  setIsTraining(true);
  // ↓ 이후 기존 코드 계속 진행




    setIsTraining(true);
    try {
      const res = await axios.post(`${SERVER_URL}/admin/ai/train/start`, requestBody);

      if (res.status === 200 && res.data.training === "true") {
        // 학습 시작 성공 → 상태 폴링
        pollTrainingStatus();
      } else if (res.status === 409) {
        alert(res.data.message);
        setIsTraining(false);
      } else {
        alert("모델 학습 시작 실패");
        setIsTraining(false);
      }
    } catch (err) {
  console.error("에러 발생", err);

  // 서버 응답이 있을 경우 (예: 409, 500, 503 등)
  const message = err?.response?.data?.message || err.message;

  if (message.includes("이미 존재") || message.includes("중단")) {
    // ✅ 이미 처리된 학습 중단, 또는 경고성 메시지
    alert(message);
  } else {
    alert("학습이 중단됨 ");
  }

  setIsTraining(false);
}
  };

const pollTrainingStatus = () => {
  const interval = setInterval(async () => {
    try {
      const res = await axios.get(`${SERVER_URL}/admin/ai/train/status`);
      if (res.data.status === "COMPLETED" || res.data.status === "IDLE" || res.data.status === "STOPPED") {
        clearInterval(interval);
        setIsTraining(false);
        if (res.data.status === "COMPLETED") {
          setIsComplete(true);
        }
      }
    } catch (err) {
      clearInterval(interval);
      console.error("상태 확인 실패", err);
      setIsTraining(false);
    }
  }, 3000);
};


const handleStopTraining = async () => {
  setIsStopping(true);
  try {
    const res = await axios.post(`${SERVER_URL}/admin/ai/train/stop`);
    console.log("중단 응답", res); // ✅ 이거 추가
    setIsTraining(false);
    setLogs(prev => [...prev, "--- 학습 중단됨 ---"]);
  } catch (err) {
    console.error("중단 실패", err); // ✅ err.response 찍기
    alert("서버 오류: " + (err?.response?.data?.message || err.message));
  } finally {
    setIsStopping(false);
  }
};



  const handleFinish = () => {
    setIsComplete(false);
    onFinish?.();
  };

  return (
    <Container>
      <FormBox>
        <FieldGrid>
          <Field>
            <Label>모델 선택</Label>
            <Select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="yolov8n">yolov8n</option>
              <option value="yolov8s">yolov8s</option>
            </Select>
            <SubLabel>yolo 모델을 지정합니다.</SubLabel>
          </Field>

          <Field>
            <LabelRow>
              <Label>이미지 크기 선택</Label>
              <RangeText>{SIZE_OPTIONS[0]}–{SIZE_OPTIONS[SIZE_OPTIONS.length - 1]}</RangeText>
            </LabelRow>
            <RangeWrap>
              <RangeInput
                type="range"
                min={0}
                max={SIZE_OPTIONS.length - 1}
                step={1}
                value={sizeIndex}
                onChange={(e) => setSizeIndex(Number(e.target.value))}
              />
            </RangeWrap>
            <CurrentSize>선택된 크기: {imageSize}px</CurrentSize>
            <SubLabel>학습 이미지 크기를 지정합니다.</SubLabel>
          </Field>

          <Field>
            <Label>학습 반복 횟수</Label>
            <Input type="number" value={epoch} onChange={(e) => setEpoch(e.target.value)} />
            <SubLabel>epoch 수를 지정합니다.</SubLabel>
          </Field>

          <Field>
            <Label>배치 사이즈</Label>
            <Select value={batchSize} onChange={(e) => setBatchSize(e.target.value)}>
              <option value="8">8</option>
              <option value="16">16</option>
              <option value="32">32</option>
            </Select>
            <SubLabel>batch 사이즈를 지정합니다.</SubLabel>
          </Field>

          <Field>
            <Label>모델 명</Label>
            <Input value={modelName} onChange={(e) => setModelName(e.target.value)} />
            <SubLabel>모델명에는 반드시 버전명이 포함되어야 합니다. 예: EyeCatch_0.01v)</SubLabel>
          </Field>

          <Field />
        </FieldGrid>

        <ButtonWrap>
          <TrainButton onClick={handleTraining} disabled={isTraining || !initialStatusChecked}>
  모델 학습
</TrainButton>

        </ButtonWrap>

{isTraining && (
  <Modal>
    <ModalBox>
      <h2>모델 학습 중...</h2>
      <p>잠시만 기다려 주세요!</p>

      <LogBox>
        <h4>학습 로그</h4>
        <LogScroll>
          {Array.isArray(logs) && logs.map((line, i) => (
  <div key={i}>{line}</div>
))}

        </LogScroll>
      </LogBox>      <StopButton onClick={handleStopTraining} disabled={isStopping}>
    {isStopping ? "중단 중..." : "모델 학습 중지"}
  </StopButton>
    </ModalBox>
  </Modal>
)}


        {isComplete && (
          <Modal>
            <ModalBox>
              <h2>모델 학습 완료되었습니다!</h2>
              <p>모델 학습 완료 및 자동 적용되어 교체되었습니다.</p>
              <ModalButton onClick={handleFinish}>Okay</ModalButton>
            </ModalBox>
          </Modal>
        )}
      </FormBox>
    </Container>
  );
};

export default AILearning;


// ---------- Styled Components ----------
const Container = styled.div`
  padding: 20px;
`;

const FormBox = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center; /* 버튼 가운데 정렬 */
  background: white;
  padding: 40px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  border-radius: 20px;
`;

const FieldGrid = styled.div`
margin-top: 30px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px 24px;
  width: 100%; /* 필드 그리드가 꽉 차도록 */
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 6px;
`;

const LabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const RangeText = styled.span`
  font-size: 14px;
  color: #757575;
`;

const RangeWrap = styled.div`
  width: 100%;
  margin-bottom: 8px;
`;

const RangeInput = styled.input`
  width: 100%;
  -webkit-appearance: none;
  height: 8px;
  background: #ddd;
  border-radius: 4px;
  outline: none;
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #21213F;
    cursor: pointer;
    margin-top: -4px;
  }
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #21213F;
    cursor: pointer;
  }
`;

const CurrentSize = styled.p`
  font-size: 14px;
  margin: 8px 0;
  color: #344053;
`;

const Input = styled.input`
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid #cfd4dc;
  border-radius: 8px;
  background: #fff;
  margin-bottom: 8px;
   display: flex;
`;

const Select = styled.select`
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid #cfd4dc;
  border-radius: 8px;
  background: #fff;
  margin-bottom: 8px;
`;

const SubLabel = styled.span`
  font-size: 12px;
  color: #757575;
`;

const ButtonWrap = styled.div`
  margin-top: 80px;
  display: flex;
  justify-content: center;
`;

const TrainButton = styled.button`
  background: #21213F;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  padding: 16px 48px;
  border: none;
  border-radius: 9999px;
  cursor: pointer;
  &:hover {
    background: #5b40df;
  }
`;
const Modal = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 16px;
  z-index: 10; /* 적당한 z-index */
`;

const ModalBox = styled.div`
  background: white;
  padding: 10px;
  border-radius: 16px;
  width: 600px;
  text-align: center;
  box-shadow: 0px 6px 20px rgba(0, 0, 0, 0.2);

  h2 {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 12px;
  }

  p {
    color: #475569;
  }
`;
const ModalButton = styled.button`
  margin-top: 20px;
  padding: 10px 20px;
  border: none;
  background: #21213F;
  color: white;
  border-radius: 24px;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background: #5b40df;
  }
`;
const LogBox = styled.div`
  margin-top: 10px;
  width: 600px;
  height: 350px;
  background: #f7f7f7;
  border-radius: 12px;
  font-family: monospace;
  font-size: 13px;
    align-items: center;
      justify-content: center;


`;

const LogScroll = styled.div`
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-line;
`;

const StopButton = styled.button`
  margin-top: 10px;
  padding: 10px 10px;
  border: none;
  background: #ff4d4f;
  color: white;
  border-radius: 24px;
  font-weight: bold;
  cursor: pointer;

  &:hover {
    background: #d9363e;
  }

  &:disabled {
    background: #aaa;
    cursor: not-allowed;
  }
`;
