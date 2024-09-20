// background.js
//

import {
  createContextMenu,
  handleContextMenuClick,
  updateAIReadSubmenus,
} from './contextMenu.js';

import {createLogger} from '../scripts/logger.js';
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

const PROMPT_KEYS = [
  'storedPrompt1',
  'storedPrompt2',
  'storedPrompt3',
  'storedPrompt4',
  'storedPrompt5',
];
const ALL_PROMPT_KEYS = [...PROMPT_KEYS, 'lastCustomPrompt'];
// Listener for storage changes to update the menu
chrome.storage.onChanged.addListener ((changes, namespace) => {
  if (namespace === 'local') {
    const shouldUpdateMenu = ALL_PROMPT_KEYS.some (key => changes[key]);
    if (shouldUpdateMenu) {
      updateAIReadSubmenus ();
    }
  }
});

const ACTIONS = {
  CHAT_COMPLETION: 'chatCompletionRequest',
  OVERWRITE_TEXT_REQUEST: 'overwriteTextRequest',
  GET_STORED_PROMPTS: 'getStoredPromptsRequest',
  AI_READ_ACTION: 'aiReadAction',
  AI_WRITE_ACTION: 'aiWriteAction',
  PERFORM_CHAT_COMPLETION: 'performChatCompletion',
  PERFORM_OVERWRITE_TEXT: 'performOverwriteText',
};

// Handler for chat completion requests
const handleChatCompletionRequest = (request, sender, sendResponse) => {
  logger.debug ('Chat completion request received:', request);
  chrome.runtime
    .sendMessage ({
      action: ACTIONS.PERFORM_CHAT_COMPLETION,
      data: request,
    })
    .then (result => {
      logger.debug ('Chat completion response received:', response);
      sendResponse ({result: result});
    });
  logger.debug ('Chat completion request forwarded to extension');
  return true;
};

// Handler for overwrite text requests
const handleOverwriteTextRequest = (request, sender, sendResponse) => {
  logger.debug ('Overwrite text request received:', request);
  chrome.runtime.sendMessage (
    {
      action: ACTIONS.PERFORM_OVERWRITE_TEXT,
      data: request,
    },
    response => {
      logger.debug ('Overwrite response received:', response);
      sendResponse (response);
    }
  );
  return true; // Indicates that the response is sent asynchronously
};

// Handler for fetching stored prompts
const handleGetStoredPromptsRequest = (request, sender, sendResponse) => {
  chrome.storage.local.get (PROMPT_KEYS, result => {
    if (chrome.runtime.lastError) {
      logger.error ('Error fetching stored prompts:', chrome.runtime.lastError);
      sendResponse ({prompts: []});
      return;
    }

    const storedPrompts = PROMPT_KEYS.map (key => result[key]).filter (
      prompt => prompt && prompt.trim () !== ''
    );

    logger.debug ('Stored prompts:', storedPrompts);
    sendResponse ({prompts: storedPrompts});
  });
};

// Handler for AI actions (read/write)
const handleAIAction = (request, sender, sendResponse) => {
  chrome.tabs.sendMessage (sender.tab.id, {
    action: request.action,
    prompt: request.prompt,
    selectedText: request.selectedText,
  });
  return true;
};

// Message handlers mapping
const actionHandlers = {
  [ACTIONS.CHAT_COMPLETION]: handleChatCompletionRequest,
  [ACTIONS.OVERWRITE_TEXT_REQUEST]: handleOverwriteTextRequest,
  [ACTIONS.GET_STORED_PROMPTS]: handleGetStoredPromptsRequest,
  [ACTIONS.AI_READ_ACTION]: handleAIAction,
  [ACTIONS.AI_WRITE_ACTION]: handleAIAction,
};

// Listener for messages from the content script
chrome.runtime.onMessage.addListener ((request, sender, sendResponse) => {
  const handler = actionHandlers[request.action];
  if (handler) {
    handler (request, sender, sendResponse);
    return true; // Indicates that the response is sent asynchronously
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
