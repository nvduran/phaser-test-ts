import './App.css'
import React from 'react';
import { BrowserRouter as Router, Route, Routes  } from 'react-router-dom';
import BossGame from './components/BossGameComponent.tsx'
import LoginPage from './components/LoginPage.tsx'
import RegisterPage from './components/RegisterPage.tsx'


function App() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<BossGame />} />
          <Route path="/login" element={<LoginPage setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/register" element={<RegisterPage />} />

        </Routes>
        
      </div>
    </Router>  );
}

export default App;
