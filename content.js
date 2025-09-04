// content.js - Floating download button for zingmusic.app

(() => {
  // Prevent multiple injections
  if (window.audioDownloaderInjected) return;
  window.audioDownloaderInjected = true;

  let floatingButton = null;
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let downloadCount = 0;

  // Create floating button
  function createFloatingButton() {
    floatingButton = document.createElement('button');
    floatingButton.id = 'audio-downloader-float-btn';
    floatingButton.innerHTML = `
      <svg class="download-icon" viewBox="0 0 24 24">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
    `;
    floatingButton.title = 'Download Audio (Drag to move)';
    
    // Load saved position
    const savedPosition = localStorage.getItem('audioDownloaderPosition');
    if (savedPosition) {
      const { top, right } = JSON.parse(savedPosition);
      floatingButton.style.top = top + 'px';
      floatingButton.style.right = right + 'px';
    }

    document.body.appendChild(floatingButton);
    
    // Add event listeners
    floatingButton.addEventListener('mousedown', handleMouseDown);
    floatingButton.addEventListener('click', handleDownload);
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Request current status
    chrome.runtime.sendMessage({ action: 'getStatus' });
  }

  // Handle mouse down for dragging
  function handleMouseDown(e) {
    if (e.button !== 0) return; // Only left click
    
    isDragging = true;
    floatingButton.classList.add('dragging');
    
    // Allow dragging regardless of ready state
    floatingButton.style.cursor = 'grabbing';
    
    const rect = floatingButton.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left;
    dragOffset.y = e.clientY - rect.top;
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    e.preventDefault();
  }

  // Handle mouse move during drag
  function handleMouseMove(e) {
    if (!isDragging) return;
    
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    
    // Keep button within viewport
    const maxX = window.innerWidth - floatingButton.offsetWidth;
    const maxY = window.innerHeight - floatingButton.offsetHeight;
    
    const constrainedX = Math.max(0, Math.min(x, maxX));
    const constrainedY = Math.max(0, Math.min(y, maxY));
    
    floatingButton.style.left = constrainedX + 'px';
    floatingButton.style.top = constrainedY + 'px';
    floatingButton.style.right = 'auto';
    floatingButton.style.bottom = 'auto';
  }

  // Handle mouse up to end drag
  function handleMouseUp(e) {
    if (!isDragging) return;
    
    isDragging = false;
    floatingButton.classList.remove('dragging');
    
    // Restore cursor based on ready state
    if (floatingButton.classList.contains('ready')) {
      floatingButton.style.cursor = 'grab';
    } else {
      floatingButton.style.cursor = 'not-allowed';
    }
    
    // Save position
    const rect = floatingButton.getBoundingClientRect();
    const position = {
      top: rect.top,
      right: window.innerWidth - rect.right
    };
    localStorage.setItem('audioDownloaderPosition', JSON.stringify(position));
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }

  // Handle download button click
  function handleDownload(e) {
    if (isDragging) return; // Don't download if we were dragging
    
    e.preventDefault();
    e.stopPropagation();
    
    // Check if button is in ready state
    if (!floatingButton.classList.contains('ready')) {
      showStatus('No audio available. Play a track first!', 'error');
      return;
    }
    
    // Send download request to background script
    chrome.runtime.sendMessage({ action: 'download' }, (response) => {
      if (response && response.success) {
        showStatus('Download started!', 'success');
        downloadCount++;
        updateBadge();
      } else {
        showStatus(response?.error || 'Download failed', 'error');
      }
    });
  }

  // Handle messages from background script
  function handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'updateStatus':
        updateButtonStatus(message.hasAudio, message.count);
        break;
      case 'downloadComplete':
        showStatus('Download complete!', 'success');
        break;
      case 'downloadError':
        showStatus(message.error || 'Download failed', 'error');
        break;
    }
  }

  // Update button visual status
  function updateButtonStatus(hasAudio, count) {
    if (!floatingButton) return;
    
    if (hasAudio) {
      floatingButton.classList.add('ready');
      floatingButton.title = 'Download Audio - Ready! (Click to download, drag to move)';
      floatingButton.style.cursor = 'grab';
    } else {
      floatingButton.classList.remove('ready');
      floatingButton.title = 'Download Audio - Play a track first (drag to move)';
      floatingButton.style.cursor = 'not-allowed';
    }
    
    if (count && count !== downloadCount) {
      downloadCount = count;
      updateBadge();
    }
  }

  // Update badge display
  function updateBadge() {
    if (!floatingButton) return;
    
    if (downloadCount > 0) {
      floatingButton.classList.add('has-badge');
      floatingButton.setAttribute('data-badge', downloadCount > 99 ? '99+' : downloadCount.toString());
    } else {
      floatingButton.classList.remove('has-badge');
      floatingButton.removeAttribute('data-badge');
    }
  }

  // Show status message
  function showStatus(message, type = 'info') {
    let statusEl = document.getElementById('audio-downloader-status');
    
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.id = 'audio-downloader-status';
      document.body.appendChild(statusEl);
    }
    
    statusEl.textContent = message;
    statusEl.className = `show ${type}`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      statusEl.classList.remove('show');
    }, 3000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatingButton);
  } else {
    createFloatingButton();
  }

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (floatingButton) {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
  });
})();
