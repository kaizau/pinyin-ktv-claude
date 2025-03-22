// Global variables
let player;
let currentLyrics = [];
let timeOffset = 0;
let currentStep = 'video'; // Tracks current step: 'video', 'lyrics', or 'player'

// DOM elements - we'll refresh references to these elements later
let youtubeUrlInput = document.getElementById('youtubeUrl');
let loadVideoButton = document.getElementById('loadVideo');
const videoInput = document.getElementById('videoInput');
const playerContainer = document.getElementById('playerContainer');
const playerElement = document.getElementById('player');
let artistSongInput = document.getElementById('artistSong');
let searchLyricsButton = document.getElementById('searchLyrics');
const lyricsSearch = document.getElementById('lyricsSearch');
const searchResults = document.getElementById('searchResults');
const lyricsView = document.getElementById('lyricsView');
// playbackControls references removed
const currentTimeDisplay = document.getElementById('currentTime');

// Navigation links
const navVideo = document.getElementById('navVideo');
const navLyrics = document.getElementById('navLyrics');
const navPlayer = document.getElementById('navPlayer');

// Function to refresh element references
function refreshElementReferences() {
  youtubeUrlInput = document.getElementById('youtubeUrl');
  loadVideoButton = document.getElementById('loadVideo');
  artistSongInput = document.getElementById('artistSong'); 
  searchLyricsButton = document.getElementById('searchLyrics');
  themeToggleButton = document.getElementById('themeToggle');
}

// Get theme toggle button reference
let themeToggleButton = document.getElementById('themeToggle');

// Initialize YouTube API
function onYouTubeIframeAPIReady() {
  // This function will be called when YouTube API is ready
  console.log('YouTube API ready');
}

// Extract video ID from YouTube URL
function getYouTubeVideoId(url) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

// Load YouTube video metadata using oEmbed API
async function loadVideoMetadata(url) {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!response.ok) throw new Error('Failed to fetch video metadata');
    return await response.json();
  } catch (error) {
    console.error('Error loading video metadata:', error);
    throw error;
  }
}

// Create YouTube player
function createYouTubePlayer(videoId) {
  // If there's an existing player, destroy it first to prevent issues
  if (player) {
    player.destroy();
    player = null;
  }

  // Make sure the player div is clean
  playerElement.innerHTML = '';
  
  // Hide the video input form
  videoInput.classList.add('hidden');
  
  // Ensure the player container has the correct aspect ratio for desktop
  // This ensures the player takes up the full height on desktop
  playerContainer.classList.add('lg:flex-grow');

  // Create a new YouTube player
  player = new YT.Player('player', {
    height: '100%',
    width: '100%',
    videoId: videoId,
    playerVars: {
      autoplay: 0,
      controls: 1,
      playsinline: 1, // Better for mobile
      rel: 0,         // Don't show related videos
      modestbranding: 1, // Reduce YouTube branding
      fs: 1           // Allow fullscreen
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
  
  // Update nav state since video is now loaded
  updateNavState();
}

// Player ready event handler
function onPlayerReady(event) {
  // You could autoplay here if desired
  // event.target.playVideo();
}

// Handle player state changes
function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    // Start monitoring current time for lyric highlighting
    startLyricTracking();
  } else if (event.data === YT.PlayerState.PAUSED) {
    // Stop monitoring
    stopLyricTracking();
  }
}

let lyricTrackingInterval;

// Start tracking current playback time
function startLyricTracking() {
  stopLyricTracking(); // Clear any existing interval
  lyricTrackingInterval = setInterval(updateCurrentLyric, 100);
}

// Stop tracking
function stopLyricTracking() {
  if (lyricTrackingInterval) {
    clearInterval(lyricTrackingInterval);
    lyricTrackingInterval = null;
  }
}

// Update highlighted lyrics based on current time
function updateCurrentLyric() {
  if (!player || !currentLyrics.length) return;
  
  const currentTime = player.getCurrentTime() + timeOffset;
  
  // Find the current lyric based on timestamps
  let currentIndex = -1;
  for (let i = 0; i < currentLyrics.length; i++) {
    if (currentLyrics[i].startTime <= currentTime && 
        (i === currentLyrics.length - 1 || currentLyrics[i + 1].startTime > currentTime)) {
      currentIndex = i;
      break;
    }
  }
  
  // Highlight current lyric line
  if (currentIndex >= 0) {
    const lyricElements = lyricsView.querySelectorAll('div[data-time]');
    lyricElements.forEach((el, index) => {
      if (index === currentIndex) {
        el.classList.add('active', 'bg-yellow-100/70', 'dark:bg-yellow-900/50', 'border-amber-400', 'dark:border-amber-600');
        el.querySelector('div:last-child').classList.add('font-bold');
        
        // Use scrollIntoView for simpler, more reliable scrolling
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center' // Center the element vertically
        });
      } else {
        el.classList.remove('active', 'bg-yellow-100/70', 'dark:bg-yellow-900/50', 'border-amber-400', 'dark:border-amber-600');
        el.querySelector('div:last-child').classList.remove('font-bold');
        el.classList.remove('bg-gray-100/70', 'dark:bg-gray-700/70', 'translate-x-0.5');
      }
    });
    
    // Update time display
    const formattedTime = formatTime(currentTime);
    currentTimeDisplay.textContent = formattedTime;
    currentTimeDisplay.classList.remove('hidden');
  }
}

