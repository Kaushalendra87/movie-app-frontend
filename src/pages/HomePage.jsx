import { Link } from 'react-router-dom';
import MoviePosterCarousel from '../components/MoviePosterCarousel';

function HomePage() {
  const isAuthenticated = Boolean(localStorage.getItem('accessToken'));

  return (
    <div className="home-page-container">
      {/* Main Cinema Hero Section */}
      <section className="home-hero-banner">
        <div className="home-hero-content">
          <span className="home-eyebrow-badge">🎬 WELCOME TO ONLYCINEMA</span>
          <h1 className="home-hero-title">
            Your Ultimate Hub for Movie Discoveries & Community Reviews
          </h1>
          <p className="home-hero-description">
            Explore curated blockbusters, rate your favorite releases, save movies to your personal watchlist, and connect with movie enthusiasts worldwide.
          </p>

          <div className="home-hero-actions">
            <Link to={isAuthenticated ? "/movies" : "/login"} className="primary-link hero-btn-main">
              {isAuthenticated ? "Browse Movies Catalog →" : "Get Started Now →"}
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="ghost-button hero-btn-sec">
                Create Free Account
              </Link>
            )}
          </div>
        </div>

        <div className="home-hero-stats">
          <div className="hero-stat-card">
            <span className="stat-value">1000+</span>
            <span className="stat-label">Titles & Movies</span>
          </div>
          <div className="hero-stat-card">
            <span className="stat-value">4.9 ★</span>
            <span className="stat-label">Community Rating</span>
          </div>
          <div className="hero-stat-card">
            <span className="stat-value">100%</span>
            <span className="stat-label">Free Cinema Hub</span>
          </div>
        </div>
      </section>

      {/* Infinite Movie Poster Carousel Showcase */}
      <MoviePosterCarousel />

      {/* Features Overview */}
      <section className="home-features-grid">
        <div className="feature-card">
          <div className="feature-icon">🔖</div>
          <h3>Curated Watchlists</h3>
          <p>Easily save and track films you want to watch. Access your personalized watchlist anytime from any device.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⭐</div>
          <h3>Interactive Star Ratings</h3>
          <p>Rate films on a 5-star scale and view community consensus ratings calculated instantly across thousands of users.</p>
        </div>

        <div className="feature-card">
          <div className="feature-icon">💬</div>
          <h3>In-Depth Reviews</h3>
          <p>Share your perspective, write detailed movie reviews, and read feedback from film buffs around the world.</p>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
