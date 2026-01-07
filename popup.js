// SiteBlock - Popup Script

document.addEventListener('DOMContentLoaded', init);

let currentHostname = null;
let isCurrentSiteBlocked = false;

async function init() {
  await loadCurrentTab();
  await loadBlockedSites();
  setupEventListeners();
}

function setupEventListeners() {
  // Enable/Disable toggle
  document.getElementById('enableToggle').addEventListener('change', async (e) => {
    const response = await sendMessage({ action: 'toggleEnabled' });
    updateToggleUI(response.isEnabled);
  });

  // Block/Unblock current site
  document.getElementById('toggleSiteBtn').addEventListener('click', async () => {
    if (!currentHostname) return;
    
    if (isCurrentSiteBlocked) {
      await sendMessage({ action: 'removeSite', hostname: currentHostname });
    } else {
      await sendMessage({ action: 'addSite', hostname: currentHostname });
    }
    
    await loadBlockedSites();
    updateCurrentSiteButton();
  });

  // Manual add
  document.getElementById('manualAddBtn').addEventListener('click', addManualSite);
  document.getElementById('manualInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addManualSite();
  });
}

async function loadCurrentTab() {
  const response = await sendMessage({ action: 'getCurrentTab' });
  currentHostname = response.hostname;
  
  const siteNameEl = document.getElementById('currentSite');
  const toggleBtn = document.getElementById('toggleSiteBtn');
  
  if (currentHostname) {
    siteNameEl.textContent = currentHostname;
  } else {
    siteNameEl.textContent = 'Not a blockable page';
    toggleBtn.disabled = true;
  }
}

async function loadBlockedSites() {
  const response = await sendMessage({ action: 'getBlockedSites' });
  const { blockedSites, isEnabled } = response;
  
  // Update toggle
  document.getElementById('enableToggle').checked = isEnabled;
  updateToggleUI(isEnabled);
  
  // Update site count
  const sites = Object.keys(blockedSites || {});
  document.getElementById('siteCount').textContent = sites.length;
  
  // Render sites
  renderBlockedSites(blockedSites || {});
  
  // Check if current site is blocked
  if (currentHostname) {
    isCurrentSiteBlocked = sites.some(site => 
      currentHostname.includes(site) || site.includes(currentHostname)
    );
    updateCurrentSiteButton();
  }
}

function updateToggleUI(isEnabled) {
  const label = document.getElementById('toggleLabel');
  const container = document.querySelector('.container');
  
  label.textContent = isEnabled ? 'ON' : 'OFF';
  label.classList.toggle('active', isEnabled);
  container.classList.toggle('disabled', !isEnabled);
}

function updateCurrentSiteButton() {
  const btn = document.getElementById('toggleSiteBtn');
  const icon = document.getElementById('btnIcon');
  const text = document.getElementById('btnText');
  
  if (isCurrentSiteBlocked) {
    icon.textContent = '➖';
    text.textContent = 'Unblock';
    btn.classList.add('remove');
  } else {
    icon.textContent = '➕';
    text.textContent = 'Block Site';
    btn.classList.remove('remove');
  }
}

function renderBlockedSites(sites) {
  const container = document.getElementById('sitesContainer');
  const emptyState = document.getElementById('emptyState');
  const entries = Object.entries(sites);
  
  // Clear existing items except empty state
  const items = container.querySelectorAll('.site-item');
  items.forEach(item => item.remove());
  
  if (entries.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  
  emptyState.style.display = 'none';
  
  // Sort by attempts (most first)
  entries.sort((a, b) => (b[1].attempts || 0) - (a[1].attempts || 0));
  
  entries.forEach(([hostname, data]) => {
    const item = createSiteItem(hostname, data);
    container.appendChild(item);
  });
}

function createSiteItem(hostname, data) {
  const div = document.createElement('div');
  div.className = 'site-item';
  
  const attempts = data.attempts || 0;
  const attemptsText = attempts === 1 ? '1 attempt' : `${attempts} attempts`;
  
  div.innerHTML = `
    <div class="site-item-info">
      <span class="site-item-name">${escapeHtml(hostname)}</span>
      <span class="site-item-stats">
        🚫 <span class="attempts">${attemptsText}</span>
      </span>
    </div>
    <div class="site-item-actions">
      <button class="btn-remove" title="Remove" data-hostname="${escapeHtml(hostname)}">
        🗑️
      </button>
    </div>
  `;
  
  // Add remove handler
  div.querySelector('.btn-remove').addEventListener('click', async (e) => {
    const hostname = e.currentTarget.dataset.hostname;
    await sendMessage({ action: 'removeSite', hostname });
    await loadBlockedSites();
    updateCurrentSiteButton();
  });
  
  return div;
}

async function addManualSite() {
  const input = document.getElementById('manualInput');
  let hostname = input.value.trim().toLowerCase();
  
  if (!hostname) return;
  
  // Clean up the hostname
  hostname = hostname.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  
  if (!hostname || hostname.length < 3) {
    input.classList.add('error');
    setTimeout(() => input.classList.remove('error'), 500);
    return;
  }
  
  await sendMessage({ action: 'addSite', hostname });
  input.value = '';
  await loadBlockedSites();
  updateCurrentSiteButton();
}

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, resolve);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

