// api.js

import {updateStatus} from './utils.js';
import {initMarkdown, appendMarkdown, displayMarkdown} from '../ui/markdown.js';
import {ID_API_CONNECTION_TEST_STATUS} from './constants.js';
import {createLogger} from './logger.js';

const logger = createLogger ('api.js');

let currentController = null;
let requestCancelled = true;

cancelButton.addEventListener ('click', () => {
  logger.debug ('Cancelling the request...');
  if (currentController && currentController instanceof AbortController) {
    logger.debug ('Request aborted.');
    currentController.abort ();
    currentController = null;
    requestCancelled = true;
    updateStatus ('Request cancelled.');
    cancelButton.style.display = 'none';
  } else {
    logger.debug ('No request to cancel.');
  }
});

/**
 * Fetches a response from the OpenAI API.
  * @param {string} system_prompt - The system prompt to be sent to the API.
  * @param {string} user_prompt - The user prompt to be sent to the API.
  * @returns {void}
 */
export function fetchOpenAI (system_prompt, user_prompt) {
  return new Promise ((resolve, reject) => {
    //print debug log in console
    logger.debug (`system_prompt: ${system_prompt}`);
    logger.debug (`user_prompt: ${user_prompt}`);
    let response = '';

    // Get settings from local storage
    chrome.storage.local.get (
      ['apiUrl', 'apiToken', 'modelName', 'maxToken', 'temperature', 'topP'],
      async function (settings) {
        if (chrome.runtime.lastError) {
          logger.error ('Error fetching settings:', chrome.runtime.lastError);
          updateStatus ('Failed to load settings. Please try again.');
          return;
        }
        // Cancel any ongoing fetch
        if (currentController && currentController instanceof AbortController) {
          currentController.abort ();
        }

        // Create a new AbortController
        currentController = new AbortController ();

        // Create messages array dynamically based on system_prompt
        const messages = [];
        // Check if system_prompt is not empty
        if (system_prompt) {
          messages.push ({
            role: 'system',
            content: system_prompt,
          });
        }

        messages.push ({
          role: 'user',
          content: user_prompt,
        });

        const payload = {
          model: settings.modelName,
          max_tokens: parseInt (settings.maxToken, 10), // Ensure max_tokens is an integer
          temperature: parseFloat (settings.temperature), // Ensure temperature is a float
          top_p: parseFloat (settings.topP), // Ensure top_p is a float
          messages: messages,
          stream: true, // Stream the response
        };

        // Convert payload to JSON string
        const payloadString = JSON.stringify (payload);
        const requestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${settings.apiToken}`,
          },
          body: JSON.stringify (payload),
          signal: currentController.signal,
        };

        updateStatus ('Calling API ' + settings.apiUrl);
        cancelButton.style.display = 'block'; // Show cancel button

        try {
          requestCancelled = false;
          fetch (settings.apiUrl, requestOptions).then (response => {
            const statusCode = response.status; // Capture the HTTP status code
            if (!response.ok) {
              logger.error (
                `API call failed: ${statusCode} ${response.statusText}`
              );
              updateStatus (
                `API call failed: ${statusCode} ${response.statusText}`
              );
              cancelButton.style.display = 'none'; // Hide cancel button
              return;
            }
            const reader = response.body.getReader ();
            initMarkdown ();
            updateStatus (`Status : ${statusCode}. Waiting for response...`);
            let buffer = '';

            function processChunk (text) {
              logger.debug ('Buffer: ' + buffer);
              buffer += text; // Append new text to buffer
              let parts = buffer.split ('\n'); // Split by lines
              // Process all lines except the last one, which might be incomplete
              logger.debug (`${parts.length} Parts found`);
              parts.slice (0, -1).forEach (line => {
                line = line.trim ();
                // if line length is 0, skip
                if (line.length === 0) {
                  return;
                }
                if (line.startsWith ('data:')) {
                  try {
                    let content = line.slice (5);
                    if (content.trim () === '[DONE]') {
                      logger.debug ('Received Done');
                      return;
                    }
                    const json = JSON.parse (content); // Parse JSON after 'data:'
                    updateStatus ('Stream received data.');
                    if (
                      json.choices &&
                      json.choices[0] &&
                      json.choices[0].delta &&
                      json.choices[0].delta.content
                    ) {
                      const content = json.choices[0].delta.content;
                      logger.debug ('Received content: ' + content);
                      appendMarkdown (content);
                      response += content;
                      if (content.includes ('\n')) {
                        displayMarkdown ();
                      }
                    }
                  } catch (error) {
                    logger.error ('Error parsing JSON:', error);
                  }
                } else if (line.startsWith ('ping:')) {
                  logger.debug ('Received ping:' + chunk);
                  updateStatus ('ping received.');
                } else {
                  logger.error (
                    'Unexpected line:' + line + '. length:' + line.length
                  );
                }
              });

              // Preserve the last, potentially incomplete line in the buffer
              buffer = parts.pop ();
            }

            reader.read ().then (function pump({done, value}) {
              if (done) {
                updateStatus (`Stream completed.`);
                displayMarkdown (true);
                cancelButton.style.display = 'none'; // Hide cancel button
                resolve (response);
                return;
              }
              const chunk = new TextDecoder ('utf-8').decode (value);
              logger.debug ('Received chunk:' + chunk);

              if (!chunk.startsWith ('data:')) {
                logger.debug ('Chunk does not start with "data:"' + chunk);
              }
              processChunk (chunk);
              return reader.read ().then (pump);
            });
          });
        } catch (error) {
          if (error.name === 'AbortError') {
            updateStatus ('Request was cancelled.');
          } else {
            logger.error ('Error during fetch or reading:', error);
            updateStatus (`API call failed: ${error.message}`);
          }
          cancelButton.style.display = 'none'; // Hide cancel button
        }
        //return;
      }
    );
  });
}

function updateConnectionTestStatus (message, success) {
  const statusDisplay = document.getElementById (ID_API_CONNECTION_TEST_STATUS);
  statusDisplay.textContent = message;

  // Clear existing alert classes and set visibility
  statusDisplay.className = 'alert small';
  statusDisplay.style.display = 'block'; // Make the alert visible

  // Add the appropriate Bootstrap alert class based on success
  if (success === true) {
    statusDisplay.classList.add ('alert-success');
  } else if (success === false) {
    statusDisplay.classList.add ('alert-danger');
  } else {
    statusDisplay.classList.add ('alert-light');
  }
}

export function testApiConnection (apiUrl, apiToken) {
  const controller = new AbortController ();
  const timeoutId = setTimeout (() => controller.abort (), 30000); // 30 seconds timeout

  updateConnectionTestStatus ('Testing connection...');
  //print api url and first 4 characters **** last 4 characters of api token in debug log
  logger.debug (
    `Testing connection... ${apiUrl} ${apiToken.substring (0, 4)}****${apiToken.slice (-4)}`
  );

  fetch (apiUrl, {
    method: 'GET', // adjust as necessary for your API
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiToken}`,
    },
    signal: controller.signal,
  })
    .then (response => {
      clearTimeout (timeoutId);

      if (response.ok || (response.status >= 404 && response.status < 500)) {
        // Considering 2xx and 4xx as successful cases
        updateConnectionTestStatus (`Connection successful!`, true);
        logger.debug (
          `Connection successful!${response.status} ${response.statusText}`
        );
      } else if (response.status >= 500) {
        // Handling server errors separately
        updateConnectionTestStatus (
          `Server error encountered: ${response.status} ${response.statusText}`,
          false
        );
      } else {
        updateConnectionTestStatus (
          `Connection failed: ${response.status} ${response.statusText}`,
          false
        );
      }
    })
    .catch (error => {
      clearTimeout (timeoutId);
      if (error.name === 'AbortError') {
        updateConnectionTestStatus ('Connection timed out.', false);
      } else {
        updateConnectionTestStatus (
          `Connection failed: ${error.message}`,
          false
        );
      }
    });
}
