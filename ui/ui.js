//ui.js

import {testApiConnection} from '../scripts/api.js';
import {isValidUrl} from '../scripts/utils.js';
import {handlePromptSubmission} from '../services/aiServices.js';
import {updateStatus} from '../scripts/utils.js';
import {extractWebpageText} from '../background/contentExtraction.js';
import {
  DEFAULT_API_URL,
  DEFAULT_MODEL_NAME,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  DEFAULT_TOP_P,
  STORAGE_API_URL,
  STORAGE_API_TOKEN,
  STORAGE_MODEL_NAME,
  STORAGE_MAX_TOKEN,
  STORAGE_TEMPERATURE,
  STORAGE_TOP_P,
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
  ID_SAVE_API_URL_BUTTON,
  ID_TEST_CONNECTION_BUTTON,
  ID_STORED_PROMPT_INPUT,
  ID_STORED_PROMPT_BUTTON,
  ID_STORED_PROMPT_STORAGE,
  SIDE_PANEL_HTML,
  STORAGE_KEY_LAST_CUSTOM_PROMPT,
  STORAGE_KEY_SELECTED_LANGUAGE,
  STORAGE_STORED_PROMPT_PREFIX,
  STORAGE_DISABLE_SYSTEM_ROLE,
  ID_API_URL_STORAGE_SPAN,
  ID_API_TOKEN_STORAGE_SPAN,
  ID_MODEL_NAME_STORAGE_SPAN,
  ID_MAX_TOKEN_STORAGE_SPAN,
  ID_TEMPERATURE_STORAGE_SPAN,
  ID_TOP_P_STORAGE_SPAN,
  ID_MAGIC_CLICK_CHECKBOX,
  ID_INCLUDE_WEB_CONTENT_CHECKBOX,
  ID_DISABLE_SYSTEM_ROLE_CHECKBOX,
  ID_DISABLE_SYSTEM_ROLE_SPAN,
} from '../scripts/constants.js';
import {createLogger} from '../scripts/logger.js';

const logger = createLogger ();

