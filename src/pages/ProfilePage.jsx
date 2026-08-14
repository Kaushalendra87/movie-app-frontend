import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import profileService from '../services/profileService';
import getImageUrl from '../utils/getImageUrl';

const emptyForm = {
  bio: '',
  date_of_birth: '',
  location: '',
  favourite_genre: '',
};

function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'watchlist', 'reviews'

  const [watchlistItems, setWatchlistItems] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [moviesMap, setMoviesMap] = useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const syncProfileToHeader = useCallback((data) => {
    if (data?.username) {
      localStorage.setItem('profileName', data.username);
    }
    if (data?.profile_pic) {
      localStorage.setItem('profileImage', getImageUrl(data.profile_pic));
    } else {
      localStorage.removeItem('profileImage');
    }
    window.dispatchEvent(new Event('profile-updated'));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchProfileAndUserData = async () => {
      try {
        setLoading(true);
        const [profileRes, watchlistRes, reviewsRes, moviesRes] = await Promise.all([
          profileService.getProfile(),
          axiosInstance.get('/api/v1/watchlist/'),
          axiosInstance.get('/api/v1/reviews/'),
          axiosInstance.get('/api/v1/movies/'),
        ]);

        if (!isMounted) return;

        const profData = profileRes.data;
        setProfile(profData);
        syncProfileToHeader(profData);

        setFormData({
          bio: profData.bio || '',
          date_of_birth: profData.date_of_birth || '',
          location: profData.location || '',
          favourite_genre: profData.favourite_genre || '',
        });

        const watchlistList = Array.isArray(watchlistRes.data)
          ? watchlistRes.data
          : watchlistRes.data?.results || [];
        setWatchlistItems(watchlistList);

        const moviesList = Array.isArray(moviesRes.data)
          ? moviesRes.data
          : moviesRes.data?.results || [];
        const map = {};
        moviesList.forEach((m) => {
          map[m.id] = m;
        });
        setMoviesMap(map);

        const reviewsList = Array.isArray(reviewsRes.data)
          ? reviewsRes.data
          : reviewsRes.data?.results || [];
        const myRevs = reviewsList.filter(
          (rev) => rev.username === profData.username || rev.user === profData.id
        );
        setUserReviews(myRevs);
      } catch (error) {
        if (!isMounted) return;
        if (error.response?.status === 401) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          navigate('/login');
          return;
        }
        setMessage({ type: 'error', text: 'We could not load your profile right now.' });
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfileAndUserData();

    return () => {
      isMounted = false;
    };
  }, [navigate, syncProfileToHeader]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = new FormData();
      payload.append('bio', formData.bio);
      payload.append('date_of_birth', formData.date_of_birth);
      payload.append('location', formData.location);
      payload.append('favourite_genre', formData.favourite_genre);

      if (selectedFile) {
        payload.append('profile_pic', selectedFile);
      }

      const response = await axiosInstance.patch('/api/v1/profile/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setProfile(response.data);
      // Update cached profile so other parts of the app reuse latest data
      try { profileService.setProfile(response.data); } catch (e) {}
      syncProfileToHeader(response.data);
      setSelectedFile(null);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Your profile has been updated successfully.' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.detail || 'We could not update your profile right now.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromWatchlist = async (id) => {
    try {
      await axiosInstance.delete(`/api/v1/watchlist/${id}/`);
      setWatchlistItems((prev) => prev.filter((item) => item.id !== id));
      window.dispatchEvent(new Event('watchlist-updated'));
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove item.' });
    }
  };

  const handleDeleteReview = async (id) => {
    try {
      await axiosInstance.delete(`/api/v1/reviews/${id}/`);
      setUserReviews((prev) => prev.filter((item) => item.id !== id));
      setMessage({ type: 'success', text: 'Review deleted.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete review.' });
    }
  };

  const imageSrc = getImageUrl(profile?.profile_pic);

  return (
    <section className="profile-shell">
      <div className="profile-hero-card">
        <div className="profile-hero-card__identity">
          <div className="profile-avatar" aria-label="profile avatar">
            {imageSrc ? (
              <img src={imageSrc} alt={profile?.username || 'User profile'} />
            ) : (
              <span>{profile?.username?.charAt(0)?.toUpperCase() || 'U'}</span>
            )}
          </div>

          <div>
            <p className="profile-eyebrow">Private Profile</p>
            <h1>{profile?.username || 'Your Profile'}</h1>
            <p className="profile-subtitle">
              Manage your personal cinematic preferences, watchlists, ratings, and written reviews.
            </p>
          </div>
        </div>

        <div className="profile-hero-card__stats">
          <div className="profile-stat-pill">
            <span className="profile-stat-pill__label">Username</span>
            <strong>{profile?.username || 'Member'}</strong>
          </div>
          <div className="profile-stat-pill">
            <span className="profile-stat-pill__label">Saved Watchlist</span>
            <strong>{watchlistItems.length} Movies</strong>
          </div>
          <div className="profile-stat-pill">
            <span className="profile-stat-pill__label">Reviews Written</span>
            <strong>{userReviews.length} Reviews</strong>
          </div>
        </div>
      </div>

      {message.text && (
        <div className={`message ${message.type === 'error' ? 'message--error' : 'message--success'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs Header */}
      <div className="profile-tabs-header">
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile Details
        </button>
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('watchlist')}
        >
          🔖 My Watchlist ({watchlistItems.length})
        </button>
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
          onClick={() => setActiveTab('reviews')}
        >
          ✍️ My Reviews ({userReviews.length})
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your profile profile...</p>
        </div>
      ) : (
        <div className="profile-card">
          {/* TAB 1: PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <>
              <div className="profile-card__header">
                <div>
                  <span className="profile-eyebrow">Personal Information</span>
                  <h2>Your Details</h2>
                </div>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setIsEditing((prev) => !prev)}
                >
                  {isEditing ? 'Cancel Edit' : '✏️ Edit Profile'}
                </button>
              </div>

              {isEditing ? (
                <form className="profile-form" onSubmit={handleSubmit}>
                  <label>
                    Profile Picture
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                  </label>

                  <label>
                    Bio
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows="4"
                      placeholder="Share a short bio about your film taste..."
                    />
                  </label>

                  <div className="profile-form__grid">
                    <label>
                      Location
                      <input type="text" name="location" value={formData.location} onChange={handleChange} />
                    </label>

                    <label>
                      Favorite Genre
                      <input type="text" name="favourite_genre" value={formData.favourite_genre} onChange={handleChange} />
                    </label>
                  </div>

                  <label>
                    Date of Birth
                    <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
                  </label>

                  <button type="submit" disabled={saving} className="primary-link profile-submit">
                    {saving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </form>
              ) : (
                <div className="profile-details-grid">
                  <div className="profile-detail-card">
                    <span className="meta-label">Email Address</span>
                    <p>{profile?.email || 'Not provided'}</p>
                  </div>
                  <div className="profile-detail-card">
                    <span className="meta-label">Bio</span>
                    <p>{profile?.bio || 'No bio added yet.'}</p>
                  </div>
                  <div className="profile-detail-card">
                    <span className="meta-label">Location</span>
                    <p>{profile?.location || 'Not shared yet.'}</p>
                  </div>
                  <div className="profile-detail-card">
                    <span className="meta-label">Favorite Genre</span>
                    <p>{profile?.favourite_genre || 'Not shared yet.'}</p>
                  </div>
                  <div className="profile-detail-card">
                    <span className="meta-label">Date of Birth</span>
                    <p>{profile?.date_of_birth || 'Private'}</p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: WATCHLIST */}
          {activeTab === 'watchlist' && (
            <div className="profile-watchlist-tab">
              <div className="profile-card__header">
                <div>
                  <span className="profile-eyebrow">Saved Items</span>
                  <h2>Your Watchlist</h2>
                </div>
                <Link to="/watchlist" className="primary-link">
                  Open Watchlist Page →
                </Link>
              </div>

              {watchlistItems.length === 0 ? (
                <div className="empty-tab-state">
                  <p>Your watchlist is currently empty.</p>
                  <Link to="/movies" className="ghost-button">Browse Movies</Link>
                </div>
              ) : (
                <div className="profile-watchlist-list">
                  {watchlistItems.map((item) => {
                    const movie = moviesMap[item.movie];
                    return (
                      <div key={item.id} className="profile-watchlist-item">
                        <div>
                          <strong>{item.movie_title || movie?.title}</strong>
                          <span className="item-meta"> • {movie?.genre || 'Cinema'}</span>
                        </div>
                        <div className="item-actions">
                          <Link to={`/movies/${item.movie}`} className="ghost-button view-sm-btn">
                            View
                          </Link>
                          <button
                            type="button"
                            className="remove-sm-btn"
                            onClick={() => handleRemoveFromWatchlist(item.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="profile-reviews-tab">
              <div className="profile-card__header">
                <div>
                  <span className="profile-eyebrow">Written Reviews</span>
                  <h2>Your Reviews History</h2>
                </div>
              </div>

              {userReviews.length === 0 ? (
                <div className="empty-tab-state">
                  <p>You haven't written any reviews yet.</p>
                  <Link to="/movies" className="ghost-button">Explore Movies & Review</Link>
                </div>
              ) : (
                <div className="profile-reviews-list">
                  {userReviews.map((rev) => {
                    const movie = moviesMap[rev.movie];
                    const movieTitle = movie?.title || `Movie #${rev.movie}`;
                    return (
                      <div key={rev.id} className="profile-review-card">
                        <div className="profile-review-header">
                          <div>
                            <Link to={`/movies/${rev.movie}`} className="profile-review-title">
                              {movieTitle}
                            </Link>
                            <span className="profile-review-date">
                              {new Date(rev.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="ghost-button delete-review-btn"
                            onClick={() => handleDeleteReview(rev.id)}
                          >
                            Delete
                          </button>
                        </div>
                        <p className="profile-review-content">{rev.review}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default ProfilePage;
