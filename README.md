# Zing chrome extension Audio Downloader

A Chrome extension specifically designed for [zing music](https://zingmusic.app/) that allows you to easily download audio tracks with a convenient floating download button.

## Features

### 🎵 **Smart Audio Capture**
- Automatically detects and captures audio URLs from supported platforms
- Works seamlessly in the background while you browse

### 🟢 **Visual Status Indicators**
- **Green Button**: Audio is ready to download
- **Gray Button**: No audio captured yet (play a track first)
- **Pulsing Animation**: Indicates download is available

### 📱 **Floating Download Button**
- Appears on [zing music](https://zingmusic.app/)
- **Draggable**: Move the button anywhere on the page
- **Position Memory**: Remembers where you placed it
- **Download Counter**: Shows badge with number of downloads

### ⬇️ **Easy Downloads**
- Click the green floating button to download
- Automatic filename detection
- Downloads directly to your default download folder

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension folder
5. The extension is now installed and ready to use!

## How to Use

### Step 1: Play a Track
1. Go to the supported audio source platform
2. Play any audio track
3. The extension will automatically capture the audio URL

### Step 2: Download
1. Navigate to [zing music](https://zingmusic.app/)
2. You'll see a floating download button appear
3. When the button is **green** and pulsing, click it to download
4. The audio file will be saved to your downloads folder

### Step 3: Customize (Optional)
- **Move the Button**: Drag it anywhere on the page
- **Use Extension Icon**: Click the extension icon in the toolbar (alternative method)

## Visual Guide

### Button States

| State | Appearance | Meaning | Action |
|-------|------------|---------|---------|
| 🔴 **Disabled** | Gray, semi-transparent | No audio captured | Play a track first |
| 🟢 **Ready** | Green, pulsing glow | Audio ready to download | Click to download |
| 🔵 **Dragging** | Scaled up, grabbing cursor | Being moved | Position the button |

### Status Messages
- ✅ **"Download started!"** - Download initiated successfully
- ✅ **"Download complete!"** - File saved to downloads
- ❌ **"No audio available..."** - Need to play a track first
- ❌ **"Download failed"** - Error occurred during download

## Supported Websites

### Audio Source
- **jewishmusic.fm** (all ports)
- **jewishmusic.fm:8443** (secure port)

### Download Interface
- **[zing music](https://zingmusic.app/)** (with www subdomain support)

## Technical Details

### Files Structure
```
extnation/
├── manifest.json       # Extension configuration
├── background.js       # Service worker (audio capture logic)
├── content.js         # Floating button functionality
├── content.css        # Button styling and animations
└── README.md          # This file
```

### Permissions Used
- **downloads**: Save files to download folder
- **webRequest**: Monitor and capture audio URLs
- **tabs**: Access active tabs for injection
- **scripting**: Inject download functionality

### Data Storage
- Button position saved in localStorage
- Download count tracked in memory
- No personal data collected or transmitted

## Troubleshooting

### Button Not Appearing
- Make sure you're on [zing music](https://zingmusic.app/)
- Refresh the page
- Check if extension is enabled

### Button is Gray
- Play a track on the supported audio source platform first
- Wait a moment for URL capture
- Check browser console for errors

### Download Not Starting
- Ensure popup blockers aren't interfering
- Check download permissions in Chrome settings
- Verify you're on the correct websites

### Button Position Reset
- Position is saved per-domain
- Clearing browser data will reset position

## Version History

### v1.0.6 (Current)
- ✨ Added floating download button
- ✨ Draggable button with position memory
- ✨ Visual status indicators (green/gray states)
- ✨ Download counter badge
- ✨ Status messages and error handling
- ✨ Improved user experience

### Previous Versions
- Basic audio capture and download functionality
- Extension icon-based downloads

## Browser Compatibility

- **Chrome**: Fully supported (Manifest V3)
- **Edge**: Should work (Chromium-based)
- **Firefox**: Not compatible (different manifest format)



## Privacy & Security

- **No data collection**: Extension doesn't collect personal information
- **Local processing**: All functionality runs locally in your browser
- **Secure connections**: Only works with HTTPS websites
- **Minimal permissions**: Uses only necessary browser permissions

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify you're using supported websites
3. Check browser console for error messages
4. Ensure extension is up to date

## License

This project is licensed under the [MIT License](./LICENSE).


**Happy downloading! 🎵⬇️**
