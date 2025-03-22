// Global variables
let player;
let currentLyrics = [];
let timeOffset = 0;

// DOM elements
const videoForm = document.getElementById('videoForm');
const youtubeUrlInput = document.getElementById('youtubeUrl');
const songInfoDiv = document.getElementById('songInfo');
const artistSongInput = document.getElementById('artistSong');
const searchLyricsButton = document.getElementById('searchLyrics');
const lyricsPanel = document.getElementById('lyricsPanel');
const searchTab = document.getElementById('searchTab');
const lyricsTab = document.getElementById('lyricsTab');
const searchResults = document.getElementById('searchResults');
const lyricsView = document.getElementById('lyricsView');
const playbackControls = document.getElementById('playbackControls');
const adjustEarlierButton = document.getElementById('adjustEarlier');
const adjustLaterButton = document.getElementById('adjustLater');

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

  player = new YT.Player('player', {
    height: '100%',
    width: '100%',
    videoId: videoId,
    playerVars: {
      autoplay: 0,
      controls: 1,
    },
    events: {
      'onStateChange': onPlayerStateChange
    }
  });
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
    
    // Update time display if we have one
    if (document.getElementById('currentTime')) {
      const formattedTime = formatTime(currentTime);
      document.getElementById('currentTime').textContent = formattedTime;
    }
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
  
  // Show lyrics view and controls
  searchTab.classList.remove('text-blue-500', 'border-blue-500');
  searchTab.classList.add('text-gray-500');
  lyricsTab.classList.remove('text-gray-500');
  lyricsTab.classList.add('text-blue-500', 'border-blue-500');
  
  searchResults.classList.add('hidden');
  lyricsView.classList.remove('hidden');
  playbackControls.classList.remove('hidden');
}

// Display search results
function displaySearchResults(results) {
  searchResults.innerHTML = '';
  
  if (results.length === 0) {
    searchResults.innerHTML = '<p class="text-gray-500 p-4 text-center text-sm">No lyrics found. Try a different search term.</p>';
    return;
  }
  
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
      lyricsView.classList.remove('hidden');
      searchResults.classList.add('hidden');
      
      // Update tabs
      searchTab.classList.remove('text-blue-500', 'border-blue-500');
      searchTab.classList.add('text-gray-500');
      lyricsTab.classList.remove('text-gray-500');
      lyricsTab.classList.add('text-blue-500', 'border-blue-500');
      
      try {
        const fullLyrics = await getLyrics(result.id);
        const parsedLyrics = parseLyrics(fullLyrics.syncedLyrics);
        displayLyricsWithPinyin(parsedLyrics);
      } catch (error) {
        lyricsView.innerHTML = '<p class="text-red-500 text-center p-4 text-sm">Error loading lyrics. Please try again.</p>';
      }
    });
    
    searchResults.appendChild(resultElement);
  });
  
  // Show search results panel with fade in effect
  lyricsPanel.classList.remove('hidden');
  lyricsPanel.classList.add('fade-in');
}

// Event Listeners
videoForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
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
  
  try {
    // Load video metadata
    const metadata = await loadVideoMetadata(youtubeUrl);
    
    // Create YouTube player
    createYouTubePlayer(videoId);
    
    // Show and populate artist/song field
    songInfoDiv.classList.remove('hidden');
    artistSongInput.value = metadata.title || '';
  } catch (error) {
    showError('Error loading video: ' + error.message, 'errorContainer');
  }
});

// Use debounce to prevent rapid fire search requests
const debouncedSearchLyrics = debounce(async (query) => {
  if (!query) return;
  
  try {
    const results = await searchLyrics(query);
    displaySearchResults(results);
  } catch (error) {
    showError('Error searching lyrics: ' + error.message, 'errorContainer');
  }
}, 500);

searchLyricsButton.addEventListener('click', () => {
  const query = artistSongInput.value.trim();
  debouncedSearchLyrics(query);
});

// Tab switching
searchTab.addEventListener('click', () => {
  if (searchResults.classList.contains('hidden')) {
    searchTab.classList.add('text-blue-500', 'border-blue-500');
    searchTab.classList.remove('text-gray-500');
    lyricsTab.classList.add('text-gray-500');
    lyricsTab.classList.remove('text-blue-500', 'border-blue-500');
    
    searchResults.classList.remove('hidden');
    lyricsView.classList.add('hidden');
  }
});

lyricsTab.addEventListener('click', () => {
  if (lyricsView.classList.contains('hidden') && currentLyrics.length > 0) {
    lyricsTab.classList.add('text-blue-500', 'border-blue-500');
    lyricsTab.classList.remove('text-gray-500');
    searchTab.classList.add('text-gray-500');
    searchTab.classList.remove('text-blue-500', 'border-blue-500');
    
    lyricsView.classList.remove('hidden');
    searchResults.classList.add('hidden');
  }
});

// Timing adjustment controls
adjustEarlierButton.addEventListener('click', () => {
  timeOffset -= 0.5;
  updateCurrentLyric();
});

adjustLaterButton.addEventListener('click', () => {
  timeOffset += 0.5;
  updateCurrentLyric();
});

// Initial UI setup
document.addEventListener('DOMContentLoaded', () => {
  // Reference all DOM elements after they're loaded
  // (Already done at the top of this file)
});