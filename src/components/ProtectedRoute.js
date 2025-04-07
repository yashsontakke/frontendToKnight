// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// This component checks if a user is logged in.
// If logged in, it renders the child components (the actual page).
// If not logged in, it redirects the user to the login page.

function ProtectedRoute({ user, children }) {
  // 'user' prop should be the user object from your App state (null if not logged in)
  // 'children' represents the component this route is protecting (e.g., <DashboardPage />)

  let location = useLocation(); // Get the current URL location

  if (!user) {
    // User is not logged in.
    // Redirect them to the /login page.
    // We pass the current location in 'state' so the login page can redirect back
    // to the intended page after successful login (optional but good UX).
    // 'replace' prevents the protected route URL from being added to history.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // User is logged in, render the component they were trying to access.
  return children;
}

export default ProtectedRoute;