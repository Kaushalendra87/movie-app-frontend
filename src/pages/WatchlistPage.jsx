import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../axiosInstance';

function WatchlistPage() {
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [removingId, setRemovingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const fetchData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await axiosInstance.get('/api/v1/watchlist/');
      const data = res?.data;
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];
      setWatchlistItems(items);
    } catch (err) {
      console.error('Watchlist fetch error:', err);
      setErrorMessage('Could not load your watchlist right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Poster URL is now absolute from the backend, but keep fallback just in case
  const getPosterUrl = (poster) => {
    if (!poster) return null;
    if (poster.startsWith('http://') || poster.startsWith('https://')) return poster;
    const base = import.meta.env.VITE_BACKEND_BASER_API || 'http://127.0.0.1:8000';
    return `${base}${poster.startsWith('/') ? poster : `/${poster}`}`;
  };

  // Split comma-separated genres into individual pills
  const splitGenres = (genreStr) => {
    if (!genreStr) return [];
    return genreStr.split(',').map((g) => g.trim()).filter(Boolean);
  };

  const handleRemoveFromWatchlist = async (watchlistId, movieTitle) => {
    setRemovingId(watchlistId);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await axiosInstance.delete(`/api/v1/watchlist/${watchlistId}/`);
      setWatchlistItems((prev) => prev.filter((item) => item.id !== watchlistId));
      setSuccessMessage(`"${movieTitle}" removed from your watchlist.`);
      window.dispatchEvent(new Event('watchlist-updated'));
    } catch {
      setErrorMessage('Failed to remove item from watchlist.');
    } finally {
      setRemovingId(null);
    }
  };

  const filteredAndSortedWatchlist = useMemo(() => {
    let items = [...watchlistItems];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      items = items.filter((item) => {
        const title = item.movie_title || '';
        const genre = item.movie_genre || '';
        return title.toLowerCase().includes(q) || genre.toLowerCase().includes(q);
      });
    }

    if (sortBy === 'newest') {
      items.sort((a, b) => new Date(b.added_at) - new Date(a.added_at));
    } else if (sortBy === 'oldest') {
      items.sort((a, b) => new Date(a.added_at) - new Date(b.added_at));
    } else if (sortBy === 'rating') {
      items.sort((a, b) => (b.movie_average_rating || 0) - (a.movie_average_rating || 0));
    }

    return items;
  }, [watchlistItems, searchTerm, sortBy]);

  return (
    <section className="watchlist-page">
      <div className="watchlist-hero">
        <div className="watchlist-hero__text">
          <h1>Your Personal Watchlist</h1>
          <p className="hero-copy">
            Keep track of the movies you want to watch next. Easily manage, organize, and explore your curated list.
          </p>
        </div>

        <div className="watchlist-stats-box">
          <span className="stat-number">{watchlistItems.length}</span>
          <span className="stat-caption">{watchlistItems.length === 1 ? 'Movie Saved' : 'Movies Saved'}</span>
        </div>
      </div>

      {errorMessage && <div className="message message--error">{errorMessage}</div>}
      {successMessage && <div className="message message--success">{successMessage}</div>}

      <div className="watchlist-controls">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search inside your watchlist..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="watchlist-search-input"
          />
        </div>

        <div className="sort-box">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Recently Added</option>
            <option value="oldest">First Added</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your saved watchlist...</p>
        </div>
      ) : filteredAndSortedWatchlist.length === 0 ? (
        <div className="empty-watchlist-card">
          <div className="empty-icon">🍿</div>
          <h2>{searchTerm ? 'No matching movies found' : 'Your watchlist is empty'}</h2>
          <p>
            {searchTerm
              ? 'Try adjusting your search query or clear filters to see your saved movies.'
              : 'Start exploring the movie catalog and click "+ Add to Watchlist" on any film you like!'}
          </p>
          {!searchTerm && (
            <Link to="/movies" className="primary-link empty-cta">
              Browse Movie Catalog
            </Link>
          )}
        </div>
      ) : (
        <div className="watchlist-grid">
          {filteredAndSortedWatchlist.map((item) => {
            const posterSrc = getPosterUrl(item.poster);
            const title = item.movie_title || 'Untitled Movie';
            const genres = splitGenres(item.movie_genre);
            const duration = item.movie_duration ? `${item.movie_duration} min` : null;
            const avgRating = item.movie_average_rating
              ? `${item.movie_average_rating} ★`
              : 'No ratings';

            return (
              <article key={item.id} className="watchlist-card">
                <div className="watchlist-card__image-wrap">
                  {posterSrc ? (
                    <img src={posterSrc} alt={title} className="watchlist-poster" />
                  ) : (
                    <div className="watchlist-poster watchlist-poster--placeholder">🎬</div>
                  )}
                  <span className="watchlist-rating-badge">{avgRating}</span>
                </div>

                <div className="watchlist-card__body">
                  <div className="watchlist-card__meta">
                    {genres.length > 0 ? (
                      genres.map((g) => (
                        <span key={g} className="watchlist-genre">{g}</span>
                      ))
                    ) : (
                      <span className="watchlist-genre">—</span>
                    )}
                    {duration && <span className="watchlist-duration">{duration}</span>}
                  </div>

                  <h3 className="watchlist-title">
                    <Link to={`/movies/${item.movie}`}>{title}</Link>
                  </h3>

                  <div className="watchlist-added-time">
                    Added {new Date(item.added_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  <div className="watchlist-card__actions">
                    <Link to={`/movies/${item.movie}`} className="ghost-button view-btn">
                      View Details
                    </Link>
                    <button
                      type="button"
                      className="remove-watchlist-btn"
                      disabled={removingId === item.id}
                      onClick={() => handleRemoveFromWatchlist(item.id, title)}
                      aria-label={`Remove ${title} from watchlist`}
                    >
                      {removingId === item.id ? 'Removing...' : '🗑️ Remove'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default WatchlistPage;
