/**
 * Verification Studio utilities
 * Implements CSV/JSON export, before‑after slider, and card integration.
 */

// ---------- Export Functions ----------
function exportToCSV() {
  const container = document.getElementById('verification-cards-container');
  if (!container) return;
  const rows = [];
  // Header
  rows.push(['complaint_id', 'status', 'before_image', 'after_image'].join(','));
  const cards = container.querySelectorAll('.glass-panel');
  cards.forEach(card => {
    // complaint id (first .font-mono span)
    const idSpan = card.querySelector('.font-mono');
    const complaintId = idSpan ? idSpan.textContent.trim() : '';
    // status – the uppercase badge near line 380
    const statusEl = card.querySelector('.uppercase');
    const status = statusEl ? statusEl.textContent.trim() : '';
    // before/after images
    const imgs = card.querySelectorAll('img');
    const beforeImg = imgs[0] ? imgs[0].src : '';
    const afterImg = imgs[1] ? imgs[1].src : '';
    // Escape commas and quotes
    const esc = v => `"${v.replace(/"/g, '""')}"`;
    rows.push([esc(complaintId), esc(status), esc(beforeImg), esc(afterImg)].join(','));
  });
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'verification.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function exportToJSON() {
  const container = document.getElementById('verification-cards-container');
  if (!container) return;
  const data = [];
  const cards = container.querySelectorAll('.glass-panel');
  cards.forEach(card => {
    const idSpan = card.querySelector('.font-mono');
    const complaintId = idSpan ? idSpan.textContent.trim() : '';
    const statusEl = card.querySelector('.uppercase');
    const status = statusEl ? statusEl.textContent.trim() : '';
    const imgs = card.querySelectorAll('img');
    const beforeImg = imgs[0] ? imgs[0].src : '';
    const afterImg = imgs[1] ? imgs[1].src : '';
    data.push({
      complaint_id: complaintId,
      status: status,
      before_image: beforeImg,
      after_image: afterImg
    });
  });
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'verification.json';
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Slider Component ----------
function initBeforeAfterSlider(beforeUrl, afterUrl) {
  const slider = document.getElementById('before-after-slider');
  if (!slider) return;
  // Clear any previous content
  slider.innerHTML = '';
  if (!beforeUrl && !afterUrl) {
    slider.textContent = 'No before/after images available.';
    return;
  }
  // Ensure container styles
  slider.style.position = 'relative';
  slider.style.overflow = 'hidden';
  slider.style.userSelect = 'none';

  const beforeImg = document.createElement('img');
  beforeImg.src = beforeUrl || '';
  beforeImg.style.width = '100%';
  beforeImg.style.height = '100%';
  beforeImg.style.objectFit = 'cover';
  slider.appendChild(beforeImg);

  const afterWrapper = document.createElement('div');
  afterWrapper.style.position = 'absolute';
  afterWrapper.style.top = '0';
  afterWrapper.style.left = '0';
  afterWrapper.style.height = '100%';
  afterWrapper.style.width = '50%'; // start at 50%
  afterWrapper.style.overflow = 'hidden';
  slider.appendChild(afterWrapper);

  const afterImg = document.createElement('img');
  afterImg.src = afterUrl || '';
  afterImg.style.width = '100%';
  afterImg.style.height = '100%';
  afterImg.style.objectFit = 'cover';
  afterWrapper.appendChild(afterImg);

  // Handle element
  const handle = document.createElement('div');
  handle.style.position = 'absolute';
  handle.style.top = '0';
  handle.style.left = '50%';
  handle.style.transform = 'translateX(-50%)';
  handle.style.width = '2px';
  handle.style.height = '100%';
  handle.style.background = 'rgba(255,255,255,0.8)';
  handle.style.cursor = 'ew-resize';
  slider.appendChild(handle);

  let isDragging = false;

  const setPosition = clientX => {
    const rect = slider.getBoundingClientRect();
    let percent = ((clientX - rect.left) / rect.width) * 100;
    percent = Math.max(0, Math.min(100, percent));
    afterWrapper.style.width = `${percent}%`;
    handle.style.left = `${percent}%`;
  };

  const onMove = e => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setPosition(clientX);
  };

  const onDown = e => {
    isDragging = true;
    e.preventDefault();
  };

  const onUp = () => {
    isDragging = false;
  };

  handle.addEventListener('mousedown', onDown);
  handle.addEventListener('touchstart', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove);
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);
}

// ---------- Card Click Integration ----------
function attachVerificationCardListeners() {
  const container = document.getElementById('verification-cards-container');
  if (!container) return;
  const cards = container.querySelectorAll('.glass-panel');
  cards.forEach(card => {
    // Find before/after images inside the card
    const imgs = card.querySelectorAll('img');
    const beforeImg = imgs[0] ? imgs[0].src : null;
    const afterImg = imgs[1] ? imgs[1].src : null;
    card.style.cursor = 'pointer';
    card.onclick = () => {
      initBeforeAfterSlider(beforeImg, afterImg);
    };
  });
}

// Hook into rendering – the app already calls renderVerificationStudio()
// We'll monkey‑patch that function after it loads.
if (window.renderVerificationStudio) {
  const originalRender = window.renderVerificationStudio;
  window.renderVerificationStudio = function () {
    const result = originalRender.apply(this, arguments);
    // after rendering, attach listeners
    try { attachVerificationCardListeners(); } catch (e) { console.error('Verification card listener error', e); }
    return result;
  };
}

// Expose functions for the buttons (they call global names)
window.exportToCSV = exportToCSV;
window.exportToJSON = exportToJSON;
window.initBeforeAfterSlider = initBeforeAfterSlider;
