// logger.js

export const createLogger = function (providedFileName) {
  console.info ('Logger created for:', providedFileName);
  function getCallerInfo () {
    if (providedFileName) {
      return {fileName: providedFileName, functionName: getFunctionName ()};
    }

    const err = new Error ();
    const stack = err.stack.split ('\n').map (line => line.trim ());
    let callerInfo = {fileName: 'unknown', functionName: 'anonymous'};

    // Find the last line in the stack that refers to our extension
    let relevantStackIndex = stack.length - 1;
    while (
      relevantStackIndex >= 0 &&
      !stack[relevantStackIndex].includes ('chrome-extension://')
    ) {
      relevantStackIndex--;
    }

    if (relevantStackIndex >= 0) {
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
    }

    callerInfo.functionName = getFunctionName ();
    return callerInfo;
  }

  function getFunctionName () {
    const err = new Error ();
    const stack = err.stack.split ('\n').map (line => line.trim ());
    let functionName = 'anonymous';

    if (stack.length > 3) {
      const callerLine = stack[3]; // Index 3 because 0 is this function, 1 is getCallerInfo, 2 is the log function
      const match = callerLine.match (
        /at (?:(.+?)\s+\()?(?:(.+?):(\d+)(?::(\d+))?)\)?/
      );
      if (match && match[1]) {
        functionName = match[1];
      }
    }

    return functionName;
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

  return {
    debug: createLogFunction ('debug'),
    log: createLogFunction ('log'),
    info: createLogFunction ('info'),
    warn: createLogFunction ('warn'),
    error: createLogFunction ('error'),
  };
};
