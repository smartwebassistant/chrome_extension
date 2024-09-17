// Enhanced logging function for background.js

import {
  createContextMenu,
  handleContextMenuClick,
  updateAIReadSubmenus,
} from './scripts/contextMenu.js';

import {createLogger} from './scripts/logger.js';
const logger = createLogger ();

// Main Logic of background.js
logger.log ('Background script loaded...');

// Create context menu when the extension is installed or updated
chrome.runtime.onInstalled.addListener (details => {
  console.log ('Extension installed or updated. Reason:', details.reason);
  createContextMenuForCurrentTab ();
});

// Recreate context menu when Chrome starts
chrome.runtime.onStartup.addListener (() => {
  console.log ('Chrome started. Recreating context menu.');
  createContextMenuForCurrentTab ();
});

// Update context menu when the active tab changes
chrome.tabs.onActivated.addListener (activeInfo => {
  chrome.tabs.get (activeInfo.tabId, tab => {
    console.log ('Tab activated:', tab.url);
    createContextMenu (tab);
  });
});

// Update context menu when a tab is updated
chrome.tabs.onUpdated.addListener ((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log ('Tab updated:', tab.url);
    createContextMenu (tab);
  }
});

// Helper function to create context menu for the current tab
function createContextMenuForCurrentTab () {
  chrome.tabs.query ({active: true, currentWindow: true}, tabs => {
    if (tabs.length > 0) {
      createContextMenu (tabs[0]);
    }
  });
}

// Add listener for context menu clicks
chrome.contextMenus.onClicked.addListener (handleContextMenuClick);

// Add listener for storage changes to update the menu
chrome.storage.onChanged.addListener ((changes, namespace) => {
  if (namespace === 'local') {
    const relevantKeys = [
      'storedPrompt1',
      'storedPrompt2',
      'storedPrompt3',
      'storedPrompt4',
      'storedPrompt5',
      'lastCustomPrompt',
    ];
    const shouldUpdateMenu = relevantKeys.some (key => changes[key]);
    if (shouldUpdateMenu) {
      updateAIReadSubmenus ();
    }
  }
});

// Listen for messages from the content script
chrome.runtime.onMessage.addListener ((request, sender, sendResponse) => {
  if (request.action === 'chatCompletion') {
    logger.debug ('Chat completion request received from content.js', request);
    chrome.runtime.sendMessage ({
      action: 'handleChatCompletion',
      data: request,
    });
    logger.debug ('Chat completion request was sent to extension');
    return true;
  } else if (request.action === 'overwriteTextRequest') {
    logger.debug ('Overwrite text request received from content.js', request);
    chrome.runtime.sendMessage (
      {
        action: 'handleOverwriteTextRequest',
        data: request,
      },
      response => {
        logger.debug ('Overwrite response received from extension:', response);
        sendResponse (response);
        logger.debug ('Overwrite text response was sent to content.js');
      }
    );
    logger.debug ('Overwrite text response was sent to extension');
    return true;
  } else if (request.action === 'getStoredPrompts') {
    const keys = [
      'storedPrompt1',
      'storedPrompt2',
      'storedPrompt3',
      'storedPrompt4',
      'storedPrompt5',
    ];

    chrome.storage.local.get (keys, function (result) {
      if (chrome.runtime.lastError) {
        logger.error (
          'Error fetching stored prompts:',
          chrome.runtime.lastError
        );
        sendResponse ({prompts: []});
        return;
      }

      const storedPrompts = keys
        .map (key => result[key])
        .filter (prompt => prompt && prompt.trim () !== '');

      logger.debug ('Stored prompts:', storedPrompts);
      sendResponse ({prompts: storedPrompts});
    });

    return true; // Indicates that the response is sent asynchronously
  } else if (
    request.action === 'aiReadAction' ||
    request.action === 'aiWriteAction'
  ) {
    // Update listener for AI actions
    chrome.tabs.sendMessage (sender.tab.id, {
      action: request.action,
      prompt: request.prompt,
      selectedText: request.selectedText,
    });
    return true;
  }
});

// Listen for when the extension icon is clicked
chrome.action.onClicked.addListener (tab => {
  if (!tab.url.match (/^http/)) {
    return;
  } // Ignore non-http(s) pages

  chrome.scripting.executeScript (
    {
      target: {tabId: tab.id},
      files: ['content.js'],
    },
    () => {
      if (chrome.runtime.lastError) {
        logger.error ('Script injection failed:', chrome.runtime.lastError);
      } else {
        logger.log ('Content script injected successfully');
      }
    }
  );
});
