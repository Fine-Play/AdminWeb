import React, { useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";

const DataList = () => {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [hovered, setHovered] = useState(null);
  const [total, setTotal] = useState(0);
  const [inputPage, setInputPage] = useState("");
  const [selectedClass, setSelectedClass] = useState("전체");

  const size = 10;
  const totalPages = Math.ceil(total / size);

  useEffect(() => {
  const url =
    selectedClass === "전체"
      ? `${SERVER_URL}/admin/aidata/files?page=${page}&size=${size}`
      : `${SERVER_URL}/admin/aidata/files/by-class?className=${selectedClass}&page=${page}&size=${size}`;

  axios
    .get(url)
    .then((res) => {
      setData(res.data.files);
      setTotal(res.data.total);
    })
    .catch((err) => console.error("데이터 불러오기 실패", err));
}, [page, selectedClass]);


  const SERVER_URL = "/api";

  useEffect(() => {
    axios
      .get(`${SERVER_URL}/admin/aidata/files?page=${page}&size=10`)
      .then((res) => setData(res.data.files))
      .catch((err) => console.error("데이터 불러오기 실패", err));
  }, [page]);

  const getVisiblePages = (current, total) => {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = [];
    if (current <= 3) {
      pages.push(1, 2, 3, 4, "...", total);
    } else if (current >= total - 2) {
      pages.push(1, "...", total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, "...", current - 1, current, current + 1, "...", total);
    }
    return pages;
  };
const handleDelete = (filename) => {
  if (!window.confirm(`${filename} 파일을 삭제할까요?`)) return;

  axios
    .delete(`${SERVER_URL}/admin/aidata/delete?name=${filename}`)
    .then(() => {
      alert("삭제 완료");

      // ✅ 삭제된 항목을 제외하고 목록 갱신
      setData((prev) => prev.filter((item) => item.image !== filename));
    })
    .catch((err) => {
      alert("삭제 실패: " + err.message);
    });
};


const handleUpload = (e) => {
  e.preventDefault();
  const formData = new FormData();

  const imageFiles = e.target.image.files;
  const labelFiles = e.target.label.files;

  if (imageFiles.length !== labelFiles.length) {
    alert("이미지와 라벨 수가 다릅니다.");
    return;
  }

  for (let i = 0; i < imageFiles.length; i++) {
    formData.append("image", imageFiles[i]);
    formData.append("label", labelFiles[i]);
  }

  axios
    .post(`${SERVER_URL}/admin/aidata/upload`, formData)
    .then(() => {
      alert("업로드 성공");
      setPage(1);
    })
     .catch(err => {
    if (err.response && err.response.status === 400) {
      alert("잘못된 클래스 ID 포함: " + err.response.data.message);
    } else {
      alert("서버 오류: " + err.message);
    }
  });
};

const handleFolderUpload = (e) => {
  e.preventDefault();
  const formData = new FormData();

  const imageFiles = document.getElementById("imageFolder").files;
  const labelFiles = document.getElementById("labelFolder").files;

  if (imageFiles.length === 0 || labelFiles.length === 0) {
    alert("이미지와 라벨 폴더를 모두 선택해주세요.");
    return;
  }

  for (let file of imageFiles) {
    formData.append("image", file, file.webkitRelativePath);
  }
  for (let file of labelFiles) {
    formData.append("label", file, file.webkitRelativePath);
  }

  axios
    .post(`${SERVER_URL}/admin/aidata/upload`, formData)
    .then(() => {
      alert("폴더 업로드 성공");
      setPage(1);
    })
    .catch((err) => {
      alert("업로드 실패: " + err.message);
    });
};


  return (
    <div>
      <UploadWrapper>
       
 <AllUploadBox>
  <Uploadlabel>
  <text>✓ 클래스 ID는 0~2의 정수만 허용되며, 각각 고양이(0), 개(1), 사람(2)을 의미합니다.
</text>
</Uploadlabel>
  <UploadBox onSubmit={handleUpload}>
    <UploadGroup>
      <label >📜 이미지/라벨 파일 업로드</label>
  
      <label htmlFor="imageInput">이미지 파일</label>
      <input id="imageInput" type="file" name="image" accept="image/*" multiple required />
    </UploadGroup>
    
    <UploadGroup>
      <label htmlFor="labelInput">라벨 파일</label>
      <input id="labelInput" type="file" name="label" accept=".txt" multiple required />
    </UploadGroup>
    <UploadButton type="submit">파일 업로드</UploadButton>
  </UploadBox>
  
<FolderUploadBox onSubmit={handleFolderUpload}>
  <UploadGroup>
  <label >📁 이미지/라벨 폴더 업로드</label>
  
    <label htmlFor="imageFolder">이미지 폴더</label>
    <input id="imageFolder" type="file" name="image" webkitdirectory="true" directory="true" multiple required />
  </UploadGroup>
  <UploadGroup>
    <label htmlFor="labelFolder">라벨 폴더</label>
    <input id="labelFolder" type="file" name="label" webkitdirectory="true" directory="true" multiple required />
  </UploadGroup>
  <UploadButton type="submit">폴더 업로드</UploadButton>
</FolderUploadBox>

</AllUploadBox>


<FilterUploadRow>
 <FilterBox>
    <label htmlFor="classFilter">클래스 필터: </label>
    <select
      id="classFilter"
      value={selectedClass}
      onChange={(e) => {
        setSelectedClass(e.target.value);
        setPage(1);
      }}
    >
      <option value="전체">전체</option>
      <option value="cat">고양이 (cat)</option>
      <option value="dog">강아지 (dog)</option>
      <option value="person">사람 (person)</option>
    </select>
  </FilterBox>
</FilterUploadRow>
</UploadWrapper>
      <Table>
        <colgroup>
          <col style={{ width: "25%" }} />
          <col style={{ width: "25%" }} />
          <col style={{ width: "50%" }} />
        </colgroup>
        <thead>
          <tr>
            <th>이미지</th>
            <th>라벨 파일</th>
            <th>라벨 내용</th>
             <th>삭제</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.image}>
              <td style={{ textAlign: "center" }}>
                <ImageWrapper
                  onMouseEnter={() => setHovered(item.image)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <Thumbnail
                    src={`${SERVER_URL}/admin/aidata/download?type=images&name=${item.image}`}
                    alt={item.image}
                  />
                  {hovered === item.image &&
                    item.parsedLabels?.map((label, i) => (
                      <Box
                        key={i}
                        style={{
                          left: `${(label.x - label.w / 2) * 100}%`,
                          top: `${(label.y - label.h / 2) * 100}%`,
                          width: `${label.w * 100}%`,
                          height: `${label.h * 100}%`,
                        }}
                      >
                        {label.class}
                      </Box>
                    ))}
                </ImageWrapper>
              </td>

              <td>{item.label}</td>
              
              <td>
                <pre>{item.labelText || "없음"}</pre>
              </td>
               <td>
  <DeleteButton onClick={() => handleDelete(item.image)}>
    삭제
  </DeleteButton>
</td>
             
            </tr>
          ))}
        </tbody>
      </Table>

      <Pagination>
        <NavBtn disabled={page === 1} onClick={() => setPage(page - 1)}>
          &lt; 이전
        </NavBtn>

        {getVisiblePages(page, totalPages).map((p, i) =>
          p === "..." ? (
            <Dots key={`dots-${i}`}>...</Dots>
          ) : (
            <PageBtn key={p} active={p === page} onClick={() => setPage(p)}>
              {p}
            </PageBtn>
          )
        )}

        <NavBtn
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          다음 &gt;
        </NavBtn>

        <JumpBox>
          <PageInput
            type="number"
            min={1}
            max={totalPages}
            value={inputPage}
            onChange={(e) => setInputPage(e.target.value)}
          />
          <span>/{totalPages}</span>
          <JumpButton
            onClick={() => {
              const num = parseInt(inputPage);
              if (!isNaN(num) && num >= 1 && num <= totalPages) {
                setPage(num);
                setInputPage("");
              }
            }}
          >
            이동
          </JumpButton>
        </JumpBox>
      </Pagination>
    </div>
  );
};

