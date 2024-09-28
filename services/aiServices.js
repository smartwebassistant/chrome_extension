// aiServices.js

// This file contains the functions that handle the submission of prompts
import {fetchOpenAI} from '../scripts/api.js';
import {
  ID_DISABLE_SYSTEM_ROLE_CHECKBOX,
  ID_MAGIC_CLICK_CHECKBOX,
  ID_CUSTOM_PROMPT_INPUT,
  ID_LANGUAGE_SELECT,
  ID_MARKDOWN_CONTENT,
} from '../scripts/constants.js';
import {createLogger} from '../scripts/logger.js';
import {updateStatus} from '../scripts/utils.js';
const logger = createLogger ('aiServices.js');

// chrome.runtime.onMessage.addListener ((request, sender, sendResponse) => {
//   logger.debug ('Message received:', request);
//   if (request.action === 'performChatCompletion') {
//     logger.debug ('Chat completion request received');
//     performChatCompletion (request.data, sender, sendResponse);
//   } else if (request.action === 'performOverwriteText') {
//     logger.debug ('Overwrite text request received');
//     performOverwriteText (request.data, sender, sendResponse);
//   }
//   return true;
// });

export function performChatCompletion (request, sender, sendResponse) {
  // get prompt from customized prompt
  logger.debug ('Chat completion request received' + request);
  prompt = request.subAction;
  const language = document.getElementById (ID_LANGUAGE_SELECT).value;
  const context = request.elementInfo.text;

  handlePromptSubmission (prompt, language, context)
    .then (result => {
      sendResponse ({result: result});
    })
    .catch (error => {
      logger.error ('Error in chat completion: ' + error.message);
    });
  return true;
}

export function performOverwriteText (request, sender, sendResponse) {
  // Request markdown content from the popup
  logger.debug ('Overwrite text request received');
  const markdownContent = document.getElementById (ID_MARKDOWN_CONTENT)
    .innerText;
  logger.debug ('Markdown content: ' + markdownContent);
  if (markdownContent) {
    // Overwrite the text in the chat box with the markdown content
    sendResponse ({content: markdownContent});
    logger.debug ('Overwrite text response was sent');
  } else {
    sendResponse ({error: 'No markdown content found'});
    console.error ('No markdown content found');
  }
}

export function handlePromptSubmission (prompt, language, context) {
  let outputPrompt = `The output format should be in markdown, here is an example markdown: \n\n
      # Title
      ## Subtitle
      - List item 1
      - List item 2
      - List item 3
      \n
      `;

  const systemPrompt = `
  As an advanced language model, you must strictly adhere to the following rules when answering any question:

    Format Requirement:
    All output must be in Markdown format. This includes appropriate use of headers, lists, code blocks, and other Markdown elements.

    Language Requirement:
    All answers must be provided in ${language}, regardless of the language of the question.

    Answer Structure:
    Begin with a concise answer to the question. Then, if applicable, provide relevant details or explanations from the context. Finally, if necessary, point out any limitations or shortcomings in the context.

    Honesty:
    If you are unsure or unable to answer a question, please state this honestly. Do not attempt to fabricate information.

    Always follow these rules to ensure your answers are both accurate and compliant with the requirements.
  `;
  const outputLanguage = `The output language should be in ${language}. \n\n`;
  // print debug log in console
  logger.debug (`prompt: ${prompt}`);
  logger.debug (`language: ${language}`);
  if (context) {
    // print first 100 characters of context in debug log
    logger.debug (`context: ${context.substring (0, 100)}`);
  }

  // get from local storage
  const disableSystemRole = localStorage.getItem (
    ID_DISABLE_SYSTEM_ROLE_CHECKBOX
  );

  const magicClick = document.getElementById (ID_MAGIC_CLICK_CHECKBOX).checked;
  if (magicClick) {
    logger.debug ('magicClick is checked');
    chrome.tabs.query ({active: true, currentWindow: true}, function (tabs) {
      {
        const userPrompt = `${prompt}. Below is the context.
      \n\n ${context} \n\n`;
        // replace the prompts in custom prompt input
        document.getElementById (ID_CUSTOM_PROMPT_INPUT).value = prompt;

        // Replace the prompt in your fetchOpenAI call with the custom prompt
        fetchOpenAI (
          // if disableSystemRole is checked, use userPrompt only
          disableSystemRole ? '' : outputLanguage,
          disableSystemRole ? `${outputLanguage} ${userPrompt}` : userPrompt
        ).catch (error => {
          logger.error ('Failed to process custom prompt.' + error.message);
          updateStatus ('Failed to process custom prompt.' + error.message);
        });
      }
      updateStatus ('Calling API, wait for response');
    });
  } else {
    // if context is not empty
    if (context && context !== '') {
      const userPrompt = `Please read the content of the following web page.
        Based on the information on that page, answer the following question: ${prompt}. Below is the text extracted from the web page.
        \n\n ${context} \n\n`;
      fetchOpenAI (
        // if disableSystemRole is checked, use userPrompt only
        disableSystemRole ? '' : systemPrompt,
        disableSystemRole
          ? `${systemPrompt} ${outputLanguage} ${userPrompt}`
          : `${outputLanguage} ${userPrompt}`
      ).catch (error => {
        logger.error ('Failed to process custom prompt.' + error.message);
        updateStatus ('Failed to process custom prompt.' + error.message);
      });
    } else {
      fetchOpenAI (
        disableSystemRole ? '' : systemPrompt,
        disableSystemRole
          ? `${systemPrompt} ${outputLanguage} ${prompt}`
          : `${outputLanguage} ${prompt}`
      ).catch (error => {
        logger.error ('Failed to process custom prompt.' + error.message);
        updateStatus ('Failed to process custom prompt.' + error.message);
      });
    }
  }

  updateStatus ('Submitting prompt: ' + prompt);
}
