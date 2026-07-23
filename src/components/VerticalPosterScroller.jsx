import React, { useMemo } from 'react';

const FOLDER_POSTERS = [
  '/movie_poster/dune.jpg',
  '/movie_poster/interstellar.jpg',
  '/movie_poster/oppenheimer.jpg',
  '/movie_poster/superman.jpg',
  '/movie_poster/l_deadpool-wolverine-movie-poster_ca977381.jpeg',
  '/movie_poster/l_avatar-fire-and-ash-movie-poster_94fad1b5.jpeg',
  '/movie_poster/l_spider-man-across-the-spider-verse-part-one-movie-poster_37d41ec0.jpeg',
  '/movie_poster/l_barbie-movie-poster_780f2c78.jpeg',
  '/movie_poster/l_guardians-of-the-galaxy-vol-3-movie-poster_1aa9e0b7.jpeg',
  '/movie_poster/l_alien-romulus-movie-poster_bce598ef.jpeg',
  '/movie_poster/l_dune-part-two-movie-poster_3e6691ec.jpeg',
  '/movie_poster/l_the-substance-movie-poster_1dbeba64.jpeg',
  '/movie_poster/l_captain-america-brave-new-world-movie-poster_d309c549.jpeg',
  '/movie_poster/l_black-panther-wakanda-forever-movie-poster_7d7dc251.jpeg',
  '/movie_poster/l_the-beekeeper-movie-poster_4075f58c.jpeg',
  '/movie_poster/l_f1-the-movie-movie-poster_c4cb907a.jpeg',
  '/movie_poster/l_wicked-movie-poster_d65e7d87.jpeg',
  '/movie_poster/l_wonka-movie-poster_7f3d2b2e.jpeg',
  '/movie_poster/l_the-super-mario-bros-movie-movie-poster_c62032f8.jpeg',
  '/movie_poster/l_despicable-me-4-movie-poster_3c4ff16e.jpeg',
  '/movie_poster/l_bad-boys-ride-or-die-movie-poster_94c04697.jpeg',
  '/movie_poster/poster1.jpg',
  '/movie_poster/poster2.jpg',
  '/movie_poster/poster3.jpg',
  '/movie_poster/poster4.jpg',
  '/movie_poster/poster5.jpg',
  '/movie_poster/poster6.jpg',
];

function VerticalPosterScroller() {
  const columnData = useMemo(() => {
    const col1 = [];
    const col2 = [];
    const col3 = [];

    FOLDER_POSTERS.forEach((poster, idx) => {
      if (idx % 3 === 0) col1.push(poster);
      else if (idx % 3 === 1) col2.push(poster);
      else col3.push(poster);
    });

    // Duplicate list items to create seamless infinite continuous scrolling loop
    return {
      col1: [...col1, ...col1, ...col1],
      col2: [...col2, ...col2, ...col2],
      col3: [...col3, ...col3, ...col3],
    };
  }, []);

  return (
    <div className="vertical-scroller-container" aria-label="Vertical Movie Posters Showcase">
      <div className="vertical-scroller-grid">
        {/* Column 1: Scrolls Downwards */}
        <div className="vertical-column column-down">
          <div className="vertical-track track-down">
            {columnData.col1.map((url, idx) => (
              <div key={`col1-${idx}`} className="vertical-poster-card">
                <img src={url} alt="" className="vertical-poster-img" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Scrolls Upwards */}
        <div className="vertical-column column-up">
          <div className="vertical-track track-up">
            {columnData.col2.map((url, idx) => (
              <div key={`col2-${idx}`} className="vertical-poster-card">
                <img src={url} alt="" className="vertical-poster-img" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Scrolls Downwards */}
        <div className="vertical-column column-down">
          <div className="vertical-track track-down">
            {columnData.col3.map((url, idx) => (
              <div key={`col3-${idx}`} className="vertical-poster-card">
                <img src={url} alt="" className="vertical-poster-img" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerticalPosterScroller;