export default DataList;

const FilterBox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  label {
    font-size: 15px;
    font-weight: 600;
    color: #21213F;
  }

  select {
    padding: 6px 12px;
    border-radius: 6px;
    border: 2px solid #21213F;
    background-color: white;
    color: #21213F;
    font-weight: 600;
    font-size: 14px;
    outline: none;
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml;utf8,<svg fill='21213F' height='12' viewBox='0 0 24 24' width='12' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-size: 12px;
    padding-right: 30px;

    &:focus {
      border-color: #5c40e5;
      box-shadow: 0 0 0 2px rgba(107, 78, 255, 0.2);
    }

    &:hover {
      background-color: #f5f3ff;
    }
  }
`;

const Thumbnail = styled.img`
  width: 100%;
  max-width: 250px;
  height: auto;
  object-fit: contain;
  border: 2px solid #21213F;
  border-radius: 6px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: 0 0 0 3px rgba(107, 78, 255, 0.2);
  }
`;

const Table = styled.table`
  margin-top: 20px; // ✅ 여유 공간 확보

  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: #0f172a;

  th,
  td {
    border: 1px solid #e2e8f0;
    padding: 12px;
    text-align: center;
    vertical-align: middle;
  }

  th {
    background-color: #f5f3ff;
    font-weight: 700;
    color: #21213F;
    border-bottom: 2px solid #21213F;
  }

  pre {
    font-size: 14px;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
    font-family: inherit;
    color: #334155;
  }
