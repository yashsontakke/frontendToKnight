// src/components/ViewProfilePage.js
import React from 'react';
import { Link } from 'react-router-dom'; // To link to the update page

// Placeholder image if user has no profile picture or it fails to load
const placeholderAvatar = '/placeholder-user.png'; // Ensure you have this in /public

// Helper to format LocalDate (if stored as YYYY-MM-DD string) or Date object
const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
        // Assuming dateString is 'YYYY-MM-DD' from backend/DynamoDB String mapping
        const date = new Date(dateString + 'T00:00:00'); // Avoid timezone issues by specifying time
        return date.toLocaleDateString(undefined, { // Use browser's locale
             year: 'numeric', month: 'long', day: 'numeric'
        });
    } catch (e) {
        console.error("Error formatting date:", e);
        return dateString; // Return original string if formatting fails
    }
};

// Helper to construct S3 URL if needed (same as in UpdateProfilePage)
const getImageUrl = (profileImagePath) => {
    if (!profileImagePath) return placeholderAvatar;
    if (profileImagePath.startsWith('http')) return profileImagePath; // Already a full URL

    // Construct S3 URL (ensure env vars are set)
    const bucketName = process.env.REACT_APP_S3_BUCKET_NAME;
    const region = process.env.REACT_APP_AWS_REGION;
    if (!bucketName || !region) {
        console.warn("S3 bucket name or region ENV VAR not set for image URL construction.");
        return placeholderAvatar;
    }
    return `https://${bucketName}.s3.${region}.amazonaws.com/${profileImagePath}`;
};


function ViewProfilePage({ user }) { // Receive user object as prop

    // --- Styles (Mobile-First) ---
    const styles = {
        container: {
            padding: '20px',
            maxWidth: '600px',
            margin: '30px auto',
            fontFamily: 'Arial, sans-serif',
            color: '#333',
            textAlign: 'center', // Center align most content
            backgroundColor: '#fff',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        },
        profileHeader: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '30px',
        },
        profileImage: {
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            objectFit: 'cover',
            marginBottom: '15px',
            border: '4px solid #eee',
        },
        name: {
            fontSize: '1.8em',
            fontWeight: '600',
            margin: '0',
        },
        email: {
            fontSize: '1em',
            color: '#666',
            margin: '5px 0 0 0',
        },
        profileDetails: {
            textAlign: 'left', // Align details text left
            marginTop: '20px',
            padding: '20px',
            borderTop: '1px solid #eee',
        },
        detailItem: {
            marginBottom: '15px',
        },
        detailLabel: {
            fontWeight: 'bold',
            color: '#555',
            display: 'block',
            marginBottom: '3px',
            fontSize: '0.9em',
        },
        detailValue: {
            fontSize: '1em',
            color: '#333',
            lineHeight: '1.5', // For bio readability
            whiteSpace: 'pre-wrap', // Respect newlines in bio
        },
        editButton: {
            display: 'inline-block',
            marginTop: '30px',
            padding: '10px 25px',
            backgroundColor: '#007bff', // Blue edit button
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '25px',
            fontSize: '1em',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
        },
    };

    // Handle case where user data might not be loaded yet
    if (!user) {
        // Or redirect to login? ProtectedRoute should handle this, but good fallback.
        return <div style={{textAlign:'center', padding:'40px'}}>Loading user profile...</div>;
    }

    const imageUrl = getImageUrl(user.profileImagePath);

    return (
        <div style={styles.container}>
            {/* --- Profile Header --- */}
            <div style={styles.profileHeader}>
                <img
                    src={imageUrl}
                    alt="Profile"
                    style={styles.profileImage}
                    onError={(e) => { e.target.onerror = null; e.target.src=placeholderAvatar }} // Fallback
                 />
                <h2 style={styles.name}>{user.name || 'N/A'}</h2>
                <p style={styles.email}>{user.email || 'N/A'}</p>
            </div>

            {/* --- Profile Details --- */}
            <div style={styles.profileDetails}>
                 <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Bio:</span>
                    <p style={styles.detailValue}>{user.bio || 'No bio provided.'}</p>
                </div>
                <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Date of Birth:</span>
                    <span style={styles.detailValue}>{formatDate(user.dateOfBirth)}</span> {/* Use formatter */}
                </div>
                 <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Gender:</span>
                    <span style={styles.detailValue}>{user.gender || 'Not specified'}</span>
                </div>
                 <div style={styles.detailItem}>
                     <span style={styles.detailLabel}>Internal User ID:</span>
                     <span style={styles.detailValue}>{user.userId || 'N/A'}</span> {/* Displaying for info */}
                 </div>
                 <div style={styles.detailItem}>
                     <span style={styles.detailLabel}>Google ID:</span>
                     <span style={styles.detailValue}>{user.googleId || 'N/A'}</span> {/* Displaying for info */}
                 </div>

                {/* Add other relevant fields here */}
            </div>

             {/* --- Edit Button --- */}
             <Link to="/update-profile" style={styles.editButton}>
                 Edit Profile
             </Link>
        </div>
    );
}

export default ViewProfilePage;