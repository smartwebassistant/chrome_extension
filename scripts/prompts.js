//prompts.js
// This file contains the functions that handle the submission of prompts
import {updateStatus, LOG_LEVELS} from './utils.js';
import {fetchOpenAI} from './api.js';
import {extractWebpageText} from './contentExtraction.js';
import {consoleLog} from './utils.js';
import {ID_INCLUDE_WEB_CONTENT_CHECKBOX} from './constants.js';
import {
  ID_OUTPUT_FORMAT_TEXT_RADIO,
  ID_OUTPUT_FORMAT_JSON_RADIO,
  ID_OUTPUT_FORMAT_MARKDOWN_RADIO,
  ID_OUTPUT_FORMAT_TABLE_RADIO,
  ID_DISABLE_SYSTEM_ROLE_CHECKBOX,
} from './constants.js';

export function handlePromptSubmission (prompt, language, currentController) {
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
  consoleLog (`prompt: ${prompt}`, LOG_LEVELS.DEBUG);
  consoleLog (`language: ${language}`, LOG_LEVELS.DEBUG);
  consoleLog (`currentController: ${currentController}`, LOG_LEVELS.DEBUG);

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
      disableSystemRole ? '' : systemPrompt,
      disableSystemRole
        ? `${systemPrompt} ${outputLanguage} ${prompt}`
        : `${outputLanguage} ${prompt}`,
      currentController
    ).catch (error => {
      updateStatus ('Failed to process custom prompt.' + error.message);
    });
  }
  updateStatus ('Submitting prompt: ' + prompt);
}
