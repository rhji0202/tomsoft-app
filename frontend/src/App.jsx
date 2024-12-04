import { useState, useEffect } from "react";

function App() {
  const [apiStatus, setApiStatus] = useState("checking...");
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    try {
      const response = await fetch("http://localhost:8000/");
      const data = await response.json();
      setApiStatus("running");
      setApiMessage(data.message);
    } catch (error) {
      setApiStatus("error");
      setApiMessage(error.toString());
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>회원가입 응용프로그램</h1>

      <div style={{ marginTop: "20px" }}>
        <h2>백엔드 상태</h2>
        <p>상태: {apiStatus}</p>
        <p>메시지: {apiMessage}</p>
        <button onClick={checkBackendStatus}>백엔드 상태 다시 확인</button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h2>API 호출 테스트</h2>
        <button
          onClick={async () => {
            try {
              const response = await fetch("http://localhost:8000/", {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                },
              });
              const data = await response.json();
              alert(JSON.stringify(data, null, 2));
            } catch (error) {
              console.error("API 호출 중 오류 발생:", error);
              alert("API 호출에 실패했습니다.");
            }
          }}
        >
          백엔드 API 호출하기
        </button>
      </div>
    </div>
  );
}

export default App;
