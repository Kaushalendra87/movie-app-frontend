import React from 'react';

const posterData = [
  { id: 1, title: 'Dune: Part Two', image: '/movie_poster/dune.jpg', genre: 'Sci-Fi • Epic', rating: '8.6' },
  { id: 2, title: 'Interstellar', image: '/movie_poster/interstellar.jpg', genre: 'Sci-Fi • Adventure', rating: '8.7' },
  { id: 3, title: 'Oppenheimer', image: '/movie_poster/oppenheimer.jpg', genre: 'Biography • Drama', rating: '8.9' },
  { id: 4, title: 'Superman', image: '/movie_poster/superman.jpg', genre: 'Action • Superhero', rating: '8.4' },
  { id: 5, title: 'Cyber Horizon', image: '/movie_poster/poster1.jpg', genre: 'Sci-Fi • Cyberpunk', rating: '8.5' },
  { id: 6, title: 'The Last Realm', image: '/movie_poster/poster2.jpg', genre: 'Fantasy • Adventure', rating: '8.2' },
  { id: 7, title: 'Shadow Chronicles', image: '/movie_poster/poster3.jpg', genre: 'Mystery • Thriller', rating: '8.8' },
  { id: 8, title: 'Nebula Drift', image: '/movie_poster/poster4.jpg', genre: 'Space • Drama', rating: '8.3' },
  { id: 9, title: 'Crimson Peak', image: '/movie_poster/poster5.jpg', genre: 'Horror • Mystery', rating: '8.1' },
  { id: 10, title: 'Velvet Echoes', image: '/movie_poster/poster6.jpg', genre: 'Drama • Music', rating: '8.0' },
];

function MoviePosterCarousel() {
  // Duplicate array twice to ensure seamless infinite looping without gaps
  const carouselItems = [...posterData, ...posterData, ...posterData];

  return (
    <div className="poster-showcase-container" aria-label="Streaming Movie Showcase">
      <div className="poster-showcase-header">
        <span className="streaming-badge">✨ NOW TRENDING ON ONLYCINEMA</span>
        <h2 className="showcase-title">Explore Blockbusters & Exclusive Ratings</h2>
      </div>

      <div className="poster-carousel-viewport">
        <div className="poster-carousel-track">
          {carouselItems.map((movie, index) => (
            <div key={`${movie.id}-${index}`} className="poster-card-item">
              <div className="poster-card-wrapper">
                <img
                  src={movie.image}
                  alt={movie.title}
                  className="poster-image"
                  loading="lazy"
                />
                <div className="poster-badge-rating">★ {movie.rating}</div>
                <div className="poster-info-overlay">
                  <span className="poster-genre">{movie.genre}</span>
                  <h4 className="poster-title">{movie.title}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MoviePosterCarousel;
