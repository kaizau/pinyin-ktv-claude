# YouTube Pinyin Karaoke Generator

A static web application that displays pinyin transcriptions alongside Chinese lyrics, with synchronized video playback highlighting.

## Features

- Load YouTube videos directly in the application
- Search for song lyrics using LrcLib API
- Automatic pinyin conversion for Chinese characters
- Synchronized lyrics highlighting during playback
- Manual timing adjustment controls
- Responsive design for mobile and desktop

## How to Use

1. Open `index.html` in a web browser
2. Enter a YouTube URL for a Chinese song
3. The video will load and extract the title
4. Click "Search Lyrics" to find matching lyrics
5. Select the correct lyrics from search results
6. The lyrics will display with pinyin transcription
7. Play the video to see synchronized highlighting
8. Use the +/- buttons to adjust timing if needed

## Technologies Used

- HTML5, CSS (Tailwind CSS), JavaScript (Vanilla)
- YouTube oEmbed & iFrame APIs
- LrcLib API for lyrics
- pinyin-pro for Chinese to pinyin conversion

## No Build Process Required

All dependencies are loaded via CDN, so you can deploy this application by simply copying the files to a web server or opening `index.html` locally.

## Credits

- [YouTube iFrame API](https://developers.google.com/youtube/iframe_api_reference)
- [LrcLib API](https://lrclib.net/api)
- [pinyin-pro](https://github.com/zh-lx/pinyin-pro)
- [Tailwind CSS](https://tailwindcss.com/)