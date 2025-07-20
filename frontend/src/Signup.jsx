import { useState } from 'react';
import { apiCall } from './api';
import { useNavigate } from 'react-router-dom';
import endpoints from './endpoints';
import { setToken } from './authHelper';
import './Signup.css';

export default function Signup({ onLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await apiCall({
        url: endpoints.signup,
        method: 'POST',
        data: { username, email, password },
      });
      
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
  };

  return (
    <div className="signup-container">
      <form onSubmit={handleSubmit} className="signup-form">
        <h2 className="signup-title">Create your AgroWood Account</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          className="signup-input"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="signup-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="signup-input"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          className="signup-input"
        />
        <button
          type="submit"
          disabled={loading}
          className="signup-button"
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
        {error && <div className="error-message">{error}</div>}
        <p className="login-link">
          Already have an account? <a href="/login">Sign in</a>
        </p>
      </form>
    </div>
  );
}
