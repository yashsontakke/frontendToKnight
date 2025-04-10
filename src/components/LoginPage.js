// src/components/LoginPage.js
import React, { useEffect, useState, useCallback } from 'react';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
console.log("[LoginPage] Read Client ID:", GOOGLE_CLIENT_ID);
/* global google */ // Tell ESLint 'google' is global

// Expects onAccessTokenResponse prop now
function LoginPage({ onAccessTokenResponse }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isGoogleReady, setIsGoogleReady] = useState(false); // Track GSI script readiness

    // Store the token client instance using state
    const [tokenClient, setTokenClient] = useState(null);

    // --- Callback handler for the Token Client ---
    const handleTokenResponse = useCallback((tokenResponse) => {
        setIsLoading(false);
        if (tokenResponse && tokenResponse.access_token) {
            console.log("Google Access Token received by Token Client:", tokenResponse);
            // Pass ONLY the access_token string to the parent App.js handler
            onAccessTokenResponse(tokenResponse.access_token);
        } else {
            console.error("Token Client callback received invalid response:", tokenResponse);
            setError("Failed to get necessary permissions from Google. Please try again.");
        }
    }, [onAccessTokenResponse]); // Depend on the callback prop from App.js

    // --- Error handler for the Token Client ---
    const handleTokenError = useCallback((error) => {
        setIsLoading(false);
        console.error("Google Token Client Error:", error);
        let userMessage = "An error occurred during Google Sign-In.";
        if (error?.type === 'popup_closed_by_user') {
            userMessage = "Sign-in popup closed before completion.";
        } else if (error?.type === 'access_denied') {
            // This will happen if user denies birthday permission
            userMessage = "Permission was denied to access necessary Google account information (including birthday).";
        }
        setError(userMessage + " Please try again.");
    }, []);

    // --- Initialize Google Token Client ---
    useEffect(() => {
        setError(null);
        if (!GOOGLE_CLIENT_ID) {
            console.error("Google Client ID missing.");
            setError("Google Login configuration missing.");
            setIsGoogleReady(false); // Cannot proceed
            return;
        }

        // Check if Google script is loaded
        if (window.google && window.google.accounts && window.google.accounts.oauth2) {
            console.log("[LoginPage useEffect] Google script ready. Initializing Token Client...");
            try {
                // Initialize the OAuth 2.0 Token Client
                const client = google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CLIENT_ID,
                    // --- IMPORTANT: Add the birthday scope here ---
                    scope: `openid email profile https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/user.gender.read`, // <-- ADD GENDER SCOPE
                    callback: handleTokenResponse, // Handler for success (receives Access Token)
                    error_callback: handleTokenError, // Handler for errors
                });
                setTokenClient(client);
                setIsGoogleReady(true);
                console.log("Google Token Client Initialized successfully.");

            } catch (initError) {
                console.error("Error initializing Google Token Client:", initError);
                setError("Failed to initialize Google Sign-In services.");
                setIsGoogleReady(false);
            }
        } else {
            // If script isn't loaded yet, this effect might run again if dependencies change,
            // or you might need a retry mechanism like before if loading is slow/unreliable.
            console.warn("[LoginPage useEffect] Google script not ready yet.");
            setIsGoogleReady(false);
            // Optionally set a temporary error or rely on button being disabled
            // setError("Google Sign-In services are still loading...");
        }

    }, [handleTokenResponse, handleTokenError]); // Re-run if handlers change


    // --- Trigger Login ---
    const handleGoogleLoginClick = () => {
        if (tokenClient) {
            setIsLoading(true);
            setError(null);
            // Request the access token. Triggers Google popup & consent screen.
            tokenClient.requestAccessToken({
                 // Add prompt: 'consent' if you want to force the consent screen
                 // every time, useful for testing scope changes. Remove for production.
                 // prompt: 'consent'
            });
        } else {
            console.error("Google Token Client not initialized yet.");
            setError("Google Sign-In is not ready yet. Please wait or refresh.");
        }
    };

    return (
        <div>
            <h2>Login Page</h2>
            <p>Please sign in with your Google Account:</p>
            <p style={{fontSize: '0.9em', color: '#555'}}>(We will ask for permission to access your basic profile, email, and birthday).</p>

            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>Error: {error}</p>}

            {/* Your Custom Button */}
            <button onClick={handleGoogleLoginClick} disabled={isLoading || !isGoogleReady}>
                {isLoading ? 'Connecting to Google...' : 'Sign in with Google'}
            </button>
            {!isGoogleReady && !error && <p>Loading Google Sign-In...</p>}

            {!GOOGLE_CLIENT_ID && !isLoading && (
                <p style={{ color: 'orange' }}>Warning: Client ID seems missing.</p>
            )}
        </div>
    );
}

export default LoginPage;