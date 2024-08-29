// Log levels
export const LOG_LEVELS = {
  ERROR: 1,
  INFO: 2,
  DEBUG: 3,
};
// Update the status display in the bottom
export function updateStatus (message, level = LOG_LEVELS.INFO) {
  const isDebugMode = document.getElementById ('debugModeCheckbox').checked;
  if (!isDebugMode && level === LOG_LEVELS.DEBUG) {
    return; // Ignore debug messages unless debug mode is enabled
  }
  // let user know the status of each operation
  const statusDisplay = document.getElementById ('status');
  statusDisplay.textContent = message;
}

// Console log with log levels, if debug mode is enabled
export function consoleLog (message, level = LOG_LEVELS.INFO) {
  const isDebugMode = document.getElementById ('debugModeCheckbox').checked;
  if (!isDebugMode && level === LOG_LEVELS.DEBUG) {
    return; // Ignore debug messages unless debug mode is enabled
  }
  console.log (message);
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
