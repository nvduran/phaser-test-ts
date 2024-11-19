import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/RegisterPage.css";

export const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const navigate = useNavigate();

  const securityQuestions = [
    "What was the name of your first pet?",
    "What was the make and model of your first car?",
    "What elementary school did you attend?",
    "Where were you born?",
    "What is your mother's maiden name?",
  ];

  const isValidEmail = (email: any) => {
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  };

  const handleRegister = async () => {
    if (
      !username ||
      !password ||
      !securityQuestion ||
      !securityAnswer ||
      !displayName
    ) {
      alert("Please fill in all fields.");
      return;
    }

    if (!isValidEmail(username)) {
      alert("Please enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    if (displayName.length < 3 || displayName.length > 25) {
      alert("Display Name must be between 3 and 25 characters.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3420/user-login/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
            security_question: securityQuestion,
            security_answer: securityAnswer,
            display_name: displayName,
          }),
        }
      );

      const data = await response.json();

      if (response.status === 201) {
        alert(data.message);
        navigate("/login");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error registering:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="register-page">
      <h2>Register</h2>
      <div className="register-form">
        <input
          type="email"
          placeholder="Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="text"
          placeholder="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <select
          value={securityQuestion}
          onChange={(e) => setSecurityQuestion(e.target.value)}
        >
          <option value="" disabled>
            Select a security question
          </option>
          {securityQuestions.map((question, index) => (
            <option key={index} value={question}>
              {question}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Security Answer"
          value={securityAnswer}
          onChange={(e) => setSecurityAnswer(e.target.value)}
        />
        <button onClick={handleRegister}>Register</button>
      </div>
    </div>
  );
};

export default RegisterPage;
