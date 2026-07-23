import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-brand-section">
          <Link to="/movies" className="footer-brand">
            <span className="footer-logo-icon">🎬</span>
            <span className="footer-brand-name">OnlyCinema</span>
          </Link>
          <p className="footer-tagline">
            Your premier destination for movie discovery, reviews, personal watchlists, and community ratings.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} OnlyCinema. All rights reserved.</p>
        <div className="footer-tech-stack">
          <span>Powered by React + Django REST Framework</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