// Update the navigation state based on current app state
function updateNavState() {
  const videoLoaded = player !== undefined && player !== null;
  const lyricsLoaded = currentLyrics.length > 0;
  
  // Always allow video navigation
  navVideo.className = 'px-2 py-1 transition-all duration-200 rounded font-medium text-gray-500 opacity-60 cursor-pointer';
  
  // Lyrics navigation requires video to be loaded
  if (videoLoaded) {
    navLyrics.className = 'px-2 py-1 transition-all duration-200 rounded font-medium text-gray-500 opacity-60 cursor-pointer';
  } else {
    navLyrics.className = 'px-2 py-1 transition-all duration-200 rounded font-medium text-gray-400 opacity-40 cursor-default';
  }
  
  // Player navigation requires both video and lyrics
  if (videoLoaded && lyricsLoaded) {
    navPlayer.className = 'px-2 py-1 transition-all duration-200 rounded font-medium text-gray-500 opacity-60 cursor-pointer';
  } else {
    navPlayer.className = 'px-2 py-1 transition-all duration-200 rounded font-medium text-gray-400 opacity-40 cursor-default';
  }
}

// Navigation functions
function goToStep(step) {
  currentStep = step;
  
  // Update navigation links - set correct base states
  updateNavState();
  
  // Update UI based on step
  switch(step) {
    case 'video':
      // Update active nav item
      navVideo.className = 'px-2 py-1 transition-all duration-200 rounded font-semibold text-blue-500 opacity-100 cursor-pointer';
      
      // If player doesn't exist, show the video input form
      if (!player) {
        videoInput.classList.remove('hidden');
      }
      
      // Hide other sections
      lyricsSearch.classList.add('hidden');
      lyricsView.classList.add('hidden');
      
      // Hide player controls
      currentTimeDisplay.classList.add('hidden');
      break;
      
    case 'lyrics':
      // Update active nav items
      navVideo.className = 'px-2 py-1 transition-all duration-200 rounded font-semibold text-blue-500 opacity-100 cursor-pointer';
      navLyrics.className = 'px-2 py-1 transition-all duration-200 rounded font-semibold text-blue-500 opacity-100 cursor-pointer';
      
      // Hide video input, show lyrics search
      videoInput.classList.add('hidden');
      lyricsSearch.classList.remove('hidden');
      lyricsView.classList.add('hidden');
      
      // Hide player controls
      currentTimeDisplay.classList.add('hidden');
      
      // Prefill and auto-search if we have a title
      if (artistSongInput.value.trim()) {
        debouncedSearchLyrics(artistSongInput.value.trim());
      }
      break;
      
    case 'player':
      // Update active nav items
      navVideo.className = 'px-2 py-1 transition-all duration-200 rounded font-semibold text-blue-500 opacity-100 cursor-pointer';
      navLyrics.className = 'px-2 py-1 transition-all duration-200 rounded font-semibold text-blue-500 opacity-100 cursor-pointer';
      navPlayer.className = 'px-2 py-1 transition-all duration-200 rounded font-semibold text-blue-500 opacity-100 cursor-pointer';
      
      // Hide input sections, show lyrics view
      videoInput.classList.add('hidden');
      lyricsSearch.classList.add('hidden');
      lyricsView.classList.remove('hidden');
      
      // Show player controls
      currentTimeDisplay.classList.remove('hidden');
      break;
  }
}

// Search for lyrics using LrcLib API
async function searchLyrics(query) {
  try {
    const response = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to fetch lyrics');
    return await response.json();
  } catch (error) {
    console.error('Error searching lyrics:', error);
    throw error;
  }
}

// Get full lyrics from LrcLib API
async function getLyrics(id) {
  try {
    const response = await fetch(`https://lrclib.net/api/get/${id}`);
    if (!response.ok) throw new Error('Failed to fetch lyrics');
    return await response.json();
  } catch (error) {
    console.error('Error getting lyrics:', error);
    throw error;
  }
}

// Convert Chinese characters to pinyin function is imported from pinyin.js
// The global convertToPinyin function will be available

