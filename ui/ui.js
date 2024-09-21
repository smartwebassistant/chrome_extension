//ui.js begins here

import {handlePromptSubmission} from '../services/aiServices.js';
import {updateStatus} from '../scripts/utils.js';
import {extractWebpageText} from '../background/contentExtraction.js';
import {
  DEFAULT_LANGUAGE,
  ID_CONFIG_BUTTON,
  ID_CONFIG_POPUP,
  ID_MARKDOWN_CONTENT,
  ID_TOGGLE_SIDEBAR_BUTTON,
  ID_LANGUAGE_SELECT,
  ID_CUSTOM_PROMPT_INPUT,
  ID_API_URL_INPUT,
  ID_API_TOKEN_INPUT,
  ID_MODEL_NAME_INPUT,
  ID_MAX_TOKEN_INPUT,
  ID_TEMPERATURE_INPUT,
  ID_TOP_P_INPUT,
  ID_SUBMIT_CUSTOM_PROMPT_BUTTON,
  ID_CONFIG_DROPDOWN,
  ID_STORED_PROMPT_BUTTON,
  SIDE_PANEL_HTML,
  STORAGE_KEY_LAST_CUSTOM_PROMPT,
  STORAGE_KEY_SELECTED_LANGUAGE,
  ID_MAGIC_CLICK_CHECKBOX,
  ID_INCLUDE_WEB_CONTENT_CHECKBOX,
  ID_STORED_PROMPT_INPUT,
} from '../scripts/constants.js';
import {createLogger} from '../scripts/logger.js';

