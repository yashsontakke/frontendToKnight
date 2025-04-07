import React from 'react';
import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div>
      <h2>Welcome to the Home Page!</h2>
      <p>This page is accessible to everyone.</p>
      <p>
        Please <Link to="/login">Login</Link> to access the dashboard.
      </p>
    </div>
  );
}

export default HomePage;