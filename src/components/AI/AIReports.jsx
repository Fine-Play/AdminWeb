import React, { useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";


const imageOrder = [
  {
    name: "F1 Curve",
    src: "/`F1_curve.png",
    desc:
      "Confidence threshold에 따른 F1 점수의 변화를 나타냅니다. " +
      "F1 점수는 정밀도(Precision)와 재현율(Recall)의 조화 평균으로, " +
      "모델이 얼마나 균형 있게 예측했는지를 보여줍니다. 가장 두꺼운 곡선은 전체 평균입니다.",
  },
  {
    name: "Precision Curve",
    src: "/P_curve.png",
    desc:
      "Confidence가 높아질수록 예측의 정확도(Precision)가 어떻게 변하는지를 나타냅니다. " +
      "높은 Precision은 모델이 예측한 클래스가 실제로도 맞을 확률이 높다는 것을 의미합니다.",
  },
  {
    name: "Recall Curve",
    src: "/R_curve.png",
    desc:
      "Confidence 값에 따라 재현율(Recall)이 어떻게 변하는지 나타냅니다. " +
      "Recall은 실제 객체 중 얼마나 많이 탐지했는지를 의미하며, 낮은 Confidence일수록 일반적으로 높은 값을 보입니다.",
  },
  {
    name: "PR Curve",
    src: "/PR_curve.png",
    desc:
      "Precision-Recall 간의 관계를 보여주는 곡선입니다." +
      "이 곡선을 통해 모델이 얼마나 정밀하게, 그리고 얼마나 많이 객체를 탐지하는지 균형을 확인할 수 있습니다. " +
      "PR-AUC 값이 높을수록 모델의 탐지 성능이 우수합니다.",
  },
  {
    name: "Labels Heatmap",
    src: "/labels.png",
    desc:
      "클래스별 인스턴스 개수와 바운딩 박스 분포를 시각화한 히트맵입니다. " +
      "왼쪽 상단은 각 클래스의 데이터 개수를 보여주고, 나머지 그래프는 위치, 크기 분포를 확인할 수 있습니다. " +
      "데이터 불균형, 학습 편향 등을 파악하는 데 유용합니다.",
  },
  {
    name: "Results Summary",
    src: "/results.png",
    desc:
      "전체 학습 과정에서의 손실(loss) 변화와 성능 지표(mAP, Precision, Recall)의 추이를 시각화한 종합 그래프입니다. " +
      "학습이 수렴했는지, 과적합이 발생했는지 등을 판단할 수 있는 핵심 시각 자료입니다.",
  },
];

const AIReports = () => {
  const [models, setModels] = useState([]);
  const [modelDir, setModelDir] = useState(null);
  const [images, setImages] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [showModal, setShowModal] = useState(false);
const [pendingDeleteModel, setPendingDeleteModel] = useState(null);

  const SERVER_URL = "http://ceprj.gachon.ac.kr:60004"; // 학과 서버 주소로 바꿔줘
  useEffect(() => {
    axios
      .get(`${SERVER_URL}/api/admin/ai/models`)
      .then((res) => setModels(res.data))
      .catch((err) => console.error("모델 리스트 로드 실패", err));
  }, []);

  useEffect(() => {
    if (!modelDir) return;
    axios
      .get(`${SERVER_URL}/api/admin/ai/results?modelDir=${modelDir}`)
      .then((res) => {
        const merged = res.data.map((img) => {
          const found = imageOrder.find((item) => item.name === img.name);
          return {
            ...img,
            desc: found ? found.desc : "설명 준비 중",
          };
        });
        setImages(merged);
      })
      .catch((err) => console.error("이미지 로드 실패", err));
  }, [modelDir]);
 

  return (
    <FormBox>
  <select onChange={(e) => setModelDir(e.target.value)}>
    <option disabled selected value="">모델 선택</option>
    {models.map((dir) => (
      <option key={dir} value={dir}>{dir}</option>
    ))}
  </select>

  {images.length > 0 && (
    <>
      <ImageGrid>
        {images.map((img, idx) => (
          <ChartContainer
            key={img.name}
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
          >
            <ChartImage
              src={`${SERVER_URL}${img.url}`}
              alt={img.name}
              $isHovered={hovered === idx}
            />
            <Label>{img.name}</Label>
            {hovered === idx && <Description>{img.desc}</Description>}
          </ChartContainer>
        ))}
      </ImageGrid>

      {/* ✅ 다운로드 버튼을 그리드 아래에 정가운데로 분리 */}
 

      <ButtonWrapper>
  <DownloadLink
    href={`${SERVER_URL}/api/admin/ai/models/${modelDir}.pt`}
    download
    target="_blank"
    rel="noopener noreferrer"
  >
    {modelDir}.pt 다운로드
  </DownloadLink>

  <DeleteButton
  onClick={() => {
    setPendingDeleteModel(modelDir);
    setShowModal(true);
  }}
>
  모델 삭제
</DeleteButton>

</ButtonWrapper>

    </>
  )}
   {showModal && (
  <Modal>
    <ModalBox>
      <h2>정말 삭제하시겠습니까?</h2>
      <p>선택한 모델 "{pendingDeleteModel}"을(를) 삭제하면 복구할 수 없습니다.</p>
      <div style={{ marginTop: "20px" }}>
        <ModalButton
          onClick={() => {
            axios
              .delete(`${SERVER_URL}/api/admin/ai/models/${pendingDeleteModel}`)
              .then(() => {
                alert("모델 삭제 완료");
                setModelDir(null);
                setImages([]);
                setShowModal(false);
                setPendingDeleteModel(null);
                axios.get(`${SERVER_URL}/api/admin/ai/models`)
                     .then((res) => setModels(res.data));
              })
              .catch((err) => {
                alert("삭제 실패: " + err.response?.data?.message || err.message);
                setShowModal(false);
              });
          }}
        >
          삭제 확인
        </ModalButton>

        <ModalButton
          style={{ background: "#ddd", color: "#333", marginLeft: "10px" }}
          onClick={() => {
            setShowModal(false);
            setPendingDeleteModel(null);
          }}
        >
          취소
        </ModalButton>
      </div>
    </ModalBox>
  </Modal>
)}
</FormBox>

  );
 

};



export default AIReports;
const FormBox = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  padding: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
  border-radius: 20px;
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-top: 2rem;
  width: 100%;
`;

const ChartContainer = styled.div`
  background: #fff;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.3s ease;
`;

const ChartImage = styled.img`
  width: 100%;
  height: 220px;
  object-fit: contain;
  border-radius: 8px;
  transition: transform 0.3s ease;
  transform: ${({ $isHovered }) => ($isHovered ? "scale(1.5)" : "scale(1)")};
`;

const Label = styled.p`
  text-align: center;
  font-size: 16px;
  color: #333;
  font-weight: bold;
  margin-top: 1rem;
`;

const Description = styled.p`
  font-size: 16px;
  color: #757575;

  margin-top: 8px;
  text-align: center;
  animation: fadeIn 0.3s ease-in-out;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ButtonWrapper = styled.div`
  margin-top: 24px;
  text-align: center;
`;

const DownloadLink = styled.a`
  display: inline-block;
  padding: 10px 18px;
   background: #21213F;
  color: white;
  font-weight: 500;
  font-size: 15px;
  border-radius: 24px;
  text-decoration: none;
  transition: background-color 0.2s ease;

  &:hover {
    background: #5b40df;
  }
`;

const DeleteButton = styled.button`
  margin-left: 16px;
  padding: 10px 18px;
  background-color: #dc3545;
  color: white;
  font-weight: 500;
  font-size: 15px;
  border-radius: 24px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #b02a37;
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