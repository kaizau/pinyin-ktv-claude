// Utility functions for the application

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @returns {Function} - The debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Format time from seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

/**
 * Show error message to the user
 * @param {string} message - Error message to display
 * @param {string} containerId - ID of container to show message in
 */
function showError(message, containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
        <strong class="font-bold">Error:</strong>
        <span class="block sm:inline"> ${message}</span>
      </div>
    `;
  } else {
    alert(message);
  }
}