// src/App.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";
import axios from "axios";

// Import Utility function
import { getDistanceFromLatLonInMeters } from "./utils/locationUtils";

// Components
import HomePage from "./components/HomePage";
import DashboardPage from "./components/DashboardPage";
import LoginPage from "./components/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import UpdateProfilePage from "./components/UpdateProfilePage";

axios.defaults.withCredentials = true;
// Define constants for location states
const LOCATION_STATE = {
  IDLE: "idle",
  REQUESTING: "requesting",
  GRANTED: "granted",
  DENIED: "denied",
  ERROR: "error",
};

const AUTH_BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8080";
const LOCATION_SERVICE_URL =
  process.env.REACT_APP_LOCATION_SERVICE_URL || "http://localhost:8081"; //

const LOCATION_UPDATE_INTERVAL_MS = 60 * 1000; // 1 minute
const MIN_DISTANCE_METERS_TO_UPDATE = 100; // 100 meters

function App() {
  // --- State Variables ---
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [locationState, setLocationState] = useState(LOCATION_STATE.IDLE);
  const [userCoords, setUserCoords] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // --- Refs ---
  const lastSentCoordsRef = useRef(null); // Stores { latitude, longitude }
  const locationIntervalRef = useRef(null); // Stores interval ID

  // --- Logout Handler ---
  // --- Logout Handler ---
  const handleLogout = useCallback(async () => {
    // Make async
    console.log("App.js: handleLogout called");
    const wasLoggedIn = !!user;
    setUser(null);

    // Reset location state
    setLocationState(LOCATION_STATE.IDLE);
    setUserCoords(null);
    setLocationError(null);
    lastSentCoordsRef.current = null;
    setAuthError(null);

    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }

    // --- IMPORTANT: Call Backend Logout Endpoint ---
    // This is necessary for the backend to clear the HttpOnly cookie.
    if (wasLoggedIn) {
      // Avoid calling if already logged out
      try {
        console.log("App.js: Calling backend logout...");
        // Adjust URL and method (POST is common) as needed for your backend endpoint
        await axios.post(`${AUTH_BACKEND_URL}/api/auth/logout`);
        console.log("App.js: Backend logout call potentially successful.");
      } catch (error) {
        // Log error, but proceed with frontend logout regardless
        console.error(
          "App.js: Backend logout call failed:",
          error.response?.data || error.message
        );
      }
    }
    // --- End Backend Logout Call ---
  }, [user]); // Depends on user state to know if backend call needed

  // --- Location Handlers (depend only on setters, which are stable) ---
  const handleLocationSuccess = useCallback((position) => {
    const { latitude, longitude } = position.coords;
    console.log("App.js: Location permission granted/available:", {
      latitude,
      longitude,
    });
    setUserCoords({ latitude, longitude }); // Store current coords
    setLocationState(LOCATION_STATE.GRANTED); // Set state to granted
    setLocationError(null);
  }, []);

  const handleLocationError = useCallback((error) => {
    console.error("App.js: Geolocation Error:", error.code, error.message);
    let message = "Could not get location.";
    let state = LOCATION_STATE.ERROR;
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = "Location access denied by user. Enable in browser settings.";
        state = LOCATION_STATE.DENIED;
        break;
      case error.POSITION_UNAVAILABLE:
        message = "Location information is currently unavailable.";
        break;
      case error.TIMEOUT:
        message = "Request to get user location timed out.";
        break;
      default:
        message = "An unknown error occurred retrieving location.";
        break;
    }
    setLocationError(message);
    setLocationState(state);
    setUserCoords(null);

    // Stop interval if permission denied or error likely persistent
    if (
      locationIntervalRef.current &&
      (state === LOCATION_STATE.DENIED || state === LOCATION_STATE.ERROR)
    ) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
      console.log(
        "App.js: Location update interval cleared due to error/denial."
      );
    }
  }, []); // Empty dependency array is fine

  const requestLocationPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by this browser.");
      setLocationState(LOCATION_STATE.ERROR);
      return;
    }
    console.log("App.js: Requesting location permission...");
    setLocationState(LOCATION_STATE.REQUESTING);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      handleLocationError,
      {
        timeout: 15000,
        enableHighAccuracy: false,
      }
    );
  }, [handleLocationSuccess, handleLocationError]);

  // --- Fetch User Profile (Checks Auth via Cookie) ---
  const loadUserProfile = useCallback(async () => {
    console.log(
      "App.js: loadUserProfile: Attempting /api/users/me to check auth status..."
    );
    // Don't set loading true here if called after login, only for initial load.
    // setIsAuthLoading(true); // This is set in the initial useEffect only
    setAuthError(null);
    try {
      // Browser sends HttpOnly cookie automatically because axios.defaults.withCredentials = true
      const response = await axios.get(`${AUTH_BACKEND_URL}/api/users/me`);

      if (response.data) {
        console.log(
          "App.js: loadUserProfile: Success. User is logged in.",
          response.data
        );
        setUser(response.data); // Set user state
      } else {
        // Should ideally not happen - backend should send user or error status
        throw new Error("Received empty profile data from /api/users/me");
      }
    } catch (error) {
      console.log(
        "App.js: loadUserProfile: Failed (likely not logged in or token expired). Status:",
        error.response?.status
      );
      // If error (likely 401/403), ensure user state is null
      if (user !== null) {
        // Only clear if it wasn't already null
        setUser(null);
      }
      // No need to call handleLogout here unless you want full cleanup on *any* /me failure
    } finally {
      // Only set initial auth loading to false
      if (isAuthLoading) setIsAuthLoading(false);
    }
  }, [user, isAuthLoading]); // Added dependencies
  // --- Initial Load Check ---
  useEffect(() => {
    console.log("App.js: Initial load effect, attempting loadUserProfile...");
    setIsAuthLoading(true); // Set loading true for this initial check
    loadUserProfile();
    // We cannot know synchronously if user is logged in anymore,
    // so isAuthLoading will be set to false within loadUserProfile.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // --- Google Auth Handler ---
  const handleGoogleAuthResponse = useCallback(
    async (accessToken) => {
      if (!accessToken) {
        /* ... error handling ... */ return;
      }
      console.log("App.js: Google Access Token received, calling backend...");
      setIsLoginLoading(true);
      setAuthError(null);
      lastSentCoordsRef.current = null; // Reset last sent location on new login
      if (locationIntervalRef.current)
        clearInterval(locationIntervalRef.current); // Clear old interval

      try {
        // EXPECTATION: Backend verifies accessToken, finds/creates user,
        // SETS HttpOnly auth cookie via 'Set-Cookie' header,
        // and returns user data in the body (or just status OK).
        const response = await axios.post(
          `${AUTH_BACKEND_URL}/api/auth/google`,
          { accessToken }
        );

        console.log(
          "App.js: Backend /google Auth Response Status:",
          response.status
        );
        console.log(
          "App.js: Backend /google Auth Response Data:",
          response.data
        );

        // Check if login was successful (cookie should be set by browser now)
        // Option A: Backend returns user data in body
        if (response.data && response.data.user) {
          setUser(response.data.user); // Set user state directly
          console.log(
            "App.js: Login successful (user data in response). HttpOnly cookie should be set."
          );
        }
        // Option B: Backend returns only 200 OK/204 No Content (cookie is set)
        else if (response.status === 200 || response.status === 204) {
          console.log(
            "App.js: Login successful (backend returned OK/NoContent, cookie set), fetching user data..."
          );
          // Need to fetch user data now to confirm and populate state
          await loadUserProfile(); // Fetch user data using the new cookie
        } else {
          throw new Error(
            "Invalid or unexpected response from backend /api/auth/google"
          );
        }

        // Reset location state after successful login
        setLocationState(LOCATION_STATE.IDLE);
        setUserCoords(null);
        setLocationError(null);
      } catch (error) {
        console.error(
          "App.js: Error processing Google login via backend:",
          error.response?.data || error.message
        );
        setAuthError("Failed to complete login via backend.");
        handleLogout();
      } finally {
        setIsLoginLoading(false);
      }
    },
    [handleLogout]
  );

  // Get CSRF token from cookie
  function getCsrfToken() {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match && decodeURIComponent(match[1]);
  }

  const sendLocationToBackend = useCallback(
    async (coords) => {
      if (!coords) {
        /* ... */ return false;
      }
      const endpoint = `${LOCATION_SERVICE_URL}/api/location/update`; // Ensure correct URL
      console.log(
        `App.js: Attempting POST ${endpoint} (expecting cookie + CSRF if needed)`
      );
      try {
        // --- IMPORTANT: CSRF Protection ---
        // If your backend enabled CSRF protection (which it SHOULD with cookie auth),
        // you MUST include the CSRF token here. Typically read from a non-HttpOnly
        // 'XSRF-TOKEN' cookie and sent in an 'X-XSRF-TOKEN' header.
        // Example (needs helper function `getCsrfToken`):
        const config = { headers: { "X-XSRF-TOKEN": getCsrfToken() } };
        await axios.post(endpoint, coords, config);
        // --- For now, assuming CSRF header is handled automatically by axios or not yet enabled ---
        // await axios.post(endpoint, coords); // Browser sends auth cookie automatically

        console.log("App.js: Location sent successfully.");
        return true;
      } catch (error) {
        console.error(
          "App.js: Error sending location:",
          error.response?.status,
          error.response?.data || error.message
        );
        if (error.response?.status === 401 || error.response?.status === 403) {
          // 403 could be invalid CSRF token
          console.warn(
            "App.js: Received 401/403 from location service. Logging out."
          );
          handleLogout();
        }
        return false;
      }
    },
    [handleLogout]
  );
  // --- Function Called by Interval ---
  const updateLocationIfMoved = useCallback(() => {
    console.log("App.js/Interval: Checking location...");
    if (!navigator.geolocation) {
      console.warn("Interval: Geolocation not supported.");
      if (locationIntervalRef.current)
        clearInterval(locationIntervalRef.current);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const currentCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          // Optional: Add accuracy, timestamp if backend needs them
          // accuracy: position.coords.accuracy,
          // timestamp: position.timestamp
        };
        const previousCoords = lastSentCoordsRef.current;

        console.debug("Interval: Current Coords:", currentCoords);
        console.debug("Interval: Last Sent Coords:", previousCoords);

        let shouldSend = false;
        if (!previousCoords) {
          shouldSend = true; // Send the first time
        } else {
          const distance = getDistanceFromLatLonInMeters(
            // Use imported function
            previousCoords.latitude,
            previousCoords.longitude,
            currentCoords.latitude,
            currentCoords.longitude
          );
          console.log(`Interval: Distance = ${distance.toFixed(0)}m`);
          if (distance >= MIN_DISTANCE_METERS_TO_UPDATE) {
            shouldSend = true;
          } else {
            console.log("Interval: Distance < threshold, not sending.");
          }
        }

        if (shouldSend) {
          console.log(
            "Interval: Conditions met, attempting to send location..."
          );
          const success = await sendLocationToBackend(currentCoords);
          if (success) {
            lastSentCoordsRef.current = currentCoords; // Update ref only on success
            console.log("Interval: Updated lastSentCoordsRef.", currentCoords);
          } else {
            console.warn(
              "Interval: Backend update failed, lastSentCoordsRef not updated."
            );
          }
        }
        // Update general userCoords state regardless of sending,
        // so UI can potentially show latest known location
        setUserCoords(currentCoords);
      },
      (error) => {
        console.error(
          "Interval: Error getting location:",
          error.code,
          error.message
        );
        handleLocationError(error); // Use existing handler
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, [sendLocationToBackend, handleLocationError, setUserCoords]); // Dependencies

  // --- Effect to Start/Stop Location Update Interval ---
  useEffect(() => {
    // Run only if: user is logged in, token exists, location permission granted
    if (user && locationState === LOCATION_STATE.GRANTED) {
      console.log("App.js: Starting location update interval...");

      if (locationIntervalRef.current)
        clearInterval(locationIntervalRef.current); // Clear previous just in case

      // Run once immediately, then start interval
      updateLocationIfMoved();
      locationIntervalRef.current = setInterval(
        updateLocationIfMoved,
        LOCATION_UPDATE_INTERVAL_MS
      );

      // Cleanup function
      return () => {
        if (locationIntervalRef.current) {
          clearInterval(locationIntervalRef.current);
          locationIntervalRef.current = null;
          console.log(
            "App.js: Location update interval cleared on effect cleanup."
          );
        }
      };
    } else {
      // Ensure interval is cleared if conditions are not met
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
        console.log(
          "App.js: Location update interval cleared (conditions not met)."
        );
      }
    }
  }, [user, locationState, updateLocationIfMoved]); // Dependencies

  // --- Render Logic ---
  if (isAuthLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px", fontSize: "1.2em" }}>
        Checking session...
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {authError && !user && (
          <p
            style={{
              color: "red",
              textAlign: "center",
              border: "1px solid red",
              padding: "5px",
              margin: "10px",
            }}
          >
            {authError}
          </p>
        )}
        {isLoginLoading && <p style={{ textAlign: "center" }}>Logging in...</p>}

        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute user={user}>
                <LoginPage onAccessTokenResponse={handleGoogleAuthResponse} />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute user={user}>
                <DashboardPage
                  user={user}
                  onLogout={handleLogout}
                  locationState={locationState}
                  userCoords={userCoords}
                  locationError={locationError}
                  requestLocation={requestLocationPermission}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/update-profile"
            element={
              <ProtectedRoute user={user}>
                <UpdateProfilePage currentUser={user} />
              </ProtectedRoute>
            }
          />

          {/* 404 Not Found */}
          <Route
            path="*"
            element={
              <div style={{ textAlign: "center", padding: "50px" }}>
                <h2>404 - Page Not Found</h2>
                <Link to="/">Go to Home Page</Link>
              </div>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
