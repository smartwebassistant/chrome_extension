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
  STORAGE_ENABLE_CONTEXT_MENU,
} from '../scripts/constants.js';
import {createLogger} from '../scripts/logger.js';

const logger = createLogger ('initializeExtension.js');

const DEFAULT_PROMPTS = [
  'Summarize the Article, Provide a concise summary of this article, highlighting the main points and any conclusions drawn.',
  'Extract Key Facts, List all key facts mentioned in this article, including dates, statistics, and important names.',
  'Identify Opinions vs. Facts, Identify and separate opinions from facts in this article. Provide a list of statements classified as either factual or opinion-based.',
  'Generate Questions for Further Research, Based on the content of this article, what are some follow-up questions that could be asked for further research or clarification? ',
  'Clarify Technical Terms, Identify and explain any technical terms or jargon used in this article. Provide definitions or simplified explanations to help understand the context.',
];

export async function initializeExtension () {
  try {
    const result = await chrome.storage.local.get (STORAGE_INITIALIZATION_KEY);

    if (!result[STORAGE_INITIALIZATION_KEY]) {
      const defaultSettings = {
        [STORAGE_INITIALIZATION_KEY]: true, // Set to true to prevent re-initialization
        [STORAGE_API_URL]: DEFAULT_API_URL,
        [STORAGE_API_TOKEN]: '',
        [STORAGE_MODEL_NAME]: DEFAULT_MODEL_NAME,
        [STORAGE_MAX_TOKEN]: DEFAULT_MAX_TOKENS,
        [STORAGE_TEMPERATURE]: DEFAULT_TEMPERATURE,
        [STORAGE_TOP_P]: DEFAULT_TOP_P,
        [STORAGE_DISABLE_SYSTEM_ROLE]: false,
        [STORAGE_ENABLE_CONTEXT_MENU]: true,
      };
      logger.info (
        'Initializing extension for the first time...' + defaultSettings
      );

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
