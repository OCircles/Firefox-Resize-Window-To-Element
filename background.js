browser.contextMenus.create({
  id: "resize-to-element",
  title: "Resize To Element",
  contexts: ["all"]
});

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
    return { width: Math.round(adjustedWidth), height: Math.round(adjustedHeight) };
  });
}

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "resize-to-element") {
    browser.tabs.sendMessage(tab.id, { action: "startPicker" });
  }
});

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.action === "triggerResize" && message.width && message.height) {
    getAdjustedSize(message.width, message.height).then((size) => {
      resizeWindow(size.width, size.height, sender.tab.id);
    });
  } else if (message.action === "getZoom") {
    return browser.tabs.getZoom(sender.tab.id).then((zoom) => {
      return { zoom: zoom };
    });
  }
});

browser.browserAction.onClicked.addListener((tab) => {
  browser.tabs.sendMessage(tab.id, { action: "startPicker" });
});

browser.tabs.onActivated.addListener((activeInfo) => {
  browser.browserAction.enable(activeInfo.tabId);
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    browser.browserAction.enable(tabId);
  }
});