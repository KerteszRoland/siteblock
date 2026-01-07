// SiteBlock - Blocked Page Script

// Random emojis for the blocked page
const emojis = [
  '📚', '🎓', '✏️', '💪', '🧠', '⏰', '🎯', '📖', 
  '🔥', '⭐', '💡', '🚀', '📝', '🎒', '📐', '🔬',
  '🤓', '😤', '🙅', '🛑', '⛔', '🚫', '❌', '👀',
  '😅', '🫣', '🙈', '💀', '☠️', '👻', '🤖', '🦾'
];

// Motivational quotes
const quotes = [
  "The secret of getting ahead is getting started.",
  "Focus on being productive instead of busy.",
  "Success is the sum of small efforts repeated daily.",
  "Don't watch the clock; do what it does. Keep going.",
  "The only way to do great work is to love what you do.",
  "Your future self will thank you.",
  "Discipline is choosing between what you want now and what you want most.",
  "Small progress is still progress.",
  "You don't have to be great to start, but you have to start to be great.",
  "The harder you work, the luckier you get."
];

// Set random emoji
document.getElementById('emoji').textContent = emojis[Math.floor(Math.random() * emojis.length)];

// Set random quote
document.getElementById('quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];

// Get blocked site and original URL from URL params
const urlParams = new URLSearchParams(window.location.search);
const blockedSite = urlParams.get('site') || 'Unknown site';
const originalUrl = urlParams.get('url') || null;
document.getElementById('blockedSite').textContent = blockedSite;

// Go back function
function goBack() {
  // Try to go back in history, or close the tab
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.close();
  }
}

// Attach to button
document.getElementById('backBtn').addEventListener('click', goBack);

// Listen for storage changes to auto-redirect when unblocked
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    // Check if blocking was disabled
    if (changes.isEnabled && !changes.isEnabled.newValue && originalUrl) {
      window.location.href = originalUrl;
      return;
    }

    // Check if this specific site was unblocked
    if (changes.blockedSites && originalUrl) {
      const newSites = changes.blockedSites.newValue || {};
      const wasBlocked = Object.keys(newSites).some(site => 
        blockedSite.includes(site) || site.includes(blockedSite)
      );
      if (!wasBlocked) {
        window.location.href = originalUrl;
      }
    }
  }
});

