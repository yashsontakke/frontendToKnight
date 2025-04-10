// src/components/UserCard.js
import React from 'react';

function UserCard({ user }) {
    const styles = {
        card: {
            position: 'relative', // Needed for absolute positioning inside TinderCard if desired
            width: '90vw',      // Responsive width
            maxWidth: '350px',  // Max width for larger screens
            height: '65vh',     // Responsive height
            maxHeight: '550px',
            borderRadius: '20px',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0px 10px 30px -5px rgba(0, 0, 0, 0.3)',
            backgroundColor: '#ffffff', // Fallback background
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end', // Position text at the bottom
            color: '#333', // Default text color if no background image
            // Add a placeholder background image or color
            // backgroundImage: `url(${user.pic || '/placeholder-user.png'})` // Use this later
            border: '1px solid #eee',
        },
        infoContainer: {
            backgroundColor: 'rgba(255, 255, 255, 0.85)', // Semi-transparent white background for text
            padding: '15px',
            borderRadius: '0 0 15px 15px', // Round bottom corners
            textAlign: 'left',
        },
        name: {
            fontSize: '1.5em',
            fontWeight: 'bold',
            marginBottom: '5px',
        },
        detail: {
            fontSize: '1em',
            marginBottom: '3px',
        }
    };

    return (
        <div style={styles.card}>
            {/* Content positioned at bottom */}
            <div style={styles.infoContainer}>
                <h3 style={styles.name}>{user.name}</h3>
                <p style={styles.detail}>Goal: {user.goal || 'Not specified'}</p>
                <p style={styles.detail}>~ {user.distance || '?'} away</p>
                {/* Add expiry time later if needed */}
            </div>
        </div>
    );
}

export default UserCard;