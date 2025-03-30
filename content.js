let lastClickedElement = null;
let isPickerActive = false;
let highlightedElement = null;
let highlightWrapper = null;

document.addEventListener("contextmenu", (event) => {
  lastClickedElement = event.target;
});

function highlightElement(element) {
  if (highlightedElement) {
    removeHighlight();
  }

  // Always create a wrapper div
  highlightWrapper = document.createElement('div');
  highlightWrapper.classList.add('element-picker-highlight-wrapper');
  
  // Insert wrapper before the element and move element inside it
  element.parentNode.insertBefore(highlightWrapper, element);
  highlightWrapper.appendChild(element);
  
  highlightedElement = highlightWrapper;
}

function removeHighlight() {
  if (highlightedElement && highlightWrapper) {
    // Move the wrapped element back to its original parent and remove wrapper
    const wrappedElement = highlightedElement.firstChild;
    if (wrappedElement && highlightWrapper.parentNode) {
      highlightWrapper.parentNode.insertBefore(wrappedElement, highlightWrapper);
      highlightWrapper.remove();
    }
    highlightWrapper = null;
    highlightedElement = null;
  }
}

function startPicker() {
  if (isPickerActive) return;
  
  isPickerActive = true;
  
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
  
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  
  lastClickedElement = e.target;
  const rect = highlightWrapper.getBoundingClientRect(); // Always use wrapper's rect
  
  browser.runtime.sendMessage({
    action: "triggerResize",
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  });
  
  stopPicker();
  
  return false;
};

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