// initializeExtension.js

import {
  STORAGE_API_URL,
  STORAGE_API_TOKEN,
  STORAGE_MODEL_NAME,
  STORAGE_MAX_TOKEN,
  STORAGE_TEMPERATURE,
  STORAGE_TOP_P,
  STORAGE_DISABLE_SYSTEM_ROLE,
  STORAGE_STORED_PROMPT_PREFIX,
  STORAGE_INITIALIZATION_KEY,
  DEFAULT_API_URL,
  DEFAULT_MODEL_NAME,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  DEFAULT_TOP_P,
} from '../scripts/constants.js';
import {createLogger} from '../scripts/logger.js';

const logger = createLogger ('initializeExtension.js');

const DEFAULT_PROMPTS = [
  'Summarize it.',
  'Explain this concept.',
  'Translate it.',
  'Find the main points in this text.',
  'Provide pros and cons for this topic.',
];

export async function initializeExtension () {
  try {
    const result = await chrome.storage.local.get (STORAGE_INITIALIZATION_KEY);

    if (!result[STORAGE_INITIALIZATION_KEY]) {
      logger.info ('Initializing extension for the first time...');

      const defaultSettings = {
        [STORAGE_API_URL]: DEFAULT_API_URL,
        [STORAGE_API_TOKEN]: '',
        [STORAGE_MODEL_NAME]: DEFAULT_MODEL_NAME,
        [STORAGE_MAX_TOKEN]: DEFAULT_MAX_TOKENS,
        [STORAGE_TEMPERATURE]: DEFAULT_TEMPERATURE,
        [STORAGE_TOP_P]: DEFAULT_TOP_P,
        [STORAGE_DISABLE_SYSTEM_ROLE]: false,
        [STORAGE_INITIALIZATION_KEY]: true,
      };

      // Add stored prompts 1 to 5
      for (let i = 1; i <= 5; i++) {
        defaultSettings[`${STORAGE_STORED_PROMPT_PREFIX}${i}`] =
          DEFAULT_PROMPTS[i - 1] || '';
      }

      await chrome.storage.local.set (defaultSettings);

      logger.info (
        'Extension initialized successfully, default settings set to local storage.'
      );
    } else {
      logger.info (
        'Extension already initialized, NOT to overwrite the settings.'
      );
    }
  } catch (error) {
    logger.error ('Error initializing extension:', error);
  }
}
