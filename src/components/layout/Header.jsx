import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';
import getImageUrl from '../../utils/getImageUrl';
import profileService from '../../services/profileService';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = Boolean(localStorage.getItem('accessToken'));
  const [profileImage, setProfileImage] = useState(localStorage.getItem('profileImage') || '');
  const [profileName, setProfileName] = useState(localStorage.getItem('profileName') || 'U');
  const [isSuperuser, setIsSuperuser] = useState(localStorage.getItem('isSuperuser') === 'true');
  const [watchlistCount, setWatchlistCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const syncProfileInfo = () => {
      setProfileImage(localStorage.getItem('profileImage') || '');
      setProfileName(localStorage.getItem('profileName') || 'U');
      setIsSuperuser(localStorage.getItem('isSuperuser') === 'true');
    };

    const fetchProfileAndWatchlist = async () => {
      if (!isAuthenticated) return;
      try {
        const [profileRes, watchlistRes] = await Promise.allSettled([
          profileService.getProfile(),
          axiosInstance.get('/api/v1/watchlist/'),
        ]);

        if (isMounted && profileRes.status === 'fulfilled') {
          const prof = profileRes.value.data;
          const isSuper = Boolean(prof.is_superuser || prof.is_staff);
          setIsSuperuser(isSuper);
          localStorage.setItem('isSuperuser', isSuper ? 'true' : 'false');

          // Ensure profile name is available immediately
          if (prof.username) {
            setProfileName(prof.username);
            localStorage.setItem('profileName', prof.username);
          }

          // Preload profile image (use Cloudinary URL directly if present)
          const rawPic = prof.profile_pic;
          if (rawPic) {
            const imgUrl = getImageUrl(rawPic);
            if (imgUrl) {
              const img = new Image();
              img.src = imgUrl;
              img.onload = () => {
                if (!isMounted) return;
                setProfileImage(imgUrl);
                localStorage.setItem('profileImage', imgUrl);
                window.dispatchEvent(new Event('profile-updated'));
              };
              img.onerror = () => {
                // keep existing/default avatar on error
                localStorage.removeItem('profileImage');
              };
            }
          } else {
            // No profile pic: ensure localStorage is cleared
            localStorage.removeItem('profileImage');
            setProfileImage('');
          }
        }

        if (isMounted && watchlistRes.status === 'fulfilled') {
          const data = watchlistRes.value.data;
          const count = Array.isArray(data)
            ? data.length
            : typeof data?.count === 'number'
              ? data.count
              : Array.isArray(data?.results)
                ? data.results.length
                : 0;
          setWatchlistCount(count);
        }
      } catch {
        // ignore fetch error in header
      }
    };

    syncProfileInfo();
    if (isAuthenticated) {
      fetchProfileAndWatchlist();
    }

    const handleWatchlistUpdate = () => {
      fetchProfileAndWatchlist();
    };

    window.addEventListener('profile-updated', syncProfileInfo);
    window.addEventListener('watchlist-updated', handleWatchlistUpdate);

    return () => {
      isMounted = false;
      window.removeEventListener('profile-updated', syncProfileInfo);
      window.removeEventListener('watchlist-updated', handleWatchlistUpdate);
    };
  }, [location.pathname, isAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('profileName');
    localStorage.removeItem('profileImage');
    localStorage.removeItem('isSuperuser');
    // Clear any in-memory cached profile so a subsequent login fetches the
    // correct user's profile rather than returning stale data.
    if (profileService && typeof profileService.clearProfileCache === 'function') {
      profileService.clearProfileCache();
    }
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
