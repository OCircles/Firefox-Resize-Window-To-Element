browser.contextMenus.create({
  id: "resize-to-element",
  title: "Resize To Element",
  contexts: ["all"]
});

const defaultSettings = {
  widthPadding: 50,
  heightPadding: 100,
  scrollbarWidth: 17,
  scrollbarHeight: 17,
  resizeBehavior: "current"
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
    browser.storage.local.get(defaultSettings).then((settings) => {
      const behavior = settings.resizeBehavior;
      
      // Check number of tabs in the current window
      browser.tabs.query({ windowId: sender.tab.windowId }).then((tabs) => {
        const isSingleTab = tabs.length === 1;
        
        if (behavior === "current" || isSingleTab) {
          // Resize current window
          getAdjustedSize(message.width, message.height).then((size) => {
            resizeWindow(size.width, size.height, sender.tab.id);
          });
        } else if (behavior === "new" || behavior === "move") {
          // Get current window dimensions
          browser.windows.getCurrent().then((currentWindow) => {
            const { width: currentWidth, height: currentHeight } = currentWindow;
            const originalTabId = sender.tab.id;
            
            // Create new window with same dimensions
            browser.windows.create({
              url: sender.tab.url,
              width: currentWidth,
              height: currentHeight,
              type: "normal"
            }).then((newWindow) => {
              const newTabId = newWindow.tabs[0].id;
              // Wait for the new tab to fully load
              browser.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (tabId === newTabId && changeInfo.status === "complete") {
                  browser.tabs.onUpdated.removeListener(listener);
                  // Send message to resize the new window
                  getAdjustedSize(message.width, message.height).then((size) => {
                    browser.windows.update(newWindow.id, {
                      width: size.width,
                      height: size.height
                    }).then(() => {
                      browser.tabs.sendMessage(newTabId, { action: "scrollToElement" });
                      // If "move" behavior, close the original tab
                      if (behavior === "move" && !isSingleTab) {
                        browser.tabs.remove(originalTabId);
                      }
                    });
                  });
                }
              });
            });
          });
        }
      });
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