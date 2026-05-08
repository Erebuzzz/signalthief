// SignalThief Content Script
// Detects <audio> and <video> elements on the page

(function () {
  'use strict';

  // Track already-reported media URLs to avoid duplicates
  const reportedUrls = new Set();

  function detectMediaElements() {
    const sources = [];

    // Find all <audio> elements
    document.querySelectorAll('audio').forEach((el, index) => {
      let url = el.src || el.currentSrc;
      if (url && !reportedUrls.has(url)) {
        reportedUrls.add(url);
        sources.push({
          url,
          mimeType: el.type || guessMimeType(url),
          duration: el.duration || null,
          isAudio: true,
          isVideo: false,
          source: 'element',
          selector: `audio:nth-of-type(${index + 1})`,
        });
      }

      // Also check <source> children
      el.querySelectorAll('source').forEach((s, si) => {
        const src = s.src;
        if (src && !reportedUrls.has(src)) {
          reportedUrls.add(src);
          sources.push({
            url: src,
            mimeType: s.type || guessMimeType(src),
            duration: el.duration || null,
            isAudio: true,
            isVideo: false,
            source: 'element',
            selector: `audio:nth-of-type(${index + 1}) source:nth-of-type(${si + 1})`,
          });
        }
      });
    });

    // Find all <video> elements
    document.querySelectorAll('video').forEach((el, index) => {
      let url = el.src || el.currentSrc;
      if (url && !reportedUrls.has(url)) {
        reportedUrls.add(url);
        sources.push({
          url,
          mimeType: el.type || guessMimeType(url),
          duration: el.duration || null,
          isAudio: true, // Can extract audio from video
          isVideo: true,
          source: 'element',
          selector: `video:nth-of-type(${index + 1})`,
        });
      }

      el.querySelectorAll('source').forEach((s, si) => {
        const src = s.src;
        if (src && !reportedUrls.has(src)) {
          reportedUrls.add(src);
          sources.push({
            url: src,
            mimeType: s.type || guessMimeType(src),
            duration: el.duration || null,
            isAudio: true,
            isVideo: true,
            source: 'element',
            selector: `video:nth-of-type(${index + 1}) source:nth-of-type(${si + 1})`,
          });
        }
      });
    });

    return sources;
  }

  function guessMimeType(url) {
    const ext = (url.split('.').pop() || '').toLowerCase().split('?')[0];
    const map = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      opus: 'audio/opus',
      flac: 'audio/flac',
      m4a: 'audio/mp4',
      aac: 'audio/aac',
      weba: 'audio/webm',
      webm: 'video/webm',
      mp4: 'video/mp4',
      mkv: 'video/x-matroska',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      flv: 'video/x-flv',
    };
    return map[ext] || 'audio/mpeg';
  }

  // Send detected sources to background
  function reportSources() {
    const sources = detectMediaElements();
    if (sources.length > 0) {
      chrome.runtime.sendMessage({
        action: 'reportElementSources',
        sources,
        pageUrl: window.location.href,
        pageTitle: document.title,
      }).catch(() => {
        // Background might not be ready
      });
    }
  }

  // Listen for request from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'detectElements') {
      const sources = detectMediaElements();
      sendResponse({ sources });
    }
    return true;
  });

  // Initial detection
  reportSources();

  // Watch for DOM changes (lazy-loaded media)
  const observer = new MutationObserver(() => {
    reportSources();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'currentSrc'],
  });

  // Re-scan periodically for dynamically created elements
  setInterval(reportSources, 3000);
})();