const logger = createLogger ();

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
    dropdownMenu.style.display = isDisplayed ? 'none' : 'block';

    if (markdownContent.style.display === 'none') {
      showMarkdownContent ();
      hideConfigPopup ();
    }

    if (!isDisplayed) {
      const buttonRect = configButton.getBoundingClientRect ();
      dropdownMenu.style.top = `${buttonRect.bottom}px`;
      dropdownMenu.style.right = '0px';
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
      // Open the side panel for the active tab
      await chrome.sidePanel.open ({tabId});
      // Set options for the side panel
      await chrome.sidePanel.setOptions ({
        tabId,
        path: SIDE_PANEL_HTML,
        enabled: true,
      });
      window.close (); // Closes the popup after opening the side panel
      chrome.storage.local.set ({preferSidePanel: true});
    } catch (error) {
      console.error ('Failed to open or configure the side panel:', error);
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
  const magicClickCheckbox = document.getElementById (ID_MAGIC_CLICK_CHECKBOX);
  //once the checkbox is enabled, send selectElement message to content.js
  let wasDisabledByMagicClick = false;
  magicClickCheckbox.addEventListener ('change', function () {
    const checked = this.checked;
    const includeWebContentCheckbox = document.getElementById (
      ID_INCLUDE_WEB_CONTENT_CHECKBOX
    );
    if (checked) {
      // disable the include web content checkbox
      wasDisabledByMagicClick = true;
      includeWebContentCheckbox.checked = false;

      chrome.tabs.query ({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage (tabs[0].id, {action: 'selectElement'});
      });
    } else {
      if (wasDisabledByMagicClick) {
        // enable the include web content checkbox
        includeWebContentCheckbox.checked = true;
      }
      wasDisabledByMagicClick = false;
      chrome.tabs.query ({active: true, currentWindow: true}, function (tabs) {
        chrome.tabs.sendMessage (tabs[0].id, {action: 'stopSelectingElement'});
      });
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

  const apiUrlInput = document.getElementById (ID_API_URL_INPUT);
  const apiTokenInput = document.getElementById (ID_API_TOKEN_INPUT);
  const modelNameInput = document.getElementById (ID_MODEL_NAME_INPUT);
  const maxTokenInput = document.getElementById (ID_MAX_TOKEN_INPUT);
  const temperatureInput = document.getElementById (ID_TEMPERATURE_INPUT);
  const topPInput = document.getElementById (ID_TOP_P_INPUT);

  // Helper function to mask the API key for display
  // function maskApiKey (apiKey) {
  //   if (typeof apiKey !== 'string' || !apiKey) {
  //     return 'None'; // Return empty if no key is provided or if it's not a string
  //   }

  //   const keyLength = apiKey.length;

  //   if (keyLength === 1) {
  //     // Return the single character unmasked
  //     return apiKey;
  //   } else if (keyLength === 2 || keyLength === 3) {
  //     // Mask the first character and show the second
  //     return '*' + apiKey.slice (1);
  //   } else {
  //     // For keys with more than 3 characters, mask all but the last 3 characters
  //     const numAsterisks = Math.min (6, keyLength - 3);
  //     return '*'.repeat (numAsterisks) + apiKey.slice (-3);
  //   }
  // }

  // const saveApiUrlButton = document.getElementById (ID_SAVE_API_URL_BUTTON);
  // const testConnectionButton = document.getElementById (
  //   ID_TEST_CONNECTION_BUTTON
  // );
  // // Save configuration settings
  // saveApiUrlButton.addEventListener ('click', () => {
  //   // Check if required fields are not empty
  //   if (
  //     !apiUrlInput.value.trim () ||
  //     !maxTokenInput.value.trim () ||
  //     !temperatureInput.value.trim () ||
  //     !topPInput.value.trim ()
  //   ) {
  //     updateStatus ('Please fill in all required * fields.');
  //     return;
  //   }
  //   if (!isValidUrl (apiUrlInput.value)) {
  //     updateStatus ('Please enter a valid API URL.');
  //     return;
  //   }

  //   // Ensure that numeric inputs are not only positive but also within expected ranges
  //   const maxTokens = parseInt (maxTokenInput.value, 10);
  //   const temperature = parseFloat (temperatureInput.value);
  //   const topP = parseFloat (topPInput.value);

  //   if (isNaN (maxTokens) || maxTokens <= 0) {
  //     updateStatus ('Max tokens must be a positive number.');
  //     return;
  //   }

  //   if (isNaN (temperature) || temperature < 0 || temperature > 1) {
  //     updateStatus ('Temperature must be a number between 0 and 1.');
  //     return;
  //   }

  //   if (isNaN (topP) || topP < 0 || topP > 1) {
  //     updateStatus ('Top P must be a number between 0 and 1.');
  //     return;
  //   }
  //   chrome.storage.local.set (
  //     {
  //       [STORAGE_API_URL]: apiUrlInput.value,
  //       [STORAGE_API_TOKEN]: apiTokenInput.value,
  //       [STORAGE_MODEL_NAME]: modelNameInput.value,
  //       [STORAGE_MAX_TOKEN]: maxTokenInput.value,
  //       [STORAGE_TEMPERATURE]: temperatureInput.value,
  //       [STORAGE_TOP_P]: topPInput.value,
  //       storedPrompt1: storedPrompt1Input.value,
  //       storedPrompt2: storedPrompt2Input.value,
  //       storedPrompt3: storedPrompt3Input.value,
  //       storedPrompt4: storedPrompt4Input.value,
  //       storedPrompt5: storedPrompt5Input.value,
  //     },
  //     () => {
  //       document.getElementById (
  //         ID_API_URL_STORAGE_SPAN
  //       ).textContent = `(Stored: ${apiUrlInput.value})`;

  //       // Extract and conditionally format the apiToken for display
  //       if (apiTokenInput.value.trim ()) {
  //         // Check if the input is effectively non-empty after trimming
  //         // If not empty, format with first 4 chars '***' and the last 4 chars
  //         document.getElementById (
  //           ID_API_TOKEN_STORAGE_SPAN
  //         ).textContent = `(Stored: ${maskApiKey (apiTokenInput.value)})`;
  //       } else {
  //         // If empty, set display to indicate no stored token
  //         document.getElementById (
  //           ID_API_TOKEN_STORAGE_SPAN
  //         ).textContent = `(Stored: None)`;
  //       }

  //       document.getElementById (
  //         ID_MODEL_NAME_STORAGE_SPAN
  //       ).textContent = `(Stored: ${modelNameInput.value})`;

  //       document.getElementById (
  //         ID_MAX_TOKEN_STORAGE_SPAN
  //       ).textContent = `(Stored: ${maxTokenInput.value})`;

  //       document.getElementById (
  //         ID_TEMPERATURE_STORAGE_SPAN
  //       ).textContent = `(Stored: ${temperatureInput.value})`;

  //       document.getElementById (
  //         ID_TOP_P_STORAGE_SPAN
  //       ).textContent = `(Stored: ${topPInput.value})`;

  //       // Loop through stored prompts to update both storage text and button title
  //       storedPromptInputs.forEach ((input, index) => {
  //         // Check if input value exists and handle appropriately
  //         const inputValue = input.value || ''; // Ensure it defaults to an empty string if undefined

  //         // Update storage text if corresponding storage element exists
  //         if (index < storedPromptStorages.length) {
  //           const displayText = inputValue ? inputValue.slice (0, 20) : 'None';
  //           storedPromptStorages[
  //             index
  //           ].textContent = `(Stored: ${displayText})`;
  //         }

  //         // Update button title if corresponding button exists
  //         if (index < storedPromptButtons.length) {
  //           const titleText = inputValue ? inputValue.slice (0, 100) : '';
  //           storedPromptButtons[index].title = titleText;
  //         }
  //       });

  //       //configPopup.style.display = 'none'; // Optionally hide the popup after saving
  //       updateStatus ('Settings saved successfully.');
  //     }
  //   );
  // });

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

  // testConnectionButton.addEventListener ('click', () => {
  //   const apiUrl = apiUrlInput.value;
  //   const apiToken = apiTokenInput.value;
  //   if (!isValidUrl (apiUrl)) {
  //     updateStatus ('Please enter a valid API URL.');
  //     return;
  //   }
  //   testApiConnection (apiUrl, apiToken);
  // });
}

// ui.js ends here
