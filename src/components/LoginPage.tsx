// LoginPage.tsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginPage.css";

interface LoginPageProps {
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setUserData: (data: { displayName: string; userId: string }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ setIsLoggedIn, setUserData }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    // Check if the username and password fields are not empty
    if (!username || !password) {
      alert("Please enter a valid username and password.");
      return;
    }

    try {
      // Make an API call to authenticate the user
      const response = await fetch("http://localhost:3420/user-login/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.status === 200) {
        // Store data in localStorage if needed
        localStorage.setItem("token", data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("isPaidUser", data.isPaidUser);
        localStorage.setItem("displayName", data.display_name);
        localStorage.setItem("userId", data.user_id);

        // Set the user data in state
        setUserData({
          displayName: data.display_name,
          userId: data.user_id,
        });

        setIsLoggedIn(true);
        navigate("/");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error logging in:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="login-page">
      <h2>Login</h2>
      <div className="login-form">
        <input
          type="text"
          placeholder="Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
      </div>
      <div className="forgot-password-link">
        <div onClick={() => navigate("/forgot-password")} className="forgot_pword">
          Forgot Password?
        </div>
      </div>
      <div className="register-link">
        Don't have an account?{" "}
        <button onClick={() => navigate("/register")} className="regist-buttn">
          Register
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
