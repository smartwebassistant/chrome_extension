// api.js
import {updateStatus, consoleLog, LOG_LEVELS} from './utils.js';
import {initMarkdown, appendMarkdown, displayMarkdown} from './markdown.js';

let currentController = null;
let requestCancelled = true;

cancelButton.addEventListener ('click', () => {
  consoleLog ('Cancelling the request...', LOG_LEVELS.DEBUG);
  if (currentController && currentController instanceof AbortController) {
    consoleLog ('Request aborted.', LOG_LEVELS.DEBUG);
    currentController.abort ();
    currentController = null;
    requestCancelled = true;
    updateStatus ('Request cancelled.');
    cancelButton.style.display = 'none';
  } else {
    consoleLog ('No request to cancel.', LOG_LEVELS.DEBUG);
  }
});

/**
 * Fetches a response from the OpenAI API.
  * @param {string} system_prompt - The system prompt to be sent to the API.
  * @param {string} user_prompt - The user prompt to be sent to the API.
  * @returns {void}
 */
export function fetchOpenAI (system_prompt, user_prompt) {
  //print debug log in console
  consoleLog (`system_prompt: ${system_prompt}`, LOG_LEVELS.DEBUG);
  consoleLog (`user_prompt: ${user_prompt}`, LOG_LEVELS.DEBUG);

  // Get settings from local storage
  chrome.storage.local.get (
    ['apiUrl', 'apiToken', 'modelName', 'maxToken', 'temperature', 'topP'],
    async function (settings) {
      if (chrome.runtime.lastError) {
        console.error ('Error fetching settings:', chrome.runtime.lastError);
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

      // Copy the API request payload to the clipboard if debug mode is enabled
      // if (document.getElementById ('debugModeCheckbox').checked) {
      //   if (navigator.clipboard) {
      //     navigator.clipboard
      //       .writeText (payloadString)
      //       .then (() => {
      //         updateStatus ('Payload copied to clipboard.', LOG_LEVELS.DEBUG);
      //       })
      //       .catch (err => {
      //         updateStatus ('Failed to copy payload to clipboard.');
      //         console.error ('Clipboard write failed:', err);
      //       });
      //   } else {
      //     updateStatus ('Clipboard API not available.');
      //   }
      // }

      // Define the requestOptions including the AbortController's signal
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.apiToken}`,
        },
        body: JSON.stringify (payload),
        signal: currentController.signal,
      };

      updateStatus ('Calling API ' + settings.apiUrl, LOG_LEVELS.DEBUG);
      cancelButton.style.display = 'block'; // Show cancel button

      try {
        requestCancelled = false;
        fetch (settings.apiUrl, requestOptions).then (response => {
          const statusCode = response.status; // Capture the HTTP status code
          const reader = response.body.getReader ();
          initMarkdown ();
          updateStatus (`Status : ${statusCode}. Waiting for response...`);
          reader
            .read ()
            .then (function pump({done, value}) {
              if (done) {
                updateStatus (`Stream completed.`);
                displayMarkdown (true);
                cancelButton.style.display = 'none'; // Hide cancel button
                return;
              }
              const chunk = new TextDecoder ('utf-8').decode (value);
              consoleLog ('Received chunk:' + chunk, LOG_LEVELS.DEBUG);
              if (chunk.startsWith ('ping')) {
                consoleLog ('Received ping:' + chunk, LOG_LEVELS.DEBUG);
                updateStatus ('ping received.');
              }

              if (!chunk.startsWith ('data:')) {
                consoleLog (
                  'Chunk does not start with "data:"' + chunk,
                  LOG_LEVELS.DEBUG
                );
              }

              try {
                //if there are multiple daata: in the chunk, split it loop through each data: and process it
                let list = [];
                list = chunk.split ('data:');
                consoleLog (
                  `Received ${list.length} chunks.`,
                  LOG_LEVELS.DEBUG
                );
                list.forEach (function (item) {
                  if (item) {
                    const obj = JSON.parse (item);
                    if (
                      obj.choices &&
                      obj.choices[0] &&
                      obj.choices[0].delta &&
                      obj.choices[0].delta.content
                    ) {
                      updateStatus ('Stream received data.');
                      const content = obj.choices[0].delta.content;
                      consoleLog (
                        'Received content:' + content,
                        LOG_LEVELS.DEBUG
                      );
                      appendMarkdown (content);
                      if (content.includes ('\n')) {
                        displayMarkdown ();
                      }
                    } else {
                      consoleLog (
                        'Received correct chunk format but no data:',
                        chunk,
                        LOG_LEVELS.DEBUG
                      );
                    }
                  }
                });
              } catch (error) {
                console.error ('Error processing JSON:', error);
                updateStatus ('Error processing chunk:', error);
              }
              return reader.read ().then (pump);
            })
            .catch (error => {
              console.error ('Error during fetch or reading:', error);
              if (error.name === 'AbortError') {
                updateStatus ('Request was cancelled.');
              }
              if (requestCancelled) {
                updateStatus ('Request was cancelled.');
              } else {
                updateStatus (`API call has failed: ${error.message}`);
              }
            });
        });
      } catch (error) {
        if (error.name === 'AbortError') {
          updateStatus ('Request was cancelled.');
        }
        if (requestCancelled) {
          updateStatus ('Request was cancelled.');
        } else {
          console.error ('Error during fetch or reading:', error);
          updateStatus (`API call failed: ${error.message}`);
        }
        cancelButton.style.display = 'none'; // Hide cancel button
      }
      //return;
    }
  );
}

function updateConnectionTestStatus (message, success) {
  const statusDisplay = document.getElementById ('apiConnectionTestStatus');
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

export function testApiConnection (apiUrl) {
  const controller = new AbortController ();
  const timeoutId = setTimeout (() => controller.abort (), 30000); // 30 seconds timeout

  updateConnectionTestStatus ('Testing connection...');

  fetch (apiUrl, {
    method: 'GET', // adjust as necessary for your API
    headers: {
      'Content-Type': 'application/json',
    },
    signal: controller.signal,
  })
    .then (response => {
      clearTimeout (timeoutId);

      if (response.ok || (response.status >= 405 && response.status < 500)) {
        // Considering 2xx and 4xx as successful cases
        updateConnectionTestStatus (`Connection successful!`, true);
        consoleLog (
          `Connection successful!${response.status} ${response.statusText}`,
          LOG_LEVELS.DEBUG
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
