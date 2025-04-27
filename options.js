// Default values
const defaultSettings = {
  widthPadding: 50,
  heightPadding: 100,
  scrollbarWidth: 17,
  scrollbarHeight: 17,
  resizeBehavior: "current"
};

// Load saved settings into form
function loadSettings() {
  browser.storage.local.get(defaultSettings).then((settings) => {
    document.getElementById('widthPadding').value = settings.widthPadding;
    document.getElementById('heightPadding').value = settings.heightPadding;
    document.getElementById('scrollbarWidth').value = settings.scrollbarWidth;
    document.getElementById('scrollbarHeight').value = settings.scrollbarHeight;
    document.getElementById('resizeBehavior').value = settings.resizeBehavior;
  });
}

// Save settings
document.getElementById('settings-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const settings = {
    widthPadding: parseInt(document.getElementById('widthPadding').value),
    heightPadding: parseInt(document.getElementById('heightPadding').value),
    scrollbarWidth: parseInt(document.getElementById('scrollbarWidth').value),
    scrollbarHeight: parseInt(document.getElementById('scrollbarHeight').value),
    resizeBehavior: document.getElementById('resizeBehavior').value
  };
  
  browser.storage.local.set(settings).then(() => {
    const status = document.getElementById('status');
    status.textContent = 'Settings saved!';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
});

// Reset to defaults
document.getElementById('reset').addEventListener('click', () => {
  browser.storage.local.set(defaultSettings).then(() => {
    loadSettings();
    const status = document.getElementById('status');
    status.textContent = 'Settings reset to defaults!';
    setTimeout(() => { status.textContent = ''; }, 2000);
  });
});

// Load settings when page opens
document.addEventListener('DOMContentLoaded', loadSettings);