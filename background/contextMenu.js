// contextMenu.js
import {createLogger} from '../scripts/logger.js';
import {STORAGE_KEYS} from '../scripts/constants.js';
const logger = createLogger ('contextMenu.js');

const MENU_IDS = {
  SMART_WEB_ASSISTANT: 'smartWebAssistant',
  AI_READ: 'aiRead',
  AI_WRITE: 'aiWrite',
  CUSTOM_PROMPT: 'customPrompt',
  SMART_AGENTS: 'smartAgents',
};

export function createContextMenu (tab) {
  logger.info ('Creating context menu for tab:', tab.url);

  if (isValidTab (tab)) {
    logger.warn ('Invalid tab for context menu creation:', tab.url);
    return;
  }

  removeExistingMenuItems ()
    .then (createTopLevelMenuItem)
    .then (createSubMenus)
    .catch (error => logger.error ('Error in context menu creation:', error));
}

function isValidTab (tab) {
  return tab && tab.url && !tab.url.startsWith ('http');
}

function createTopLevelMenuItem () {
  return new Promise ((resolve, reject) => {
    chrome.contextMenus.create (
      {
        id: MENU_IDS.SMART_WEB_ASSISTANT,
        title: 'Smart Web Assistant',
        contexts: ['all'],
      },
      () => {
        if (chrome.runtime.lastError) {
          logger.error (
            'Error creating Smart Web Assistant menu:',
            chrome.runtime.lastError
          );
          reject (chrome.runtime.lastError);
        } else {
          logger.info ('Smart Web Assistant menu created successfully');
          resolve ();
        }
      }
    );
  });
}

function removeExistingMenuItems () {
  return new Promise (resolve => {
    chrome.contextMenus.removeAll (() => {
      logger.debug ('Removed all existing context menu items');
      resolve ();
    });
  });
}

function createSubMenus () {
  createAIReadSubmenu ();
  //createAIWriteSubmenu ();
  createSmartAgentsSubmenu ();
}

function createAIReadSubmenu () {
  createSubmenu (
    MENU_IDS.AI_READ,
    'Stored Prompts',
    ['all'],
    updateAIReadSubmenus
  );
}

function createAIWriteSubmenu () {
  createSubmenu (MENU_IDS.AI_WRITE, 'Write Assistant', ['editable']);
}

function createSmartAgentsSubmenu () {
  createSubmenu (
    MENU_IDS.SMART_AGENTS,
    'Smart Agents',
    ['all'],
    updateSmartAgentsSubmenus
  );
}

function createSubmenu (id, title, contexts, callback) {
  chrome.contextMenus.create (
    {
      id: id,
      title: title,
      parentId: MENU_IDS.SMART_WEB_ASSISTANT,
      contexts: contexts,
    },
    () => {
      if (chrome.runtime.lastError) {
        logger.error (
          `Error creating ${title} submenu:`,
          chrome.runtime.lastError
        );
      } else {
        logger.info (`${title} submenu created successfully`);
        if (callback) callback ();
      }
    }
  );
}

export function updateAIReadSubmenus () {
  logger.info ('Updating AI Read sub-menus');

  chrome.storage.local.get (
    [...STORAGE_KEYS.STORED_PROMPTS, STORAGE_KEYS.LAST_CUSTOM_PROMPT],
    result => {
      let subMenuCount = createStoredPromptSubmenus (result);
      subMenuCount += createCustomPromptSubmenu (result);

      logger.info (`Total AI Read sub-menus created: ${subMenuCount}`);
      if (subMenuCount === 0) {
        logger.warn (
          'No AI Read sub-menus were created. Check stored prompts.'
        );
      }
    }
  );
}

function updateSmartAgentsSubmenus () {
  logger.info ('Updating Smart Agents sub-menus');

  chrome.storage.local.get (STORAGE_KEYS.AGENTS, result => {
    const agents = result[STORAGE_KEYS.AGENTS] || [];
    let subMenuCount = createAgentSubmenus (agents);

    logger.info (`Total Smart Agent sub-menus created: ${subMenuCount}`);
    if (subMenuCount === 0) {
      logger.warn (
        'No Smart Agent sub-menus were created. Check stored agents.'
      );
    }
  });
}

function createAgentSubmenus (agents) {
  return agents.reduce ((count, agent) => {
    if (agent && agent.id && agent.name) {
      createAgentSubmenu (agent.id, agent.name);
      return count + 1;
    }
    return count;
  }, 0);
}

