import React from "react";
import { Link } from "react-router-dom"; // Import Link

function DashboardPage({ user }) {
  // Assuming your backend sends back user info like name, email etc.
  // Adjust based on the actual structure of the 'user' object from your backend
  const userName = user?.name || user?.email || "User"; // Try to get a name

  return (
    <div>
      <h2>Dashboard</h2>
      <p>Welcome, {userName}!</p>
      <p>You are logged in and can see this protected page.</p>
      {/* You can display more user info if available */}
      {user && (
        <pre
          style={{
            background: "#f4f4f4",
            padding: "10px",
            borderRadius: "5px",
          }}
        >
          User Data from Backend: {JSON.stringify(user, null, 2)}
        </pre>
      )}
      {/* Add dashboard content here later */}
      <p>
        <Link to="/update-profile">Update Your Profile</Link>
      </p>
    </div>
  );
}

export default DashboardPage;
