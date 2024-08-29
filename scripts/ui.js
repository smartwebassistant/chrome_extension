//ui.js

import {updateStatus, isValidUrl, consoleLog, LOG_LEVELS} from './utils.js';
import {testApiConnection} from './api.js';
import {handlePromptSubmission} from './prompts.js';

export function initUI () {
  const cancelButton = document.getElementById ('cancelButton');
  const configButton = document.getElementById ('config');
  const configPopup = document.getElementById ('configPopup');
  const apiUrlInput = document.getElementById ('apiUrlInput');
  const apiTokenInput = document.getElementById ('apiTokenInput');
  const modelNameInput = document.getElementById ('modelNameInput');
  const maxTokenInput = document.getElementById ('maxTokenInput');
  const temperatureInput = document.getElementById ('temperatureInput');
  const topPInput = document.getElementById ('topPInput');
  const saveApiUrlButton = document.getElementById ('saveApiUrlButton');
  const customPromptInput = document.getElementById ('customPromptInput');
  const languageSelect = document.getElementById ('languageSelect');
  const markdownContent = document.getElementById ('markdownContent');
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

  // Load the last used custom prompt from local storage
  const lastCustomPrompt = localStorage.getItem ('lastCustomPrompt');
  if (lastCustomPrompt) {
    // Checks if lastCustomPrompt is not null and not an empty string
    customPromptInput.value = lastCustomPrompt.trim ();
  }

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
        input.value = result[`storedPrompt${index + 1}`] || '';
        document.getElementById (
          `storedPrompt${index + 1}Storage`
        ).textContent = `(Stored: ${result[`storedPrompt${index + 1}`].slice (0, 20) || 'None'})`;
        //update the button text with the first 10 characters of the prompt
        storedPromptButtons[index].title =
          result[`storedPrompt${index + 1}`].slice (0, 100) || '';
      });

      updateStatus ('Ready.');
    }
  );

  // Show or hide the configuration popup
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
          if (index < storedPromptStorages.length) {
            storedPromptStorages[
              index
            ].textContent = `(Stored: ${input.value.slice (0, 20)})`;
          }
          if (index < storedPromptButtons.length) {
            storedPromptButtons[index].title = input.value.slice (0, 100);
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
