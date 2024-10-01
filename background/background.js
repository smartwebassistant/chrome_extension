// background.js
//

import {
  createContextMenu,
  handleContextMenuClick,
  updateAIReadSubmenus,
} from './contextMenu.js';
import {initializeExtension} from './initializeExtension.js';
import {createLogger} from '../scripts/logger.js';

const logger = createLogger ('background.js');

// Main Logic of background.js
logger.debug ('Background script loaded...');

// required for user clicking icon to open sidepanel
chrome.sidePanel
  .setPanelBehavior ({openPanelOnActionClick: true})
  .catch (error => logger.error (error));

// Create context menu when the extension is installed or updated
chrome.runtime.onInstalled.addListener (async details => {
  logger.debug ('Extension installed or updated. Reason:', details.reason);

  if (details.reason === 'install' || details.reason === 'update') {
    await initializeAgents ();
    await initializeExtension ();
  }
  createContextMenuForCurrentTab ();
});

async function initializeAgents () {
  logger.debug ('Initializing agents...');
  try {
    const response = await fetch (
      chrome.runtime.getURL ('background/init-agents.json')
    );
    const agents = await response.json ();
    logger.debug ('Agents loaded:', agents.length);

    chrome.storage.local.set ({agents: agents}, () => {
      logger.info ('Initial agents loaded into storage');
    });
  } catch (error) {
    logger.error ('Error initializing agents:', error);
  }
}

// Recreate context menu when Chrome starts
chrome.runtime.onStartup.addListener (() => {
  logger.info ('Chrome started. Recreating context menu.');
  createContextMenuForCurrentTab ();
});

// Update context menu when the active tab changes
chrome.tabs.onActivated.addListener (activeInfo => {
  chrome.tabs.get (activeInfo.tabId, tab => {
    logger.info ('Tab activated:', tab.url);
    createContextMenu (tab);
  });
});

// Update context menu when a tab is updated
chrome.tabs.onUpdated.addListener ((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    logger.info ('Tab updated:', tab.url);
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
  QUERY_AGENT: 'bg.queryAgent',
  EXECUTE_AGENT: 'bg.executeAgent',
};

const OUTBOUND_ACTIONS = {
  EXECUTE_AGENT: 'agentExecutor.executeAgent',
};

const executeAgent = (request, sender, sendResponse) => {
  logger.debug ('Execute agent request received:', request);
  const messageExtensionRequest = {
    action: OUTBOUND_ACTIONS.EXECUTE_AGENT,
    data: request.data,
  };
  logger.debug (
    'Forwarding agent execution request to extension:',
    messageExtensionRequest
  );
  chrome.runtime.sendMessage (messageExtensionRequest, response => {
    logger.debug ('Agent execution response received:', response);
    sendResponse (response);
  });
  return true;
};

const queryAgent = (request, sender, sendResponse) => {
  logger.debug ('Query agent request received:', request);

  // fetch the agents from storage
  chrome.storage.local.get ('agents', result => {
    if (chrome.runtime.lastError) {
      logger.error ('Error fetching agents:', chrome.runtime.lastError);
      sendResponse ({agents: []});
      return;
    }

    const agents = result.agents || [];
    logger.debug ('Agents:', agents);

    // find the agent by id
    const agent = agents.find (a => a.id === request.agentId);
    sendResponse ({agent: agent});
  });
  return true;
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
  [ACTIONS.QUERY_AGENT]: queryAgent,
  [ACTIONS.EXECUTE_AGENT]: executeAgent,
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

chrome.runtime.onConnect.addListener (function (port) {
  logger.debug ('Port connected:', port.name);
  if (port.name === 'sidepanel') {
    port.onDisconnect.addListener (async () => {
      logger.debug ('Sidepanel disconnected');
      closeAllSidepanels ();
      logger.info ('All Sidepanels closed');
    });
  }
});

// Function to close sidepanels for all tabs
function closeAllSidepanels () {
  // Query for all tabs
  chrome.tabs.query ({}, tabs => {
    tabs.forEach (tab => {
      // Attempt to close the sidepanel for each tab
      chrome.sidePanel
        .setOptions ({enabled: false, tabId: tab.id})
        .catch (error => {
          // If there's an error (e.g., sidepanel wasn't open), log it but continue
          logger.error (`Error closing sidepanel for tab ${tab.id}:`, error);
        });
      logger.debug (`Sidepanel closed for tab ${tab.id}`);
    });
  });
}
