// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Components
import HomePage from './components/HomePage';
import DashboardPage from './components/DashboardPage';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import PublicOnlyRoute from './components/PublicOnlyRoute';
import UpdateProfilePage from './components/UpdateProfilePage';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

function App() {
    // State still holds user data, but populated directly from login or initial storage
    const [user, setUser] = useState(null);
    // State for your backend's JWT
    const [appToken, setAppToken] = useState(null); // Initialize from null, check storage in useEffect
    // Loading state for the initial check of stored auth data
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    // Loading state specifically for the login API call process
    const [isLoginLoading, setIsLoginLoading] = useState(false);
    // State for displaying login/auth errors
    const [authError, setAuthError] = useState(null);

    // --- Logout Handler ---
    const handleLogout = useCallback(() => {
        console.log("handleLogout called");
        setUser(null);
        setAppToken(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData'); // Clear stored user data
        setAuthError(null);
    }, []);

    // --- REMOVED loadUserProfile function ---

    // --- Initial Load Check (Simplified) ---
    useEffect(() => {
        console.log("App useEffect running: Checking initial token/user data from localStorage...");
        const storedToken = localStorage.getItem('authToken');
        const storedUserData = localStorage.getItem('userData');

        if (storedToken && storedUserData) {
            // If we find token AND user data in storage, assume user is logged in
            console.log("Token and user data found in storage.");
            setAppToken(storedToken);
            try {
                // Set user state directly from stored data
                setUser(JSON.parse(storedUserData));
                console.log("Initial user state set from localStorage.");
            } catch (e) {
                // If stored data is corrupt, clear everything
                console.error("Error parsing stored user data:", e);
                handleLogout(); // Use logout to clear everything consistently
            }
        } else {
            // No token or no user data found, ensure logged out state
            console.log("No valid initial token/user data found in localStorage.");
            // Ensure state reflects logged out if storage is missing/inconsistent
             if(user || appToken) { // Only clear state if it somehow got set incorrectly
                 handleLogout();
             }
        }
        // Finished the initial check from storage
        setIsAuthLoading(false);
    }, [handleLogout]); // Include handleLogout in dependency array

    // --- Handler for Google Auth Response from LoginPage ---
    const handleGoogleAuthResponse = async (accessToken) => {
        if (!accessToken) {
             console.error("handleGoogleAuthResponse called without access token.");
             setAuthError("Google authentication failed. No access token received.");
             setIsLoginLoading(false);
             return;
        }
        console.log("handleGoogleAuthResponse: Google Access Token received, calling backend...");
        setIsLoginLoading(true); // Use separate loading state for login process
        setAuthError(null);

        try {
            const response = await axios.post(`${BACKEND_URL}/api/auth/google`, {
                accessToken: accessToken
            });

            console.log('Backend /google Auth Response:', response.data);

            // Expect backend to return { token: 'YOUR_APP_JWT', user: {...} }
            if (response.data && response.data.token && response.data.user) {
                const receivedAppToken = response.data.token;
                const userData = response.data.user;

                // Store token, update user state
                setAppToken(receivedAppToken);
                setUser(userData); // User state now comes directly from login response
                localStorage.setItem('authToken', receivedAppToken);
                localStorage.setItem('userData', JSON.stringify(userData)); // Store user data from login

                console.log("Login and backend auth successful, app token stored.");

            } else {
                 throw new Error("Invalid response structure from backend /api/auth/google");
            }

        } catch (error) {
            console.error("Error processing Google login via backend:", error.response?.data || error.message);
            setAuthError("Failed to complete login via backend. Please try again.");
            handleLogout(); // Clear state on error
        } finally {
            setIsLoginLoading(false); // Stop login loading indicator
        }
    };

    // --- Render Logic ---
    // Show loading indicator only during the initial check from localStorage
    if (isAuthLoading) {
        return <div>Checking session...</div>;
    }

    return (
        <Router>
            <div className="App">
                <header className="App-header">
                    <h1>My App</h1>
                    {user && ( // Check user state for login status
                        <button onClick={handleLogout} style={{ float: 'right', margin: '10px' }} disabled={isLoginLoading}>
                            Logout ({user?.name || user?.email})
                        </button>
                    )}
                </header>

                 {/* Display login errors (only when not logged in) */}
                 {authError && !user && <p style={{color: 'red', textAlign: 'center', border: '1px solid red', padding: '5px'}}>{authError}</p>}
                 {/* Display login loading indicator */}
                 {isLoginLoading && <p style={{textAlign: 'center'}}>Logging in...</p>}


                <Routes>
                    {/* Pass 'user' state to determine access */}
                    <Route path="/dashboard" element={<ProtectedRoute user={user}><DashboardPage user={user} /></ProtectedRoute>} />
                    <Route path="/update-profile" element={<ProtectedRoute user={user}><UpdateProfilePage currentUser={user} /></ProtectedRoute>} />
                    <Route
                        path="/login"
                        element={
                            <PublicOnlyRoute user={user}>
                                {/* Pass the correct handler */}
                                <LoginPage onAccessTokenResponse={handleGoogleAuthResponse} />
                            </PublicOnlyRoute>
                        }
                    />
                    <Route path="/" element={<HomePage />} />
                    <Route path="*" element={<div>404 Not Found</div>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;