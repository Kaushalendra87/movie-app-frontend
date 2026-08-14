import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../axiosInstance';
import profileService from '../services/profileService';

function AddMoviePage() {
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    genre: '',
    language: 'English',
    duration: '',
    release_date: '',
    description: '',
  });

  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const verifySuperuser = async () => {
      try {
        const res = await profileService.getProfile();
        const isSuper = Boolean(res.data.is_superuser || res.data.is_staff);
        setIsSuperuser(isSuper);
        localStorage.setItem('isSuperuser', isSuper ? 'true' : 'false');
      } catch {
        setIsSuperuser(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    verifySuperuser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setPosterFile(file);
    if (file) {
      setPosterPreview(URL.createObjectURL(file));
    } else {
      setPosterPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.title.trim() || !formData.genre.trim() || !formData.description.trim()) {
      setErrorMessage('Please fill in all required fields (Title, Genre, Description).');
      return;
    }

    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('genre', formData.genre.trim());
      payload.append('language', formData.language.trim());
      payload.append('duration', formData.duration || 120);
      payload.append('release_date', formData.release_date || new Date().toISOString().split('T')[0]);
      payload.append('description', formData.description.trim());

      if (posterFile) {
        payload.append('poster', posterFile);
      }

      const res = await axiosInstance.post('/api/v1/movies/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccessMessage(`Movie "${res.data.title}" was successfully added to the site!`);
      setFormData({
        title: '',
        genre: '',
        language: 'English',
        duration: '',
        release_date: '',
        description: '',
      });
      setPosterFile(null);
      setPosterPreview(null);
    } catch (err) {
      const detail = err?.response?.data?.detail || err?.response?.data?.title?.[0] || 'Failed to add movie to catalog.';
      setErrorMessage(detail);
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Verifying admin permissions...</p>
      </div>
    );
  }

  if (!isSuperuser) {
    return (
      <div className="access-denied-card">
        <span className="access-denied-icon">🔒</span>
        <h2>Superuser Access Required</h2>
        <p>This section is restricted to administrators and superusers only.</p>
        <Link to="/movies" className="primary-link">Back to Movies Catalog</Link>
      </div>
    );
  }

  return (
    <section className="add-movie-page">
      <div className="add-movie-hero">
        <Link to="/movies" className="ghost-button back-btn">← Back to Catalog</Link>
        <div className="admin-badge">👑 Superuser Admin Panel</div>
        <h1>Add New Movie to Site</h1>
        <p className="hero-copy">Fill out the film details below to publish a new movie to the OnlyCinema database.</p>
      </div>

      {errorMessage && <div className="message message--error">{errorMessage}</div>}
      {successMessage && <div className="message message--success">{successMessage}</div>}

      <div className="add-movie-card">
        <form onSubmit={handleSubmit} className="add-movie-form">
          <div className="form-grid">
            <label>
              Movie Title <span className="required-star">*</span>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Inception"
                required
              />
            </label>

            <label>
              Genre <span className="required-star">*</span>
              <input
                type="text"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                placeholder="e.g. Sci-Fi, Action, Drama"
                required
              />
            </label>
          </div>

          <div className="form-grid">
            <label>
              Language
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleChange}
                placeholder="e.g. English, Spanish, Hindi"
              />
            </label>

            <label>
              Duration (minutes)
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g. 148"
                min="1"
              />
            </label>

            <label>
              Release Date
              <input
                type="date"
                name="release_date"
                value={formData.release_date}
                onChange={handleChange}
              />
            </label>
          </div>

          <label>
            Movie Poster Image
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </label>

          {posterPreview && (
            <div className="poster-preview-box">
              <span className="preview-label">Poster Preview:</span>
              <img src={posterPreview} alt="Poster preview" className="poster-preview-img" />
            </div>
          )}

          <label>
            Description / Synopsis <span className="required-star">*</span>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="5"
              placeholder="Enter a detailed storyline, director notes, or synopsis..."
              required
            />
          </label>

          <div className="form-actions">
            <button type="submit" className="primary-link submit-movie-btn" disabled={submitting}>
              {submitting ? 'Publishing Movie...' : '🎬 Publish Movie to Site'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default AddMoviePage;
