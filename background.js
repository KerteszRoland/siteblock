// SiteBlock - Background Service Worker

// Initialize storage with defaults
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["blockedSites", "isEnabled"], (result) => {
    if (!result.blockedSites) {
      chrome.storage.local.set({ blockedSites: {} });
    }
    if (result.isEnabled === undefined) {
      chrome.storage.local.set({ isEnabled: true });
    }
  });
});

// Listen for tab updates to check if we should block
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" && tab.url) {
    checkAndBlock(tabId, tab.url);
  }
});

// Check if URL should be blocked
async function checkAndBlock(tabId, url) {
  try {
    const { blockedSites, isEnabled } = await chrome.storage.local.get([
      "blockedSites",
      "isEnabled",
    ]);

    if (!isEnabled) return;

    const hostname = getHostname(url);
    if (!hostname) return;

    // Check if this hostname matches any blocked site
    for (const blockedHost of Object.keys(blockedSites || {})) {
      if (hostname.includes(blockedHost) || blockedHost.includes(hostname)) {
        // Increment access count
        blockedSites[blockedHost].attempts =
          (blockedSites[blockedHost].attempts || 0) + 1;
        blockedSites[blockedHost].lastAttempt = Date.now();
        await chrome.storage.local.set({ blockedSites });

        // Redirect to blocked page (include original URL for restoration)
        const blockedPageUrl = chrome.runtime.getURL(
          `blocked.html?site=${encodeURIComponent(
            blockedHost
          )}&url=${encodeURIComponent(url)}`
        );
        chrome.tabs.update(tabId, { url: blockedPageUrl });
        return;
      }
    }
  } catch (error) {
    console.error("Error checking block status:", error);
  }
}

// Extract hostname from URL
function getHostname(url) {
  try {
    if (
      url.startsWith("chrome://") ||
      url.startsWith("chrome-extension://") ||
      url.startsWith("about:")
    ) {
      return null;
    }
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return null;
  }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCurrentTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        sendResponse({ url: tabs[0].url, hostname: getHostname(tabs[0].url) });
      } else {
        sendResponse({ url: null, hostname: null });
      }
    });
    return true; // Keep message channel open for async response
  }

  if (request.action === "addSite") {
    addBlockedSite(request.hostname).then(sendResponse);
    return true;
  }

  if (request.action === "removeSite") {
    removeBlockedSite(request.hostname).then(sendResponse);
    return true;
  }

  if (request.action === "toggleEnabled") {
    toggleEnabled().then(sendResponse);
    return true;
  }

  if (request.action === "getBlockedSites") {
    chrome.storage.local.get(["blockedSites", "isEnabled"], sendResponse);
    return true;
  }

  if (request.action === "resetAttempts") {
    resetAttempts(request.hostname).then(sendResponse);
    return true;
  }
});

// Add a site to blocked list
async function addBlockedSite(hostname) {
  const { blockedSites, isEnabled } = await chrome.storage.local.get([
    "blockedSites",
    "isEnabled",
  ]);
  const sites = blockedSites || {};

  if (!sites[hostname]) {
    sites[hostname] = {
      addedAt: Date.now(),
      attempts: 0,
      lastAttempt: null,
    };
    await chrome.storage.local.set({ blockedSites: sites });

    // If blocking is enabled, immediately block any open tabs with this site
    if (isEnabled) {
      await blockOpenTabs(hostname);
    }
  }

  return { success: true, sites };
}

// Remove a site from blocked list
async function removeBlockedSite(hostname) {
  const { blockedSites } = await chrome.storage.local.get(["blockedSites"]);
  const sites = blockedSites || {};

  if (sites[hostname]) {
    delete sites[hostname];
    await chrome.storage.local.set({ blockedSites: sites });

    // Restore any tabs that were blocked for this specific site
    await restoreBlockedTabs(hostname);
  }

  return { success: true, sites };
}

// Toggle blocking enabled/disabled
async function toggleEnabled() {
  const { isEnabled } = await chrome.storage.local.get(["isEnabled"]);
  const newState = !isEnabled;
  await chrome.storage.local.set({ isEnabled: newState });

  if (newState) {
    // Blocking enabled - block all tabs that match blocked sites
    await blockAllMatchingTabs();
  } else {
    // Blocking disabled - restore all blocked tabs
    await restoreBlockedTabs();
  }

  return { isEnabled: newState };
}

// Reset attempts counter for a site
async function resetAttempts(hostname) {
  const { blockedSites } = await chrome.storage.local.get(["blockedSites"]);
  const sites = blockedSites || {};

  if (sites[hostname]) {
    sites[hostname].attempts = 0;
    await chrome.storage.local.set({ blockedSites: sites });
  }

  return { success: true };
}

// Restore all tabs showing the blocked page back to their original URLs
async function restoreBlockedTabs(specificSite = null) {
  const blockedPageBase = chrome.runtime.getURL("blocked.html");
  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    if (tab.url && tab.url.startsWith(blockedPageBase)) {
      try {
        const tabUrl = new URL(tab.url);
        const originalUrl = tabUrl.searchParams.get("url");
        const blockedSite = tabUrl.searchParams.get("site");

        // If specificSite is provided, only restore tabs blocked for that site
        if (specificSite && blockedSite !== specificSite) {
          continue;
        }

        if (originalUrl) {
          chrome.tabs.update(tab.id, { url: originalUrl });
        }
      } catch (error) {
        console.error("Error restoring tab:", error);
      }
    }
  }
}

// Block open tabs that match a specific hostname
async function blockOpenTabs(hostname) {
  const tabs = await chrome.tabs.query({});
  const blockedPageBase = chrome.runtime.getURL("blocked.html");

  for (const tab of tabs) {
    if (!tab.url || tab.url.startsWith(blockedPageBase)) continue;

    const tabHostname = getHostname(tab.url);
    if (!tabHostname) continue;

    if (tabHostname.includes(hostname) || hostname.includes(tabHostname)) {
      const blockedPageUrl = chrome.runtime.getURL(
        `blocked.html?site=${encodeURIComponent(
          hostname
        )}&url=${encodeURIComponent(tab.url)}`
      );
      chrome.tabs.update(tab.id, { url: blockedPageUrl });
    }
  }
}

// Block all tabs that match any blocked site (used when enabling blocking)
async function blockAllMatchingTabs() {
  const { blockedSites } = await chrome.storage.local.get(["blockedSites"]);
  const sites = Object.keys(blockedSites || {});
  if (sites.length === 0) return;

  const tabs = await chrome.tabs.query({});
  const blockedPageBase = chrome.runtime.getURL("blocked.html");

  for (const tab of tabs) {
    if (!tab.url || tab.url.startsWith(blockedPageBase)) continue;

    const tabHostname = getHostname(tab.url);
    if (!tabHostname) continue;

    for (const blockedHost of sites) {
      if (
        tabHostname.includes(blockedHost) ||
        blockedHost.includes(tabHostname)
      ) {
        const blockedPageUrl = chrome.runtime.getURL(
          `blocked.html?site=${encodeURIComponent(
            blockedHost
          )}&url=${encodeURIComponent(tab.url)}`
        );
        chrome.tabs.update(tab.id, { url: blockedPageUrl });
        break;
      }
    }
  }
}
