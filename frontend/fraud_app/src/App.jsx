// src/App.jsx
import React, { useEffect, useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import SummaryPage from './pages/SummaryPage';
import AccountPage from './pages/AccountPage';
import TermsPage from './pages/TermsPage';
import { apiService } from './services/api';

function App() {
  const [activePage, setActivePage] = useState('login');
  const [selectedProcessId, setSelectedProcessId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('auth_token')) {
      setAuthLoading(false);
      return;
    }
    apiService.getCurrentUser()
      .then((user) => {
        setCurrentUser(user);
        setActivePage('home');
      })
      .catch(() => localStorage.removeItem('auth_token'))
      .finally(() => setAuthLoading(false));
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case 'login':
        return <LoginPage setActivePage={setActivePage} setCurrentUser={setCurrentUser} />;
      case 'register':
        return <RegisterPage setActivePage={setActivePage} />;
      case 'terms':
        return <TermsPage setActivePage={setActivePage} />;
      case 'home':
        return (
          <HomePage
            setActivePage={setActivePage}
            setSelectedProcessId={setSelectedProcessId}
          />
        );
      case 'upload':
        return (
          <UploadPage
            setActivePage={setActivePage}
            setSelectedProcessId={setSelectedProcessId}
          />
        );
      case 'summary':
        return <SummaryPage processId={selectedProcessId} setActivePage={setActivePage} />;
      case 'account':
        return <AccountPage currentUser={currentUser} setActivePage={setActivePage} />;
      default:
        return <HomePage setActivePage={setActivePage} setSelectedProcessId={setSelectedProcessId} />;
    }
  };

  if (authLoading) return <div className="container">กำลังตรวจสอบเซสชัน...</div>;

  return (
    <div className="App">
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />
      <div className="content">{renderPage()}</div>
    </div>
  );
}

export default App;