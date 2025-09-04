// background.js

// globals that hold the most recent capture
let lastAudioUrl = null;
let lastTrackId = null;
let downloadCount = 0;

chrome.action.setBadgeBackgroundColor({ color: "#555" });

// capture any request to the jewishmusic.fm audio API
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    try {
      const u = new URL(details.url);
      if (
        u.hostname.endsWith("jewishmusic.fm") &&
        (u.port === "8443" || u.port === "") &&
        u.pathname.startsWith("/api/audio-file")
      ) {
        lastAudioUrl = details.url;
        lastTrackId = u.searchParams.get("trackId") || "audio";
        chrome.action.setBadgeText({ text: "1" });
        console.log("[SW] captured:", details.url);
        
        // Notify content script about new audio availability
        notifyContentScript();
      }
    } catch (err) {
      console.error("parse error:", err);
    }
  },
  { urls: ["https://jewishmusic.fm/*", "https://jewishmusic.fm:8443/*"] },
  []
);

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'getStatus':
      sendResponse({
        hasAudio: !!lastAudioUrl,
        count: downloadCount
      });
      break;
      
    case 'download':
      handleDownloadRequest(sender.tab.id)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Handle download request from content script
async function handleDownloadRequest(tabId) {
  if (!lastAudioUrl) {
    await chrome.action.setBadgeText({ text: "!" });
    return { success: false, error: "No captured audio URL yet. Play a track first." };
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: downloadAudio,
      args: [lastAudioUrl, lastTrackId]
    });

    downloadCount++;
    await chrome.action.setBadgeText({ text: "" });
    
    // Notify content script of successful download
    chrome.tabs.sendMessage(tabId, { action: 'downloadComplete' });
    
    return { success: true };
  } catch (e) {
    console.error("executeScript failed:", e);
    await chrome.action.setBadgeText({ text: "X" });
    
    // Notify content script of download error
    chrome.tabs.sendMessage(tabId, { action: 'downloadError', error: e.message });
    
    return { success: false, error: e.message };
  }
}

// Download function to inject into page
function downloadAudio(url, trackId) {
  const saveBlob = (blob, name) => {
    const obj = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = obj;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(obj), 30000);
  };

  const guessName = (res, fallback) => {
    const cd = res.headers.get("content-disposition") || "";
    const m = cd.match(/filename\*?=(?:UTF-8''|")?([^"';]+)/i);
    return m && m[1] ? decodeURIComponent(m[1]) : fallback;
  };

  fetch(url, {
    method: "GET",
    credentials: "include",
    referrer: location.href,
    referrerPolicy: "strict-origin-when-cross-origin",
    headers: { "Accept": "audio/*,application/octet-stream;q=0.9,*/*;q=0.8" },
    redirect: "follow"
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const ct = res.headers.get("content-type") || "";
      const blob = await res.blob();
      const filename = /audio|mpeg|mp3|octet-stream/i.test(ct)
        ? guessName(res, `track-${trackId}.mp3`)
        : `track-${trackId}.bin`;
      saveBlob(blob, filename);
    })
    .catch(err => {
      console.error("In-page fetch failed:", err);
      throw err;
    });
}

// Notify content script about audio status
async function notifyContentScript() {
  const tabs = await chrome.tabs.query({});
  const zingTabs = tabs.filter(t => t.url && /^https:\/\/(www\.)?zingmusic\.app\//.test(t.url));
  
  zingTabs.forEach(tab => {
    chrome.tabs.sendMessage(tab.id, {
      action: 'updateStatus',
      hasAudio: !!lastAudioUrl,
      count: downloadCount
    }).catch(() => {
      // Tab might not have content script loaded yet, ignore error
    });
  });
}

// when user clicks extension button, handle as before for backward compatibility
chrome.action.onClicked.addListener(async () => {
  if (!lastAudioUrl) {
    await chrome.action.setBadgeText({ text: "!" });
    console.log("No captured URL yet.");
    return;
  }

  const tabs = await chrome.tabs.query({});
  const zingTab = tabs.find(t => t.url && /^https:\/\/(www\.)?zingmusic\.app\//.test(t.url));
  if (!zingTab) {
    console.log("Open the zingmusic.app tab and play a track first.");
    await chrome.action.setBadgeText({ text: "!" });
    return;
  }

  // Use the same download logic
  const result = await handleDownloadRequest(zingTab.id);
  if (!result.success) {
    console.error("Download failed:", result.error);
  }
});
