// SignalThief Popup Script

// Config
const API_BASE = 'http://localhost:3001';

// State
let currentTab = 'detected';
let currentMediaInfo = null;
let selectedAudioFormat = 'best';
let selectedVideoFormat = 'best';
let selectedQuality = 'best';

// DOM Elements
const elements = {
  pageTitle: document.getElementById('pageTitle'),
  sourceList: document.getElementById('sourceList'),
  noSources: document.getElementById('noSources'),
  urlInput: document.getElementById('urlInput'),
  extractBtn: document.getElementById('extractBtn'),
  extractResult: document.getElementById('extractResult'),
  extractLoading: document.getElementById('extractLoading'),
  extractError: document.getElementById('extractError'),
  mediaInfo: document.getElementById('mediaInfo'),
  formatModal: document.getElementById('formatModal'),
  modalBody: document.getElementById('modalBody'),
  closeModal: document.getElementById('closeModal'),
  toast: document.getElementById('toast'),
  openWebApp: document.getElementById('openWebApp'),
  refreshBtn: document.getElementById('refreshBtn'),
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Refresh button
  elements.refreshBtn.addEventListener('click', loadDetectedSources);

  // Open Web App
  elements.openWebApp.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openWebApp' });
  });

  // URL Extract button
  elements.extractBtn.addEventListener('click', handleExtract);

  // Enter key on URL input
  elements.urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleExtract();
  });

  // Close modal
  elements.closeModal.addEventListener('click', closeFormatModal);

  // Load detected sources
  loadDetectedSources();
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('detectedTab').classList.toggle('active', tab === 'detected');
  document.getElementById('urlTab').classList.toggle('active', tab === 'url');
}

// ===== Detected Sources =====

function loadDetectedSources() {
  chrome.runtime.sendMessage({ action: 'getDetectedSources' }, (response) => {
    if (chrome.runtime.lastError || !response) {
      showNoSources();
      return;
    }

    elements.pageTitle.textContent = response.pageTitle || 'Current Page';

    const sources = response.sources || [];
    if (sources.length === 0) {
      showNoSources();
      return;
    }

    elements.noSources.classList.add('hidden');
    renderSourceList(sources);
  });
}

function renderSourceList(sources) {
  elements.sourceList.innerHTML = sources.map((source, index) => {
    const icon = source.isVideo ? '🎬' : '🎵';
    const type = source.isVideo ? 'VIDEO' : 'AUDIO';
    const mimeShort = source.mimeType.split('/')[1] || source.mimeType;
    const domain = getDomain(source.url);

    return `
      <div class="source-item" data-index="${index}">
        <span class="source-icon">${icon}</span>
        <div class="source-info">
          <div class="source-type">${type} · ${source.source}</div>
          <div class="source-url">${domain}</div>
          <div class="source-mime">${mimeShort}</div>
        </div>
        <span class="download-arrow">⤓</span>
      </div>
    `;
  }).join('');

  // Add click handlers
  elements.sourceList.querySelectorAll('.source-item').forEach((item, i) => {
    item.addEventListener('click', () => handleSourceClick(sources[i], i));
  });
}

function handleSourceClick(source, index) {
  // Direct download for direct URLs
  const filename = generateFilename(source);
  chrome.runtime.sendMessage({
    action: 'downloadUrl',
    url: source.url,
    filename,
  }, () => {
    showToast('Download started!', 'success');
  });
}

function generateFilename(source) {
  const domain = getDomain(source.url);
  const ext = source.mimeType.split('/')[1]?.split(';')[0] || 'unknown';
  const date = new Date().toISOString().slice(0, 10);
  const prefix = source.isVideo ? 'video' : 'audio';
  return `SignalThief/${prefix}_${domain}_${date}.${ext}`;
}

function showNoSources() {
  elements.sourceList.innerHTML = '';
  elements.noSources.classList.remove('hidden');
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url.substring(0, 40);
  }
}

// ===== URL Extract =====

async function handleExtract() {
  const url = elements.urlInput.value.trim();
  if (!url) {
    showExtractError('Please enter a URL');
    return;
  }

  // Validate URL
  try {
    new URL(url);
  } catch {
    showExtractError('Invalid URL format');
    return;
  }

  // Show loading
  elements.extractResult.classList.add('hidden');
  elements.extractError.classList.add('hidden');
  elements.extractLoading.classList.remove('hidden');
  elements.extractBtn.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/api/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Extraction failed');
    }

    currentMediaInfo = data.data;
    renderMediaInfo(data.data);

    elements.extractLoading.classList.add('hidden');
    elements.extractResult.classList.remove('hidden');
  } catch (err) {
    elements.extractLoading.classList.add('hidden');
    // If API is not available, show specific error
    if (err.message.includes('Failed to fetch')) {
      showExtractError('Backend not available. Start server at localhost:3001 or deploy to Render.');
    } else {
      showExtractError(err.message);
    }
  } finally {
    elements.extractBtn.disabled = false;
  }
}

