// src/App.jsx
import React, { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import SummaryPage from './pages/SummaryPage';
import AccountPage from './pages/AccountPage';
import TermsPage from './pages/TermsPage';

function App() {
  const [activePage, setActivePage] = useState('home');
  const [selectedProcessId, setSelectedProcessId] = useState(null);
  const [currentUser, setCurrentUser] = useState({ email: 'user@sme.com', id: 'usr_01' });

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

  return (
    <div className="App">
      <Navbar activePage={activePage} setActivePage={setActivePage} currentUser={currentUser} />
      <div className="content">{renderPage()}</div>
    </div>
  );
}

export default App;