//ui.js begins here

import {handlePromptSubmission} from '../services/aiServices.js';
import {updateStatus, state} from '../scripts/utils.js';
import {extractWebpageText} from '../background/contentExtraction.js';
import {messageContentScript} from '../scripts/utils.js';
import {
  DEFAULT_LANGUAGE,
  ID_CONFIG_BUTTON,
  ID_CONFIG_POPUP,
  ID_MARKDOWN_CONTENT,
  ID_TOGGLE_SIDEBAR_BUTTON,
  ID_LANGUAGE_SELECT,
  ID_CUSTOM_PROMPT_INPUT,
  ID_SUBMIT_CUSTOM_PROMPT_BUTTON,
  ID_CONFIG_DROPDOWN,
  ID_STORED_PROMPT_BUTTON,
  SIDE_PANEL_HTML,
  STORAGE_KEY_LAST_CUSTOM_PROMPT,
  STORAGE_KEY_SELECTED_LANGUAGE,
  ID_MAGIC_CLICK_CHECKBOX,
  ID_INCLUDE_WEB_CONTENT_CHECKBOX,
  ID_STORED_PROMPT_INPUT,
  ID_ENABLE_CONTEXT_MENU_CHECKBOX,
  STORAGE_ENABLE_CONTEXT_MENU,
  ID_ENABLE_CONTEXT_MENU_SPAN,
} from '../scripts/constants.js';
import {createLogger} from '../scripts/logger.js';
import '../services/messageGateway.js';
import {
  createContextMenu,
  removeExistingMenuItems,
} from '../background/contextMenu.js';
const logger = createLogger ('ui.js');