`;

const ImageWrapper = styled.div`
  position: relative;
  display: inline-block;
  width: 250px;
  padding: 4px;
  border-radius: 6px;
  background-color: #fdfbff;
`;


const Box = styled.div`
  position: absolute;
  border: 2px solid #21213F;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  font-size: 12px;
  padding: 2px 4px;
  pointer-events: none;
  z-index: 5;
  transition: border 0.2s ease;
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 32px;
  flex-wrap: wrap;
`;

const PageBtn = styled.button`
  background: ${(props) => (props.active ? "#21213F" : "#fff")};
  color: ${(props) => (props.active ? "#fff" : "#21213F")};
  border: 1.5px solid #21213F;
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => (props.active ? "#5c40e5" : "#f5f3ff")};
  }
`;

const NavBtn = styled(PageBtn)`
  background: none;
  color: #21213F;
  border: none;

  &:disabled {
    color: #cbd5e1;
    cursor: default;
  }
`;

const Dots = styled.span`
  padding: 0 6px;
  color: #94a3b8;
  font-weight: bold;
`;

const JumpBox = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 20px;
  font-size: 14px;
  color: #21213F;
`;

const PageInput = styled.input`
  width: 48px;
  padding: 6px 8px;
  border: 1.5px solid #21213F;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
  font-size: 14px;
  color: #21213F;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(107, 78, 255, 0.15);
  }
`;

const JumpButton = styled.button`
  padding: 6px 12px;
  border: 1.5px solid #21213F;
  background-color: white;
  color: #21213F;
  font-weight: 600;
  font-size: 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f3ff;
  }
`;

const DeleteButton = styled.button`
  background-color: #dc2626;
  color: white;
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  font-size: 13px;
  cursor: pointer;

  &:hover {
    background-color: #b91c1c;
  }
`;




const UploadBox = styled.form`
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  padding: 6px 12px 4px 12px;
  border: 1.5px solid #21213F;
  border-radius: 8px;
  background-color: #f9f9ff;
`;


const UploadGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 13px;
    font-weight: 600;
    color: #21213F;
    margin-bottom: 2px;
  }

  input[type="file"] {
    font-size: 13px;
    cursor: pointer;
  }
`;

const UploadButton = styled.button`
  padding: 8px 16px;
  background-color: #21213F;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background-color: #5c40e5;
  }
`;
const FolderUploadBox = styled.form`
display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  padding: 6px 12px 4px 12px;
  border: 1.5px solid #21213F;
  border-radius: 8px;
  background-color: #f9f9ff;
  h4 {
    color: #21213F;
    margin: 0;
    font-weight: 700;
  }
`;
const UploadWrapper = styled.div`
  margin-top: 60px; // ✅ 여유 공간 확보

  position: relative;
  min-height: 150px; // 공간 확보

`;

const Uploadlabel=  styled.div`

 font-size: 13px;
    font-weight: 450;
    color: gray;
    margin-bottom: 2px;
`; 

const FilterUploadRow = styled.div`

  position: absolute;
  left: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap:10px;
`; 

const AllUploadBox = styled.div`

  position: absolute;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;
