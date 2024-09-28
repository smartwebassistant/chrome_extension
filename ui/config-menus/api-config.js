// apiConfig.js
import {
  STORAGE_API_URL,
  STORAGE_API_TOKEN,
  STORAGE_MODEL_NAME,
  STORAGE_MAX_TOKEN,
  STORAGE_TEMPERATURE,
  STORAGE_TOP_P,
  STORAGE_DISABLE_SYSTEM_ROLE,
  ID_DISABLE_SYSTEM_ROLE_CHECKBOX,
  ID_DISABLE_SYSTEM_ROLE_SPAN,
  ID_CONFIG_POPUP,
  ID_SAVE_API_CONFIG_BUTTON,
  DEFAULT_API_URL,
  DEFAULT_MODEL_NAME,
  ID_API_URL_STORAGE_SPAN,
  ID_API_TOKEN_STORAGE_SPAN,
  ID_MODEL_NAME_STORAGE_SPAN,
  ID_MAX_TOKEN_STORAGE_SPAN,
  ID_TEMPERATURE_STORAGE_SPAN,
  ID_TOP_P_STORAGE_SPAN,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  DEFAULT_TOP_P,
  ID_TEST_CONNECTION_BUTTON,
} from '../../scripts/constants.js';
import {testApiConnection} from '../../scripts/api.js';
import {createLogger} from '../../scripts/logger.js';
import {isValidUrl, updateStatus} from '../../scripts/utils.js';
const logger = createLogger ('apiConfig.js');

export function init () {
  logger.debug ('Initializing API configuration...');
  logger.debug ('Loading API configuration popup...');

  const configPopupDiv = document.getElementById (ID_CONFIG_POPUP);
  load ();
  configPopupDiv.style.display = 'block';
}
function load () {
  chrome.storage.local.get (
    [
      STORAGE_API_URL,
      STORAGE_API_TOKEN,
      STORAGE_MODEL_NAME,
      STORAGE_MAX_TOKEN,
      STORAGE_TEMPERATURE,
      STORAGE_TOP_P,
      STORAGE_DISABLE_SYSTEM_ROLE,
      ID_API_URL_STORAGE_SPAN,
      ID_API_TOKEN_STORAGE_SPAN,
      ID_MODEL_NAME_STORAGE_SPAN,
      ID_MAX_TOKEN_STORAGE_SPAN,
      ID_TEMPERATURE_STORAGE_SPAN,
      ID_TOP_P_STORAGE_SPAN,
    ],
    function (result) {
      const disableSystemRoleCheckbox = document.getElementById (
        ID_DISABLE_SYSTEM_ROLE_CHECKBOX
      );
      disableSystemRoleCheckbox.addEventListener (
        'change',
        handleDisableSystemRoleChange
      );
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

      document
        .getElementById ('saveApiConfigButton')
        .addEventListener ('click', save);
      document
        .getElementById (ID_TEST_CONNECTION_BUTTON)
        .addEventListener ('click', testConnection);
      updateStatus ('Ready.');
    }
  );
}

function testConnection () {
  const apiUrl = apiUrlInput.value;
  const apiToken = apiTokenInput.value;
  if (!isValidUrl (apiUrl)) {
    updateStatus ('Please enter a valid API URL.');
    return;
  }
  testApiConnection (apiUrl, apiToken);
}

function handleDisableSystemRoleChange () {
  const disableSystemRoleCheckbox = document.getElementById (
    ID_DISABLE_SYSTEM_ROLE_CHECKBOX
  );
  const disableSystemRoleSpan = document.getElementById (
    ID_DISABLE_SYSTEM_ROLE_SPAN
  );

  chrome.storage.local.set (
    {
      [STORAGE_DISABLE_SYSTEM_ROLE]: disableSystemRoleCheckbox.checked,
    },
    function () {
      disableSystemRoleSpan.style.display = 'inline';
      setTimeout (() => {
        disableSystemRoleSpan.style.display = 'none';
      }, 2000);
    }
  );
}

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

function save () {
  const saveApiUrlButton = document.getElementById (ID_SAVE_API_CONFIG_BUTTON);
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

    const disableSystemRoleCheckbox = document.getElementById (
      ID_DISABLE_SYSTEM_ROLE_CHECKBOX
    );
    const disableSystemRoleSpan = document.getElementById (
      ID_DISABLE_SYSTEM_ROLE_SPAN
    );
    chrome.storage.local.set (
      {
        [STORAGE_API_URL]: apiUrlInput.value,
        [STORAGE_API_TOKEN]: apiTokenInput.value,
        [STORAGE_MODEL_NAME]: modelNameInput.value,
        [STORAGE_MAX_TOKEN]: maxTokenInput.value,
        [STORAGE_TEMPERATURE]: temperatureInput.value,
        [STORAGE_TOP_P]: topPInput.value,
        [STORAGE_DISABLE_SYSTEM_ROLE]: disableSystemRoleCheckbox.checked,
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

        disableSystemRoleSpan.style.display = 'inline';
        setTimeout (() => {
          disableSystemRoleSpan.style.display = 'none';
        }, 2000);

        //configPopup.style.display = 'none'; // Optionally hide the popup after saving
        updateStatus ('Settings saved successfully.');
      }
    );
  });
}