export function initUI () {
  //1. Button to show or hide the configuration popup
  const configButton = document.getElementById (ID_CONFIG_BUTTON);
  const configPopup = document.getElementById (ID_CONFIG_POPUP);
  // Show or hide the configuration popup, when config pop is shown, markdown content is hidden

  function showConfigPopup () {
    // Show the config popup and hide the markdown content
    logger.debug ('show config popup');
    configPopup.style.display = 'block';
    markdownContent.style.display = 'none';
  }

  function hideConfigPopup () {
    // Hide the config popup and show the markdown content
    logger.debug ('hide config popup');
    configPopup.style.display = 'none';
    markdownContent.style.display = 'block';
  }
  configButton.addEventListener ('click', () => {
    if (configPopup.style.display === 'block') {
      hideConfigPopup ();
    } else {
      showConfigPopup ();
    }
  });

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

  const storedPromptInputs = Array.from ({length: numberOfPrompts}, (_, i) =>
    document.getElementById (ID_STORED_PROMPT_INPUT (i + 1))
  );
  logger.debug ('Stored prompt inputs:', storedPromptInputs);

  const storedPromptStorages = Array.from ({length: numberOfPrompts}, (_, i) =>
    document.getElementById (ID_STORED_PROMPT_STORAGE (i + 1))
  );
  logger.debug ('Stored prompt storages:', storedPromptStorages);

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
  const markdownContent = document.getElementById (ID_MARKDOWN_CONTENT);
  // I am using iframe to include popup.html in sidepanel.html to reuse the same code
  // in sidepanel,increase the height of the iframe to fit the content
  // Check if the current page is loaded within an iframe
  if (window.self !== window.top) {
    // This code runs if the page is in an iframe
    if (markdownContent) {
      markdownContent.style.height = '460px'; // Adjust the height as needed
      logger.debug ('Adjusted markdownContent height for iframe usage.');
    }

    document.body.style.width = '100%'; // Adjust the width as needed
  }

  // 8. configuration settings
  const disableSystemPromptCheckbox = document.getElementById (
    ID_DISABLE_SYSTEM_ROLE_CHECKBOX
  );
  // store the disableSystemPromptCheckbox status in local storage when it is changed
  disableSystemPromptCheckbox.addEventListener ('change', function () {
    chrome.storage.local.set ({
      [STORAGE_DISABLE_SYSTEM_ROLE]: this.checked,
    });
    const disableSystemRoleSpan = document.getElementById (
      ID_DISABLE_SYSTEM_ROLE_SPAN
    );
    disableSystemRoleSpan.style.display = 'block';
    // Hide the status message after 2 seconds
    setTimeout (() => {
      disableSystemRoleSpan.style.display = 'none';
    }, 2000);
    logger.debug ('disableSystemPromptCheckbox status saved to local storage.');
  });

  const apiUrlInput = document.getElementById (ID_API_URL_INPUT);
  const apiTokenInput = document.getElementById (ID_API_TOKEN_INPUT);
  const modelNameInput = document.getElementById (ID_MODEL_NAME_INPUT);
  const maxTokenInput = document.getElementById (ID_MAX_TOKEN_INPUT);
  const temperatureInput = document.getElementById (ID_TEMPERATURE_INPUT);
  const topPInput = document.getElementById (ID_TOP_P_INPUT);

  // Helper function to mask the API key for display
  function maskApiKey (apiKey) {
    if (typeof apiKey !== 'string' || !apiKey) {
      return 'None'; // Return empty if no key is provided or if it's not a string
    }

    const keyLength = apiKey.length;

    if (keyLength === 1) {
      // Return the single character unmasked
      return apiKey;
    } else if (keyLength === 2 || keyLength === 3) {
      // Mask the first character and show the second
      return '*' + apiKey.slice (1);
    } else {
      // For keys with more than 3 characters, mask all but the last 3 characters
      const numAsterisks = Math.min (6, keyLength - 3);
      return '*'.repeat (numAsterisks) + apiKey.slice (-3);
    }
  }

  // Load settings from local storage
  chrome.storage.local.get (
    [
      STORAGE_API_URL,
      STORAGE_API_TOKEN,
      STORAGE_MODEL_NAME,
      STORAGE_MAX_TOKEN,
      STORAGE_TEMPERATURE,
      STORAGE_TOP_P,
      STORAGE_DISABLE_SYSTEM_ROLE,
      ...Array.from (
        {length: 5},
        (_, i) => `${STORAGE_STORED_PROMPT_PREFIX}${i + 1}`
      ),
    ],
    function (result) {
      // load disableSystemPromptCheckbox status from local storage
      logger.debug (
        'disableSystemPromptCheckbox storage value:' +
          result[STORAGE_DISABLE_SYSTEM_ROLE]
      );
      disableSystemPromptCheckbox.checked =
        result[STORAGE_DISABLE_SYSTEM_ROLE] || false;

      // console.log('Value currently is ' + result.apiUrl);
      logger.debug ('apiUrl storage value:' + result[STORAGE_API_URL]);
      apiUrlInput.value = result[STORAGE_API_URL] || DEFAULT_API_URL;
      document.getElementById (
        ID_API_URL_STORAGE_SPAN
      ).textContent = `(Stored: ${result[STORAGE_API_URL] || 'None'})`;

      // masked token display, example ****123
      logger.debug ('apiToken storage value:' + result[STORAGE_API_TOKEN]);
      let tokenDisplay = result[STORAGE_API_TOKEN]
        ? maskApiKey (result[STORAGE_API_TOKEN])
        : 'None';
      apiTokenInput.value = result[STORAGE_API_TOKEN];
      document.getElementById (
        ID_API_TOKEN_STORAGE_SPAN
      ).textContent = `(Masked Token: ${tokenDisplay})`;

      // Set the model name, max tokens, temperature, and top P from local storage
      logger.debug ('modelName storage value:' + result[STORAGE_MODEL_NAME]);
      modelNameInput.value = result[STORAGE_MODEL_NAME] || DEFAULT_MODEL_NAME;
      document.getElementById (
        ID_MODEL_NAME_STORAGE_SPAN
      ).textContent = `(Stored: ${result[STORAGE_MODEL_NAME] || 'None'})`;

      logger.debug ('maxToken storage value:' + result[STORAGE_MAX_TOKEN]);
      maxTokenInput.value = result[STORAGE_MAX_TOKEN] || DEFAULT_MAX_TOKENS;
      document.getElementById (
        ID_MAX_TOKEN_STORAGE_SPAN
      ).textContent = `(Stored: ${result[STORAGE_MAX_TOKEN] || 'None'})`;

      logger.debug ('temperature storage value:' + result[STORAGE_TEMPERATURE]);
      temperatureInput.value =
        result[STORAGE_TEMPERATURE] || DEFAULT_TEMPERATURE;
      document.getElementById (
        ID_TEMPERATURE_STORAGE_SPAN
      ).textContent = `(Stored: ${result[STORAGE_TEMPERATURE] || 'None'})`;

      logger.debug ('topP storage value:' + result[STORAGE_TOP_P]);
      topPInput.value = result[STORAGE_TOP_P] || DEFAULT_TOP_P;
      document.getElementById (
        ID_TOP_P_STORAGE_SPAN
      ).textContent = `(Stored: ${result[STORAGE_TOP_P] || 'None'})`;

      // Load stored prompts from local storage in a loop
      storedPromptInputs.forEach ((input, index) => {
        // Safely get the stored prompt value with a fallback to an empty string if undefined
        const promptKey = `${STORAGE_STORED_PROMPT_PREFIX}${index + 1}`;
        const promptValue = result[promptKey] || '';
        logger.debug (`${promptKey} storage value: ${promptValue}`);

        // Set the input value
        input.value = promptValue;

        // Safely slice the prompt for display, defaulting to 'None' if empty
        const displayText = promptValue ? promptValue.slice (0, 20) : 'None';
        document.getElementById (
          `${promptKey}Storage`
        ).textContent = `(Stored: ${displayText})`;

        // Update the button title with the first 100 characters of the prompt, or empty if not available
        const titleText = promptValue ? promptValue.slice (0, 100) : '';
        storedPromptButtons[index].title = titleText;
      });

      updateStatus ('Ready.');
    }
  );

  const saveApiUrlButton = document.getElementById (ID_SAVE_API_URL_BUTTON);
  const testConnectionButton = document.getElementById (
    ID_TEST_CONNECTION_BUTTON
  );
  // Save configuration settings
  saveApiUrlButton.addEventListener ('click', () => {
    // Check if required fields are not empty
    if (
      !apiUrlInput.value.trim () ||
      !maxTokenInput.value.trim () ||
      !temperatureInput.value.trim () ||
      !topPInput.value.trim ()
    ) {
      updateStatus ('Please fill in all required * fields.');
      return;
    }
    if (!isValidUrl (apiUrlInput.value)) {
      updateStatus ('Please enter a valid API URL.');
      return;
    }

    // Ensure that numeric inputs are not only positive but also within expected ranges
    const maxTokens = parseInt (maxTokenInput.value, 10);
    const temperature = parseFloat (temperatureInput.value);
    const topP = parseFloat (topPInput.value);

    if (isNaN (maxTokens) || maxTokens <= 0) {
      updateStatus ('Max tokens must be a positive number.');
      return;
    }

    if (isNaN (temperature) || temperature < 0 || temperature > 1) {
      updateStatus ('Temperature must be a number between 0 and 1.');
      return;
    }

    if (isNaN (topP) || topP < 0 || topP > 1) {
      updateStatus ('Top P must be a number between 0 and 1.');
      return;
    }
    chrome.storage.local.set (
      {
        [STORAGE_API_URL]: apiUrlInput.value,
        [STORAGE_API_TOKEN]: apiTokenInput.value,
        [STORAGE_MODEL_NAME]: modelNameInput.value,
        [STORAGE_MAX_TOKEN]: maxTokenInput.value,
        [STORAGE_TEMPERATURE]: temperatureInput.value,
        [STORAGE_TOP_P]: topPInput.value,
        storedPrompt1: storedPrompt1Input.value,
        storedPrompt2: storedPrompt2Input.value,
        storedPrompt3: storedPrompt3Input.value,
        storedPrompt4: storedPrompt4Input.value,
        storedPrompt5: storedPrompt5Input.value,
      },
      () => {
        document.getElementById (
          ID_API_URL_STORAGE_SPAN
        ).textContent = `(Stored: ${apiUrlInput.value})`;

        // Extract and conditionally format the apiToken for display
        if (apiTokenInput.value.trim ()) {
          // Check if the input is effectively non-empty after trimming
          // If not empty, format with first 4 chars '***' and the last 4 chars
          document.getElementById (
            ID_API_TOKEN_STORAGE_SPAN
          ).textContent = `(Stored: ${maskApiKey (apiTokenInput.value)})`;
        } else {
          // If empty, set display to indicate no stored token
          document.getElementById (
            ID_API_TOKEN_STORAGE_SPAN
          ).textContent = `(Stored: None)`;
        }

        document.getElementById (
          ID_MODEL_NAME_STORAGE_SPAN
        ).textContent = `(Stored: ${modelNameInput.value})`;

        document.getElementById (
          ID_MAX_TOKEN_STORAGE_SPAN
        ).textContent = `(Stored: ${maxTokenInput.value})`;

        document.getElementById (
          ID_TEMPERATURE_STORAGE_SPAN
        ).textContent = `(Stored: ${temperatureInput.value})`;

        document.getElementById (
          ID_TOP_P_STORAGE_SPAN
        ).textContent = `(Stored: ${topPInput.value})`;

        // Loop through stored prompts to update both storage text and button title
        storedPromptInputs.forEach ((input, index) => {
          // Check if input value exists and handle appropriately
          const inputValue = input.value || ''; // Ensure it defaults to an empty string if undefined

          // Update storage text if corresponding storage element exists
          if (index < storedPromptStorages.length) {
            const displayText = inputValue ? inputValue.slice (0, 20) : 'None';
            storedPromptStorages[
              index
            ].textContent = `(Stored: ${displayText})`;
          }

          // Update button title if corresponding button exists
          if (index < storedPromptButtons.length) {
            const titleText = inputValue ? inputValue.slice (0, 100) : '';
            storedPromptButtons[index].title = titleText;
          }
        });

        //configPopup.style.display = 'none'; // Optionally hide the popup after saving
        updateStatus ('Settings saved successfully.');
      }
    );
  });

  storedPromptButtons.forEach ((button, index) => {
    button.addEventListener ('click', () => {
      const promptInput = storedPromptInputs[index];
      const selectedLanguage = languageSelect.value;
      if (!promptInput.value.trim ()) {
        updateStatus (
          `No stored prompt is found. Please save your prompt to stored prompt ${index + 1} in Settings.`
        );
        return;
      }
      // Set the custom prompt input to the content of the selected stored prompt
      const context = GetWebPageTextAsQueryContext ();
      logger.debug (`To submit stored prompt ${index}: promptInput.value`);
      logger.debug ('Selected language:' + selectedLanguage);
      logger.debug ('Webpage context:' + context);

      customPromptInput.value = promptInput.value;
      handlePromptSubmission (
        promptInput.value,
        selectedLanguage,
        GetWebPageTextAsQueryContext ()
      );
    });
  });

  submitCustomPromptButton.addEventListener ('click', () => {
    const customPrompt = customPromptInput.value;
    const selectedLanguage = languageSelect.value;
    if (!customPrompt) {
      updateStatus ('Please enter a custom prompt.');
      return;
    }

    localStorage.setItem (STORAGE_KEY_LAST_CUSTOM_PROMPT, customPrompt);
    logger.debug ('Custom prompt saved:' + customPrompt);
    const context = GetWebPageTextAsQueryContext ();

    logger.debug ('To submit Custom prompt:' + customPrompt);
    logger.debug ('Selected language:' + selectedLanguage);
    logger.debug ('Webpage context:' + context);
    handlePromptSubmission (customPrompt, selectedLanguage, context);
  });

  function GetWebPageTextAsQueryContext () {
    const includeWebContent = document.getElementById (
      ID_INCLUDE_WEB_CONTENT_CHECKBOX
    ).checked;
    let context = '';
    if (includeWebContent) {
      // If including webpage content
      chrome.tabs.query ({active: true, currentWindow: true}, function (tabs) {
        if (tabs[0] && tabs[0].id) {
          extractWebpageText (tabs[0].id, text => {
            context = text;
          });
        }
      });
    }
    return context;
  }

  testConnectionButton.addEventListener ('click', () => {
    const apiUrl = apiUrlInput.value;
    const apiToken = apiTokenInput.value;
    if (!isValidUrl (apiUrl)) {
      updateStatus ('Please enter a valid API URL.');
      return;
    }
    testApiConnection (apiUrl, apiToken);
  });
}
