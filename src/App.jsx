import { useState } from "react";
import { auth } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

function App() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  const handleSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pw);
      console.log("회원가입 성공:", userCredential.user);
    } catch (error) {
      console.error("에러:", error.message);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>회원가입</h2>
      <input type="email" placeholder="이메일" onChange={e => setEmail(e.target.value)} /><br />
      <input type="password" placeholder="비밀번호" onChange={e => setPw(e.target.value)} /><br />
      <button onClick={handleSignup}>가입하기</button>
    </div>
  );
}

export default App;
