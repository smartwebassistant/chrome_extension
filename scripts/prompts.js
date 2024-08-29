import {updateStatus, LOG_LEVELS} from './utils.js';
import {fetchOpenAI} from './api.js';
import {extractWebpageText} from './contentExtraction.js';
import {consoleLog} from './utils.js';

export function handlePromptSubmission (prompt, language, currentController) {
  const includeWebContent = document.getElementById (
    'includeWebContentCheckbox'
  ).checked;
  const systemPrompt = `Output response in ${language} language and markdown format. The prompt is:`;
  // print debug log in console
  consoleLog (`prompt: ${prompt}`, LOG_LEVELS.DEBUG);
  consoleLog (`language: ${language}`, LOG_LEVELS.DEBUG);
  consoleLog (`currentController: ${currentController}`, LOG_LEVELS.DEBUG);

  if (includeWebContent) {
    // If including webpage content
    chrome.tabs.query ({active: true, currentWindow: true}, function (tabs) {
      if (tabs[0] && tabs[0].id) {
        extractWebpageText (tabs[0].id, text => {
          // Replace the prompt in your fetchOpenAI call with the custom prompt
          fetchOpenAI (
            ``,
            `${systemPrompt} ${prompt}. below is the text of the web page: ${text}.`,
            currentController
          ).catch (error => {
            consoleLog (
              'Failed to process custom prompt.' + error.message,
              LOG_LEVELS.ERROR
            );
            updateStatus ('Failed to process custom prompt.' + error.message);
          });
        });
        updateStatus ('Calling API, wait for response');
      }
    });
  } else {
    // If not including webpage content

    fetchOpenAI (
      '',
      `${systemPrompt} ${prompt}.`,
      currentController
    ).catch (error => {
      updateStatus ('Failed to process custom prompt.' + error.message);
    });
  }
  updateStatus ('Submitting prompt: ' + prompt);
}