function createAgentSubmenu (id, name) {
  chrome.contextMenus.create (
    {
      id: `${id}`,
      title: truncateText (name, 30),
      parentId: MENU_IDS.SMART_AGENTS,
      contexts: ['all'],
    },
    () => {
      if (chrome.runtime.lastError) {
        logger.error (
          `Error creating agent sub-menu ${id}:`,
          chrome.runtime.lastError
        );
      } else {
        logger.debug (`Agent sub-menu ${id} created successfully`);
      }
    }
  );
}

function createStoredPromptSubmenus (result) {
  return STORAGE_KEYS.STORED_PROMPTS.reduce ((count, key) => {
    if (result[key] && result[key].trim () !== '') {
      createPromptSubmenu (key, result[key]);
      return count + 1;
    }
    return count;
  }, 0);
}

function createCustomPromptSubmenu (result) {
  if (
    result[STORAGE_KEYS.LAST_CUSTOM_PROMPT] &&
    result[STORAGE_KEYS.LAST_CUSTOM_PROMPT].trim () !== ''
  ) {
    createPromptSubmenu (
      MENU_IDS.CUSTOM_PROMPT,
      result[STORAGE_KEYS.LAST_CUSTOM_PROMPT]
    );
    return 1;
  }
  return 0;
}

function createPromptSubmenu (id, prompt) {
  chrome.contextMenus.create (
    {
      id: id,
      title: truncateText (prompt, 30),
      parentId: MENU_IDS.AI_READ,
      contexts: ['all'],
    },
    () => {
      if (chrome.runtime.lastError) {
        logger.error (
          `Error creating sub-menu ${id}:`,
          chrome.runtime.lastError
        );
      } else {
        logger.debug (`Sub-menu ${id} created successfully`);
      }
    }
  );
}

export function handleContextMenuClick (info, tab) {
  logger.info ('Context menu item clicked:', info.menuItemId);

  if (
    info.menuItemId === MENU_IDS.AI_READ ||
    info.parentMenuItemId === MENU_IDS.AI_READ
  ) {
    handleAIReadAction (info.menuItemId, info.selectionText, tab.id);
  } else if (info.menuItemId === MENU_IDS.AI_WRITE) {
    handleAIWriteAction (tab.id);
  } else if (info.parentMenuItemId === MENU_IDS.SMART_AGENTS) {
    handleSmartAgentAction (info.menuItemId, tab.id);
  }
}

function handleAIReadAction (menuItemId, selectedText, tabId) {
  logger.debug ('Handling AI Read action', {menuItemId, tabId});

  chrome.tabs.sendMessage (
    tabId,
    {action: 'getContextForAIRead', selectedText: selectedText},
    response => {
      if (response && response.context) {
        getPromptAndSendMessage (menuItemId, response.context, tabId);
      } else {
        logger.warn ('No context received for AI Read action');
      }
    }
  );
}

function getPromptAndSendMessage (menuItemId, context, tabId) {
  chrome.storage.local.get (
    [menuItemId, STORAGE_KEYS.LAST_CUSTOM_PROMPT],
    result => {
      const prompt = menuItemId === MENU_IDS.CUSTOM_PROMPT
        ? result[STORAGE_KEYS.LAST_CUSTOM_PROMPT]
        : result[menuItemId] || 'Analyze the following text:';

      sendAIReadMessage (prompt, context, tabId);
    }
  );
}

function sendAIReadMessage (prompt, context, tabId) {
  chrome.tabs.sendMessage (tabId, {
    action: 'aiReadAction',
    prompt: prompt,
    context: context,
  });
  logger.debug ('Sent AI Read message to tab', {
    tabId,
    promptLength: prompt.length,
  });
}

function handleAIWriteAction (tabId) {
  logger.debug ('Handling AI Write action', {tabId});

  chrome.tabs.sendMessage (
    tabId,
    {action: 'getContextForAIWrite'},
    response => {
      if (response && response.context) {
        chrome.tabs.sendMessage (tabId, {
          action: 'aiWriteAction',
          context: response.context,
        });
        logger.debug ('Sent AI Write message to tab', {tabId});
      } else {
        logger.warn ('No context received for AI Write action');
      }
    }
  );
}

function handleSmartAgentAction (menuItemId, tabId) {
  logger.debug ('Handling Smart Agent action', {menuItemId, tabId});
  const agentId = menuItemId;
  logger.debug ('Handling Smart Agent action', {agentId, tabId});

  chrome.tabs.sendMessage (tabId, {
    action: 'content.executeAgent',
    agentId: agentId,
  });
  logger.debug ('Sent Execute Agent message to tab', {tabId, agentId});
}

function truncateText (text, maxLength) {
  return text.length > maxLength ? text.substr (0, maxLength) + '...' : text;
}
