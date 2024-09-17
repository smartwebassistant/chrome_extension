// contextMenu.js
import {createLogger} from '../scripts/logger.js';
const logger = createLogger ();

export function createContextMenu (tab) {
  logger.debug ('Creating context menu for tab:', tab);
  if (tab.url.startsWith ('chrome://extensions/')) {
    logger.log (
      'Not creating context menu for non-web page:',
      tab ? tab.url : 'undefined tab'
    );
    return;
  }

  logger.log ('Creating context menu for web page:', tab.url);
  // Remove existing menu items to avoid duplicates
  chrome.contextMenus.removeAll (() => {
    logger.debug ('Removed all existing context menu items');

    // Create the top-level menu item
    chrome.contextMenus.create (
      {
        id: 'smartWebAssistant',
        title: 'Smart Web Assistant',
        contexts: ['all'],
      },
      () => {
        if (chrome.runtime.lastError) {
          logger.error (
            'Error creating Smart Web Assistant menu:',
            chrome.runtime.lastError
          );
        } else {
          logger.log ('Smart Web Assistant menu created successfully');

          // Create AI Read submenu
          chrome.contextMenus.create (
            {
              id: 'aiRead',
              title: 'AI Read',
              parentId: 'smartWebAssistant',
              contexts: ['all'],
            },
            () => {
              if (chrome.runtime.lastError) {
                logger.error (
                  'Error creating AI Read submenu:',
                  chrome.runtime.lastError
                );
              } else {
                logger.log ('AI Read submenu created successfully');
                updateAIReadSubmenus ();
              }
            }
          );

          // Create AI Write submenu (only for editable contexts)
          chrome.contextMenus.create (
            {
              id: 'aiWrite',
              title: 'AI Write',
              parentId: 'smartWebAssistant',
              contexts: ['editable'],
            },
            () => {
              if (chrome.runtime.lastError) {
                logger.error (
                  'Error creating AI Write submenu:',
                  chrome.runtime.lastError
                );
              } else {
                logger.log ('AI Write submenu created successfully');
              }
            }
          );
        }
      }
    );
  });
}

export function updateAIReadSubmenus () {
  logger.log ('Updating AI Read sub-menus');

  // Fetch stored prompts and create sub-menus
  chrome.storage.local.get (
    [
      'storedPrompt1',
      'storedPrompt2',
      'storedPrompt3',
      'storedPrompt4',
      'storedPrompt5',
      'lastCustomPrompt',
    ],
    result => {
      let subMenuCount = 0;

      for (let i = 1; i <= 5; i++) {
        const promptKey = `storedPrompt${i}`;
        if (result[promptKey] && result[promptKey].trim () !== '') {
          chrome.contextMenus.create (
            {
              id: promptKey,
              title: truncateText (result[promptKey], 30),
              parentId: 'aiRead',
              contexts: ['all'],
            },
            () => {
              if (chrome.runtime.lastError) {
                logger.error (
                  `Error creating sub-menu ${promptKey}:`,
                  chrome.runtime.lastError
                );
              } else {
                logger.log (`Sub-menu ${promptKey} created successfully`);
                subMenuCount++;
              }
            }
          );
        }
      }

      // Add custom prompt if it exists
      if (result.lastCustomPrompt && result.lastCustomPrompt.trim () !== '') {
        chrome.contextMenus.create (
          {
            id: 'customPrompt',
            title: truncateText (result.lastCustomPrompt, 30),
            parentId: 'aiRead',
            contexts: ['all'],
          },
          () => {
            if (chrome.runtime.lastError) {
              logger.error (
                'Error creating custom prompt sub-menu:',
                chrome.runtime.lastError
              );
            } else {
              logger.log ('Custom prompt sub-menu created successfully');
              subMenuCount++;
            }
          }
        );
      }

      logger.log (`Total sub-menus created: ${subMenuCount}`);
      if (subMenuCount === 0) {
        logger.log (
          'No sub-menus were created. Check if there are any stored prompts.'
        );
      }
    }
  );
}

export function handleContextMenuClick (info, tab) {
  if (info.menuItemId === 'aiRead' || info.parentMenuItemId === 'aiRead') {
    handleAIReadAction (info.menuItemId, info.selectionText, tab.id);
  } else if (info.menuItemId === 'aiWrite') {
    handleAIWriteAction (tab.id);
  }
}

function handleAIReadAction (menuItemId, selectedText, tabId) {
  chrome.tabs.sendMessage (
    tabId,
    {action: 'getContextForAIRead', selectedText: selectedText},
    response => {
      if (response) {
        const context = response.context;

        chrome.storage.local.get ([menuItemId, 'lastCustomPrompt'], result => {
          const prompt = menuItemId === 'customPrompt'
            ? result.lastCustomPrompt
            : result[menuItemId] || 'Analyze the following text:';

          chrome.tabs.sendMessage (tabId, {
            action: 'aiReadAction',
            prompt: prompt,
            context: context,
          });
        });
      }
    }
  );
}

function handleAIWriteAction (tabId) {
  chrome.tabs.sendMessage (
    tabId,
    {action: 'getContextForAIWrite'},
    response => {
      if (response && response.context) {
        chrome.tabs.sendMessage (tabId, {
          action: 'aiWriteAction',
          context: response.context,
        });
      }
    }
  );
}

function truncateText (text, maxLength) {
  return text.length > maxLength ? text.substr (0, maxLength) + '...' : text;
}
