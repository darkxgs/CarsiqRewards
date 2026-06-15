import React, { useState } from 'react';
import { loginUser } from '../services/db';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUser(username, password);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src="/logo.png" alt="هندسة السيارات" />
        <h2 style={{justifyContent: 'center', marginBottom: '2rem'}}>نظام هندسة السيارات</h2>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input 
              type="text" 
              className="form-control" 
              placeholder="اسم المستخدم" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input 
              type="password" 
              className="form-control" 
              placeholder="كلمة المرور" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
