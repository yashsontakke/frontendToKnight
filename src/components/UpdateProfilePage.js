// src/components/UpdateProfilePage.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getCookie } from '../utils/cookieUtils'; // <-- Adjust path as needed


// Placeholder image if user has no profile picture
const placeholderAvatar = '/placeholder-user.png'; // Make sure you have a placeholder image in your public folder

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';


function UpdateProfilePage({ currentUser }) {
    // State for form fields
    const [bio, setBio] = useState('');
    const [imageFile, setImageFile] = useState(null); // Holds the File object for upload
    const [imagePreview, setImagePreview] = useState(placeholderAvatar); // For displaying current/selected image

    // State for UI feedback
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    
    const fileInputRef = useRef(null); // Ref to access hidden file input

    // Effect to initialize form when currentUser data is available/changes
    useEffect(() => {
        if (currentUser) {
            setBio(currentUser.bio || ''); // Set initial bio

            // Construct image URL - *Adjust this based on how you store/serve S3 images*
            let currentImageUrl = placeholderAvatar;
            if (currentUser.profileImagePath) {
                 // If profileImagePath stores the full URL:
                 // currentImageUrl = currentUser.profileImagePath;

                 // If profileImagePath stores only the S3 Key:
                 // Assuming a base URL structure, replace with your actual S3 URL format
                 const s3BaseUrl = `https://${process.env.REACT_APP_S3_BUCKET_NAME}.s3.${process.env.REACT_APP_AWS_REGION}.amazonaws.com/`; // Example S3 URL structure
                 // Check if profileImagePath is already a full URL (e.g., from Google) or just a key
                 if (!currentUser.profileImagePath.startsWith('http')) {
                      currentImageUrl = s3BaseUrl + currentUser.profileImagePath;
                 } else {
                      currentImageUrl = currentUser.profileImagePath; // Use it directly if it's already a full URL
                 }

            }
            setImagePreview(currentImageUrl);
        }
    }, [currentUser]); // Rerun if currentUser object changes

    // --- Handlers ---
    const handleImageClick = () => {
        // Trigger the hidden file input click
        fileInputRef.current?.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            // Generate a temporary local preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result); // Show preview of selected file
            };
            reader.readAsDataURL(file);
            setSuccessMessage(''); // Clear previous success message
            setError(null);
        }
    };

    const handleBioChange = (event) => {
        setBio(event.target.value);
        setSuccessMessage(''); // Clear success message on edit
        setError(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMessage('');
    
        // --- Construct FormData (remains the same) ---
        const formData = new FormData();
        if (bio !== null) formData.append('bio', bio);
        if (imageFile) formData.append('imageFile', imageFile);
    
        // --- API Call ---
        try {
            const endpoint = `/api/users/me/profile`; // Use relative path
            console.log(`Submitting profile update to ${endpoint}`);
    
            
            // We manually add the CSRF header here
            const response = await axios.post(endpoint, formData);
    
            console.log('Profile update successful:', response.data);
            setSuccessMessage('Profile updated successfully!');
            setImageFile(null); // Clear selected file after success
    
            // Handle updating preview if backend returns new image path/URL
            if (response.data?.profileImagePath) {
                let updatedImageUrl = '/placeholder-user.png'; // Fallback
                const s3BaseUrl = `https://${process.env.REACT_APP_S3_BUCKET_NAME}.s3.${process.env.REACT_APP_AWS_REGION}.amazonaws.com/`;
                if (!response.data.profileImagePath.startsWith('http')) {
                     updatedImageUrl = s3BaseUrl + response.data.profileImagePath;
                } else {
                     updatedImageUrl = response.data.profileImagePath;
                }
               setImagePreview(updatedImageUrl); // Update preview to reflect saved image
            }
    
        } catch (err) {
            console.error("Error updating profile:", err);
             const errorMessage = err.response?.data?.message || err.response?.data || err.message || "Failed to update profile.";
             // Specifically check for 403, which could be CSRF failure
             if (err.response?.status === 403) {
                  setError("Update failed: Authorization or security token issue. Please log in again.");
                  // Consider calling handleLogout passed down from App.js
             } else {
                  setError(errorMessage);
             }
        } finally {
            setIsLoading(false);
        }
    };
    

    // --- Styles ---
    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px',
            maxWidth: '500px', // Suitable for mobile view centered on desktop
            margin: '30px auto',
            fontFamily: 'Arial, sans-serif',
        },
        title: {
            color: '#333',
            marginBottom: '30px',
        },
        form: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        },
        imageContainer: {
            position: 'relative',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            marginBottom: '20px',
            cursor: 'pointer',
            overflow: 'hidden', // Ensure image stays within bounds
            border: '3px solid #eee',
        },
        profileImage: {
            width: '100%',
            height: '100%',
            objectFit: 'cover', // Crop image nicely
            display: 'block',
        },
        imageOverlay: { // Simple overlay to suggest clickability
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0, // Hidden by default
            transition: 'opacity 0.2s ease-in-out',
            borderRadius: '50%',
            fontSize: '0.8em',
            textAlign: 'center',
            pointerEvents: 'none', // Allow clicks to go through to container
        },
        // Show overlay on container hover (requires CSS or JS event handlers)
        // In JS: add onMouseEnter/onMouseLeave to imageContainer to toggle a state/class
        // Simpler: Just always show edit text lightly? Or use an edit icon?
         editIcon: { // Example using simple text, replace with icon
             position: 'absolute',
             bottom: '5px',
             right: '5px',
             backgroundColor: 'rgba(0,0,0,0.6)',
             color: 'white',
             padding: '4px 6px',
             borderRadius: '50%',
             fontSize: '14px', // Adjust size
             pointerEvents: 'none', // Let click go to container
         },
        fileInput: {
            display: 'none', // Hide the actual file input
        },
        fieldGroup: {
            width: '100%',
            marginBottom: '25px',
            textAlign: 'left',
        },
        label: {
            display: 'block', // Label on its own line
            fontWeight: 'bold',
            marginBottom: '8px',
            fontSize: '0.95em',
            color: '#555',
        },
        textarea: {
            width: '100%',
            minHeight: '120px',
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            fontSize: '1em',
            lineHeight: '1.5',
            boxSizing: 'border-box', // Include padding in width
            resize: 'vertical', // Allow vertical resize only
        },
        button: {
            padding: '12px 35px',
            backgroundColor: '#6200EE', // Theme color
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            fontSize: '1.1em',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            marginTop: '10px',
        },
        buttonDisabled: {
            backgroundColor: '#cccccc',
            cursor: 'not-allowed',
        },
        statusMessage: {
            marginTop: '15px',
            fontSize: '0.9em',
            fontWeight: 'bold',
        },
        errorText: {
            color: '#dc3545', // Red
        },
        successText: {
            color: '#28a745', // Green
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Update Your Profile</h2>

            {!currentUser ? (
                <p>Loading...</p>
            ) : (
                <form style={styles.form} onSubmit={handleSubmit}>
                    {/* Profile Image Section */}
                    <div style={styles.imageContainer} onClick={handleImageClick} title="Click to change profile picture">
                        <img
                            src={imagePreview}
                            alt="Profile Preview"
                            style={styles.profileImage}
                            onError={(e) => { e.target.onerror = null; e.target.src=placeholderAvatar }} // Fallback if URL is bad
                        />
                         {/* Edit Indicator */}
                         <div style={styles.editIcon}>✎</div>
                         {/* Hidden File Input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={styles.fileInput}
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Bio Section */}
                    <div style={styles.fieldGroup}>
                        <label htmlFor="bio" style={styles.label}>Your Bio:</label>
                        <textarea
                            id="bio"
                            value={bio}
                            onChange={handleBioChange}
                            rows="5" // Adjust as needed
                            style={styles.textarea}
                            placeholder="Tell us a bit about yourself and your goals..."
                        />
                    </div>

                    {/* Status Messages */}
                    {error && <p style={{...styles.statusMessage, ...styles.errorText}}>Error: {error}</p>}
                    {successMessage && <p style={{...styles.statusMessage, ...styles.successText}}>{successMessage}</p>}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{...styles.button, ...(isLoading ? styles.buttonDisabled : {})}}
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            )}
        </div>
    );
}

export default UpdateProfilePage;