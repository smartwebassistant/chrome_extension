// logger.js

export const createLogger = (function () {
  function getCallerInfo () {
    const err = new Error ();
    const stack = err.stack.split ('\n').map (line => line.trim ());
    let callerInfo = {fileName: 'unknown', functionName: 'anonymous'};

    // Find the last line in the stack that refers to our extension
    let relevantStackIndex = stack.length - 2;
    while (
      relevantStackIndex >= 0 &&
      !stack[relevantStackIndex].includes ('chrome-extension://')
    ) {
      relevantStackIndex--;
    }

    // If we couldn't find a relevant stack entry, use the last one
    if (relevantStackIndex < 0) {
      relevantStackIndex = stack.length - 1;
    }

    const callerLine = stack[relevantStackIndex];
    const match = callerLine.match (
      /at ((\w+)\.)?(\w+)? \(?(chrome-extension:\/\/[^/]+\/([^:]+))/
    );

    if (match) {
      callerInfo.functionName = match[3] || match[2] || 'anonymous';
      callerInfo.fileName = match[5];
    } else {
      // Handle anonymous functions or other edge cases
      const anonymousMatch = callerLine.match (
        /(chrome-extension:\/\/[^/]+\/([^:]+))/
      );
      if (anonymousMatch) {
        callerInfo.fileName = anonymousMatch[2];
      }
    }

    return callerInfo;
  }

  function formatMessage (fileName, functionName, level, message) {
    return `[${fileName}][${functionName}][${level.toUpperCase ()}]: ${message}`;
  }

  function createLogFunction (level) {
    return function (message, ...args) {
      const {fileName, functionName} = getCallerInfo ();
      const formattedMessage = formatMessage (
        fileName,
        functionName,
        level,
        message
      );
      console[level] (formattedMessage, ...args);
    };
  }

  return function () {
    return {
      debug: createLogFunction ('debug'),
      log: createLogFunction ('log'),
      info: createLogFunction ('info'),
      warn: createLogFunction ('warn'),
      error: createLogFunction ('error'),
    };
  };
}) ();
