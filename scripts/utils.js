//utils.js;

import {ID_STATUS_FOOTER} from './constants.js';
import {createLogger} from './logger.js';
const logger = createLogger ('utils.js');
// Update the status display in the bottom
// create constants for icons and export them
const hourglassIcon = '\u23F3'; // ⏳ Hourglass for in-progress
const checkmarkIcon = '\u2705'; // ✅ Green checkmark for completion
const errorIcon = '\u274C'; // ❌ Red cross mark for error
const actionRequiredIcon = '\u26A0'; // ⚠️ Warning sign for action required

export const state = {
  inProgress: 'inProgress',
  completed: 'completed',
  error: 'error',
  actionRequired: 'actionRequired',
};

export function updateStatus (message, status = 'actionRequired') {
  // let user know the status of each operation
  const statusDisplay = document.getElementById (ID_STATUS_FOOTER);
  let icon;

  switch (status) {
    case state.completed:
      icon = checkmarkIcon;
      break;
    case state.error:
      icon = errorIcon;
      break;
    case state.actionRequired:
      icon = actionRequiredIcon;
      break;
    case state.inProgress:
    default:
      icon = hourglassIcon;
  }

  statusDisplay.textContent = `${icon} ${message}`;
}

// test if a string is a valid URL
export function isValidUrl (url) {
  const pattern = new RegExp (
    '^(https?:\/\/)?' + // protocol
    '(([a-z\\d]([a-z\\d-]*[a-z\\d])*)' + // hostname
    '(\\.([a-z\\d]([a-z\\d-]*[a-z\\d])*))*' + // domain name
    '|((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  ); // fragment locator
  return !!pattern.test (url);
}

export function messageExtension (request) {
  logger.debug ('Sending message to extension:', request);
  return new Promise ((resolve, reject) => {
    chrome.runtime.sendMessage (request, response => {
      if (chrome.runtime.lastError) {
        reject (chrome.runtime.lastError);
      } else {
        resolve (response);
      }
    });
  });
}

export function messageContentScript (request) {
  return new Promise ((resolve, reject) => {
    chrome.tabs.query ({active: true, currentWindow: true}, tabs => {
      if (tabs.length === 0) {
        reject ('No active tab found');
        logger.error (
          'No active tab found when sending message to content script'
        );
      } else {
        const tabId = tabs[0].id;
        chrome.tabs.sendMessage (tabId, request, response => {
          if (chrome.runtime.lastError) {
            reject (chrome.runtime.lastError);
          } else {
            resolve (response);
          }
        });
      }
    });
  });
}

export function messageBackground (request) {
  return new Promise ((resolve, reject) => {
    chrome.runtime.sendMessage (request, response => {
      if (chrome.runtime.lastError) {
        reject (chrome.runtime.lastError);
      } else {
        resolve (response);
      }
    });
  });
}
