// Enhanced logging function for background.js

const logger = (function () {
  const FILE_NAME = 'background.js';

  function getCallerFunctionName () {
    const err = new Error ();
    const stack = err.stack.split ('\n');
    // The calling function is typically the third item in the stack
    const callerLine = stack[2];
    // Extract function name using regex
    const match = callerLine.match (/at (\w+)/);
    return match ? match[1] : 'anonymous';
  }

  function formatMessage (level, functionName, message) {
    return `[${FILE_NAME}][${functionName}][${level.toUpperCase ()}]: ${message}`;
  }

  function log (level, message, ...args) {
    const functionName = getCallerFunctionName ();
    const formattedMessage = formatMessage (level, functionName, message);
    console[level] (formattedMessage, ...args);
  }

  return {
    debug: function (message, ...args) {
      log ('debug', message, ...args);
    },
    log: function (message, ...args) {
      log ('info', message, ...args);
    },
    warn: function (message, ...args) {
      log ('warn', message, ...args);
    },
    error: function (message, ...args) {
      log ('error', message, ...args);
    },
  };
}) ();

logger.log ('Background script loaded...');

chrome.action.onClicked.addListener (tab => {
  chrome.scripting.executeScript ({
    target: {tabId: tab.id},
    files: ['content.js'],
  });
});

chrome.runtime.onMessage.addListener ((request, sender, sendResponse) => {
  if (request.action === 'chatCompletion') {
    logger.debug ('Chat completion request received from content.js', request);
    chrome.runtime.sendMessage ({
      action: 'handleChatCompletion',
      data: request,
    });
    logger.debug ('Chat completion request was sent to extension');
    return false;
  } else if (request.action === 'overwriteTextRequest') {
    logger.debug ('Overwrite text request received from content.js', request);
    chrome.runtime.sendMessage (
      {
        action: 'handleOverwriteTextRequest',
        data: request,
      },
      response => {
        logger.debug ('Overwrite response received from extension:', response);
        sendResponse (response);
        logger.debug ('Overwrite text response was sent to content.js');
      }
    );
    logger.debug ('Overwrite text response was sent to extension');
    return true;
  }
});
