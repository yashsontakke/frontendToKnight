// src/components/PublicOnlyRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

// This component is for pages that should *only* be visible to logged-out users (like Login/Signup).
// If a logged-in user tries to access it, they get redirected away (e.g., to the dashboard).

function PublicOnlyRoute({ user, children }) {
  // 'user' prop should be the user object from your App state (null if not logged in)
  // 'children' represents the component this route is wrapping (e.g., <LoginPage />)

  if (user) {
    // User IS logged in.
    // Redirect them away from this page (e.g., to the main dashboard).
    // 'replace' prevents the login page URL from being added to history.
    return <Navigate to="/dashboard" replace />;
  }

  // User is not logged in, render the component (e.g., the login page).
  return children;
}

export default PublicOnlyRoute;