// Parse LRC format lyrics
function parseLyrics(lrcText) {
  const lines = lrcText.split('\n');
  const timeRegex = /\[(\d+):(\d+)\.(\d+)\]/;
  const parsedLyrics = [];

  lines.forEach(line => {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const centiseconds = parseInt(match[3]);
      const startTime = minutes * 60 + seconds + centiseconds / 100;
      const text = line.replace(timeRegex, '').trim();
      
      if (text) {
        parsedLyrics.push({
          startTime,
          text
        });
      }
    }
  });

  return parsedLyrics;
}

// Display lyrics with pinyin
function displayLyricsWithPinyin(lyrics) {
  lyricsView.innerHTML = '';
  currentLyrics = lyrics;
  
  lyrics.forEach((line, index) => {
    const lineElement = document.createElement('div');
    lineElement.className = 'px-2 py-1 mb-2 rounded cursor-pointer transition-all duration-200 border-l-4 border-transparent animate-fade-in relative';
    
    const pinyinElement = document.createElement('div');
    pinyinElement.className = 'text-base text-gray-500 dark:text-gray-400 leading-snug transition-colors duration-300';
    pinyinElement.textContent = convertToPinyin(line.text);
    
    const chineseElement = document.createElement('div');
    chineseElement.className = 'text-lg font-medium leading-relaxed tracking-widest text-gray-800 dark:text-gray-200 transition-colors duration-300';
    chineseElement.textContent = line.text;
    
    lineElement.appendChild(pinyinElement);
    lineElement.appendChild(chineseElement);
    lyricsView.appendChild(lineElement);
    
    // Add hover effect with JS since we can't use CSS
    lineElement.addEventListener('mouseenter', () => {
      lineElement.classList.add('bg-gray-100/70', 'dark:bg-gray-700/70', 'translate-x-0.5');
    });
    
    lineElement.addEventListener('mouseleave', () => {
      if (!lineElement.classList.contains('active')) {
        lineElement.classList.remove('bg-gray-100/70', 'dark:bg-gray-700/70', 'translate-x-0.5');
      }
    });
    
    // Add click event to jump to this timestamp in the video
    lineElement.addEventListener('click', () => {
      if (player) {
        // Jump to this lyric's timestamp minus the offset
        player.seekTo(line.startTime - timeOffset, true);
        player.playVideo(); // Start playing from this point
      }
    });
    
    // Add a data attribute for the timestamp (useful for debugging)
    lineElement.setAttribute('data-time', line.startTime);
  });
  
  // Update nav state since lyrics are now loaded
  updateNavState();
  
  // Go to player mode
  goToStep('player');
}

// Display search results
function displaySearchResults(results) {
  searchResults.innerHTML = '';
  
  if (results.length === 0) {
    searchResults.innerHTML = '<p class="text-gray-500 dark:text-gray-400 p-4 text-center text-sm transition-colors duration-300">No lyrics found. Try a different search term.</p>';
    return;
  }
  
  // Add results header
  const headerElement = document.createElement('div');
  headerElement.className = 'text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-50 dark:bg-gray-700 transition-colors duration-300';
  headerElement.textContent = `${results.length} results found`;
  searchResults.appendChild(headerElement);
  
  // Add each result
  results.forEach(result => {
    const resultElement = document.createElement('div');
    resultElement.className = 'p-2 border-b border-gray-200 dark:border-gray-700 cursor-pointer animate-fade-in hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-300';
    
    const artistName = result.artistName || 'Unknown Artist';
    const trackName = result.trackName || 'Unknown Song';
    
    resultElement.innerHTML = `
      <div class="font-medium text-sm text-gray-800 dark:text-gray-200 transition-colors duration-300">${artistName}</div>
      <div class="text-sm text-gray-700 dark:text-gray-400 transition-colors duration-300">${trackName}</div>
    `;
    
    resultElement.addEventListener('click', async () => {
      // Show loading indicator
      lyricsView.innerHTML = '<div class="flex justify-center p-4"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 dark:border-blue-400"></div></div>';
      
      // Enable player nav
      navPlayer.classList.remove('disabled');
      
      try {
        const fullLyrics = await getLyrics(result.id);
        const parsedLyrics = parseLyrics(fullLyrics.syncedLyrics);
        displayLyricsWithPinyin(parsedLyrics);
      } catch (error) {
        lyricsView.innerHTML = '<p class="text-red-500 dark:text-red-400 text-center p-4 text-sm transition-colors duration-300">Error loading lyrics. Please try again.</p>';
        goToStep('lyrics');
      }
    });
    
    searchResults.appendChild(resultElement);
  });
}

