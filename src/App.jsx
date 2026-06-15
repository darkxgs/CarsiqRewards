import React, { useState } from 'react';
import BranchDashboard from './components/BranchDashboard';

function App() {
  const [activeBranch, setActiveBranch] = useState('sector');

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="brand">
            <img src="/logo.png" alt="شعار هندسة السيارات" className="brand-logo" />
            <h1>هندسة السيارات</h1>
          </div>
          <div className="branch-nav">
            <button 
              className={`nav-btn ${activeBranch === 'sector' ? 'active' : ''}`}
              onClick={() => setActiveBranch('sector')}
            >
              فرع القطاع
            </button>
            <button 
              className={`nav-btn ${activeBranch === 'industrial' ? 'active' : ''}`}
              onClick={() => setActiveBranch('industrial')}
            >
              فرع الصناعية
            </button>
          </div>
        </div>
      </nav>

      <main className="app-container">
        {activeBranch === 'sector' && (
          <BranchDashboard branchName="فرع القطاع" branchId="sector" />
        )}
        {activeBranch === 'industrial' && (
          <BranchDashboard branchName="فرع الصناعية" branchId="industrial" />
        )}
      </main>
    </>
  );
}

export default App;
