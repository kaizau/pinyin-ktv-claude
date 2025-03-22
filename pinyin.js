// Pinyin conversion utility
let pinyinConverter;

// Load the pinyin library
function loadPinyinLibrary() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/pinyin-pro@3.18.5/dist/index.js';
    script.onload = () => {
      try {
        // pinyin-pro exposes a global 'pinyinPro' object
        pinyinConverter = window.pinyinPro;
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Convert Chinese text to pinyin with tone marks
function convertToPinyin(text) {
  if (!pinyinConverter) {
    return 'Loading pinyin converter...';
  }
  
  try {
    // Convert with tone marks
    return pinyinConverter.pinyin(text, { 
      toneType: 'symbol', 
      separator: ' ',
      nonZh: 'consecutive'
    });
  } catch (error) {
    console.error('Error converting to pinyin:', error);
    return 'Error: Could not convert to pinyin';
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadPinyinLibrary()
    .then(() => console.log('Pinyin library loaded successfully'))
    .catch(error => console.error('Failed to load pinyin library:', error));
});