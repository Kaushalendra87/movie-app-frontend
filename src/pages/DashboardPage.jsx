import { Link } from 'react-router-dom';

function DashboardPage() {
  return (
    <section className="dashboard-card">
      <p className="eyebrow">Private area</p>
      <h1>Dashboard</h1>
      <p>You have successfully reached the private area.</p>

      <div className="dashboard-actions">
        <Link to="/movies" className="primary-link">
          Explore movies & ratings
        </Link>
      </div>
    </section>
  );
}

export default DashboardPage;
