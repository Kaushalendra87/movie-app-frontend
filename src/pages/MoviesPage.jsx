import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import profileService from '../services/profileService';
import getImageUrl from '../utils/getImageUrl';

function MoviesPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(localStorage.getItem('accessToken'));

  const [movies, setMovies] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [watchlistMap, setWatchlistMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [submittingRatingId, setSubmittingRatingId] = useState(null);
  const [selectedRatings, setSelectedRatings] = useState({});
  const [togglingWatchlistId, setTogglingWatchlistId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(3);
  const [pageInfo, setPageInfo] = useState({ count: 0, next: null, previous: null });

  const [isSuperuser, setIsSuperuser] = useState(localStorage.getItem('isSuperuser') === 'true');
  const [deletingMovieId, setDeletingMovieId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const requests = [
          axiosInstance.get('/api/v1/movies/', { params: { page: currentPage, page_size: pageSize } }),
          axiosInstance.get('/api/v1/ratings/'),
        ];

        if (isAuthenticated) {
          requests.push(axiosInstance.get('/api/v1/watchlist/'));
          requests.push(profileService.getProfile());
        }

        const results = await Promise.allSettled(requests);
        const moviesResponse = results[0].status === 'fulfilled' ? results[0].value : null;
        const moviesPayload = moviesResponse?.data ?? {};
        const moviesData = Array.isArray(moviesPayload.results) ? moviesPayload.results : [];
        const ratingsData = results[1].status === 'fulfilled' ? results[1].value.data : [];
        const rawWatchlist = isAuthenticated && results[2]?.status === 'fulfilled' ? results[2].value.data : [];
        const watchlistData = Array.isArray(rawWatchlist)
          ? rawWatchlist
          : Array.isArray(rawWatchlist?.results)
            ? rawWatchlist.results
            : [];
        const profileData = isAuthenticated && results[3]?.status === 'fulfilled' ? results[3].value.data : null;

        if (profileData) {
          const isSuper = Boolean(profileData.is_superuser || profileData.is_staff);
          setIsSuperuser(isSuper);
          localStorage.setItem('isSuperuser', isSuper ? 'true' : 'false');
        }

        setMovies(moviesData);
        setRatings(ratingsData);
        setPageInfo({
          count: moviesPayload.count ?? moviesData.length,
          next: moviesPayload.next ?? null,
          previous: moviesPayload.previous ?? null,
        });

        const map = {};
        watchlistData.forEach((item) => {
          map[item.movie] = item.id;
        });
        setWatchlistMap(map);
      } catch {
        setErrorMessage('Unable to load movies right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, currentPage, pageSize]);

  const totalPages = Math.max(1, Math.ceil(pageInfo.count / pageSize));

  const genres = useMemo(() => {
    const set = new Set();
    movies.forEach((m) => {
      if (m.genre) {
        m.genre.split(',').forEach((g) => {
          const trimmed = g.trim();
          if (trimmed) set.add(trimmed);
        });
      }
    });
    return ['All', ...Array.from(set).sort()];
  }, [movies]);

  const filteredMovies = useMemo(() => {
    return movies.filter((movie) => {
      const matchSearch =
        !searchTerm.trim() ||
        `${movie.title} ${movie.genre} ${movie.description}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const movieGenres = movie.genre
        ? movie.genre.split(',').map((g) => g.trim())
        : [];
      const matchGenre =
        selectedGenre === 'All' || movieGenres.includes(selectedGenre);

      return matchSearch && matchGenre;
    });
  }, [movies, searchTerm, selectedGenre]);

  const getPosterUrl = (poster) => getImageUrl(poster);

  const getAverageRating = (movie) => {
    if (typeof movie?.average_rating === 'number' && movie.average_rating > 0) {
      return `${movie.average_rating} ★`;
    }
    const movieRatings = ratings.filter((r) => r.movie === movie?.id);
    if (!movieRatings.length) return 'No ratings';
    const avg = movieRatings.reduce((sum, r) => sum + r.rating, 0) / movieRatings.length;
    return `${avg.toFixed(1)} ★`;
  };

  const handleToggleWatchlist = async (movieId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setTogglingWatchlistId(movieId);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const existingId = watchlistMap[movieId];
      if (existingId) {
        await axiosInstance.delete(`/api/v1/watchlist/${existingId}/`);
        setWatchlistMap((prev) => {
          const next = { ...prev };
          delete next[movieId];
          return next;
        });
        setSuccessMessage('Removed from watchlist.');
      } else {
        const res = await axiosInstance.post('/api/v1/watchlist/', { movie: movieId });
        setWatchlistMap((prev) => ({ ...prev, [movieId]: res.data.id }));
        setSuccessMessage('Added to your watchlist!');
      }
      window.dispatchEvent(new Event('watchlist-updated'));
    } catch {
      setErrorMessage('Could not update watchlist.');
    } finally {
      setTogglingWatchlistId(null);
    }
  };

  const handleDeleteMovie = async (movieId, movieTitle) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${movieTitle}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingMovieId(movieId);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await axiosInstance.delete(`/api/v1/movies/${movieId}/`);
      setMovies((prev) => prev.filter((m) => m.id !== movieId));
      setSuccessMessage(`Movie "${movieTitle}" was successfully deleted from catalog.`);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Failed to delete movie card. Superuser permissions required.';
      setErrorMessage(detail);
    } finally {
      setDeletingMovieId(null);
    }
  };

  const handleRateMovie = async (movieId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const ratingValue = selectedRatings[movieId] || 5;
    setSubmittingRatingId(movieId);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await axiosInstance.post('/api/v1/ratings/', {
        movie: movieId,
        rating: Number(ratingValue),
      });
      setSuccessMessage('Your rating has been saved!');
      const ratingsRes = await axiosInstance.get('/api/v1/ratings/');
      setRatings(ratingsRes.data);
    } catch (err) {
      setErrorMessage(err?.response?.data?.detail || 'Could not submit rating.');
    } finally {
      setSubmittingRatingId(null);
    }
  };

  return (
    <section className="movies-page">
      <div className="movies-hero">
        <div className="movies-hero__content">
          <h1>Explore Cinema & Discover Top Picks</h1>
          <p className="hero-copy">
            Browse through our curated film database, rate your favorite releases, write reviews, and save titles to your personal watchlist.
          </p>

          <div className="movies-toolbar">
            <div className="search-input-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search movies by title, genre, or keyword..."
                className="search-input"
              />
            </div>
            <Link to="/watchlist" className="ghost-button watchlist-hero-link">
              🔖 Go to Watchlist
            </Link>
            {isSuperuser && (
              <Link to="/add-movie" className="primary-link add-movie-hero-btn">
                👑 + Add New Movie
              </Link>
            )}
          </div>

          {/* Genre Filter Pills */}
          <div className="genre-filter-bar">
            {genres.map((g) => (
              <button
                key={g}
                type="button"
                className={`genre-filter-pill ${selectedGenre === g ? 'active' : ''}`}
                onClick={() => setSelectedGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      {errorMessage && <div className="message message--error">{errorMessage}</div>}
      {successMessage && <div className="message message--success">{successMessage}</div>}

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading cinema catalog...</p>
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="no-movies-state">
          <span className="no-movies-icon">🍿</span>
          <h3>No movies found</h3>
          <p>Try searching for a different keyword or select another genre filter.</p>
        </div>
      ) : (
        <>
          <div className="movies-grid">
            {filteredMovies.map((movie) => {
              const inWatchlist = Boolean(watchlistMap[movie.id]);
              const isToggling = togglingWatchlistId === movie.id;
              const currentRatingChoice = selectedRatings[movie.id] || 5;

              return (
                <article key={movie.id} className="movie-card">
                <div className="movie-card__image-container">
                  {getPosterUrl(movie.poster) ? (
                    <img src={getPosterUrl(movie.poster)} alt={movie.title} className="movie-poster" />
                  ) : (
                    <div className="movie-poster movie-poster--placeholder">🎬</div>
                  )}

                  <span className="movie-rating-badge">{getAverageRating(movie)}</span>

                  <button
                    type="button"
                    className={`card-watchlist-btn ${inWatchlist ? 'active' : ''}`}
                    onClick={() => handleToggleWatchlist(movie.id)}
                    disabled={isToggling}
                    title={inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    aria-label={`Toggle Watchlist for ${movie.title}`}
                  >
                    {inWatchlist ? '🔖 Saved' : '+ Watchlist'}
                  </button>

                  {isSuperuser && (
                    <button
                      type="button"
                      className="delete-movie-card-btn"
                      onClick={() => handleDeleteMovie(movie.id, movie.title)}
                      disabled={deletingMovieId === movie.id}
                      title="Delete Movie Card (Superuser Only)"
                      aria-label={`Delete ${movie.title}`}
                    >
                      {deletingMovieId === movie.id ? 'Removing...' : '🗑️ Delete'}
                    </button>
                  )}
                </div>

                <div className="movie-card__content">
                  <div className="movie-card__header">
                    <div>
                      <div className="movie-genres-row">
                        {movie.genre
                          ? movie.genre.split(',').map((g) => g.trim()).filter(Boolean).map((g) => (
                              <span key={g} className="movie-genre">{g}</span>
                            ))
                          : <span className="movie-genre">—</span>}
                      </div>
                      <h2>
                        <Link to={`/movies/${movie.id}`}>{movie.title}</Link>
                      </h2>
                    </div>
                  </div>

                  <p className="movie-description">
                    {movie.description
                      ? movie.description.length > 110
                        ? `${movie.description.substring(0, 110)}...`
                        : movie.description
                      : ''}
                  </p>

                  <div className="movie-meta-row">
                    <span>📅 {movie.release_date}</span>
                    <span>⏱️ {movie.duration} min</span>
                  </div>

                  <div className="movie-actions">
                    <Link to={`/movies/${movie.id}`} className="primary-link movie-link">
                      View Details & Reviews →
                    </Link>
                  </div>

                  {/* Inline quick rating box */}
                  <div className="quick-rating-box">
                    <span className="quick-rating-label">Quick Rate:</span>
                    <div className="star-picker-small">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          className={`star-btn-sm ${currentRatingChoice >= val ? 'active' : ''}`}
                          onClick={() => setSelectedRatings((prev) => ({ ...prev, [movie.id]: val }))}
                          aria-label={`Rate ${val} star`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="quick-submit-btn"
                      disabled={submittingRatingId === movie.id}
                      onClick={() => handleRateMovie(movie.id)}
                    >
                      {submittingRatingId === movie.id ? '...' : 'Save'}
                    </button>
                  </div>
                </div>
                </article>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <p style={{ margin: 0, color: '#8b95a7' }}>
              Showing page {currentPage} of {totalPages} • {pageInfo.count} movies
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={pageInfo.previous === null}
              >
                ← Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    className={`ghost-button ${pageNumber === currentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(pageNumber)}
                    style={{ minWidth: '2.5rem' }}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button
                type="button"
                className="ghost-button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={pageInfo.next === null}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default MoviesPage;
