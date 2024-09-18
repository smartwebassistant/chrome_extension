// contentExtraction.js
import {updateStatus} from '../scripts/utils.js';
import {createLogger} from '../scripts/logger.js';
const logger = createLogger ();

export function extractWebpageText (tabId, processFunction) {
  logger.debug ('Extracting text from the webpage...');
  updateStatus ('Extracting text from the webpage...');
  chrome.tabs.sendMessage (tabId, {action: 'getText'}, function (response) {
    if (chrome.runtime.lastError || !response) {
      handleResponseError ('Extraction');
      return;
    }
    logger.debug ('Response: ' + response);
    processFunction (response.text);
  });
}

export function extractElementText (tabId, processFunction) {
  logger.debug ('Extracting text from the selected element...');
  updateStatus ('Extracting text from the selected element...');
  chrome.tabs.sendMessage (tabId, {action: 'getSelectedElementText'}, function (
    response
  ) {
    if (chrome.runtime.lastError || !response) {
      handleResponseError ('Extraction');
      return;
    }
    logger.debug ('Response: ' + response);
    processFunction (response.text);
  });
}

function handleResponseError (operation) {
  updateStatus (`Please refresh the webpage of active tab.`);
}
