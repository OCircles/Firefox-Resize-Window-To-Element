let lastClickedElement = null;
let isPickerActive = false;
let highlightedElement = null;

function highlightElement(element) {
  if (highlightedElement) {
    highlightedElement.classList.remove('element-picker-highlight');
  }
  element.classList.add('element-picker-highlight');
  highlightedElement = element;
}

function removeHighlight() {
  if (highlightedElement) {
    highlightedElement.classList.remove('element-picker-highlight');
    highlightedElement = null;
  }
}

function startPicker() {
  if (isPickerActive) return;
  
  isPickerActive = true;
  
  // Add event listeners with capture phase to intercept clicks early
  document.addEventListener('mouseover', mouseOverHandler);
  document.addEventListener('mouseout', mouseOutHandler);
  document.addEventListener('click', clickHandler, { capture: true });
  document.addEventListener('mousedown', preventDefaultHandler, { capture: true });
  document.addEventListener('mouseup', preventDefaultHandler, { capture: true });
}

function stopPicker() {
  isPickerActive = false;
  removeHighlight();
  document.removeEventListener('mouseover', mouseOverHandler);
  document.removeEventListener('mouseout', mouseOutHandler);
  document.removeEventListener('click', clickHandler, { capture: true });
  document.removeEventListener('mousedown', preventDefaultHandler, { capture: true });
  document.removeEventListener('mouseup', preventDefaultHandler, { capture: true });
}

const mouseOverHandler = (e) => {
  if (!isPickerActive) return;
  highlightElement(e.target);
};

const mouseOutHandler = (e) => {
  if (!isPickerActive) return;
  removeHighlight();
};

const preventDefaultHandler = (e) => {
  if (!isPickerActive) return;
  e.preventDefault();
  e.stopPropagation();
  return false;
};

const clickHandler = (e) => {
  if (!isPickerActive) return;
  
  // Prevent default behavior and stop propagation
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  
  lastClickedElement = e.target;
  const rect = lastClickedElement.getBoundingClientRect();
  
  // Send message to background script to trigger resize
  browser.runtime.sendMessage({
    action: "triggerResize",
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  });
  
  stopPicker();
  
  return false;
};

// Handle messages from background script
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "startPicker") {
    startPicker();
  } else if (message.action === "getElementSize" && lastClickedElement) {
    const rect = lastClickedElement.getBoundingClientRect();
    return Promise.resolve({
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    });
  } else if (message.action === "scrollToElement" && lastClickedElement) {
    lastClickedElement.scrollIntoView({
      behavior: "auto",
      block: "start",
      inline: "start"
    });
  }
});