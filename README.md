# 🛡️ SiteBlock - Focus Mode Chrome Extension

A Chrome extension to block distracting websites and help you stay focused on studying.

## 🖥️ Demo

https://private-user-images.githubusercontent.com/64317447/532980148-d263d907-9933-4a0b-9fb1-1653000a9a66.mp4?jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Njc4MTA2MzIsIm5iZiI6MTc2NzgxMDMzMiwicGF0aCI6Ii82NDMxNzQ0Ny81MzI5ODAxNDgtZDI2M2Q5MDctOTkzMy00YTBiLTlmYjEtMTY1MzAwMGE5YTY2Lm1wND9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNjAxMDclMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjYwMTA3VDE4MjUzMlomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTFlZTA1ZGY5MmZiMTVmMmFlZGUzZjNjYWI2Y2UzM2Y0MzdkNTMzZjRiMTUzOTNjYzU0NjliMDJiNTU1Mzc2MTgmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.lcuVxRwoZAkOfoTubMfmtcC_FbuhNDJuy1itGionfGg

> Click to play and see SiteBlock in action: blocking/unblocking sites, toggling focus, and using the fun blocked page—all in real time.

## Features

- **Block websites** - Add any website to your block list
- **Enable/Disable** - Toggle blocking on/off instantly
- **Access tracking** - See how many times you tried to access blocked sites
- **One-click blocking** - Block the current site with one click
- **Custom blocked page** - Fun page with random emojis and motivational quotes

## Installation

### 1. Generate Icons

1. Open `generate-icons.html` in your browser
2. Click "Download All Icons"
3. Move the downloaded icons to the `icons` folder

### 2. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `siteblock` folder

## Usage

### Adding Sites to Block

- **Current site**: Click the extension icon, then click "Block Site"
- **Manual entry**: Type a domain in the input field and click "Add"

### Managing Blocked Sites

- View all blocked sites in the extension popup
- See attempt counts for each site
- Click the trash icon to remove a site from the block list

### Enable/Disable Blocking

- Use the toggle switch in the header to turn blocking on/off
- When disabled, you can access all sites normally

## File Structure

```
siteblock/
├── manifest.json      # Extension configuration
├── background.js      # Service worker for blocking logic
├── popup.html         # Extension popup interface
├── popup.css          # Popup styling
├── popup.js           # Popup functionality
├── blocked.html       # Page shown when site is blocked
├── icons/             # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── generate-icons.html # Icon generator tool
```

## How It Works

1. When you try to visit a blocked site, the extension intercepts the navigation
2. You're redirected to a fun "blocked" page with a random emoji
3. Each access attempt is counted and stored
4. Toggle the extension off anytime to temporarily disable blocking

## Tips for Staying Focused

- Block social media sites during study hours
- Use the access counter to track your habits
- Set goals to reduce your attempt counts over time

---

Made with ❤️ to help you study better!

Vibe coded by Opus 4.5