// The main function to load a video
async function loadVideo() {
  // Clear any previous errors
  document.getElementById('errorContainer').innerHTML = '';
  
  const youtubeUrl = youtubeUrlInput.value.trim();
  if (!youtubeUrl) {
    showError('Please enter a YouTube URL', 'errorContainer');
    return;
  }
  
  const videoId = getYouTubeVideoId(youtubeUrl);
  if (!videoId) {
    showError('Invalid YouTube URL. Please enter a valid YouTube video URL', 'errorContainer');
    return;
  }
  
  // Save the original input HTML
  const originalInput = videoInput.innerHTML;
  
  // Show loading indicator
  videoInput.innerHTML = '<div class="flex justify-center p-4"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><div class="ml-3">Loading video...</div></div>';
  
  try {
    // Load video metadata
    const metadata = await loadVideoMetadata(youtubeUrl);
    
    // If user loaded a new video, clear any existing lyrics
    if (currentLyrics.length > 0) {
      currentLyrics = [];
      lyricsView.innerHTML = '';
    }
    
    // Restore original input form structure first
    videoInput.innerHTML = originalInput;
    
    // Refresh our element references
    refreshElementReferences();
    
    // Set the URL value back
    youtubeUrlInput.value = youtubeUrl;
    
    // Reattach event listeners
    loadVideoButton.addEventListener('click', loadVideo);
    youtubeUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        loadVideoButton.click();
      }
    });
    
    // Create YouTube player
    createYouTubePlayer(videoId);
    
    // Populate artist/song field and move to lyrics step
    artistSongInput.value = metadata.title || '';
    
    // Move to lyrics step
    goToStep('lyrics');
  } catch (error) {
    showError('Error loading video: ' + error.message, 'errorContainer');
    
    // Restore video input
    videoInput.innerHTML = originalInput;
    
    // Refresh our element references
    refreshElementReferences();
    
    // Set the URL value back
    youtubeUrlInput.value = youtubeUrl;
    
    // Reattach event listeners
    loadVideoButton.addEventListener('click', loadVideo);
    youtubeUrlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        loadVideoButton.click();
      }
    });
  }
}

// Attach the load video function to the button
loadVideoButton.addEventListener('click', loadVideo);

// Use debounce to prevent rapid fire search requests
const debouncedSearchLyrics = debounce(async (query) => {
  if (!query) {
    showError('Please enter an artist or song name', 'errorContainer');
    return;
  }
  
  // Show loading indicator
  searchResults.innerHTML = '<div class="flex justify-center p-4"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div></div>';
  
  try {
    const results = await searchLyrics(query);
    displaySearchResults(results);
  } catch (error) {
    showError('Error searching lyrics: ' + error.message, 'errorContainer');
    searchResults.innerHTML = '<p class="text-red-500 p-4 text-center text-sm">Error searching. Please try again.</p>';
  }
}, 500);

searchLyricsButton.addEventListener('click', () => {
  const query = artistSongInput.value.trim();
  debouncedSearchLyrics(query);
});

// Navigation between steps
navVideo.addEventListener('click', () => {
  if (!navVideo.classList.contains('disabled')) {
    // Clear everything when going back to video
    if (currentStep === 'player' || currentStep === 'lyrics') {
      // Clear lyrics
      currentLyrics = [];
      lyricsView.innerHTML = '';
      
      // Clear the player if it exists
      if (player) {
        player.destroy();
        player = null;
      }
      
      // Make sure the player element is clean
      playerElement.innerHTML = '';
      
      // Show the video input form
      videoInput.classList.remove('hidden');
      
      // Refresh element references
      refreshElementReferences();
      
      // Reattach event listeners
      loadVideoButton.addEventListener('click', loadVideo);
      youtubeUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          loadVideoButton.click();
        }
      });
    }
    
    goToStep('video');
  }
});

navLyrics.addEventListener('click', () => {
  // Only allow clicking lyrics if video is loaded
  if (!navLyrics.classList.contains('disabled') && player) {
    // If we're on the player step going to lyrics, clear the selected lyrics
    if (currentStep === 'player') {
      currentLyrics = [];
      lyricsView.innerHTML = '';
    }
    
    goToStep('lyrics');
  }
});

navPlayer.addEventListener('click', () => {
  // Only allow clicking player if video is loaded and lyrics are selected
  if (!navPlayer.classList.contains('disabled') && player && currentLyrics.length > 0) {
    goToStep('player');
  }
});

// Navigation is now fully handled by the top nav buttons

// Removed timing adjustment buttons

// Enter key for forms
youtubeUrlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    loadVideoButton.click();
  }
});

artistSongInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    searchLyricsButton.click();
  }
});

// Handle dark/light mode
function initializeTheme() {
  // Check for system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  }
  
  // Add event listener for system preference change
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (event.matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  });
  
  // Add click handler for theme toggle button
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
    });
  }
}

// Initialize the UI
document.addEventListener('DOMContentLoaded', () => {
  // Reset application state
  player = undefined;
  currentLyrics = [];
  timeOffset = 0;
  
  // Initialize theme
  initializeTheme();
  
  // Set initial UI state
  updateNavState();
  goToStep('video');
});