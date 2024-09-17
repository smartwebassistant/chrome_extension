//prompts.js
// This file contains the functions that handle the submission of prompts
import {fetchOpenAI} from '../scripts/api.js';
import {
  extractWebpageText,
  extractElementText,
} from '../background/contentExtraction.js';
import {ID_INCLUDE_WEB_CONTENT_CHECKBOX} from '../scripts/constants.js';
import {
  ID_OUTPUT_FORMAT_TEXT_RADIO,
  ID_OUTPUT_FORMAT_JSON_RADIO,
  ID_OUTPUT_FORMAT_MARKDOWN_RADIO,
  ID_OUTPUT_FORMAT_TABLE_RADIO,
  ID_DISABLE_SYSTEM_ROLE_CHECKBOX,
  ID_MAGIC_CLICK_CHECKBOX,
  ID_CUSTOM_PROMPT_INPUT,
  ID_LANGUAGE_SELECT,
  ID_MARKDOWN_CONTENT,
} from '../scripts/constants.js';
import {createLogger} from '../scripts/logger.js';
import {updateStatus} from '../scripts/utils.js';
const logger = createLogger ();

chrome.runtime.onMessage.addListener ((request, sender, sendResponse) => {
  if (request.action === 'handleChatCompletion') {
    logger.debug ('Chat completion request received');
    handleChatCompletion (request.data, sender, sendResponse);
  } else if (request.action === 'handleOverwriteTextRequest') {
    logger.debug ('Overwrite text request received');
    handleOverwriteTextRequest (request.data, sender, sendResponse);
  }
  return true;
});

function handleChatCompletion (request, sender, sendResponse) {
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
}

function handleOverwriteTextRequest (request, sender, sendResponse) {
  // Request markdown content from the popup
  logger.debug ('Overwrite text request received');
  const markdownContent = document.getElementById (ID_MARKDOWN_CONTENT)
    .innerText;
  if (markdownContent) {
    // Overwrite the text in the chat box with the markdown content
    sendResponse ({content: markdownContent});
    logger.debug ('Overwrite text response was sent');
  } else {
    sendResponse ({error: 'No markdown content found'});
    console.error ('No markdown content found');
  }
}

export function handlePromptSubmission (
  prompt,
  language,
  context,
  currentController
) {
  const includeWebContent = document.getElementById (
    ID_INCLUDE_WEB_CONTENT_CHECKBOX
  ).checked;

  const outputFormat = document.querySelector (
    'input[name="outputFormat"]:checked'
  ).id;
  // Set the output format based on the radio button selected
  let outputPrompt = '';
  if (outputFormat === ID_OUTPUT_FORMAT_TEXT_RADIO) {
    outputPrompt = 'The output format should be in text. ';
  } else if (outputFormat === ID_OUTPUT_FORMAT_MARKDOWN_RADIO) {
    outputPrompt = `The output format should be in markdown, here is an example markdown: \n\n
      # Title
      ## Subtitle
      - List item 1
      - List item 2
      - List item 3
      \n
      `;
  } else if (outputFormat === ID_OUTPUT_FORMAT_TABLE_RADIO) {
    outputPrompt = `Output the response as a table. Here is an example table: \n\n';
    \`\`\`
  +-----------------------+-------------------+------+
  | Title                 | Author            | Year |
  +-----------------------+-------------------+------+
  | To Kill a Mockingbird | Harper Lee        | 1960 |
  | 1984                  | George Orwell     | 1949 |
  | Pride and Prejudice   | Jane Austen       | 1813 |
  | The Great Gatsby      | F. Scott Fitzgerald | 1925 |
  | The Catcher in the Rye | J.D. Salinger     | 1951 |
  +-----------------------+-------------------+------+ \n\n
  \`\`\`
    \n`;
  } else if (outputFormat === ID_OUTPUT_FORMAT_JSON_RADIO) {
    outputPrompt = `Output the response in JSON format. Here is an example JSON object: \n\n
    \`\`\`json
        {
      "name": "John Doe",
      "age": 30,
      "email": "johndoe@example.com",
      "phoneNumbers": [
        {
          "type": "home",
          "number": "212-555-1234"
        },
        {
          "type": "work",
          "number": "646-555-4567"
        }
      ],
      "address": {
        "street": "123 Elm St",
        "city": "Anytown",
        "state": "CA",
        "postalCode": "90210"
      }
    }
    \`\`\`
    \n`;
  }

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
  logger.debug (`currentController: ${currentController}`);

  // if ID_DISABLE_SYSTEM_ROLE_CHECKBOX
  const disableSystemRole = document.getElementById (
    ID_DISABLE_SYSTEM_ROLE_CHECKBOX
  ).checked;

  if (includeWebContent) {
    // If including webpage content
    chrome.tabs.query ({active: true, currentWindow: true}, function (tabs) {
      if (tabs[0] && tabs[0].id) {
        extractWebpageText (tabs[0].id, text => {
          const userPrompt = `Please read the content of the following web page.
    Based on the information on that page, answer the following question: ${prompt}. Below is the text extracted from the web page.
    \n\n ${text} \n\n`;

          // Replace the prompt in your fetchOpenAI call with the custom prompt
          fetchOpenAI (
            // if disableSystemRole is checked, use userPrompt only
            disableSystemRole ? '' : systemPrompt,
            disableSystemRole ? `${systemPrompt} ${userPrompt}` : userPrompt,
            currentController
          ).catch (error => {
            logger.error ('Failed to process custom prompt.' + error.message);
            updateStatus ('Failed to process custom prompt.' + error.message);
          });
        });
        updateStatus ('Calling API, wait for response');
      }
    });
  } else {
    // If not including webpage content
    const magicClick = document.getElementById (ID_MAGIC_CLICK_CHECKBOX)
      .checked;
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
            disableSystemRole ? `${outputLanguage} ${userPrompt}` : userPrompt,
            currentController
          ).catch (error => {
            logger.error ('Failed to process custom prompt.' + error.message);
            updateStatus ('Failed to process custom prompt.' + error.message);
          });
        }
        updateStatus ('Calling API, wait for response');
      });
    } else {
      fetchOpenAI (
        disableSystemRole ? '' : systemPrompt,
        disableSystemRole
          ? `${systemPrompt} ${outputLanguage} ${prompt}`
          : `${outputLanguage} ${prompt}`,
        currentController
      ).catch (error => {
        updateStatus ('Failed to process custom prompt.' + error.message);
      });
    }
  }
  updateStatus ('Submitting prompt: ' + prompt);
}
