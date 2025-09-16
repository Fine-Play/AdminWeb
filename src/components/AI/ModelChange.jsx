import styled from "styled-components";
import React, { useEffect, useState, useRef } from "react";


import axios from "axios";


  


const ModelChange = ({ onNavigateToVersion }) => {
  const [devices, setDevices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIp, setSelectedIp] = useState(null);
const [showUploadArea, setShowUploadArea] = useState(false);
  const itemsPerPage = 10;
  const uploadRef = useRef(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get("/api/device/monitoring");
        if (response.data.success) {
          setDevices(response.data.data);
        } else {
          console.error("데이터 조회 실패:", response.data.message);
        }
      } catch (error) {
        console.error("API 요청 실패:", error);
      }
    };

    fetchDevices();
  }, []);

  const totalPages = Math.ceil(devices.length / itemsPerPage);
  const currentData = devices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const [selectedFile, setSelectedFile] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);

  const handleFileChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const filename = file.name;
  const versionMatch = filename.match(/(\d+\.\d+v)/);

  if (!filename.endsWith(".pt") || !versionMatch) {
    alert("'.pt' 확장자이면서 이름에 '0.01v' 같은 버전명이 포함된 파일만 선택 가능합니다.");
    return;
  }

  setSelectedFile(file);
};


  const handleUploadClick = () => {
    if (selectedFile) {
      setShowConfirmModal(true);
    } else {
      alert("모델 파일을 먼저 선택해 주세요.");
    }
  };

const handleConfirmYes = async () => {
  setShowConfirmModal(false);

  if (!selectedIp || !selectedFile) {
    alert("IP 주소와 파일을 모두 선택해야 합니다.");
    return;
  }

  const formData = new FormData();
  formData.append("model", selectedFile);

  try {
    // 1. 디바이스로 모델 전송
    const uploadResponse = await axios.post(`${selectedIp}/update`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (uploadResponse.status === 200) {
      // 2. 파일명에서 버전 추출 (예: model_0.01v.pt → 0.01v)
      const filename = selectedFile.name;
      const versionMatch = filename.match(/(\d+\.\d+v)/); // 예: 0.01v, 1.0v 등
      const version = versionMatch ? versionMatch[1] : "unknown";

      // 3. 모델 버전 정보 POST 전송
      await axios.post("/api/admin/model/update", {
        version: version,
      });

      // 4. 완료 모달
      setShowCompleteModal(true);
    } else {
      setShowCompleteModal(true);
    }
  } catch (error) {
     setShowCompleteModal(true);
  }
};


  const handleCompleteOkay = () => {
    setShowCompleteModal(false);
    onNavigateToVersion?.();
  };

  const fileInputRef = useRef(null);

const handleDrop = (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  if (file && file.name.endsWith(".pt")) {
    setSelectedFile(file);
  }
};

const handleDragOver = (e) => {
  e.preventDefault(); // 필수: 기본 동작 막기
};

const handleUploadAreaClick = () => {
  fileInputRef.current?.click();
};

  const SelectedRow = styled.tr`
  background-color: #f3f0ff; // 얕은 보라색
`;



  return (
    
    <OuterContainer>
       <Wrapper>
      <Table>
        <thead>
          <tr>
            <Th>DEVICE ID</Th>
            <Th>CAM NAME</Th>
            <Th>NICKNAME</Th>
            <Th>IP</Th>
            <Th>STATUS</Th>
          </tr>
        </thead>
       <tbody>
  {currentData.map((device) => {
    const isSelected = selectedIp === device.deviceIp;
    const RowComponent = isSelected ? SelectedRow : "tr";

    return (
      <RowComponent key={device.deviceId}>
        <Td>{device.deviceId}</Td>
        <Td>{device.cameraName}</Td>
        <Td>{device.userName}</Td>
        <TdIp
          onClick={() => {
            setSelectedIp(device.deviceIp);
            setShowUploadArea(true);
            setTimeout(() => {
              uploadRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
          }}
        >
          {device.deviceIp}
        </TdIp>
        <Td>{device.deviceStatus ?? ""}</Td>
      </RowComponent>
    );
  })}
</tbody>

      </Table>

      {totalPages > 1 && (
        <Pagination>
          <PageButton
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            ◀
          </PageButton>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <PageButton
              key={num}
              onClick={() => setCurrentPage(num)}
              active={num === currentPage}
            >
              {num}
            </PageButton>
          ))}
          <PageButton
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            ▶
          </PageButton>
        </Pagination>
      )}
    </Wrapper>
    {showUploadArea && (
  <center ref={uploadRef}>
    <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "1rem", color: "#5b40df"}}>
      선택된 기기의 IP: {selectedIp}
    </h3>
 
    <UploadArea
  onClick={handleUploadAreaClick}
  onDrop={handleDrop}
  onDragOver={handleDragOver}
>
  <UploadIcon>
    {selectedFile ? (
      <>
        <div>선택한 파일: {selectedFile.name}</div>
        <div style={{ fontSize: "0.9rem", color: "#21213F" }}>
          버전: {selectedFile.name.match(/(\d+\.\d+v)/)?.[1] || "알 수 없음"}
        </div>
      </>
    ) : (
      "업로드할 모델 파일 선택 (.pt, 버전명 포함)"
    )}
  </UploadIcon>
</UploadArea>

    
   <HiddenInput
  ref={fileInputRef}
  id="file-upload"
  type="file"
  accept=".pt"
  onChange={handleFileChange}
/>
   
    <ModelButton onClick={handleUploadClick}>모델 교체</ModelButton>
  </center>
)}

      {showConfirmModal && (
        <Modal>
          <ModalBox>
            <p>해당 파일로 모델을 교체하시겠습니까?</p>
            <FileName>{selectedFile?.name}</FileName>
            <ModalButtons>
              <CancelBtn onClick={() => setShowConfirmModal(false)}>Cancel</CancelBtn>
              <ConfirmBtn onClick={handleConfirmYes}>Yes</ConfirmBtn>
            </ModalButtons>
          </ModalBox>
        </Modal>
      )}

      {showCompleteModal && (
        <Modal>
          <ModalBox>
            <p>모델 교체 완료되었습니다!</p>
            <ConfirmBtn onClick={handleCompleteOkay}>Okay</ConfirmBtn>
          </ModalBox>
        </Modal>
      )}
    </OuterContainer>
  );
};

