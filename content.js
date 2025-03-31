let lastClickedElement = null;
let isPickerActive = false;
let highlightedElement = null;
let highlightWrapper = null;
let lastHoveredElement = null;
let debounceTimeout = null;

document.addEventListener("contextmenu", (event) => {
  lastClickedElement = event.target;
});

function highlightElement(element) {
  if (highlightedElement) {
    removeHighlight();
  }
  if (element === lastHoveredElement) return;

  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const isLarge = rect.height > viewportHeight || rect.width > viewportWidth;

  highlightWrapper = document.createElement('div');
  highlightWrapper.classList.add(isLarge ? 'element-picker-highlight-wrapper-large' : 'element-picker-highlight-wrapper');

  highlightWrapper.style.left = `${rect.left + window.scrollX}px`;
  highlightWrapper.style.top = `${rect.top + window.scrollY}px`;
  highlightWrapper.style.width = `${rect.width}px`;
  highlightWrapper.style.height = `${rect.height}px`;

  document.body.appendChild(highlightWrapper);

  highlightedElement = highlightWrapper;
  lastHoveredElement = element;

}

function removeHighlight() {
  if (highlightedElement && highlightWrapper) {
    highlightWrapper.remove();
    highlightWrapper = null;
    highlightedElement = null;
    lastHoveredElement = null;
  }
}

function startPicker() {
  if (isPickerActive) return;
  
  isPickerActive = true;
  
  document.addEventListener('mouseover', mouseOverHandler, { capture: true });
  document.addEventListener('mouseout', mouseOutHandler, { capture: true });
  document.addEventListener('click', clickHandler, { capture: true });
  document.addEventListener('mousedown', preventDefaultHandler, { capture: true });
  document.addEventListener('mouseup', preventDefaultHandler, { capture: true });
  document.addEventListener('mouseover', blockMouseOver, { capture: true });
}

function stopPicker() {
  isPickerActive = false;
  removeHighlight();
  document.removeEventListener('mouseover', mouseOverHandler, { capture: true });
  document.removeEventListener('mouseout', mouseOutHandler, { capture: true });
  document.removeEventListener('click', clickHandler, { capture: true });
  document.removeEventListener('mousedown', preventDefaultHandler, { capture: true });
  document.removeEventListener('mouseup', preventDefaultHandler, { capture: true });
  document.removeEventListener('mouseover', blockMouseOver, { capture: true });
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
    debounceTimeout = null;
  }
}

const debounce = (func, wait) => {
  return (e) => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => func(e), wait);
  };
};

const blockMouseOver = (e) => {
  if (!isPickerActive) return;
  e.stopPropagation();
};

const mouseOverHandler = debounce((e) => {
  if (!isPickerActive) return;
  e.stopPropagation();
  highlightElement(e.target);
}, 50);

const mouseOutHandler = debounce((e) => {
  if (!isPickerActive) return;
  e.stopPropagation();
  removeHighlight();
}, 50);

const preventDefaultHandler = (e) => {
  if (!isPickerActive) return;
  e.preventDefault();
  e.stopPropagation();
  return false;
};

const clickHandler = async (e) => {
  if (!isPickerActive) return;
  
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  
  lastClickedElement = e.target;
  const rect = lastClickedElement.getBoundingClientRect();

  // Get the true zoom level from background script
  const response = await browser.runtime.sendMessage({ action: "getZoom" });
  const zoom = response.zoom;

  // Adjust zoomed size to unzoomed
  const width = Math.round(rect.width * zoom);
  const height = Math.round(rect.height * zoom);

  browser.runtime.sendMessage({
    action: "triggerResize",
    width: width,
    height: height
  });

  stopPicker();
  
  return false;
};

browser.runtime.onMessage.addListener((message) => {
  if (message.action === "startPicker") {
    startPicker();
  } else if (message.action === "getElementSize" && lastClickedElement) {
    const rect = lastClickedElement.getBoundingClientRect();
    return browser.runtime.sendMessage({ action: "getZoom" }).then((response) => {
      const zoom = response.zoom;
      const width = Math.round(rect.width * zoom);
      const height = Math.round(rect.height * zoom);
      return { width: width, height: height };
    });
  } else if (message.action === "scrollToElement" && lastClickedElement) {
    lastClickedElement.scrollIntoView({
      behavior: "auto",
      block: "start",
      inline: "start"
    });
  }
});