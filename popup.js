document.addEventListener ('DOMContentLoaded', () => {
  const statusDisplay = document.getElementById ('status');
  const markdownContent = document.getElementById ('markdownContent');

  function displayMarkdown () {
    const html = converter.makeHtml (markdownContent.innerHTML);
    markdownContent.innerHTML = html;
  }

  function appendMarkdown (content) {
    markdownContent.innerHTML += content;
  }

  function initMarkdown () {
    markdownContent.innerHTML = '';
  }

  function updateStatus (message) {
    statusDisplay.textContent = message;
  }
  let currentController = null;
  const cancelButton = document.getElementById ('cancelButton');
  const configButton = document.getElementById ('config');
  const configPopup = document.getElementById ('configPopup');
  const apiUrlInput = document.getElementById ('apiUrlInput');
  const apiTokenInput = document.getElementById ('apiTokenInput');
  const modelNameInput = document.getElementById ('modelNameInput');
  const maxTokenInput = document.getElementById ('maxTokenInput');
  const temperatureInput = document.getElementById ('temperatureInput');
  const topPInput = document.getElementById ('topPInput');
  const saveApiUrlButton = document.getElementById ('saveApiUrlButton');
  const customPromptInput = document.getElementById ('customPromptInput');
  const languageSelect = document.getElementById ('languageSelect');
  const submitCustomPromptButton = document.getElementById (
    'submitCustomPromptButton'
  );
  const storedPromptButtons = [
    document.getElementById ('storedPrompt1Button'),
    document.getElementById ('storedPrompt2Button'),
    document.getElementById ('storedPrompt3Button'),
    document.getElementById ('storedPrompt4Button'),
    document.getElementById ('storedPrompt5Button'),
  ];
  const storedPromptInputs = [
    document.getElementById ('storedPrompt1Input'),
    document.getElementById ('storedPrompt2Input'),
    document.getElementById ('storedPrompt3Input'),
    document.getElementById ('storedPrompt4Input'),
    document.getElementById ('storedPrompt5Input'),
  ];
  const storedPromptStorages = [
    document.getElementById ('storedPrompt1Storage'),
    document.getElementById ('storedPrompt2Storage'),
    document.getElementById ('storedPrompt3Storage'),
    document.getElementById ('storedPrompt4Storage'),
    document.getElementById ('storedPrompt5Storage'),
  ];

  // Load the last used custom prompt from local storage
  const lastCustomPrompt = localStorage.getItem ('lastCustomPrompt');
  if (lastCustomPrompt) {
    // Checks if lastCustomPrompt is not null and not an empty string
    customPromptInput.value = lastCustomPrompt;
  }

  // Load settings from local storage
  chrome.storage.local.get (
    [
      'apiUrl',
      'apiToken',
      'modelName',
      'maxToken',
      'temperature',
      'topP',
      'storedPrompt1',
      'storedPrompt2',
      'storedPrompt3',
      'storedPrompt4',
      'storedPrompt5',
    ],
    function (result) {
      apiUrlInput.value =
        result.apiUrl || 'https://api.openai.com/v1/chat/completions';
      document.getElementById (
        'apiUrlStorage'
      ).textContent = `(Stored: ${result.apiUrl || 'None'})`;

      apiTokenInput.value = result.apiToken || '';
      modelNameInput.value = result.modelName || 'gpt-4o';
      document.getElementById (
        'modelNameStorage'
      ).textContent = `(Stored: ${result.modelName || 'None'})`;

      maxTokenInput.value = result.maxToken || 4096;
      document.getElementById (
        'maxTokenStorage'
      ).textContent = `(Stored: ${result.maxToken || 'None'})`;

      temperatureInput.value = result.temperature || 0.7;
      document.getElementById (
        'temperatureStorage'
      ).textContent = `(Stored: ${result.temperature || 'None'})`;

      topPInput.value = result.topP || 0.9;
      document.getElementById (
        'topPStorage'
      ).textContent = `(Stored: ${result.topP || 'None'})`;

      // Load stored prompts from local storage in a loop
      storedPromptInputs.forEach ((input, index) => {
        input.value = result[`storedPrompt${index + 1}`] || '';
        document.getElementById (
          `storedPrompt${index + 1}Storage`
        ).textContent = `(Stored: ${result[`storedPrompt${index + 1}`].slice (0, 20) || 'None'})`;
        //update the button text with the first 10 characters of the prompt
        storedPromptButtons[index].title =
          result[`storedPrompt${index + 1}`].slice (0, 100) || '';
      });

      updateStatus ('Ready.');
    }
  );

  // Show or hide the configuration popup
  configButton.addEventListener ('click', () => {
    configPopup.style.display = configPopup.style.display === 'block'
      ? 'none'
      : 'block';
  });

  const testConnectionButton = document.getElementById ('testConnectionButton');

  function isValidUrl (url) {
    const pattern = new RegExp (
      '^(https?:\/\/)?' + // protocol
      '(([a-z\\d]([a-z\\d-]*[a-z\\d])*)' + // hostname
      '(\\.([a-z\\d]([a-z\\d-]*[a-z\\d])*))*' + // domain name
      '|((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i'
    ); // fragment locator
    return !!pattern.test (url);
  }

  testConnectionButton.addEventListener ('click', () => {
    const apiUrl = apiUrlInput.value;
    if (!isValidUrl (apiUrl)) {
      updateStatus ('Please enter a valid API URL.');
      return;
    }
    testApiConnection (apiUrl);
  });

  function testApiConnection (apiUrl) {
    const controller = new AbortController ();
    const timeoutId = setTimeout (() => controller.abort (), 30000); // 30 seconds timeout

    updateStatus ('Testing connection...');

    fetch (apiUrl, {
      method: 'GET', // adjust as necessary for your API
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    })
      .then (response => {
        clearTimeout (timeoutId);
        if (response.ok || (response.status >= 400 && response.status < 500)) {
          // Considering 2xx and 4xx as successful cases
          updateStatus (`Connection successful! Status: ${response.status}`);
        } else if (response.status >= 500) {
          // Handling server errors separately
          updateStatus (
            `Server error encountered: ${response.status} ${response.statusText}`
          );
        }
      })
      .catch (error => {
        clearTimeout (timeoutId);
        if (error.name === 'AbortError') {
          updateStatus ('Connection test timed out.');
        } else {
          updateStatus (`Connection failed: ${error.message}`);
        }
      });
  }

  // Save configuration settings
  saveApiUrlButton.addEventListener ('click', () => {
    // Check if required fields are not empty
    if (
      !apiUrlInput.value.trim () ||
      !maxTokenInput.value.trim () ||
      !temperatureInput.value.trim () ||
      !topPInput.value.trim ()
    ) {
      updateStatus ('Please fill in all required * fields.');
      return;
    }
    if (!isValidUrl (apiUrlInput.value)) {
      updateStatus ('Please enter a valid API URL.');
      return;
    }

    // Ensure that numeric inputs are not only positive but also within expected ranges
    const maxTokens = parseInt (maxTokenInput.value, 10);
    const temperature = parseFloat (temperatureInput.value);
    const topP = parseFloat (topPInput.value);

    if (isNaN (maxTokens) || maxTokens <= 0) {
      updateStatus ('Max tokens must be a positive number.');
      return;
    }

    if (isNaN (temperature) || temperature < 0 || temperature > 1) {
      updateStatus ('Temperature must be a number between 0 and 1.');
      return;
    }

    if (isNaN (topP) || topP < 0 || topP > 1) {
      updateStatus ('Top P must be a number between 0 and 1.');
      return;
    }
    chrome.storage.local.set (
      {
        apiUrl: apiUrlInput.value,
        apiToken: apiTokenInput.value,
        modelName: modelNameInput.value,
        maxToken: maxTokenInput.value,
        temperature: temperatureInput.value,
        topP: topPInput.value,
        storedPrompt1: storedPrompt1Input.value,
        storedPrompt2: storedPrompt2Input.value,
        storedPrompt3: storedPrompt3Input.value,
        storedPrompt4: storedPrompt4Input.value,
        storedPrompt5: storedPrompt5Input.value,
      },
      () => {
        document.getElementById (
          'apiUrlStorage'
        ).textContent = `(Stored: ${apiUrlInput.value})`;
        document.getElementById (
          'modelNameStorage'
        ).textContent = `(Stored: ${modelNameInput.value})`;
        document.getElementById (
          'maxTokenStorage'
        ).textContent = `(Stored: ${maxTokenInput.value})`;
        document.getElementById (
          'temperatureStorage'
        ).textContent = `(Stored: ${temperatureInput.value})`;
        document.getElementById (
          'topPStorage'
        ).textContent = `(Stored: ${topPInput.value})`;

        // Loop through stored prompts to update both storage text and button title
        storedPromptInputs.forEach ((input, index) => {
          if (index < storedPromptStorages.length) {
            storedPromptStorages[
              index
            ].textContent = `(Stored: ${input.value.slice (0, 20)})`;
          }
          if (index < storedPromptButtons.length) {
            storedPromptButtons[index].title = input.value.slice (0, 100);
          }
        });

        //configPopup.style.display = 'none'; // Optionally hide the popup after saving
        updateStatus ('Settings saved successfully.');
      }
    );
  });

  const defaultLanguage =
    localStorage.getItem ('selectedLanguage') || 'English';

  // Set the default selected language from local storage or default to English
  languageSelect.value = defaultLanguage;

  // Event listener to update local storage when the user changes the selection
  languageSelect.addEventListener ('change', function () {
    localStorage.setItem ('selectedLanguage', this.value);
  });

  const converter = new showdown.Converter ();

  function handlePromptSubmission (prompt, language) {
    chrome.tabs.query ({active: true, currentWindow: true}, function (tabs) {
      if (tabs[0] && tabs[0].id) {
        extractWebpageText (tabs[0].id, text => {
          // Replace the prompt in your fetchOpenAI call with the custom prompt
          fetchOpenAI (
            ``,
            `${prompt}. below is the text of the web page: ${text}. Output response in ${language} language and markdown format.`
          ).catch (error => {
            updateStatus ('Failed to process custom prompt.' + error.message);
          });
        });
        updateStatus ('Calling API, wait for response');
      }
    });
    updateStatus ('Submitting prompt: ' + prompt);
  }

  storedPromptButtons.forEach ((button, index) => {
    button.addEventListener ('click', () => {
      const promptInput = storedPromptInputs[index];
      const selectedLanguage = languageSelect.value;
      if (!promptInput.value.trim ()) {
        updateStatus (
          `No stored prompt is found. Please save your prompt to stored prompt ${index + 1} in Settings.`
        );
        return;
      }
      // Set the custom prompt input to the content of the selected stored prompt
      customPromptInput.value = promptInput.value;
      handlePromptSubmission (promptInput.value, selectedLanguage);
    });
  });

  submitCustomPromptButton.addEventListener ('click', () => {
    const customPrompt = customPromptInput.value;
    const selectedLanguage = languageSelect.value;
    if (!customPrompt) {
      updateStatus ('Please enter a custom prompt.');
      return;
    }

    localStorage.setItem ('lastCustomPrompt', customPrompt);
    console.log ('Custom prompt saved:', customPrompt);

    handlePromptSubmission (customPrompt, selectedLanguage);
  });

  cancelButton.addEventListener ('click', () => {
    if (currentController) {
      currentController.abort ();
      currentController = null;
      updateStatus ('Request cancelled.');
      cancelButton.style.display = 'none';
    }
  });

  /**
 * Fetches a response from the OpenAI API.
 * @param {string} system_prompt - The system prompt to send.
 * @param {string} user_prompt - The user prompt to send.
 * @returns {Promise<void>} - A promise that resolves when the API call is complete.
 * @throws {Error} - If the API call fails.
 */
  function fetchOpenAI (system_prompt, user_prompt) {
    chrome.storage.local.get (
      ['apiUrl', 'apiToken', 'modelName', 'maxToken', 'temperature', 'topP'],
      function (settings) {
        if (chrome.runtime.lastError) {
          console.error ('Error fetching settings:', chrome.runtime.lastError);
          updateStatus ('Failed to load settings. Please try again.');
          return;
        }
        // Cancel any ongoing fetch
        if (currentController) {
          currentController.abort ();
        }

        // Create a new AbortController
        currentController = new AbortController ();

        // Create messages array dynamically based on system_prompt
        const messages = [];
        if (system_prompt) {
          // Check if system_prompt is not empty
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

        // Copy the API request payload to the clipboard
        if (navigator.clipboard) {
          navigator.clipboard
            .writeText (payloadString)
            .then (() => {
              updateStatus ('Payload copied to clipboard.');
            })
            .catch (err => {
              updateStatus ('Failed to copy payload to clipboard.');
              console.error ('Clipboard write failed:', err);
            });
        } else {
          updateStatus ('Clipboard API not available.');
        }

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

        updateStatus ('Calling API ' + settings.apiUrl);
        cancelButton.style.display = 'block'; // Show cancel button

        fetch (settings.apiUrl, requestOptions)
          .then (response => {
            const reader = response.body.getReader ();
            initMarkdown ();
            function read () {
              updateStatus ('Streaming');
              reader
                .read ()
                .then (({done, value}) => {
                  if (done) {
                    updateStatus ('Stream completed.');
                    displayMarkdown ();
                    cancelButton.style.display = 'none'; // Hide cancel button
                    return;
                  }

                  let chunk = new TextDecoder ('utf-8').decode (value);
                  // Check if the chunk contains the termination pattern "[DONE]"
                  if (chunk.includes ('[DONE]')) {
                    updateStatus ('Stream completed.');
                    displayMarkdown ();
                    cancelButton.style.display = 'none'; // Hide cancel button
                    return;
                  }

                  if (chunk.startsWith ('ping')) {
                    // Log the ping or simply ignore it
                    console.log ('Received ping:', chunk);
                    read (); // Continue reading without processing this as data
                    return;
                  }

                  // Process other chunks that do not start with "data:"
                  if (!chunk.startsWith ('data:')) {
                    console.log ('Received data:', chunk);
                    read (); // Continue reading to get more data
                    return;
                  }

                  try {
                    // Attempt to parse and handle JSON data
                    const jsonPart = chunk.split ('data: ')[1]; // Splitting on 'data:' if used as a prefix in streamed data
                    if (jsonPart) {
                      const obj = JSON.parse (jsonPart);
                      if (obj.choices[0].delta) {
                        const content = obj.choices[0].delta.content;
                        appendMarkdown (content);
                        if (content.includes ('\n')) {
                          displayMarkdown ();
                        }
                      } else {
                        updateStatus ('No delta content found in response.');
                        read ();
                        return;
                      }
                      // Recursively continue reading the stream
                      read ();
                    } else {
                      // Log non-JSON data and continue reading the stream
                      updateStatus ('Non-JSON data:', chunk);
                      read ();
                      return;
                    }
                  } catch (error) {
                    // Log non-fatal errors and continue reading the stream
                    updateStatus ('Error processing chunk:', error);
                    read ();
                  }
                })
                .catch (error => {
                  if (error.name === 'AbortError') {
                    updateStatus ('Request was cancelled.');
                  } else {
                    console.error ('Stream reading failed:', error);
                    updateStatus (`Streaming failed: ${error.message}`);
                  }
                  cancelButton.style.display = 'none'; // Hide cancel button
                });
            }
            read ();
          })
          .catch (error => {
            if (error.name === 'AbortError') {
              updateStatus ('Request was cancelled.');
            } else {
              console.error ('Error:', error);
              updateStatus (`API call failed: ${error.message}`);
            }
            cancelButton.style.display = 'none'; // Hide cancel button
          });
        //return;
      }
    );
  }

  function handleResponseError (operation) {
    updateStatus (`Please refresh the webpage of active tab.`);
    console.error (`${operation} Error:`, chrome.runtime.lastError.message);
  }

  function extractWebpageText (tabId, processFunction) {
    updateStatus ('Extracting text from the webpage...');
    chrome.tabs.sendMessage (tabId, {action: 'getText'}, function (response) {
      if (chrome.runtime.lastError || !response) {
        handleResponseError ('Extraction');
        return;
      }
      processFunction (response.text);
    });
  }

  chrome.runtime.onMessage.addListener (function (
    request,
    sender,
    sendResponse
  ) {
    if (request.action === 'getText') {
      var mainContentText = document.getElementById ('main_content')
        ? document.getElementById ('main_content').innerText
        : 'No content found';
      sendResponse ({text: mainContentText});
    }
  });
});
