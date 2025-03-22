# YouTube Pinyin Karaoke Generator

## Overview
Static web application displaying pinyin transcriptions alongside Chinese lyrics, with synchronized video playback highlighting. Single-folder deployment with no build process required.

## Application Flow

### Initial State
- Split-screen interface with left/top panel active initially
- Simple form for YouTube URL entry
- Form submission activates second panel and processes video

### Video Processing
- YouTube oEmbed API call extracts video metadata (`https://www.youtube.com/oembed?url=<video_url>&format=json`)
- Extracted title populates editable artist/song field
- YouTube video embeds in left/top panel via iFrame API

### Lyrics Acquisition
- LrcLib API query using artist/song information
- Search results display in right/bottom panel
- User selects correct lyrics match
- Application retrieves complete lyrics content

### Pinyin Conversion
- `pinyin` npm package processes Chinese text
- Display format: Chinese characters with pinyin above each line
- Toggle between search results and lyrics views

### Playback Synchronization
- YouTube API tracks current playback time
- Highlights current lyrics and pinyin lines
- Auto-scrolls lyrics panel to keep current line visible
- Manual timing adjustment controls available

## Implementation Notes

- Plain HTML, CSS, and vanilla JavaScript
- Dependencies loaded via CDN
- LrcLib API has no CORS restrictions
- Implement debouncing for all search operations
- Display errors when API requests fail (no fallbacks)
- Mobile: stack interface vertically with video remaining visible
