//ui.js

import {updateStatus, isValidUrl, consoleLog, LOG_LEVELS} from './utils.js';
import {testApiConnection} from './api.js';
import {handlePromptSubmission} from './prompts.js';

export function initUI () {
  //1. Button to show or hide the configuration popup
  const configButton = document.getElementById ('config');
  const configPopup = document.getElementById ('configPopup');
  // Show or hide the configuration popup, when config pop is shown, markdown content is hidden
  configButton.addEventListener ('click', () => {
    if (configPopup.style.display === 'block') {
      // If configPopup is currently shown, hide it and show markdownContent
      configPopup.style.display = 'none';
      markdownContent.style.display = 'block';
    } else {
      // If configPopup is currently hidden, show it and hide markdownContent
      configPopup.style.display = 'block';
      markdownContent.style.display = 'none';
    }
  });

  //2. button to toggle the sidebar, it won't show up in the sidepanel
  const toggleSidebarButton = document.getElementById ('toggleSidebarButton');

  // hide it in an iframe
  if (window.self !== window.top) {
    // Hide the toggle sidebar button if in an iframe
    if (toggleSidebarButton) {
      toggleSidebarButton.style.display = 'none';
      console.log (
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
        path: 'sidepanel.html',
        enabled: true,
      });
      window.close (); // Closes the popup after opening the side panel
      chrome.storage.local.set ({preferSidePanel: true});
    } catch (error) {
      console.error ('Failed to open or configure the side panel:', error);
    }
  });

  const languageSelect = document.getElementById ('languageSelect');

  const markdownContent = document.getElementById ('markdownContent');
  // I am using iframe to include popup.html in sidepanel.html to reuse the same code
  // in sidepanel,increase the height of the iframe to fit the content
  // Check if the current page is loaded within an iframe
  if (window.self !== window.top) {
    // This code runs if the page is in an iframe
    if (markdownContent) {
      markdownContent.style.height = '480px'; // Adjust the height as needed
      console.log ('Adjusted markdownContent height for iframe usage.');
    }

    document.body.style.width = '100%'; // Adjust the width as needed
  }

  const submitCustomPromptButton = document.getElementById (
    'submitCustomPromptButton'
  );
  const storedPromptButtons = [
    document.getElementById ('storedPrompt1Button'),
    document.getElementById ('storedPrompt2Button'),
    document.getElementById ('storedPrompt3Button'),
    document.getElementById ('storedPrompt4Button'),
    document.getElementById ('storedPrompt5Button'),
  ];
  const storedPromptInputs = [
    document.getElementById ('storedPrompt1Input'),
    document.getElementById ('storedPrompt2Input'),
    document.getElementById ('storedPrompt3Input'),
    document.getElementById ('storedPrompt4Input'),
    document.getElementById ('storedPrompt5Input'),
  ];
  const storedPromptStorages = [
    document.getElementById ('storedPrompt1Storage'),
    document.getElementById ('storedPrompt2Storage'),
    document.getElementById ('storedPrompt3Storage'),
    document.getElementById ('storedPrompt4Storage'),
    document.getElementById ('storedPrompt5Storage'),
  ];

  const customPromptInput = document.getElementById ('customPromptInput');
  // Load the last used custom prompt from local storage
  const lastCustomPrompt = localStorage.getItem ('lastCustomPrompt');
  if (lastCustomPrompt) {
    // Checks if lastCustomPrompt is not null and not an empty string
    customPromptInput.value = lastCustomPrompt.trim ();
  }

  const apiUrlInput = document.getElementById ('apiUrlInput');
  const apiTokenInput = document.getElementById ('apiTokenInput');
  const modelNameInput = document.getElementById ('modelNameInput');
  const maxTokenInput = document.getElementById ('maxTokenInput');
  const temperatureInput = document.getElementById ('temperatureInput');
  const topPInput = document.getElementById ('topPInput');
  // Load settings from local storage
  chrome.storage.local.get (
    [
      'apiUrl',
      'apiToken',
      'modelName',
      'maxToken',
      'temperature',
      'topP',
      'storedPrompt1',
      'storedPrompt2',
      'storedPrompt3',
      'storedPrompt4',
      'storedPrompt5',
    ],
    function (result) {
      apiUrlInput.value =
        result.apiUrl || 'https://api.openai.com/v1/chat/completions';
      document.getElementById (
        'apiUrlStorage'
      ).textContent = `(Stored: ${result.apiUrl || 'None'})`;

      apiTokenInput.value = result.apiToken || '';
      modelNameInput.value = result.modelName || 'gpt-4o';
      document.getElementById (
        'modelNameStorage'
      ).textContent = `(Stored: ${result.modelName || 'None'})`;

      maxTokenInput.value = result.maxToken || 4096;
      document.getElementById (
        'maxTokenStorage'
      ).textContent = `(Stored: ${result.maxToken || 'None'})`;

      temperatureInput.value = result.temperature || 0.7;
      document.getElementById (
        'temperatureStorage'
      ).textContent = `(Stored: ${result.temperature || 'None'})`;

      topPInput.value = result.topP || 0.9;
      document.getElementById (
        'topPStorage'
      ).textContent = `(Stored: ${result.topP || 'None'})`;

      // Load stored prompts from local storage in a loop
      storedPromptInputs.forEach ((input, index) => {
        // Safely get the stored prompt value with a fallback to an empty string if undefined
        const promptKey = `storedPrompt${index + 1}`;
        const promptValue = result[promptKey] || '';

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

  const saveApiUrlButton = document.getElementById ('saveApiUrlButton');
  const testConnectionButton = document.getElementById ('testConnectionButton');
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
        apiUrl: apiUrlInput.value,
        apiToken: apiTokenInput.value,
        modelName: modelNameInput.value,
        maxToken: maxTokenInput.value,
        temperature: temperatureInput.value,
        topP: topPInput.value,
        storedPrompt1: storedPrompt1Input.value,
        storedPrompt2: storedPrompt2Input.value,
        storedPrompt3: storedPrompt3Input.value,
        storedPrompt4: storedPrompt4Input.value,
        storedPrompt5: storedPrompt5Input.value,
      },
      () => {
        document.getElementById (
          'apiUrlStorage'
        ).textContent = `(Stored: ${apiUrlInput.value})`;
        document.getElementById (
          'modelNameStorage'
        ).textContent = `(Stored: ${modelNameInput.value})`;
        document.getElementById (
          'maxTokenStorage'
        ).textContent = `(Stored: ${maxTokenInput.value})`;
        document.getElementById (
          'temperatureStorage'
        ).textContent = `(Stored: ${temperatureInput.value})`;
        document.getElementById (
          'topPStorage'
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

  const defaultLanguage =
    localStorage.getItem ('selectedLanguage') || 'English';

  // Set the default selected language from local storage or default to English
  languageSelect.value = defaultLanguage;

  // Event listener to update local storage when the user changes the selection
  languageSelect.addEventListener ('change', function () {
    localStorage.setItem ('selectedLanguage', this.value);
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
      customPromptInput.value = promptInput.value;
      handlePromptSubmission (promptInput.value, selectedLanguage);
    });
  });

  submitCustomPromptButton.addEventListener ('click', () => {
    const customPrompt = customPromptInput.value;
    const selectedLanguage = languageSelect.value;
    if (!customPrompt) {
      updateStatus ('Please enter a custom prompt.');
      return;
    }

    localStorage.setItem ('lastCustomPrompt', customPrompt);
    consoleLog ('Custom prompt saved:' + customPrompt, LOG_LEVELS.DEBUG);

    handlePromptSubmission (customPrompt, selectedLanguage);
  });

  testConnectionButton.addEventListener ('click', () => {
    const apiUrl = apiUrlInput.value;
    if (!isValidUrl (apiUrl)) {
      updateStatus ('Please enter a valid API URL.');
      return;
    }
    testApiConnection (apiUrl);
  });
}
