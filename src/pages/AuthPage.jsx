import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import VerticalPosterScroller from '../components/VerticalPosterScroller';

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === '/login';

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axiosInstance.post('/api/v1/token/', {
          username: formData.username,
          password: formData.password,
        });

        // Clear any existing auth/profile state to avoid reusing another
        // user's tokens or profile data, then store the new tokens.
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('profileName');
        localStorage.removeItem('profileImage');
        localStorage.removeItem('isSuperuser');

        localStorage.setItem('accessToken', response.data.access);
        localStorage.setItem('refreshToken', response.data.refresh);

        // Trigger components to refresh profile/watchlist state.
        window.dispatchEvent(new Event('profile-updated'));

        navigate('/movies');
      } else {
        if (formData.password !== formData.confirmPassword) {
          setErrorMessage('Passwords do not match.');
          setLoading(false);
          return;
        }

        await axiosInstance.post('/api/v1/register/', {
          userName: formData.username,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });

        setSuccessMessage('Registration successful. Please log in.');
        setFormData({ username: '', email: '', password: '', confirmPassword: '' });
        setTimeout(() => navigate('/login'), 800);
      }
    } catch (error) {
      const message = error?.response?.data?.detail || error?.response?.data?.message || 'Something went wrong.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-split-wrapper">
        {/* 3-Column Dynamic Vertical Poster Scroller */}
        <VerticalPosterScroller />

        <section className="auth-card">
          <div className="auth-card__content">
            <h1>{isLogin ? 'Welcome back' : 'Create your account'}</h1>
            <p>{isLogin ? 'Sign in to continue to OnlyCinema.' : 'Register to unlock your personal dashboard.'}</p>

            <form onSubmit={handleSubmit} className="auth-form">
              <label>
                Username
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username"
                  required
                />
              </label>

              {!isLogin && (
                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    required
                  />
                </label>
              )}

              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </label>

              {!isLogin && (
                <label>
                  Confirm Password
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                </label>
              )}

              {errorMessage && <p className="message message--error">{errorMessage}</p>}
              {successMessage && <p className="message message--success">{successMessage}</p>}

              <button type="submit" disabled={loading}>
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="auth-switch-prompt">
              {isLogin ? (
                <p>
                  Don't have an account? <Link to="/register">Register here</Link>
                </p>
              ) : (
                <p>
                  Already have an account? <Link to="/login">Sign in here</Link>
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AuthPage;