function renderMediaInfo(info) {
  elements.mediaInfo.innerHTML = `
    <div class="media-header">
      ${info.thumbnail ? `<img class="media-thumb" src="${info.thumbnail}" alt="thumb" onerror="this.style.display='none'">` : ''}
      <div class="media-details">
        <div class="media-title">${escapeHtml(info.title)}</div>
        <div class="media-meta">
          ${info.uploader ? `${escapeHtml(info.uploader)} · ` : ''}
          ${formatDuration(info.duration)}
          ${info.viewCount ? ` · ${formatNumber(info.viewCount)} views` : ''}
        </div>
      </div>
    </div>

    <!-- Audio Formats -->
    <div class="format-group">
      <h3>🎵 Audio Format</h3>
      <div class="format-options" id="audioFormatOptions">
        ${renderAudioFormatOptions()}
      </div>
    </div>

    <!-- Video Formats -->
    ${info.formats.some(f => f.vcodec && f.vcodec !== 'none') ? `
    <div class="format-group">
      <h3>🎬 Video Format</h3>
      <div class="format-options" id="videoFormatOptions">
        ${renderVideoFormatOptions()}
      </div>
    </div>
    ` : ''}

    <!-- Quality -->
    <div class="format-group">
      <h3>📊 Quality</h3>
      <div class="format-options" id="qualityOptions">
        ${renderQualityOptions()}
      </div>
    </div>

    <button id="downloadMediaBtn" class="download-btn">⬇ Download</button>

    ${Object.keys(info.subtitles).length > 0 ? `
    <div class="format-group" style="margin-top: 12px;">
      <h3>📝 Subtitles Available (${Object.keys(info.subtitles).length} languages)</h3>
      <div style="font-size: 11px; color: #888;">
        ${Object.keys(info.subtitles).slice(0, 5).map(lang => `<span style="background:#1a1a1a;padding:2px 6px;border-radius:4px;margin:2px;display:inline-block;">${lang}</span>`).join(' ')}
        ${Object.keys(info.subtitles).length > 5 ? `<span>+${Object.keys(info.subtitles).length - 5} more</span>` : ''}
      </div>
    </div>
    ` : ''}
  `;

  // Add event listeners
  document.getElementById('downloadMediaBtn')?.addEventListener('click', handleDownloadMedia);

  document.querySelectorAll('#audioFormatOptions .format-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const radio = opt.querySelector('input');
      radio.checked = true;
      selectedAudioFormat = radio.value;
      updateFormatSelection('audioFormatOptions', radio.value);
    });
  });

  document.querySelectorAll('#videoFormatOptions .format-option')?.forEach(opt => {
    opt.addEventListener('click', () => {
      const radio = opt.querySelector('input');
      radio.checked = true;
      selectedVideoFormat = radio.value;
      updateFormatSelection('videoFormatOptions', radio.value);
    });
  });

  document.querySelectorAll('#qualityOptions .format-option').forEach(opt => {
    opt.addEventListener('click', () => {
      const radio = opt.querySelector('input');
      radio.checked = true;
      selectedQuality = radio.value;
      updateFormatSelection('qualityOptions', radio.value);
    });
  });
}

function renderAudioFormatOptions() {
  const formats = [
    { id: 'best', label: 'Best Available' },
    { id: 'mp3', label: 'MP3 (320kbps)' },
    { id: 'aac', label: 'AAC (256kbps)' },
    { id: 'flac', label: 'FLAC (Lossless)' },
    { id: 'opus', label: 'Opus (160kbps)' },
    { id: 'ogg', label: 'OGG Vorbis' },
    { id: 'm4a', label: 'M4A (AAC)' },
  ];

  return formats.map(f => `
    <div class="format-option ${f.id === selectedAudioFormat ? 'selected' : ''}">
      <input type="radio" name="audioFormat" value="${f.id}" ${f.id === selectedAudioFormat ? 'checked' : ''}>
      <label>${f.label}</label>
    </div>
  `).join('');
}

