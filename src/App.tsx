// App.tsx

import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import BossGameComponent from './components/BossGameComponent';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [userData, setUserData] = React.useState({
    displayName: '',
    userId: '',
    // Add other user data fields here if needed
  });

  return (
    <Router>
      <div>
        <Routes>
          <Route
            path="/"
            element={<BossGameComponent userData={userData} />}
          />
          <Route
            path="/login"
            element={
              <LoginPage
                setIsLoggedIn={setIsLoggedIn}
                setUserData={setUserData}
              />
            }
          />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
