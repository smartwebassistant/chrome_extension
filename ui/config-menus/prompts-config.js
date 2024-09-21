// promptsConfig.js
import {
  STORAGE_STORED_PROMPT_PREFIX,
  ID_SAVE_PROMPTS_CONFIG_BUTTON,
  ID_CONFIG_POPUP,
  ID_STORED_PROMPT_INPUT,
  ID_STORED_PROMPT_STORAGE,
  ID_STORED_PROMPT_BUTTON,
} from '../../scripts/constants.js';
import {updateStatus} from '../../scripts/utils.js';
import {createLogger} from '../../scripts/logger.js';
const logger = createLogger ();

export function init () {
  const configPopupDiv = document.getElementById (ID_CONFIG_POPUP);
  load ();
  configPopupDiv.style.display = 'block';
}
function load () {
  // Load settings from local storage
  chrome.storage.local.get (
    [
      ...Array.from (
        {length: 5},
        (_, i) => `${STORAGE_STORED_PROMPT_PREFIX}${i + 1}`
      ),
    ],
    function (result) {
      const numberOfPrompts = 5; // This can be adjusted based on the actual number of prompts you have

      const storedPromptInputs = Array.from (
        {length: numberOfPrompts},
        (_, i) => document.getElementById (ID_STORED_PROMPT_INPUT (i + 1))
      );
      logger.debug ('Stored prompt inputs:', storedPromptInputs);

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
      });
      document
        .getElementById (ID_SAVE_PROMPTS_CONFIG_BUTTON)
        .addEventListener ('click', save);
      updateStatus ('Ready.');
    }
  );
}

function save () {
  const numberOfPrompts = 5; // This can be adjusted based on the actual number of prompts you have

  const storedPromptInputs = Array.from ({length: numberOfPrompts}, (_, i) =>
    document.getElementById (ID_STORED_PROMPT_INPUT (i + 1))
  );
  const storedPromptStorages = Array.from ({length: numberOfPrompts}, (_, i) =>
    document.getElementById (ID_STORED_PROMPT_STORAGE (i + 1))
  );

  const storedPromptButtons = Array.from ({length: numberOfPrompts}, (_, i) =>
    document.getElementById (ID_STORED_PROMPT_BUTTON (i + 1))
  );

  logger.debug ('Stored prompt buttons:', storedPromptButtons);
  logger.debug ('Stored prompt storages:', storedPromptStorages);
  logger.debug ('Stored prompt inputs:', storedPromptInputs);
  chrome.storage.local.set (
    {
      storedPrompt1: storedPrompt1Input.value,
      storedPrompt2: storedPrompt2Input.value,
      storedPrompt3: storedPrompt3Input.value,
      storedPrompt4: storedPrompt4Input.value,
      storedPrompt5: storedPrompt5Input.value,
    },
    () => {
      // Loop through stored prompts to update both storage text and button title
      storedPromptInputs.forEach ((input, index) => {
        // Check if input value exists and handle appropriately
        const inputValue = input.value || ''; // Ensure it defaults to an empty string if undefined

        // Update storage text if corresponding storage element exists
        if (index < storedPromptStorages.length) {
          const displayText = inputValue ? inputValue.slice (0, 20) : 'None';
          storedPromptStorages[index].textContent = `(Stored: ${displayText})`;
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
}
