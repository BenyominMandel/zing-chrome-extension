// background.js

// globals that hold the most recent capture
let lastAudioUrl = null;
let lastTrackId = null;

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
      }
    } catch (err) {
      console.error("parse error:", err);
    }
  },
  { urls: ["https://jewishmusic.fm/*", "https://jewishmusic.fm:8443/*"] },
  []
);

// when user clicks extension button, inject downloader into zingmusic.app
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

  try {
    await chrome.scripting.executeScript({
      target: { tabId: zingTab.id },
      func: (url, trackId) => {
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
            alert(`Download failed: ${err.message}`);
          });
      },
      args: [lastAudioUrl, lastTrackId]
    });

    await chrome.action.setBadgeText({ text: "" });
  } catch (e) {
    console.error("executeScript failed:", e);
    await chrome.action.setBadgeText({ text: "X" });
  }
});
