import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Assuming your BACKEND_URL is accessible, otherwise define it here or pass as prop
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:8080"; // Or your backend server address

function UpdateProfilePage() {
  // State for form fields
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState(""); // Store as string 'YYYY-MM-DD'
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [imageFile, setImageFile] = useState(null); // State for the File object

  // State for loading and errors
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();

  // --- Handlers ---

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setImageFile(event.target.files[0]); // Store the selected File object
    } else {
      setImageFile(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default HTML form submission
    setIsLoading(true);
    setError(null);
    setSuccessMessage("");

    // --- Retrieve Auth Token ---
    // *** IMPORTANT: Adjust this based on how you store your backend's auth token ***
    let token = null;
    const storedUser = localStorage.getItem("user"); // Assuming user object in localStorage contains the token
    if (storedUser) {
      try {
        // Example: Assuming token is stored as 'token' property within the user object
        token = JSON.parse(storedUser)?.token;
        // If token is stored directly, use: token = localStorage.getItem('authToken');
      } catch (e) {
        console.error("Error parsing stored user data:", e);
      }
    }

    if (!token) {
      setError("Authentication token not found. Please log in again.");
      setIsLoading(false);
      // Optionally redirect to login
      // navigate('/login');
      return;
    }

    // --- Construct FormData ---
    const formData = new FormData();
    formData.append("name", name);
    formData.append("dateOfBirth", dateOfBirth); // Send as string
    formData.append("gender", gender);
    formData.append("bio", bio);
    if (imageFile) {
      formData.append("image", imageFile); // Append the File object directly
    } else {
      // Handle case where image is not required or you want to send empty
      // formData.append('image', new Blob([])); // Or omit if backend handles null
      console.warn("No image file selected for upload.");
      // Depending on backend logic, you might need to handle this differently
    }

    console.log("Submitting FormData:", {
      name,
      dateOfBirth,
      gender,
      bio,
      imageName: imageFile?.name,
    }); // Don't log the actual file content

    // --- API Call ---
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/users/createuser`,
        formData,
        {
          headers: {
            // 'Content-Type': 'multipart/form-data' // Axios sets this automatically for FormData
            Authorization: `Bearer ${token}`, // Send the auth token
          },
        }
      );

      console.log("Profile update response:", response.data);
      setSuccessMessage("Profile updated successfully!");
      setIsLoading(false);

      // Optionally clear form or navigate away
      // setName(''); setDateOfBirth(''); setGender(''); setBio(''); setImageFile(null);
      // navigate('/dashboard'); // Example: Navigate to dashboard after success
    } catch (err) {
      console.error("Error updating profile:", err);
      // Extract more specific error from backend if possible
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data ||
        err.message ||
        "Failed to update profile.";
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // --- Render Form ---
  return (
    <div>
      <h2>Update Your Profile</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        {error && <p style={{ color: "red" }}>Error: {error}</p>}
        {successMessage && <p style={{ color: "green" }}>{successMessage}</p>}

        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="dateOfBirth">Date of Birth:</label>
          <input
            type="date" // Use date input type for better UX
            id="dateOfBirth"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="gender">Gender:</label>
          <input // Consider using <select> for predefined options
            type="text"
            id="gender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            required
          />
          {/* Example using select:
                    <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} required>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                    </select> */}
        </div>
        <div>
          <label htmlFor="bio">Bio:</label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows="4"
          />
        </div>
        <div>
          <label htmlFor="image">Profile Image:</label>
          <input
            type="file"
            id="image"
            accept="image/*" // Accept only image files
            onChange={handleFileChange}
          />
          {imageFile && <p>Selected: {imageFile.name}</p>}
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
}

export default UpdateProfilePage;