export default ModelChange;

// Styled
const OuterContainer = styled.div`
  background: #fff;
  border-radius: 1.25rem;
  padding: 2.5rem;
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.08);
  min-height: 360px; // 최소 높이만 지정
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;


const center = styled.div`
  align-items: center;

`;
const Label = styled.label`
  cursor: pointer;
`;

const UploadArea = styled.div`
  width: 60%;
  height: 160px;
  border: 2px dashed #21213F;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
`;

const UploadIcon = styled.div`
  font-size: 2rem;
  color: #b596f3;
`;

const HiddenInput = styled.input`
  display: none;
`;

const ModelButton = styled.button`
  background-color: #21213F;
  color: white;
  border: none;
  padding: 0.7rem 1.5rem;
  border-radius: 9999px;
  font-weight: bold;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #5b40df;
  }
`;

// Modal styles
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalBox = styled.div`
  background: white;
  padding: 2rem;
  border-radius: 1rem;
  width: 300px;
  text-align: center;
`;

const FileName = styled.p`
  margin: 0.5rem 0 1.5rem;
  color: #7c3aed;
  font-weight: bold;
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: space-around;
`;

const CancelBtn = styled.button`
  border: 2px solid #ccc;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  cursor: pointer;
`;

const ConfirmBtn = styled.button`
  background-color: #21213F;
  color: white;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 9999px;
  font-weight: bold;
  cursor: pointer;
`;

const SubText = styled.p`
  color: #757575;
  font-size: 16px;
  margin-bottom: 24px;
`;



const Wrapper = styled.div`
  padding: 20px 120px;
  background: #fff;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 24px;
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
`;

const Pagination = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 8px;
`;

const PageButton = styled.button`
  padding: 6px 12px;
  border: none;
  background: ${(props) => (props.active ? "#21213F" : "#eee")};
  color: ${(props) => (props.active ? "white" : "#333")};
  font-weight: bold;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background: #21213F;
    color: white;
  }
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const TdIp = styled(Td)`
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #21213F;
    text-decoration: underline;
  }
`;
