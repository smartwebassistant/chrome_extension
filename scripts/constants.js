// constants.js

// String Constants
export const DEFAULT_API_URL = 'https://api.openai.com/v1/chat/completions';
export const DEFAULT_MODEL_NAME = 'gpt-4o';
export const DEFAULT_MAX_TOKENS = 4096;
export const DEFAULT_TEMPERATURE = 0;
export const DEFAULT_TOP_P = 0.9;

export const DEFAULT_LANGUAGE = 'English';

// Storage Constants
export const STORAGE_API_URL = 'apiUrl';
export const STORAGE_API_TOKEN = 'apiToken';
export const STORAGE_MODEL_NAME = 'modelName';
export const STORAGE_MAX_TOKEN = 'maxToken';
export const STORAGE_TEMPERATURE = 'temperature';
export const STORAGE_TOP_P = 'topP';
export const STORAGE_KEY_LAST_CUSTOM_PROMPT = 'lastCustomPrompt';
export const STORAGE_KEY_SELECTED_LANGUAGE = 'selectedLanguage';
export const STORAGE_STORED_PROMPT_PREFIX = 'storedPrompt'; // Generic prefix for dynamic prompt storage
export const STORAGE_DISABLE_SYSTEM_ROLE = 'disableSystemRole';
export const STORAGE_INITIALIZATION_KEY = 'extensionInitialized';
//enableContextMenu
export const STORAGE_ENABLE_CONTEXT_MENU = 'enableContextMenu';

// HTML ID Constants
export const ID_CONFIG_BUTTON = 'configButton';
export const ID_CONFIG_POPUP = 'configPopupDiv';
export const ID_MARKDOWN_CONTENT = 'markdownContentTextArea';
//copyMarkdownButton
export const ID_COPY_MARKDOWN_BUTTON = 'copyMarkdownButton';
export const ID_TOGGLE_SIDEBAR_BUTTON = 'toggleSidebarButton';
export const ID_LANGUAGE_SELECT = 'languageSelect';
export const ID_CUSTOM_PROMPT_INPUT = 'customPromptInput';
export const ID_API_URL_INPUT = 'apiUrlInput';
export const ID_API_TOKEN_INPUT = 'apiTokenInput';
export const ID_MODEL_NAME_INPUT = 'modelNameInput';
export const ID_MAX_TOKEN_INPUT = 'maxTokenInput';
export const ID_TEMPERATURE_INPUT = 'temperatureInput';
export const ID_TOP_P_INPUT = 'topPInput';
export const ID_SUBMIT_CUSTOM_PROMPT_BUTTON = 'submitCustomPromptButton';
export const ID_SAVE_API_CONFIG_BUTTON = 'saveApiConfigButton';
export const ID_TEST_CONNECTION_BUTTON = 'testConnectionButton';
export const ID_API_CONNECTION_TEST_STATUS = 'apiConnectionTestStatusDiv';
export const ID_INCLUDE_WEB_CONTENT_CHECKBOX = 'includeWebContentCheckbox';
//enableContextMenuCheckbox
export const ID_ENABLE_CONTEXT_MENU_CHECKBOX = 'enableContextMenuCheckbox';
//enableContextMenuSpan
export const ID_ENABLE_CONTEXT_MENU_SPAN = 'enableContextMenuSpan';

//magicClickCheckbox
export const ID_MAGIC_CLICK_CHECKBOX = 'magicClickCheckbox';
// disableSystemRoleCheckbox
export const ID_DISABLE_SYSTEM_ROLE_CHECKBOX = 'disableSystemRoleCheckbox';
export const ID_DISABLE_SYSTEM_ROLE_SPAN = 'disableSystemRoleSpan';
export const ID_STATUS_FOOTER = 'statusFooter';

export const ID_OUTPUT_FORMAT_TEXT_RADIO = 'outputFormatTextRadio';
export const ID_OUTPUT_FORMAT_MARKDOWN_RADIO = 'outputFormatMarkdownRadio';
export const ID_OUTPUT_FORMAT_TABLE_RADIO = 'outputFormatTableRadio';

export const ID_OUTPUT_FORMAT_JSON_RADIO = 'outputFormatJsonRadio';

export const ID_API_URL_STORAGE_SPAN = 'apiUrlStorage';
export const ID_API_TOKEN_STORAGE_SPAN = 'apiTokenStorage';
export const ID_MODEL_NAME_STORAGE_SPAN = 'modelNameStorage';
export const ID_MAX_TOKEN_STORAGE_SPAN = 'maxTokenStorage';
export const ID_TEMPERATURE_STORAGE_SPAN = 'temperatureStorage';
export const ID_TOP_P_STORAGE_SPAN = 'topPStorage';
export const ID_SAVE_PROMPTS_CONFIG_BUTTON = 'savePromptsConfigButton';

export const ID_CONFIG_DROPDOWN = 'configDropdown';

export const ID_STORED_PROMPT_INPUT = index => `storedPrompt${index}Input`;
export const ID_STORED_PROMPT_BUTTON = index => `storedPrompt${index}Button`;
export const ID_STORED_PROMPT_STORAGE = index => `storedPrompt${index}Storage`;

export const SIDE_PANEL_HTML = 'ui/sidepanel.html';
export const STORAGE_KEYS = {
  STORED_PROMPTS: [
    'storedPrompt1',
    'storedPrompt2',
    'storedPrompt3',
    'storedPrompt4',
    'storedPrompt5',
  ],
  LAST_CUSTOM_PROMPT: 'lastCustomPrompt',
  AGENTS: 'agents',
};
