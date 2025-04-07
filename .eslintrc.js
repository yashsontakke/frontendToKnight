module.exports = {
    extends: [
      'react-app', // Make sure you keep existing extends
      'react-app/jest',
    ],
    globals: {
      google: 'readonly', // Add this line/section
    },
    // ... any other rules or settings
  };