import { useState, useEffect } from 'react';
import { apiCall } from './api';
import endpoints from './endpoints';
import { setToken, setUserId, isAuthenticated } from './authHelper';
import './Login.css';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);
  // using this to log in the user
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setLoading(true);
    try {
      const response = await apiCall({
        url: endpoints.login,
        method: 'POST',
        data: { username, password },
      });
      console.log(response);
      if (response.user_id) {
        setUserId(response.user_id);
      }
      if (response.access_token) {
        setToken(response.access_token);
        if (onLogin) {
          onLogin(response);
        }
        navigate('/');
      } else {
        throw new Error('No access token received');
      }
    
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}  className="login-form">
        <h2 className="login-title">Sign in to AgroWood</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          className="login-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="login-input"
        />
        <button
          type="submit"
          disabled={loading}
          className="login-button"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        {error && <div className="error-message">{error}</div>}
        <p className="login-link">
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      </form>
    </div>
  );
}
