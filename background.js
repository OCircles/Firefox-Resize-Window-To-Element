browser.contextMenus.create({
  id: "element-picker",
  title: "Resize To Element",
  contexts: ["all"]
});

// Default settings
const defaultSettings = {
  widthPadding: 50,
  heightPadding: 100,
  scrollbarWidth: 17,
  scrollbarHeight: 17
};

function resizeWindow(width, height, tabId) {
  browser.windows.getCurrent().then((windowInfo) => {
    browser.windows.update(windowInfo.id, {
      width: width,
      height: height
    }).then(() => {
      browser.tabs.sendMessage(tabId, { action: "scrollToElement" });
    });
  });
}

function getAdjustedSize(width, height) {
  return browser.storage.local.get(defaultSettings).then((settings) => {
    const adjustedWidth = width + settings.widthPadding - settings.scrollbarWidth;
    const adjustedHeight = height + settings.heightPadding + settings.scrollbarHeight * 2;
    return { width: adjustedWidth, height: adjustedHeight };
  });
}

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "resize-window") {
    browser.tabs.sendMessage(tab.id, { action: "getElementSize" }).then((response) => {
      if (response && response.width && response.height) {
        getAdjustedSize(response.width, response.height).then((size) => {
          resizeWindow(size.width, size.height, tab.id);
        });
      } else {
        console.error("Could not get element size");
      }
    }).catch((error) => {
      console.error("Error getting element size:", error);
    });
  } else if (info.menuItemId === "element-picker") {
    browser.tabs.sendMessage(tab.id, { action: "startPicker" });
  }
});

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "triggerResize" && message.width && message.height) {
    getAdjustedSize(message.width, message.height).then((size) => {
      resizeWindow(size.width, size.height, sender.tab.id);
    });
  }
});