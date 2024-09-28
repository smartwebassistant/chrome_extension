// messageGateway.js

import {createLogger} from '../scripts/logger.js';
import {AgentExecutor} from './agentExecutor.js';
import {performChatCompletion, performOverwriteText} from './aiServices.js';

const logger = createLogger ('messageGateway.js');
const agentExecutor = new AgentExecutor ();

const ACTIONS = {
  EXECUTE_AGENT: 'agentExecutor.executeAgent',
  PERFORM_CHAT_COMPLETION: 'performChatCompletion',
  PERFORM_OVERWRITE_TEXT: 'performOverwriteText',
};

// Message handlers
const actionHandlers = {
  [ACTIONS.EXECUTE_AGENT]: performExecuteAgent,
  [ACTIONS.PERFORM_CHAT_COMPLETION]: performChatCompletion,
  [ACTIONS.PERFORM_OVERWRITE_TEXT]: performOverwriteText,
};

// Main message listener
chrome.runtime.onMessage.addListener ((request, sender, sendResponse) => {
  logger.debug ('Message received:', request);
  const handler = actionHandlers[request.action];
  if (handler) {
    handler (request, sender, sendResponse);
  }
  return true; // Indicates that the response is sent asynchronously
});

// Handler functions
function performExecuteAgent (request, sender, sendResponse) {
  logger.debug (`Executing agent: `, request);
  agentExecutor
    .executeAgent (request)
    .then (result => {
      sendResponse ({success: true, result});
    })
    .catch (error => {
      logger.error (`Error executing agent: ${error}`);
      sendResponse ({success: false, error: error.message});
    });
}