function renderVideoFormatOptions() {
  const formats = [
    { id: 'best', label: 'Best Available' },
    { id: 'mp4', label: 'MP4 (H.264)' },
    { id: 'webm', label: 'WebM (VP9)' },
    { id: 'mkv', label: 'MKV (Original)' },
  ];

  return formats.map(f => `
    <div class="format-option ${f.id === selectedVideoFormat ? 'selected' : ''}">
      <input type="radio" name="videoFormat" value="${f.id}" ${f.id === selectedVideoFormat ? 'checked' : ''}>
      <label>${f.label}</label>
    </div>
  `).join('');
}

function renderQualityOptions() {
  const qualities = [
    { id: 'best', label: 'Best' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ];

  return qualities.map(q => `
    <div class="format-option ${q.id === selectedQuality ? 'selected' : ''}">
      <input type="radio" name="quality" value="${q.id}" ${q.id === selectedQuality ? 'checked' : ''}>
      <label>${q.label}</label>
    </div>
  `).join('');
}

function updateFormatSelection(groupId, value) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.format-option').forEach(opt => {
    opt.classList.toggle('selected', opt.querySelector('input')?.value === value);
  });
}

async function handleDownloadMedia() {
  if (!currentMediaInfo) return;

  const downloadBtn = document.getElementById('downloadMediaBtn');
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Preparing download...';

  // Determine if audio or video is selected
  const isVideoSelected = document.querySelector('input[name="videoFormat"]')?.checked;
  const targetFormat = isVideoSelected ? selectedVideoFormat : selectedAudioFormat;

  // Find best format ID
  let formatId;
  if (isVideoSelected) {
    // Use best video + audio combined
    formatId = selectedVideoFormat === 'best'
      ? (currentMediaInfo.bestVideo?.formatId || currentMediaInfo.formats[0]?.formatId)
      : currentMediaInfo.formats.find(f => f.ext === selectedVideoFormat && f.vcodec)?.formatId
        || currentMediaInfo.bestVideo?.formatId
        || currentMediaInfo.formats[0]?.formatId;
  } else {
    formatId = selectedAudioFormat === 'best'
      ? (currentMediaInfo.bestAudio?.formatId || 'bestaudio')
      : currentMediaInfo.formats.find(f =>
          f.ext === selectedAudioFormat && f.acodec && (!f.vcodec || f.vcodec === 'none')
        )?.formatId || 'bestaudio';
  }

  if (!formatId) {
    showToast('No suitable format found', 'error');
    downloadBtn.disabled = false;
    downloadBtn.textContent = '⬇ Download';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: currentMediaInfo.webpageUrl,
        formatId,
        targetFormat,
        quality: selectedQuality,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Download failed');
    }

    // Stream to blob and trigger browser download
    const blob = await response.blob();
    const objUrl = URL.createObjectURL(blob);

    const ext = targetFormat === 'best' ? getExtFromContentType(response.headers.get('content-type')) : targetFormat;
    const filename = `${sanitizeFilename(currentMediaInfo.title)}.${ext}`;

    chrome.runtime.sendMessage({
      action: 'downloadUrl',
      url: objUrl,
      filename: `SignalThief/${filename}`,
    }, () => {
      showToast('Download started!', 'success');
      setTimeout(() => URL.revokeObjectURL(objUrl), 60000);
    });
  } catch (err) {
    showToast(err.message || 'Download failed', 'error');
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = '⬇ Download';
  }
}

function getExtFromContentType(contentType) {
  const map = {
    'audio/mpeg': 'mp3',
    'audio/aac': 'aac',
    'audio/flac': 'flac',
    'audio/opus': 'opus',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/mp4': 'm4a',
    'audio/webm': 'webm',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/x-matroska': 'mkv',
  };
  return map[contentType?.toLowerCase()] || 'unknown';
}

function showExtractError(msg) {
  elements.extractError.textContent = msg;
  elements.extractError.classList.remove('hidden');
  elements.extractResult.classList.add('hidden');
}

// ===== Modal =====

function closeFormatModal() {
  elements.formatModal.classList.add('hidden');
}

// ===== Toast =====

function showToast(message, type = 'info') {
  const toast = elements.toast;
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.remove('hidden');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3000);
}

// ===== Utilities =====

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDuration(seconds) {
  if (!seconds) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatNumber(n) {
  if (!n) return '';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

function sanitizeFilename(name) {
  return name.replace(/[<>:"/\\|?*]/g, '').replace(/\s+/g, '_').substring(0, 100);
}