// responseHandler.js

import {createLogger} from './logger.js';
import {updateStatus} from './utils.js';
import {displayMarkdown, appendMarkdown, initMarkdown} from '../ui/markdown.js';

const logger = createLogger ('responseHandler.js');

/**
 * Interface for handling chat completion responses.
 * @interface
 */
export class ChatCompletionResponseHandler {
  /**
   * Process any errors that occur during the chat completion.
   * @param {Error} error - The error object.
   */
  processError (error) {
    throw new Error ("Method 'processError()' must be implemented.");
  }

  /**
   * Process the content received from the chat completion.
   * @param {string} content - The content chunk received.
   */
  processContent (content) {
    throw new Error ("Method 'processContent()' must be implemented.");
  }

  /**
   * Initialize the handler.
   */
  init () {
    throw new Error ("Method 'init()' must be implemented.");
  }

  /**
   * Reset the handler's state.
   */
  postProcess (content) {
    throw new Error ("Method 'postProcess()' must be implemented.");
  }

  /**
   * Process status updates.
   * @param {string} status - The status message.
   */
  processStatus (status) {
    throw new Error ("Method 'processStatus()' must be implemented.");
  }
}

/**
 * Handler for processing chat completion responses and rendering them as Markdown.
 * @implements {ChatCompletionResponseHandler}
 */
export class MarkdownHandler extends ChatCompletionResponseHandler {
  constructor () {
    super ();
  }

  processError (error) {
    updateStatus (error);
  }

  processContent (content) {
    appendMarkdown (content);
    if (content.includes ('\n')) {
      displayMarkdown ();
    }
  }

  init () {
    initMarkdown ();
  }

  postProcess () {
    displayMarkdown (true); // Force display
  }

  processStatus (status) {
    updateStatus (status);
  }
}
