import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import BossGameComponent from './components/BossGameComponent';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [userData, setUserData] = React.useState<{
    displayName: string;
    userId: string;
  } | null>(null); // Initialize as null

  React.useEffect(() => {
    // Retrieve user data from localStorage if available
    const storedDisplayName = localStorage.getItem('displayName');
    const storedUserId = localStorage.getItem('userId');
    const token = localStorage.getItem('token');

    if (storedDisplayName && storedUserId && token) {
      setUserData({
        displayName: storedDisplayName,
        userId: storedUserId,
      });
      setIsLoggedIn(true);
    } else {
      // Set to empty object if no data found
      setUserData({
        displayName: '',
        userId: '',
      });
    }
  }, []);

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
