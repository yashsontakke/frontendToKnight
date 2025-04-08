// src/components/DashboardPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import UserCard from './UserCard';

// Define constants for location states locally or import from App/constants file
const LOCATION_STATE = {
    IDLE: 'idle', REQUESTING: 'requesting', GRANTED: 'granted',
    DENIED: 'denied', ERROR: 'error',
};

// Placeholder Data
const initialDb = [
    { id: '1', name: 'Alex F.', distance: '2km', goal: 'Marathon Training', pic: null },
    { id: '2', name: 'Brenda C.', distance: '5km', goal: 'Learn React Native', pic: null },
    { id: '3', name: 'Carlos D.', distance: '1km', goal: 'Find Startup Co-founder', pic: null },
    { id: '4', name: 'Diana E.', distance: '3km', goal: 'Book Club', pic: null },
    { id: '5', name: 'Ethan G.', distance: '4km', goal: 'Gym Partner', pic: null },
    { id: '6', name: 'Fiona H.', distance: '1.5km', goal: 'Language Exchange', pic: null },
];


// Receive props from App.js
function DashboardPage({
    user,
    onLogout,
    locationState, // <-- Prop from App.js
    userCoords,    // <-- Prop from App.js
    locationError, // <-- Prop from App.js
    requestLocation // <-- Prop from App.js (function to call)
}) {
    const navigate = useNavigate();

    // Local state for managing the user queue and UI elements
    const [nearbyUsers, setNearbyUsers] = useState([]); // Populated when location granted
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    // --- Effect to load users when location is granted ---
    useEffect(() => {
        if (locationState === LOCATION_STATE.GRANTED && userCoords) {
            // Avoid re-loading if users are already present maybe?
            // Or always reload? Depends on if backend fetch is idempotent.
            // For now, let's load the placeholders if the list is empty.
            if (nearbyUsers.length === 0) {
                 console.log("DashboardPage: Location granted! Simulating fetch.");
                 // --- TODO: Replace with actual API call using userCoords ---
                 // const fetchedUsers = await fetchNearbyUsersAPI(userCoords);
                 // setNearbyUsers(fetchedUsers);
                 setNearbyUsers(initialDb); // Load placeholder data
                 setCurrentIndex(0);
                 // --- End TODO ---
            }
        } else if (locationState !== LOCATION_STATE.REQUESTING) {
            // Clear users if location is not granted (denied, error, idle)
             if (nearbyUsers.length > 0) { // Only clear if needed
                console.log("DashboardPage: Location not granted, clearing users.");
                setNearbyUsers([]);
                setCurrentIndex(0);
             }
        }
        // Only run when location state or coords change
    }, [locationState, userCoords, nearbyUsers.length]);


    // --- Current User Logic ---
    const currentUser = nearbyUsers.length > 0 && currentIndex < nearbyUsers.length
                        ? nearbyUsers[currentIndex]
                        : null;

    // --- Action Handlers (Like/Ignore) ---
    const handleLike = useCallback(() => {
        if (!currentUser) return;
        console.log(`ACTION: Like user ${currentUser.id} (${currentUser.name})`);
        // TODO: Send "like" request to backend for currentUser.id (LATER)
        setCurrentIndex(prevIndex => prevIndex + 1);
    }, [currentUser]);

    const handleIgnore = useCallback(() => {
        if (!currentUser) return;
        console.log(`ACTION: Ignore user ${currentUser.id} (${currentUser.name})`);
        // TODO: Send "ignore" request or handle queue logic (LATER)
        setCurrentIndex(prevIndex => prevIndex + 1);
    }, [currentUser]);

    // --- Keyboard Listener ---
    useEffect(() => {
        const handleKeyDown = (event) => {
             const focusedElement = document.activeElement;
             if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
                 (focusedElement && ['INPUT', 'TEXTAREA', 'BUTTON', 'A'].includes(focusedElement.tagName))) {
                 return;
             }
            // Check if location is granted and a user is available
            if (locationState !== LOCATION_STATE.GRANTED || !currentUser) {
                return;
            }

            if (event.key === 'ArrowRight') handleLike();
            else if (event.key === 'ArrowUp') handleIgnore();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleLike, handleIgnore, currentUser, locationState]); // Dependencies accurate

    // --- Profile Menu Handlers ---
    const toggleProfileMenu = () => setIsProfileMenuOpen(prev => !prev);
    const closeMenu = () => setIsProfileMenuOpen(false);
    const handleLogoutClick = () => { onLogout(); closeMenu(); }; // Calls prop
    const goToUpdateProfile = () => { navigate('/update-profile'); closeMenu(); };
    const goToViewProfile = () => { console.warn("Navigate to View Profile page - Not implemented yet."); closeMenu(); }

    // --- Styles --- (Keep the styles object defined previously)
    const styles = {
        dashboardContainer: { minHeight: 'calc(100vh - 60px)', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto', backgroundColor: '#f0f2f5', position: 'relative', padding: '20px', boxSizing: 'border-box' },
        title: { textAlign: 'center', color: '#444', marginBottom: '20px', fontSize: '1.3em', fontWeight: 600 },
        contentArea: { flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: '20px', minHeight: '60vh' },
        permissionContainer: { textAlign: 'center', padding: '20px', maxWidth: '400px' },
        permissionButton: { padding: '12px 25px', fontSize: '1.1em', fontWeight: 'bold', borderRadius: '50px', border: 'none', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', marginTop: '20px' },
        errorText: { color: '#dc3545', marginTop: '10px', fontSize: '0.9em' },
        coordsText: { fontSize: '0.8em', color: '#888', marginTop: '5px', marginBottom: '10px' },
        cardDisplayArea: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', flexGrow: 1, marginBottom: '20px' },
        actionButtonsContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', padding: '10px 0 20px 0', gap: '25px' },
        actionButton: { padding: '15px 25px', fontSize: '1.1em', fontWeight: 'bold', borderRadius: '50px', border: 'none', cursor: 'pointer', minWidth: '120px', textAlign: 'center', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'},
        likeButton: { backgroundColor: '#28a745' },
        ignoreButton: { backgroundColor: '#dc3545' },
        infoText: { textAlign: 'center', color: '#666', fontSize: '1.1em', padding: '20px' },
        fabContainer: { position: 'fixed', bottom: '25px', right: '25px', zIndex: 1000 },
        fab: { backgroundColor: '#6200EE', color: 'white', width: '56px', height: '56px', borderRadius: '50%', border: 'none', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', fontSize: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
        profileMenu: { position: 'absolute', bottom: '70px', right: '0px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)', padding: '10px 0', minWidth: '150px', zIndex: 1001, display: isProfileMenuOpen ? 'block' : 'none' },
        menuItem: { display: 'block', padding: '10px 20px', color: '#333', textDecoration: 'none', fontSize: '1em', cursor: 'pointer', backgroundColor: 'transparent', border: 'none', width: '100%', textAlign: 'left' },
   };

    // --- Conditional Rendering Function ---
    const renderMainContent = () => {
        switch (locationState) { // Use prop from App.js
            case LOCATION_STATE.GRANTED:
                return (
                    <>
                        {userCoords && (
                            <p style={styles.coordsText}>
                                Approx. Location: {userCoords.latitude.toFixed(3)}, {userCoords.longitude.toFixed(3)}
                            </p>
                        )}
                        <div style={styles.cardDisplayArea}>
                            {currentUser ? (
                                <UserCard user={currentUser} />
                            ) : (
                                <p style={styles.infoText}>No more users nearby right now!</p>
                            )}
                        </div>
                        {currentUser && (
                             <div style={styles.actionButtonsContainer}>
                                 <button onClick={handleIgnore} style={{...styles.actionButton, ...styles.ignoreButton}} title="Ignore (Arrow Up)">Ignore (↑)</button>
                                 <button onClick={handleLike} style={{...styles.actionButton, ...styles.likeButton}} title="Like (Arrow Right)">Like (→)</button>
                             </div>
                        )}
                    </>
                );
            case LOCATION_STATE.REQUESTING:
                return (
                    <div style={styles.permissionContainer}>
                        <p style={styles.infoText}>Getting your location...</p>
                        {/* You could add a visual spinner here */}
                    </div>
                );
            case LOCATION_STATE.DENIED:
            case LOCATION_STATE.ERROR:
                return (
                     <div style={styles.permissionContainer}>
                        <p style={styles.infoText}>Location access is needed to find people near you.</p>
                        {locationError && <p style={styles.errorText}>{locationError}</p>}
                        {/* Call the request function passed as prop */}
                        <button onClick={requestLocation} style={styles.permissionButton}>
                            {locationState === LOCATION_STATE.DENIED ? 'Grant Location Permission' : 'Retry Location'}
                        </button>
                    </div>
                );
            case LOCATION_STATE.IDLE:
            default:
                return (
                    <div style={styles.permissionContainer}>
                        <p style={styles.infoText}>Enable location services to discover goal partners nearby!</p>
                         {/* Call the request function passed as prop */}
                        <button onClick={requestLocation} style={styles.permissionButton}>
                            Find Nearby Users
                        </button>
                    </div>
                );
        }
    };

    return (
        <div style={styles.dashboardContainer}>
            <h2 style={styles.title}>Discover Nearby</h2>
            <div style={styles.contentArea}>
                {renderMainContent()}
            </div>

            {/* FAB and Menu */}
            <div style={styles.fabContainer}>
                 <div style={styles.profileMenu}>
                    <button onClick={goToViewProfile} style={styles.menuItem}>View Profile</button>
                    <button onClick={goToUpdateProfile} style={styles.menuItem}>Update Profile</button>
                    <button onClick={handleLogoutClick} style={{...styles.menuItem, color: 'red'}}>Logout</button>
                </div>
                <button style={styles.fab} onClick={toggleProfileMenu} title="Profile Menu" aria-haspopup="true" aria-expanded={isProfileMenuOpen}>
                    👤
                </button>
            </div>
        </div>
    );
}

export default DashboardPage;