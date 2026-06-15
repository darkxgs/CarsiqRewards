import React, { useState, useEffect } from 'react';
import BranchDashboard from './components/BranchDashboard';
import Login from './components/Login';
import { fetchBranches, addBranch, logoutUser } from './services/db';
import { LogOut, Plus, MapPin } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [branches, setBranches] = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchType, setNewBranchType] = useState('mixed');

  useEffect(() => {
    if (isAuthenticated) {
      loadBranches();
    }
  }, [isAuthenticated]);

  const loadBranches = async () => {
    try {
      const data = await fetchBranches();
      setBranches(data);
      if (data.length > 0 && !activeBranch) {
        setActiveBranch(data[0]);
      }
    } catch (err) {
      if (err.message.includes('401') || err.message.includes('403')) {
        handleLogout();
      }
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
  };

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!newBranchName) return;
    try {
      const added = await addBranch(newBranchName, newBranchType);
      setBranches([...branches, added]);
      setActiveBranch(added);
      setNewBranchName('');
      setShowAddBranch(false);
    } catch (err) {
      alert('فشل إضافة الفرع');
    }
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo" />
          <h1>هندسة السيارات</h1>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {branches.map(branch => (
            <button
              key={branch.id}
              className={`nav-link ${activeBranch?.id === branch.id ? 'active' : ''}`}
              onClick={() => setActiveBranch(branch)}
            >
              <MapPin size={20} />
              {branch.name}
            </button>
          ))}

          {showAddBranch ? (
            <form onSubmit={handleAddBranch} style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="اسم الفرع"
                value={newBranchName}
                onChange={e => setNewBranchName(e.target.value)}
                required
                style={{ marginBottom: '0.5rem' }}
              />
              <select 
                className="form-control" 
                value={newBranchType} 
                onChange={e => setNewBranchType(e.target.value)}
                style={{ marginBottom: '0.5rem' }}
              >
                <option value="hours">ساعات فقط</option>
                <option value="money">مبالغ مالية</option>
                <option value="mixed">مختلط (ساعات ومبالغ)</option>
              </select>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem', flex: 1 }}>حفظ</button>
                <button type="button" className="btn" style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem' }} onClick={() => setShowAddBranch(false)}>إلغاء</button>
              </div>
            </form>
          ) : (
            <button className="nav-link" onClick={() => setShowAddBranch(true)} style={{ marginTop: '1rem', border: '1px dashed rgba(255,255,255,0.2)', justifyContent: 'center' }}>
              <Plus size={20} /> إضافة فرع
            </button>
          )}
        </nav>

        <button className="nav-link" onClick={handleLogout} style={{ color: '#ef4444', marginTop: 'auto' }}>
          <LogOut size={20} /> تسجيل الخروج
        </button>
      </aside>

      <main className="main-content">
        {activeBranch ? (
          <BranchDashboard 
            key={activeBranch.id} 
            branchId={activeBranch.id} 
            branchName={activeBranch.name} 
            branchType={activeBranch.type} 
          />
        ) : (
          <div style={{ textAlign: 'center', marginTop: '5rem', color: 'rgba(255,255,255,0.5)' }}>
            <h2>جاري التحميل أو لا يوجد فروع...</h2>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
