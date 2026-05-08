// SignalThief Background Service Worker
// Intercepts network requests to detect audio/video streams

const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/aac',
  'audio/ogg',
  'audio/opus',
  'audio/flac',
  'audio/wav',
  'audio/wave',
  'audio/webm',
  'audio/x-wav',
  'audio/x-m4a',
  'audio/x-flac',
  'application/octet-stream',
  'application/x-mpegURL',
  'application/vnd.apple.mpegurl',
  'video/mp4',
  'video/webm',
  'video/x-matroska',
];

const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/x-matroska',
  'video/quicktime',
  'video/x-msvideo',
  'video/ogg',
  'video/x-flv',
];

// Store detected media sources per tab
const detectedSources = new Map(); // tabId -> { sources: [], timestamp }

// Track pending requests
const pendingRequests = new Map(); // requestId -> { url, tabId, mimeType, timeStamp }

function isAudioMime(mimeType) {
  return AUDIO_MIME_TYPES.some(t => mimeType.toLowerCase().includes(t.split('/')[1]) || mimeType === t);
}

function isVideoMime(mimeType) {
  return VIDEO_MIME_TYPES.some(t => mimeType.toLowerCase().includes(t.split('/')[1]) || mimeType === t);
}

function isMediaMime(mimeType) {
  return isAudioMime(mimeType) || isVideoMime(mimeType);
}

// Listen for web requests
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const { requestId, url, tabId, type, statusCode, responseHeaders } = details;

    if (tabId < 0) return; // Skip non-tab requests
    if (statusCode < 200 || statusCode >= 400) return; // Only successful responses

    const contentType = responseHeaders?.find(
      h => h.name.toLowerCase() === 'content-type'
    )?.value || '';

    if (!isMediaMime(contentType)) return;

    pendingRequests.set(requestId, {
      url,
      tabId,
      mimeType: contentType,
      timeStamp: Date.now(),
    });
  },
  { urls: ['<all_urls>'] },
  ['responseHeaders']
);

// When request completes, add to detected sources
chrome.webRequest.onCompleted.addListener(
  (details) => {
    const { requestId, url, tabId, statusCode } = details;

    const pending = pendingRequests.get(requestId);
    if (!pending) return;

    pendingRequests.delete(requestId);

    if (statusCode < 200 || statusCode >= 400) return;

    // Get page info for this tab
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) return;

      const source = {
        url,
        mimeType: pending.mimeType,
        tabId,
        pageUrl: tab.url,
        pageTitle: tab.title || 'Unknown',
        duration: null,
        isAudio: isAudioMime(pending.mimeType),
        isVideo: isVideoMime(pending.mimeType),
        source: 'network',
      };

      if (!detectedSources.has(tabId)) {
        detectedSources.set(tabId, { sources: [], timestamp: Date.now() });
      }

      const tabSources = detectedSources.get(tabId);
      // Avoid duplicates
      if (!tabSources.sources.some(s => s.url === source.url)) {
        tabSources.sources.push(source);
      }
    });
  },
  { urls: ['<all_urls>'] }
);

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'getDetectedSources':
      handleGetSources(sender, sendResponse);
      return true; // async response

    case 'downloadUrl':
      handleDownload(message.url, message.filename);
      sendResponse({ success: true });
      break;

    case 'clearTabSources':
      detectedSources.delete(message.tabId);
      sendResponse({ success: true });
      break;

    case 'openWebApp':
      chrome.tabs.create({ url: 'https://signalthief.vercel.app' });
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: 'Unknown action' });
  }
});

function handleGetSources(sender, sendResponse) {
  // Get current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (chrome.runtime.lastError || !tabs.length) {
      sendResponse({ sources: [] });
      return;
    }

    const tabId = tabs[0].id;
    const tabData = detectedSources.get(tabId);

    // Clean up sources older than 5 minutes
    if (tabData && Date.now() - tabData.timestamp > 300000) {
      detectedSources.delete(tabId);
      sendResponse({ sources: [], pageTitle: tabs[0].title, pageUrl: tabs[0].url });
      return;
    }

    sendResponse({
      sources: tabData?.sources || [],
      pageTitle: tabs[0].title || 'Unknown',
      pageUrl: tabs[0].url || '',
    });
  });
}

function handleDownload(url, filename) {
  chrome.downloads.download({
    url,
    filename: filename || undefined,
    saveAs: true,
    conflictAction: 'uniquify',
  }, (downloadId) => {
    if (chrome.runtime.lastError) {
      console.error('Download failed:', chrome.runtime.lastError.message);
    }
  });
}

// Periodically clean up old sources
setInterval(() => {
  const now = Date.now();
  for (const [tabId, data] of detectedSources.entries()) {
    if (now - data.timestamp > 600000) { // 10 minutes
      detectedSources.delete(tabId);
    }
  }
}, 300000); // Every 5 minutes