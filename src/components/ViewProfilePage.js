// src/components/ViewProfilePage.js
import React from 'react';
import { Link } from 'react-router-dom'; // To link to the update page
import { useState, useEffect, useRef, useCallback } from 'react'; // Added hooks
// Removed Link to update page, add useNavigate maybe
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCookie } from '../utils/cookieUtils'; // For CSRF

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';


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

// Receive user object AND the onProfileUpdated callback from App.js
function ViewProfilePage({ user, onProfileUpdated }) {

    // State for editable fields
    const [editableBio, setEditableBio] = useState('');
    const [imageFile, setImageFile] = useState(null); // File object for upload
    const [imagePreview, setImagePreview] = useState(placeholderAvatar); // Local preview URL or S3 URL

    // State for UI modes and feedback
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false); // Use boolean

    const fileInputRef = useRef(null);
    const navigate = useNavigate(); // If needed for navigation

    // Effect to initialize state when user prop changes
    useEffect(() => {
        if (user) {
            setEditableBio(user.bio || '');
            setImagePreview(getImageUrl(user.profileImagePath));
            // Reset editing state if user changes (e.g., logout/login)
            setIsEditingBio(false);
            setImageFile(null); // Clear any selected file if user changes
        } else {
             // Handle case where user becomes null (e.g., logout while on page)
             setEditableBio('');
             setImagePreview(placeholderAvatar);
             setIsEditingBio(false);
             setImageFile(null);
        }
    }, [user]); // Depend on user prop

    // --- Handlers ---
    const handleImageClick = () => fileInputRef.current?.click();

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file); // Store File object
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result); // Set preview
            reader.readAsDataURL(file);
            setSaveError(null); setSaveSuccess(false); // Clear status on new file
        }
    };

    const handleBioChange = (event) => {
        setEditableBio(event.target.value);
         setSaveError(null); setSaveSuccess(false); // Clear status on edit
    };

    const handleEditBioClick = () => setIsEditingBio(true);

    const handleCancelClick = () => {
        setIsEditingBio(false);
        setEditableBio(user?.bio || ''); // Reset to original bio from prop
        setSaveError(null);
        setSaveSuccess(false);
    };
    // 1941012388.p.jeevankiranlenka@gmail.com
    // --- Save Handler (for Bio and/or Image) ---
    const handleSaveChanges = async () => {
         // Check if anything actually changed (optional optimization)
         const bioChanged = editableBio !== (user?.bio || '');
         const imageChanged = imageFile !== null;
         if (!bioChanged && !imageChanged) {
             setIsEditingBio(false); // Just close editing mode if nothing changed
             return;
         }

        setIsSaving(true); setSaveError(null); setSaveSuccess(false);

        const formData = new FormData();
        // Only append if changed, or always send current state? Send current state is simpler.
        formData.append('bio', editableBio);
        if (imageFile) {
            formData.append('imageFile', imageFile);
        }

        try {
            const endpoint = `/api/users/me/profile`; // Use relative path to MATCHES controller @PatchMapping
            console.log(`Saving profile to ${endpoint}`);

            const csrfToken = getCookie('XSRF-TOKEN');
            const headers = {};
            if (csrfToken) headers['X-XSRF-TOKEN'] = csrfToken;
            else console.warn("Save Profile: CSRF token not found!");

            const response = await axios.patch(endpoint, formData, { headers }); // Use PATCH

            if (response.data) {
                onProfileUpdated(response.data); // Update user state in App.js
                setSaveSuccess(true);
                setIsEditingBio(false); // Exit editing mode on success
                setImageFile(null); // Clear staged file
                 // Update preview *only if* backend confirms new path (already done by onProfileUpdated->useEffect)
                 // setImagePreview(getImageUrl(response.data.profileImagePath));
                setTimeout(() => setSaveSuccess(false), 3000); // Hide success message
            } else { throw new Error("No updated user data returned"); }

        } catch (err) {
            console.error("Error saving profile:", err);
            const errorMessage = err.response?.data?.message || err.response?.data || err.message || "Failed to save profile.";
            if (err.response?.status === 403) setSaveError("Save failed: Authorization or security token issue.");
            else setSaveError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Styles (Combine previous View and Update styles) ---
     const styles = {
         container: { padding: '20px', maxWidth: '600px', margin: '30px auto', fontFamily: 'Arial, sans-serif', color: '#333', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
         profileHeader: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '20px'},
         imageContainer: { position: 'relative', width: '150px', height: '150px', borderRadius: '50%', marginBottom: '15px', cursor: 'pointer', overflow: 'hidden', border: '3px solid #eee' },
         profileImage: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
         editIcon: { position: 'absolute', bottom: '5px', right: '5px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 7px', borderRadius: '50%', fontSize: '14px', pointerEvents: 'none' },
         fileInput: { display: 'none' },
         name: { fontSize: '1.8em', fontWeight: '600', margin: '0', textAlign: 'center' },
         email: { fontSize: '1em', color: '#666', margin: '5px 0 0 0', textAlign: 'center' },
         profileDetails: { textAlign: 'left', marginTop: '10px' },
         detailItem: { marginBottom: '15px' },
         detailLabel: { fontWeight: 'bold', color: '#555', display: 'block', marginBottom: '5px', fontSize: '0.95em' },
         detailValue: { fontSize: '1em', color: '#333', lineHeight: '1.5', whiteSpace: 'pre-wrap' }, // For bio display
         bioTextarea: { width: '100%', minHeight: '120px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', fontSize: '1em', lineHeight: '1.5', boxSizing: 'border-box', resize: 'vertical', marginBottom: '10px' },
         editControls: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' },
         button: { padding: '8px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold' },
         saveButton: { backgroundColor: '#28a745', color: 'white' },
         cancelButton: { backgroundColor: '#6c757d', color: 'white' },
         editButton: { backgroundColor: '#007bff', color: 'white', padding: '5px 15px', fontSize: '0.9em' },
         buttonDisabled: { backgroundColor: '#cccccc', cursor: 'not-allowed' },
         statusMessage: { marginTop: '15px', fontSize: '0.9em', fontWeight: 'bold', textAlign: 'center' },
         errorText: { color: '#dc3545' },
         successText: { color: '#28a745' },
     };

    if (!user) return <div style={styles.container}>Loading user profile...</div>; // Handle loading state

    return (
        <div style={styles.container}>
            {/* --- Profile Header (includes image upload trigger) --- */}
            <div style={styles.profileHeader}>
                <div style={styles.imageContainer} onClick={handleImageClick} title="Click to change profile picture">
                    <img src={imagePreview} alt="Profile" style={styles.profileImage} onError={(e) => { e.target.onerror = null; e.target.src=placeholderAvatar }} />
                    <div style={styles.editIcon}>✎</div>
                    <input type="file" ref={fileInputRef} style={styles.fileInput} accept="image/*" onChange={handleFileChange} />
                </div>
                <h2 style={styles.name}>{user.name || 'N/A'}</h2>
                <p style={styles.email}>{user.email || 'N/A'}</p>
            </div>

            {/* --- Profile Details --- */}
            <div style={styles.profileDetails}>
                {/* Bio Section with Editing */}
                <div style={styles.detailItem}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: styles.detailLabel.marginBottom}}>
                        <span style={styles.detailLabel}>Bio:</span>
                        {!isEditingBio && (
                            <button onClick={handleEditBioClick} style={{...styles.button, ...styles.editButton}}>Edit Bio</button>
                        )}
                    </div>
                    {isEditingBio ? (
                        <div>
                            <textarea
                                value={editableBio}
                                onChange={handleBioChange}
                                style={styles.bioTextarea}
                                placeholder="Tell us about yourself..."
                                rows={6}
                            />
                            <div style={styles.editControls}>
                                <button onClick={handleCancelClick} disabled={isSaving} style={{...styles.button, ...styles.cancelButton}}>Cancel</button>
                                <button onClick={handleSaveChanges} disabled={isSaving} style={{...styles.button, ...styles.saveButton, ...(isSaving ? styles.buttonDisabled : {})}}>
                                    {isSaving ? 'Saving...' : 'Save Bio'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p style={styles.detailValue}>{user.bio || 'No bio provided.'}</p>
                    )}
                </div>

                {/* Read-only fields */}
                 <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Date of Birth:</span>
                    <span style={styles.detailValue}>{formatDate(user.dateOfBirth)}</span>
                </div>
                 <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Gender:</span>
                    <span style={styles.detailValue}>{user.gender || 'Not specified'}</span>
                </div>
                {/* Add other read-only fields if needed */}

            </div>

             {/* Status Messages for Save Action */}
             {saveError && <p style={{...styles.statusMessage, ...styles.errorText}}>Error: {saveError}</p>}
             {saveSuccess && <p style={{...styles.statusMessage, ...styles.successText}}>Profile saved!</p>}

        </div>
    );
}

export default ViewProfilePage;
