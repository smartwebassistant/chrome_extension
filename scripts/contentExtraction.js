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

chrome.runtime.onMessage.addListener (function (request, sender, sendResponse) {
  if (request.action === 'getText') {
    var mainContentText = document.getElementById ('main_content')
      ? document.getElementById ('main_content').innerText
      : 'No content found';
    sendResponse ({text: mainContentText});
  }
});

function handleResponseError (operation) {
  updateStatus (`Please refresh the webpage of active tab.`);
  console.error (`${operation} Error:`, chrome.runtime.lastError.message);
}
