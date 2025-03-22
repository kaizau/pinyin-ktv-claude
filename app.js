// Global variables
let player;
let currentLyrics = [];
let timeOffset = 0;
let currentStep = 'video'; // Tracks current step: 'video', 'lyrics', or 'player'

// DOM elements
const youtubeUrlInput = document.getElementById('youtubeUrl');
const loadVideoButton = document.getElementById('loadVideo');
const videoInput = document.getElementById('videoInput');
const artistSongInput = document.getElementById('artistSong');
const searchLyricsButton = document.getElementById('searchLyrics');
const lyricsSearch = document.getElementById('lyricsSearch');
const searchResults = document.getElementById('searchResults');
const lyricsView = document.getElementById('lyricsView');
const playbackControls = document.getElementById('playbackControls');
const adjustEarlierButton = document.getElementById('adjustEarlier');
const adjustLaterButton = document.getElementById('adjustLater');
const currentTimeDisplay = document.getElementById('currentTime');

// Navigation links
const navVideo = document.getElementById('navVideo');
const navLyrics = document.getElementById('navLyrics');
const navPlayer = document.getElementById('navPlayer');

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
  if (player) {
    player.loadVideoById(videoId);
    return;
  }

  // Clear the videoInput content
  document.getElementById('player').innerHTML = '';

  player = new YT.Player('player', {
    height: '100%',
    width: '100%',
    videoId: videoId,
    playerVars: {
      autoplay: 0,
      controls: 1,
      playsinline: 1, // Better for mobile
      rel: 0,         // Don't show related videos
      modestbranding: 1 // Reduce YouTube branding
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
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
    const lyricElements = lyricsView.querySelectorAll('.lyric-line');
    lyricElements.forEach((el, index) => {
      if (index === currentIndex) {
        el.classList.add('active');
        
        // Auto-scroll to keep current line visible with some context above
        const containerHeight = lyricsView.clientHeight;
        const scrollPosition = el.offsetTop - (containerHeight / 3);
        lyricsView.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      } else {
        el.classList.remove('active');
      }
    });
    
    // Update time display
    const formattedTime = formatTime(currentTime);
    currentTimeDisplay.textContent = formattedTime;
    currentTimeDisplay.classList.remove('hidden');
  }
}

// Navigation functions
function goToStep(step) {
  currentStep = step;
  
  // Update navigation links
  navVideo.classList.remove('active');
  navLyrics.classList.remove('active', 'disabled');
  navPlayer.classList.remove('active', 'disabled');
  
  // Update UI based on step
  switch(step) {
    case 'video':
      // Update nav
      navVideo.classList.add('active');
      navLyrics.classList.add('disabled');
      navPlayer.classList.add('disabled');
      
      // Show video input, hide other sections
      videoInput.classList.remove('hidden');
      lyricsSearch.classList.add('hidden');
      lyricsView.classList.add('hidden');
      
      // Hide player controls
      currentTimeDisplay.classList.add('hidden');
      playbackControls.classList.add('hidden');
      break;
      
    case 'lyrics':
      // Update nav
      navVideo.classList.add('active');
      navLyrics.classList.add('active');
      navPlayer.classList.add('disabled');
      
      // Hide video input, show lyrics search
      videoInput.classList.add('hidden');
      lyricsSearch.classList.remove('hidden');
      lyricsView.classList.add('hidden');
      
      // Hide player controls
      currentTimeDisplay.classList.add('hidden');
      playbackControls.classList.add('hidden');
      
      // Prefill and auto-search if we have a title
      if (artistSongInput.value.trim()) {
        debouncedSearchLyrics(artistSongInput.value.trim());
      }
      break;
      
    case 'player':
      // Update nav
      navVideo.classList.add('active');
      navLyrics.classList.add('active');
      navPlayer.classList.add('active');
      
      // Hide input sections, show lyrics view
      videoInput.classList.add('hidden');
      lyricsSearch.classList.add('hidden');
      lyricsView.classList.remove('hidden');
      
      // Show player controls
      currentTimeDisplay.classList.remove('hidden');
      playbackControls.classList.remove('hidden');
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
  
  lyrics.forEach(line => {
    const lineElement = document.createElement('div');
    lineElement.className = 'lyric-line fade-in';
    
    const pinyinElement = document.createElement('div');
    pinyinElement.className = 'pinyin-text';
    pinyinElement.textContent = convertToPinyin(line.text);
    
    const chineseElement = document.createElement('div');
    chineseElement.className = 'chinese-text';
    chineseElement.textContent = line.text;
    
    lineElement.appendChild(pinyinElement);
    lineElement.appendChild(chineseElement);
    lyricsView.appendChild(lineElement);
  });
  
  // Go to player mode
  goToStep('player');
}

// Display search results
function displaySearchResults(results) {
  searchResults.innerHTML = '';
  
  if (results.length === 0) {
    searchResults.innerHTML = '<p class="text-gray-500 p-4 text-center text-sm">No lyrics found. Try a different search term.</p>';
    return;
  }
  
  // Add results header
  const headerElement = document.createElement('div');
  headerElement.className = 'text-xs text-gray-500 px-2 py-1 bg-gray-50';
  headerElement.textContent = `${results.length} results found`;
  searchResults.appendChild(headerElement);
  
  // Add each result
  results.forEach(result => {
    const resultElement = document.createElement('div');
    resultElement.className = 'search-result cursor-pointer fade-in';
    
    const artistName = result.artistName || 'Unknown Artist';
    const trackName = result.trackName || 'Unknown Song';
    
    resultElement.innerHTML = `
      <div class="font-medium text-sm">${artistName}</div>
      <div class="text-sm text-gray-700">${trackName}</div>
    `;
    
    resultElement.addEventListener('click', async () => {
      // Show loading indicator
      lyricsView.innerHTML = '<div class="flex justify-center p-4"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div></div>';
      
      // Enable player nav
      navPlayer.classList.remove('disabled');
      
      try {
        const fullLyrics = await getLyrics(result.id);
        const parsedLyrics = parseLyrics(fullLyrics.syncedLyrics);
        displayLyricsWithPinyin(parsedLyrics);
      } catch (error) {
        lyricsView.innerHTML = '<p class="text-red-500 text-center p-4 text-sm">Error loading lyrics. Please try again.</p>';
        goToStep('lyrics');
      }
    });
    
    searchResults.appendChild(resultElement);
  });
}

// Event Listeners
loadVideoButton.addEventListener('click', async () => {
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
  
  // Show loading indicator
  videoInput.innerHTML = '<div class="flex justify-center p-4"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div><div class="ml-3">Loading video...</div></div>';
  
  try {
    // Load video metadata
    const metadata = await loadVideoMetadata(youtubeUrl);
    
    // Create YouTube player
    createYouTubePlayer(videoId);
    
    // Populate artist/song field and move to lyrics step
    artistSongInput.value = metadata.title || '';
    
    // Enable the lyrics nav button
    navLyrics.classList.remove('disabled');
    
    // Move to lyrics step
    goToStep('lyrics');
  } catch (error) {
    showError('Error loading video: ' + error.message, 'errorContainer');
    // Restore video input
    videoInput.innerHTML = `
      <h1 class="text-xl font-bold text-gray-700 mb-4">YouTube Pinyin Karaoke</h1>
      <div class="flex flex-col gap-2">
        <input type="text" id="youtubeUrl" class="w-full p-2 text-sm border rounded" 
          placeholder="Enter YouTube URL..." value="${youtubeUrl}">
        <button id="loadVideo" class="bg-blue-500 text-white py-2 px-3 rounded text-sm">
          Load Video
        </button>
      </div>
    `;
    // Need to reattach the event listeners
    document.getElementById('loadVideo').addEventListener('click', loadVideoButton.onclick);
    document.getElementById('youtubeUrl').addEventListener('keypress', youtubeUrlInput.onkeypress);
  }
});

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
    goToStep('video');
  }
});

navLyrics.addEventListener('click', () => {
  if (!navLyrics.classList.contains('disabled')) {
    goToStep('lyrics');
  }
});

navPlayer.addEventListener('click', () => {
  if (!navPlayer.classList.contains('disabled') && currentLyrics.length > 0) {
    goToStep('player');
  }
});

// Navigation is now fully handled by the top nav buttons

// Timing adjustment controls
adjustEarlierButton.addEventListener('click', () => {
  timeOffset -= 0.5;
  updateCurrentLyric();
});

adjustLaterButton.addEventListener('click', () => {
  timeOffset += 0.5;
  updateCurrentLyric();
});

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

// Initialize the UI
document.addEventListener('DOMContentLoaded', () => {
  goToStep('video');
});