// src/utils/cookieUtils.js

/**
 * Gets the value of a specific cookie by name.
 * @param {string} name - The name of the cookie.
 * @returns {string|null} The value of the cookie, or null if not found.
 */
export function getCookie(name) {
    if (typeof document === 'undefined') {
      return null; // Ensure runs only in browser
    }
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) {
      return decodeURIComponent(match[2]); // Decode cookie value
    } else {
      return null;
    }
  }