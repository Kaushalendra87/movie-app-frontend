import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = Boolean(localStorage.getItem('accessToken'));
  const [profileImage, setProfileImage] = useState(localStorage.getItem('profileImage') || '');
  const [profileName, setProfileName] = useState(localStorage.getItem('profileName') || 'U');
  const [isSuperuser, setIsSuperuser] = useState(localStorage.getItem('isSuperuser') === 'true');
  const [watchlistCount, setWatchlistCount] = useState(0);

  const fetchProfileAndWatchlist = async () => {
    if (!isAuthenticated) return;
    try {
      const [profileRes, watchlistRes] = await Promise.allSettled([
        axiosInstance.get('/api/v1/profile/'),
        axiosInstance.get('/api/v1/watchlist/'),
      ]);

      if (profileRes.status === 'fulfilled') {
        const prof = profileRes.value.data;
        const isSuper = Boolean(prof.is_superuser || prof.is_staff);
        setIsSuperuser(isSuper);
        localStorage.setItem('isSuperuser', isSuper ? 'true' : 'false');
      }

      if (watchlistRes.status === 'fulfilled') {
        setWatchlistCount(Array.isArray(watchlistRes.value.data) ? watchlistRes.value.data.length : 0);
      }
    } catch {
      // ignore token error or fetch error in header
    }
  };

  useEffect(() => {
    const syncProfileInfo = () => {
      setProfileImage(localStorage.getItem('profileImage') || '');
      setProfileName(localStorage.getItem('profileName') || 'U');
      setIsSuperuser(localStorage.getItem('isSuperuser') === 'true');
    };

    syncProfileInfo();
    if (isAuthenticated) {
      fetchProfileAndWatchlist();
    }

    window.addEventListener('profile-updated', syncProfileInfo);
    window.addEventListener('watchlist-updated', fetchProfileAndWatchlist);

    return () => {
      window.removeEventListener('profile-updated', syncProfileInfo);
      window.removeEventListener('watchlist-updated', fetchProfileAndWatchlist);
    };
  }, [location.pathname, isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('profileName');
    localStorage.removeItem('profileImage');
    localStorage.removeItem('isSuperuser');
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="brand-block">
        <Link to="/movies" className="brand-link">
          <span className="brand-mark">🎬</span>
          <span className="brand-title">OnlyCinema</span>
        </Link>
      </div>

      <nav className="nav-links" aria-label="Primary navigation">
        {isAuthenticated ? (
          <>
            <Link to="/movies" className={location.pathname === '/movies' ? 'nav-active' : ''}>
              Catalog
            </Link>
            <Link to="/watchlist" className={`watchlist-nav-link ${location.pathname === '/watchlist' ? 'nav-active' : ''}`}>
              Watchlist
              {watchlistCount > 0 && <span className="nav-count-badge">{watchlistCount}</span>}
            </Link>

            {isSuperuser && (
              <Link to="/add-movie" className={`admin-nav-link ${location.pathname === '/add-movie' ? 'nav-active' : ''}`}>
                👑 Add Movie
              </Link>
            )}

            <Link to="/profile" className="profile-avatar-link" aria-label="Open profile">
              <div className="profile-avatar-pill">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" />
                ) : (
                  <span>{profileName.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </Link>
            <button type="button" className="text-button logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="nav-cta-button">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
