// contentExtraction.js
import {consoleLog, LOG_LEVELS} from './utils.js';
import {updateStatus} from './utils.js';

export function extractWebpageText (tabId, processFunction) {
  updateStatus ('Extracting text from the webpage...');
  chrome.tabs.sendMessage (tabId, {action: 'getText'}, function (response) {
    if (chrome.runtime.lastError || !response) {
      handleResponseError ('Extraction');
      return;
    }
    consoleLog ('Response: ' + response, LOG_LEVELS.DEBUG);
    processFunction (response.text);
  });
}

function handleResponseError (operation) {
  updateStatus (`Please refresh the webpage of active tab.`);
}
