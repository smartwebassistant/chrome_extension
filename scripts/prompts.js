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

  const systemPrompt = `${outputFormat} Output response in ${language} language. The prompt is:`;
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
