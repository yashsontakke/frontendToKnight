// src/components/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation

function HomePage() {

  // --- Styles (Mobile-First) ---
  // Defined as an object for better organization than pure inline style props
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column', // Stack elements vertically
      alignItems: 'center',    // Center-align items horizontally
      justifyContent: 'center', // Attempt to center vertically in viewport
      minHeight: 'calc(100vh - 100px)', // Adjust based on header height if needed
      padding: '25px',          // Padding around the content
      textAlign: 'center',      // Center text within elements
      maxWidth: '500px',        // Max width suitable for mobile, prevents lines getting too long on desktop
      margin: '0 auto',         // Center the container itself horizontally
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif', // Clean sans-serif font
      color: '#333',           // Default text color
    },
    // Placeholder for where an illustration/icon could go
    visualPlaceholder: {
       width: '120px',
       height: '120px',
       backgroundColor: '#f0f0f0', // Light grey background
       borderRadius: '50%',       // Circular shape
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'center',
       marginBottom: '30px',      // Space below the visual
       fontSize: '0.8em',
       color: '#888',
       // You would replace this div with an <img> or SVG component
    },
    headline: {
      fontSize: '1.8em', // Adjust size as needed
      fontWeight: '600',   // Semi-bold
      marginBottom: '10px',
      lineHeight: '1.3',
    },
    tagline: {
      fontSize: '1.1em',
      color: '#555',
      marginBottom: '25px',
      lineHeight: '1.4',
    },
    description: {
      fontSize: '0.95em',
      color: '#666',
      lineHeight: '1.6',
      marginBottom: '35px',
    },
    ctaButton: {
      display: 'inline-block', // Make the Link behave like a block for styling
      padding: '14px 30px',
      backgroundColor: '#6200EE', // Example primary color (purple)
      color: '#FFFFFF',          // White text
      textDecoration: 'none',     // Remove underline from Link
      borderRadius: '50px',       // Pill shape
      fontWeight: 'bold',
      fontSize: '1.05em',
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)', // Subtle shadow
      transition: 'transform 0.1s ease-in-out, box-shadow 0.1s ease-in-out', // Smooth effect
    },
    // Note: Hover effects usually require CSS classes or styled-components
    // To simulate a press effect:
    ctaButtonPressed: { // You would apply this style conditionally on mousedown/touchstart
        transform: 'scale(0.98)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
    }
  };

  return (
    <div style={styles.container}>

      {/* Visual Element Placeholder */}
      <div style={styles.visualPlaceholder}>
        <span>Connect Icon</span> {/* Replace with actual graphic/icon */}
      </div>

      {/* Headline */}
      <h2 style={styles.headline}>
        Find Your Goal Partners, Right Around the Corner
      </h2>

      {/* Tagline */}
      <p style={styles.tagline}>
        ToKnight intelligently connects you with nearby people who share your drive and match your style.
      </p>

      {/* Description */}
      <p style={styles.description}>
        Stop pursuing goals alone. Our AI analyzes shared ambitions and behavioral patterns to suggest compatible connections in your local area. Build motivation and accountability with your tribe.
      </p>

      {/* Call to Action */}
      <Link to="/login" style={styles.ctaButton}>
        Sign In / Get Started
      </Link>

    </div>
  );
}

export default HomePage;