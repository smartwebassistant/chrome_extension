//utils.js;

import {ID_STATUS_FOOTER} from './constants.js';
// Log levels
export const LOG_LEVELS = {
  ERROR: 1,
  INFO: 2,
  DEBUG: 3,
};
// Update the status display in the bottom
export function updateStatus (message) {
  // let user know the status of each operation
  const statusDisplay = document.getElementById (ID_STATUS_FOOTER);
  statusDisplay.textContent = message;
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
