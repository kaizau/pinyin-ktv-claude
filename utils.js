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
 * Show error message to the user as a closeable toast
 * @param {string} message - Error message to display
 * @param {string} containerId - ID of container to show message in
 */
function showError(message, containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    // Create toast element
    const toastElement = document.createElement('div');
    toastElement.className = 'fixed top-4 left-0 right-0 mx-auto w-full max-w-md z-50 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-500 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg shadow-lg transition-all transform duration-300 flex justify-between items-center animate-fade-in';
    
    // Create message content
    const messageContent = document.createElement('div');
    messageContent.innerHTML = `<strong class="font-bold">Error:</strong> <span class="ml-1">${message}</span>`;
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.className = 'text-red-500 dark:text-red-300 hover:text-red-800 dark:hover:text-red-100 font-bold text-xl leading-none cursor-pointer focus:outline-none';
    closeButton.setAttribute('aria-label', 'Close');
    
    // Add event listener to close button
    closeButton.addEventListener('click', () => {
      toastElement.classList.add('opacity-0', '-translate-y-2');
      setTimeout(() => {
        toastElement.remove();
      }, 300);
    });
    
    // Assemble toast
    toastElement.appendChild(messageContent);
    toastElement.appendChild(closeButton);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (toastElement.parentNode) {
        toastElement.classList.add('opacity-0', '-translate-y-2');
        setTimeout(() => {
          if (toastElement.parentNode) {
            toastElement.remove();
          }
        }, 300);
      }
    }, 5000);
    
    // Clear existing toasts
    container.innerHTML = '';
    container.appendChild(toastElement);
  } else {
    alert(message);
  }
}