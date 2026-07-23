import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';

function MovieDetailPage() {
  const { movieId } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = Boolean(localStorage.getItem('accessToken'));

  const [movie, setMovie] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Error / Success messaging
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Rating state
  const [userRatingObj, setUserRatingObj] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(5);
  const [submittingRating, setSubmittingRating] = useState(false);

  // Review state
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editReviewText, setEditReviewText] = useState('');
  const [userReviewObj, setUserReviewObj] = useState(null);

  // Watchlist state
  const [watchlistItem, setWatchlistItem] = useState(null);
  const [togglingWatchlist, setTogglingWatchlist] = useState(false);

  // Superuser delete state
  const [deletingMovie, setDeletingMovie] = useState(false);
  const isSuperuser = localStorage.getItem('isSuperuser') === 'true';

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      const requests = [
        axiosInstance.get(`/api/v1/movies/${movieId}/`),
        axiosInstance.get('/api/v1/ratings/'),
        axiosInstance.get(`/api/v1/reviews/?movie=${movieId}`),
      ];

      if (isAuthenticated) {
        requests.push(axiosInstance.get('/api/v1/watchlist/'));
      }

      const results = await Promise.all(requests);
      const movieData = results[0].data;
      const ratingsData = results[1].data;
      const reviewsData = results[2].data;
      const watchlistData = isAuthenticated && results[3] ? results[3].data : [];

      setMovie(movieData);
      setRatings(ratingsData);
      setReviews(reviewsData);
      setWatchlistItems(watchlistData);

      const storedUsername = localStorage.getItem('profileName');
      if (storedUsername) {
        const movieRatings = ratingsData.filter((r) => r.movie === Number(movieId));
        const foundRating = movieRatings.find((r) => r.username === storedUsername || r.user);
        if (foundRating) {
          setUserRatingObj(foundRating);
          setSelectedRating(foundRating.rating);
        }
      }

      const foundWatchlist = watchlistData.find((w) => w.movie === Number(movieId));
      setWatchlistItem(foundWatchlist || null);

      if (storedUsername) {
        const foundRev = reviewsData.find((rev) => rev.username === storedUsername);
        if (foundRev) {
          setUserReviewObj(foundRev);
        }
      }
    } catch {
      setErrorMessage('Unable to load movie details right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieDetails();
  }, [movieId, isAuthenticated]);

  const averageRating = useMemo(() => {
    const movieRatings = ratings.filter((r) => r.movie === Number(movieId));
    if (!movieRatings.length) return { score: 'No ratings', count: 0 };
    const avg = movieRatings.reduce((sum, r) => sum + r.rating, 0) / movieRatings.length;
    return { score: `${avg.toFixed(1)} / 5`, count: movieRatings.length };
  }, [ratings, movieId]);

  const getPosterUrl = (poster) => {
    if (!poster) return null;
    if (poster.startsWith('http://') || poster.startsWith('https://')) return poster;
    const backendBaseUrl = import.meta.env.VITE_BACKEND_BASER_API || 'http://127.0.0.1:8000';
    return `${backendBaseUrl}${poster.startsWith('/') ? poster : `/${poster}`}`;
  };

  const getReviewAvatarUrl = (rev) => {
    if (rev?.profile_pic) {
      if (rev.profile_pic.startsWith('http://') || rev.profile_pic.startsWith('https://')) {
        return rev.profile_pic;
      }
      const backendBaseUrl = import.meta.env.VITE_BACKEND_BASER_API || 'http://127.0.0.1:8000';
      return `${backendBaseUrl}${rev.profile_pic.startsWith('/') ? rev.profile_pic : `/${rev.profile_pic}`}`;
    }
    if (localStorage.getItem('profileName') === rev.username && localStorage.getItem('profileImage')) {
      return localStorage.getItem('profileImage');
    }
    return null;
  };

  // Watchlist Toggle
  const handleToggleWatchlist = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setTogglingWatchlist(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (watchlistItem) {
        await axiosInstance.delete(`/api/v1/watchlist/${watchlistItem.id}/`);
        setWatchlistItem(null);
        setSuccessMessage('Removed from your watchlist.');
      } else {
        const res = await axiosInstance.post('/api/v1/watchlist/', { movie: Number(movieId) });
        setWatchlistItem(res.data);
        setSuccessMessage('Added to your watchlist!');
      }
      window.dispatchEvent(new Event('watchlist-updated'));
    } catch (err) {
      setErrorMessage(err?.response?.data?.detail || 'Watchlist action failed.');
    } finally {
      setTogglingWatchlist(false);
    }
  };

  const handleDeleteMovie = async () => {
    if (!movie) return;
    const confirmed = window.confirm(`Are you sure you want to permanently delete "${movie.title}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingMovie(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await axiosInstance.delete(`/api/v1/movies/${movie.id}/`);
      setSuccessMessage(`Movie "${movie.title}" was successfully deleted.`);
      setTimeout(() => {
        navigate('/movies');
      }, 1000);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Failed to delete movie card. Superuser permissions required.';
      setErrorMessage(detail);
      setDeletingMovie(false);
    }
  };

  // Rating Submit / Update
  const handleRatingSubmit = async (ratingVal) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setSubmittingRating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (userRatingObj) {
        const res = await axiosInstance.patch(`/api/v1/ratings/${userRatingObj.id}/`, {
          rating: ratingVal,
        });
        setUserRatingObj(res.data);
        setSuccessMessage(`Updated your rating to ${ratingVal} stars.`);
      } else {
        const res = await axiosInstance.post('/api/v1/ratings/', {
          movie: Number(movieId),
          rating: ratingVal,
        });
        setUserRatingObj(res.data);
        setSuccessMessage(`Submitted rating of ${ratingVal} stars!`);
      }
      setSelectedRating(ratingVal);
      const ratingsRes = await axiosInstance.get('/api/v1/ratings/');
      setRatings(ratingsRes.data);
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.response?.data?.rating?.[0] || 'Rating submission failed.';
      setErrorMessage(detail);
    } finally {
      setSubmittingRating(false);
    }
  };

  // Review Submit
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (reviewText.trim().length < 10) {
      setErrorMessage('Review must contain at least 10 characters.');
      return;
    }

    setSubmittingReview(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await axiosInstance.post('/api/v1/reviews/', {
        movie: Number(movieId),
        review: reviewText.trim(),
      });

      setReviews((prev) => [res.data, ...prev]);
      setUserReviewObj(res.data);
      setReviewText('');
      setSuccessMessage('Your review has been published!');
    } catch (err) {
      const msg = err?.response?.data?.review?.[0] || err?.response?.data?.non_field_errors?.[0] || 'Could not submit review.';
      setErrorMessage(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Edit Review
  const handleEditReviewSave = async (reviewId) => {
    if (editReviewText.trim().length < 10) {
      setErrorMessage('Review must contain at least 10 characters.');
      return;
    }

    setSubmittingReview(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await axiosInstance.patch(`/api/v1/reviews/${reviewId}/`, {
        review: editReviewText.trim(),
      });

      setReviews((prev) => prev.map((rev) => (rev.id === reviewId ? res.data : rev)));
      setUserReviewObj(res.data);
      setEditingReviewId(null);
      setSuccessMessage('Review updated successfully.');
    } catch (err) {
      setErrorMessage(err?.response?.data?.review?.[0] || 'Could not update review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Delete Review
  const handleDeleteReview = async (reviewId) => {
    setSubmittingReview(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await axiosInstance.delete(`/api/v1/reviews/${reviewId}/`);
      setReviews((prev) => prev.filter((rev) => rev.id !== reviewId));
      if (userReviewObj?.id === reviewId) {
        setUserReviewObj(null);
      }
      setSuccessMessage('Review deleted.');
    } catch {
      setErrorMessage('Failed to delete review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading movie details...</p>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="detail-error-container">
        <div className="message message--error">{errorMessage || 'Movie not found.'}</div>
        <Link to="/movies" className="ghost-button">← Back to movie catalog</Link>
      </div>
    );
  }

  return (
    <section className="movie-detail-page">
      <Link to="/movies" className="ghost-button detail-back">
        ← Back to Catalog
      </Link>

      {errorMessage && <div className="message message--error">{errorMessage}</div>}
      {successMessage && <div className="message message--success">{successMessage}</div>}

      <div className="detail-hero-card">
        <div className="detail-poster-column">
          {getPosterUrl(movie.poster) ? (
            <img src={getPosterUrl(movie.poster)} alt={movie.title} className="detail-poster-img" />
          ) : (
            <div className="detail-poster-placeholder">🎬</div>
          )}
        </div>

        <div className="detail-content-column">
          <h1 className="detail-title">{movie.title}</h1>
          <div className="detail-pills-row">
            <span className="genre-pill">{movie.genre}</span>
            <span className="meta-pill">{movie.language}</span>
            <span className="meta-pill">{movie.duration} min</span>
            <span className="rating-pill">{averageRating.score}</span>
          </div>

          <p className="detail-description">{movie.description}</p>

          <div className="detail-meta-grid">
            <div className="meta-card">
              <span className="meta-card-label">Release Date</span>
              <strong className="meta-card-value">{movie.release_date}</strong>
            </div>
            <div className="meta-card">
              <span className="meta-card-label">Community Rating</span>
              <strong className="meta-card-value">{averageRating.score} ({averageRating.count} ratings)</strong>
            </div>
            <div className="meta-card">
              <span className="meta-card-label">Reviews</span>
              <strong className="meta-card-value">{reviews.length} written</strong>
            </div>
            <div className="meta-card">
              <span className="meta-card-label">Watchlist Saves</span>
              <strong className="meta-card-value">{movie.watchlist_count || watchlistItems.filter(w=>w.movie===movie.id).length}</strong>
            </div>
          </div>

          <div className="detail-primary-actions">
            <button
              type="button"
              className={`watchlist-toggle-btn ${watchlistItem ? 'in-watchlist' : ''}`}
              onClick={handleToggleWatchlist}
              disabled={togglingWatchlist}
            >
              {togglingWatchlist
                ? 'Updating...'
                : watchlistItem
                ? '✓ Saved in Watchlist'
                : '+ Add to Watchlist'}
            </button>

            {isSuperuser && (
              <button
                type="button"
                className="delete-movie-detail-btn"
                onClick={handleDeleteMovie}
                disabled={deletingMovie}
                title="Delete Movie Card (Superuser Only)"
              >
                {deletingMovie ? 'Deleting Movie...' : '🗑️ Delete Movie Card'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Rating Section */}
      <div className="section-card rating-section-card">
        <div className="section-card__header">
          <div>
            <span className="section-eyebrow">Rate this Film</span>
            <h2>Your Star Rating</h2>
          </div>
          {userRatingObj && (
            <span className="user-rated-tag">Your Rating: {userRatingObj.rating} / 5 ★</span>
          )}
        </div>

        <div className="interactive-rating-box">
          <p className="rating-instruction">
            {userRatingObj ? 'Click a star to change your rating:' : 'How would you rate this movie?'}
          </p>

          <div
            className="star-picker-interactive"
            onMouseLeave={() => setHoverRating(0)}
            role="radiogroup"
            aria-label="Rate this movie"
          >
            {[1, 2, 3, 4, 5].map((star) => {
              const activeStar = hoverRating ? hoverRating >= star : selectedRating >= star;
              return (
                <button
                  key={star}
                  type="button"
                  className={`star-btn-large ${activeStar ? 'star-active' : ''}`}
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => handleRatingSubmit(star)}
                  disabled={submittingRating}
                  aria-label={`${star} star${star > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              );
            })}
          </div>

          <div className="rating-score-display">
            {hoverRating ? `${hoverRating} / 5 Stars` : selectedRating ? `${selectedRating} / 5 Stars` : 'Select rating'}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="section-card reviews-section-card">
        <div className="section-card__header">
          <div>
            <span className="section-eyebrow">Community & Discussions</span>
            <h2>Audience Reviews ({reviews.length})</h2>
          </div>
        </div>

        {/* Add Review Form */}
        {isAuthenticated && !userReviewObj ? (
          <form className="add-review-form" onSubmit={handleReviewSubmit}>
            <label htmlFor="reviewText" className="form-label">
              Write a Review
            </label>
            <textarea
              id="reviewText"
              rows="4"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your thoughts on the acting, plot, visuals, or overall impression (minimum 10 characters)..."
              className="review-textarea"
            />
            <div className="form-footer">
              <span className={`char-counter ${reviewText.length < 10 ? 'char-insufficient' : 'char-sufficient'}`}>
                {reviewText.length} / 10 characters min
              </span>
              <button
                type="submit"
                className="primary-link submit-review-btn"
                disabled={submittingReview || reviewText.trim().length < 10}
              >
                {submittingReview ? 'Publishing...' : 'Post Review'}
              </button>
            </div>
          </form>
        ) : !isAuthenticated ? (
          <div className="login-prompt-card">
            <p>Want to post a review? Sign in to join the conversation.</p>
            <Link to="/login" className="primary-link">Sign In to Review</Link>
          </div>
        ) : null}

        {/* Reviews List */}
        <div className="reviews-list">
          {reviews.length === 0 ? (
            <div className="no-reviews-state">
              <span className="no-reviews-icon">✍️</span>
              <p>No reviews yet for {movie.title}. Be the first to share your thoughts!</p>
            </div>
          ) : (
            reviews.map((rev) => {
              const isOwner = localStorage.getItem('profileName') === rev.username;
              const isEditing = editingReviewId === rev.id;
              const avatarUrl = getReviewAvatarUrl(rev);

              return (
                <div key={rev.id} className={`review-card ${isOwner ? 'review-card--owner' : ''}`}>
                  <div className="review-card__header">
                    <div className="reviewer-info">
                      <div className="reviewer-avatar">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={rev.username || 'User'} className="reviewer-avatar-img" />
                        ) : (
                          <span>{rev.username ? rev.username.charAt(0).toUpperCase() : 'U'}</span>
                        )}
                      </div>
                      <div>
                        <span className="reviewer-name">{rev.username || 'Anonymous'}</span>
                        <span className="review-date">
                          {new Date(rev.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {isOwner && !isEditing && (
                      <div className="review-owner-actions">
                        <button
                          type="button"
                          className="ghost-button edit-review-btn"
                          onClick={() => {
                            setEditingReviewId(rev.id);
                            setEditReviewText(rev.review);
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          className="ghost-button delete-review-btn"
                          onClick={() => handleDeleteReview(rev.id)}
                          disabled={submittingReview}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="edit-review-box">
                      <textarea
                        rows="3"
                        value={editReviewText}
                        onChange={(e) => setEditReviewText(e.target.value)}
                        className="review-textarea"
                      />
                      <div className="form-footer">
                        <span className={`char-counter ${editReviewText.length < 10 ? 'char-insufficient' : 'char-sufficient'}`}>
                          {editReviewText.length} / 10 chars min
                        </span>
                        <div className="edit-actions">
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => setEditingReviewId(null)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="primary-link"
                            disabled={submittingReview || editReviewText.trim().length < 10}
                            onClick={() => handleEditReviewSave(rev.id)}
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="review-text">{rev.review}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

export default MovieDetailPage;