// Function to initialize the configuration dropdown menu
async function initConfigDropdown () {
  logger.debug ('Initializing configuration dropdown menu');
  const configDropdown = document.getElementById (ID_CONFIG_DROPDOWN);
  const configButton = document.getElementById (ID_CONFIG_BUTTON);
  const markdownContent = document.getElementById (ID_MARKDOWN_CONTENT);

  // Create dropdown menu
  const dropdownMenu = document.createElement ('ul');
  dropdownMenu.className = 'dropdown-menu';

  // load dropdown items from config-menu.json
  const dropdownItems = await loadDropdownItems ();

  // Create and append dropdown items
  for (const item of dropdownItems) {
    logger.debug ('Processing loaded dropdown item:', item);
    const li = document.createElement ('li');
    const a = document.createElement ('a');
    a.className = 'dropdown-item';
    a.href = '#';
    a.id = item.id;
    a.textContent = item.text;
    a.addEventListener ('click', e => {
      e.preventDefault ();
      loadConfigPage (item);
      hideMarkdownContent ();
      dropdownMenu.style.display = 'none';
    });
    li.appendChild (a);
    dropdownMenu.appendChild (li);
  }
  logger.debug ('Dropdown items loaded:', dropdownMenu.innerHTML);

  // Append dropdown menu to the dropdown container
  configDropdown.appendChild (dropdownMenu);

  // Toggle dropdown on configButton click
  configButton.addEventListener ('click', e => {
    e.stopPropagation ();
    const isDisplayed = dropdownMenu.style.display === 'block';

    if (markdownContent.style.display === 'none') {
      showMarkdownContent ();
      hideConfigPopup ();
    } else {
      dropdownMenu.style.display = isDisplayed ? 'none' : 'block';

      if (!isDisplayed) {
        const buttonRect = configButton.getBoundingClientRect ();
        dropdownMenu.style.top = `${buttonRect.bottom}px`;
        dropdownMenu.style.right = '0px';
      }
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener ('click', e => {
    if (!configDropdown.contains (e.target)) {
      dropdownMenu.style.display = 'none';
    }
  });
}

function showMarkdownContent () {
  // Show the markdown content and hide the config popup
  const markdownContent = document.getElementById (ID_MARKDOWN_CONTENT);
  logger.debug ('show markdown content');
  markdownContent.style.display = 'block';
}

function hideMarkdownContent () {
  // Hide the markdown content and show the config popup
  const markdownContent = document.getElementById (ID_MARKDOWN_CONTENT);
  logger.debug ('hide markdown content');
  markdownContent.style.display = 'none';
}

function hideConfigPopup () {
  // Hide the config popup and show the markdown content
  const configPopupDiv = document.getElementById ('configPopupDiv');
  configPopupDiv.style.display = 'none';
}

// dynamitcally load dropdown items from config-menu.json
async function loadDropdownItems () {
  logger.debug ('Loading dropdown items');
  try {
    const response = await fetch ('config-menus/config-menu.json');
    logger.debug ('menu configs:', response);
    return await response.json ();
  } catch (error) {
    console.error ('Error loading dropdown items:', error);
    return [];
  }
}

// load the configuration html page based on the selected dropdown item
async function loadConfigPage (item) {
  try {
    if (!item.htmlFile || !item.jsFile || !item.handlerFunction) {
      throw new Error ('Invalid item properties');
    }
    // Load HTML content
    const htmlResponse = await fetch (`./config-menus/${item.htmlFile}`);
    const html = await htmlResponse.text ();

    // Insert HTML into configPopupDiv
    const configPopupDiv = document.getElementById (ID_CONFIG_POPUP);
    configPopupDiv.innerHTML = html;
    configPopupDiv.style.display = 'block';

    // Dynamically import JS module and call the handler function
    const file_path = `./config-menus/${item.jsFile}`;
    logger.debug ('Loading JS module:', file_path);
    const module = await import (file_path);
    if (typeof module[item.handlerFunction] === 'function') {
      module[item.handlerFunction] ();
    } else {
      console.error (
        `Handler function ${item.handlerFunction} not found in ${item.jsFile}`
      );
    }
  } catch (error) {
    console.error (`Error loading ${item.jsFile}:`, error);
  }
}

// main function to initialize the UI
export function initUI () {
  //1. Button to show or hide the configuration popup
  initConfigDropdown ();

  //2. button to toggle the sidebar, it won't show up in the sidepanel
  const toggleSidebarButton = document.getElementById (
    ID_TOGGLE_SIDEBAR_BUTTON
  );

  // hide it in an iframe
  if (window.self !== window.top) {
    // Hide the toggle sidebar button if in an iframe
    if (toggleSidebarButton) {
      toggleSidebarButton.style.display = 'none';
      logger.debug (
        'Toggle sidebar button hidden because it is inside an iframe.'
      );
    }
  }

  toggleSidebarButton.addEventListener ('click', async () => {
    // Query the current active tab in the last focused window
    const [tab] = await chrome.tabs.query ({active: true, currentWindow: true});
    const tabId = tab.id;
    console.log ('Tab ID:', tabId);
    try {
      // Set options for the side panel
      await chrome.sidePanel.setOptions ({
        tabId,
        path: SIDE_PANEL_HTML,
        enabled: true,
      });
      // Open the side panel for the active tab
      await chrome.sidePanel.open ({tabId});
      logger.info ('Side panel opened for tab:', tabId);
      chrome.runtime.connect ({name: 'sidepanel'});
      //window.close (); // Closes the popup after opening the side panel
      chrome.storage.local.set ({preferSidePanel: true});
    } catch (error) {
      logger.error ('Failed to open or configure the side panel:', error);
    }
  });

  // 3. shortcuts for stored prompt inputs
  const numberOfPrompts = 5; // This can be adjusted based on the actual number of prompts you have

  const storedPromptButtons = Array.from ({length: numberOfPrompts}, (_, i) =>
    document.getElementById (ID_STORED_PROMPT_BUTTON (i + 1))
  );
  logger.debug ('Stored prompt buttons:', storedPromptButtons);

  // Function to update button title
  function updateButtonTitle (button, value) {
    button.title = value ? value.slice (0, 100) : '';
  }
  const storedPromptInputs = Array.from ({length: numberOfPrompts}, (_, i) =>
    document.getElementById (ID_STORED_PROMPT_INPUT (i + 1))
  );
  logger.debug ('Stored prompt inputs:', storedPromptInputs);

  // const storedPromptStorages = Array.from ({length: numberOfPrompts}, (_, i) =>
  //   document.getElementById (ID_STORED_PROMPT_STORAGE (i + 1))
  // );
  // logger.debug ('Stored prompt storages:', storedPromptStorages);

  // 4. customized prompt input
  const customPromptInput = document.getElementById (ID_CUSTOM_PROMPT_INPUT);
  // Load the last used custom prompt from local storage
  const lastCustomPrompt = localStorage.getItem (
    STORAGE_KEY_LAST_CUSTOM_PROMPT
  );
  if (lastCustomPrompt) {
    // Checks if lastCustomPrompt is not null and not an empty string
    customPromptInput.value = lastCustomPrompt.trim ();
  }

  // 5. submit custom prompt button
  const submitCustomPromptButton = document.getElementById (
    ID_SUBMIT_CUSTOM_PROMPT_BUTTON
  );

  // 6. language select
  const languageSelect = document.getElementById (ID_LANGUAGE_SELECT);
  const defaultLanguage =
    localStorage.getItem (STORAGE_KEY_SELECTED_LANGUAGE) || DEFAULT_LANGUAGE;

  // Set the default selected language from local storage or default to English
  languageSelect.value = defaultLanguage;

  // Event listener to update local storage when the user changes the selection
  languageSelect.addEventListener ('change', function () {
    localStorage.setItem (STORAGE_KEY_SELECTED_LANGUAGE, this.value);
  });

  // 6.1 magic click checkbox
  // const magicClickCheckbox = document.getElementById (ID_MAGIC_CLICK_CHECKBOX);
  // //once the checkbox is enabled, send selectElement message to content.js
  // let wasDisabledByMagicClick = false;
  // magicClickCheckbox.addEventListener ('change', function () {
  //   const checked = this.checked;
  //   const includeWebContentCheckbox = document.getElementById (
  //     ID_INCLUDE_WEB_CONTENT_CHECKBOX
  //   );
  //   if (checked) {
  //     // disable the include web content checkbox
  //     wasDisabledByMagicClick = true;
  //     includeWebContentCheckbox.checked = false;

  //     chrome.tabs.query ({active: true, currentWindow: true}, function (tabs) {
  //       chrome.tabs.sendMessage (tabs[0].id, {action: 'selectElement'});
  //     });
  //   } else {
  //     if (wasDisabledByMagicClick) {
  //       // enable the include web content checkbox
  //       includeWebContentCheckbox.checked = true;
  //     }
  //     wasDisabledByMagicClick = false;
  //     chrome.tabs.query ({active: true, currentWindow: true}, function (tabs) {
  //       chrome.tabs.sendMessage (tabs[0].id, {action: 'stopSelectingElement'});
  //     });
  //   }
  // });

  // 6.2 enable context menu checkbox
  const enableContextMenuCheckbox = document.getElementById (
    ID_ENABLE_CONTEXT_MENU_CHECKBOX
  );
  // read from local storage and set the checkbox
  chrome.storage.local.get ([STORAGE_ENABLE_CONTEXT_MENU], result => {
    logger.debug (
      'enableContextMenuCheckbox:',
      result[STORAGE_ENABLE_CONTEXT_MENU]
    );
    const checked = result[STORAGE_ENABLE_CONTEXT_MENU];

    if (checked) {
      enableContextMenuCheckbox.checked = true;
    } else {
      // set default value
      enableContextMenuCheckbox.checked = false;
    }
  });
  const enableContextMenuSpan = document.getElementById (
    ID_ENABLE_CONTEXT_MENU_SPAN
  );
  enableContextMenuCheckbox.addEventListener ('change', function () {
    const checked = this.checked;
    chrome.storage.local.set ({[STORAGE_ENABLE_CONTEXT_MENU]: checked});
    enableContextMenuSpan.style.display = 'inline';
    setTimeout (() => {
      enableContextMenuSpan.style.display = 'none';
    }, 2000);
    if (checked) {
      // create context menu in the current tab
      chrome.tabs.query ({active: true, currentWindow: true}, tabs => {
        if (tabs.length > 0) {
          createContextMenu (tabs[0]);
          messageContentScript ({action: 'content.handleContextMenuClick'}); // add green rectangle when right click
        }
      });
    } else {
      removeExistingMenuItems ();
      messageContentScript ({action: 'content.removeContextMenuClick'}); // remove green rectangle when right click
    }
  });

  // 7. mark down content
  // I am using iframe to include popup.html in sidepanel.html to reuse the same code
  // in sidepanel,increase the height of the iframe to fit the content
  // Check if the current page is loaded within an iframe
  const markdownContent = document.getElementById (ID_MARKDOWN_CONTENT);
  if (window.self !== window.top) {
    // This code runs if the page is in an iframe
    if (markdownContent) {
      markdownContent.style.height = '460px'; // Adjust the height as needed
      logger.debug ('Adjusted markdownContent height for iframe usage.');
    }

    document.body.style.width = '100%'; // Adjust the width as needed
  }

  // 8. configuration settings

  function handlePromptSubmissionWithContext (prompt, language) {
    const includeWebContent = document.getElementById (
      ID_INCLUDE_WEB_CONTENT_CHECKBOX
    ).checked;

    if (includeWebContent) {
      logger.debug ('Including webpage context is enabled.');
      GetWebPageTextAsQueryContext ()
        .then (context => {
          if (!context || context === '') {
            logger.warn ("Didn't get webpage context which is unexpected.");
            updateStatus (
              'Unable to fetch webpage context. Continuing without it.'
            );
            context = null;
          } else {
            logger.debug ('Webpage context length: ' + context.length);
          }
          handlePromptSubmission (prompt, language, context);
        })
        .catch (error => {
          logger.error ('Error getting webpage context:', error);
          updateStatus (
            'Error getting webpage context. Continuing without it.'
          );
        });
    } else {
      handlePromptSubmission (prompt, language, null);
    }
  }

  storedPromptButtons.forEach ((button, index) => {
    button.addEventListener ('click', () => {
      logger.debug (`Stored prompt button ${index + 1} clicked:`, index);
      const selectedLanguage = languageSelect.value;
      const promptStorageKey = `storedPrompt${index + 1}`;

      chrome.storage.local.get (promptStorageKey, result => {
        const storedPrompt = result[promptStorageKey];
        if (storedPrompt && storedPrompt.trim () !== '') {
          logger.debug (`Stored prompt ${index + 1} is found:`, storedPrompt);
          customPromptInput.value = storedPrompt;
          logger.debug (
            `To submit stored prompt ${index + 1}: ${storedPrompt}`
          );
          logger.debug ('Selected language: ' + selectedLanguage);
          handlePromptSubmissionWithContext (storedPrompt, selectedLanguage);
        } else {
          logger.warn (`No stored prompt ${index + 1} is found.`);
          updateStatus (
            `No stored prompt ${index + 1} is found. Please save your prompt to stored prompt ${index + 1} in Settings.`
          );
        }
      });
    });
  });

  submitCustomPromptButton.addEventListener ('click', () => {
    const customPrompt = customPromptInput.value;
    const selectedLanguage = languageSelect.value;
    if (!customPrompt) {
      logger.warn ('No custom prompt is found.');
      updateStatus ('Please enter a custom prompt.');
      return;
    }

    localStorage.setItem (STORAGE_KEY_LAST_CUSTOM_PROMPT, customPrompt);
    logger.debug ('Custom prompt saved: ' + customPrompt);
    logger.debug ('To submit Custom prompt: ' + customPrompt);
    logger.debug ('Selected language: ' + selectedLanguage);
    handlePromptSubmissionWithContext (customPrompt, selectedLanguage);
  });

  function GetWebPageTextAsQueryContext () {
    return new Promise ((resolve, reject) => {
      chrome.tabs.query ({active: true, currentWindow: true}, function (tabs) {
        if (tabs[0] && tabs[0].id) {
          const timeoutId = setTimeout (() => {
            reject (new Error ('Timeout while extracting webpage text'));
          }, 5000); // 5 second timeout

          extractWebpageText (tabs[0].id, text => {
            clearTimeout (timeoutId);
            logger.debug ('Webpage text extracted:' + text.length);
            resolve (text);
          });
        } else {
          reject (new Error ('No active tab found'));
        }
      });
    });
  }
}

// ui.js ends here
