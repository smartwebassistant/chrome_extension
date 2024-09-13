console.log ('Content script loading');
let writingContent = '';

// Create and append styles
const style = document.createElement ('style');
style.textContent = `
  .floating-buttons {
    position: absolute;
    display: flex;
    gap: 5px;
    z-index: 10000;
  }
  .floating-button {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    background-color: #007bff;
    color: white;
    font-size: 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;
document.head.appendChild (style);

chrome.runtime.onMessage.addListener (function (request, sender, sendResponse) {
  console.log ('Message received:', request);
  if (request.action === 'getText') {
    var mainContentText = document.getElementById ('main-content')
      ? document.getElementById ('main-content').innerText
      : document.body.innerText;
    sendResponse ({text: mainContentText});
  } else if (request.action === 'getHtml') {
    // Handle action to get HTML content
    var mainContentHtml = document.getElementById ('main-content')
      ? document.getElementById ('main-content').innerHTML
      : document.body.innerHTML;
    sendResponse ({html: mainContentHtml});
  } else if (request.action === 'selectElement') {
    // Handle action to select an element
    document.addEventListener ('click', handleClick, false);
  } else if (request.action === 'stopSelectingElement') {
    // Handle action to stop selecting an element
    document.removeEventListener ('click', handleClick, false);
    console.log ('Click event listener removed');
  } else if (request.action === 'getSelectedElementText') {
    // Handle action to get the text of the selected element
    if (currentObserver) {
      // use html to locate the element and get the text of its parent element
      sendResponse ({text: writingContent});
    } else {
      sendResponse ({text: ''});
    }
  }
});

let currentObserver = null;

function setupTextChangeListener (element) {
  if (currentObserver) {
    currentObserver.disconnect ();
    console.log ('Observer disconnected from previous element.');
  }

  currentObserver = new MutationObserver (mutations => {
    mutations.forEach (mutation => {
      if (mutation.type === 'characterData' || mutation.type === 'childList') {
        writingContent = element.innerText;
        console.log (
          'Text change detected in element with ID:',
          element.innerText
        );
      }
    });
  });

  const config = {childList: true, subtree: true, characterData: true};
  currentObserver.observe (element, config);
  console.log ('Observer connected to element with ID:', element.id);
}

function handleClick (event) {
  let element = event.target;

  // Traverse up the DOM tree to find a parent element with an ID, stopping at the <body> tag
  // while (element && element.tagName !== 'BODY' && !element.id) {
  //   element = element.parentNode;
  // }

  // Remove existing floating buttons
  const existingButtons = document.querySelector ('.floating-buttons');
  if (existingButtons) existingButtons.remove ();

  // Check if an element has been found
  if (element) {
    writingContent = element.innerText;
    console.log ('Clicked element:', element);
    // Add a red border to the element
    element.style.border = '2px solid green';
    setupTextChangeListener (element);
    // Remove the border after 1 second
    // setTimeout (() => {
    //   element.style.border = '';
    // }, 1000);

    // Create floating buttons
    const buttonsContainer = document.createElement ('div');
    buttonsContainer.className = 'floating-buttons';

    // AI Call button
    const aiCallButton = document.createElement ('button');
    aiCallButton.className = 'floating-button chatCompletion';
    aiCallButton.innerHTML = '💭';
    aiCallButton.title = 'Chat Completion';
    aiCallButton.addEventListener ('click', e => {
      e.stopPropagation ();
      console.log ('chatCompletion action triggered');
      chrome.runtime.sendMessage (
        {
          action: 'chatCompletion',
          elementInfo: {
            id: element.id,
            classes: Array.from (element.classList),
            text: element.innerText,
          },
        },
        response => {
          console.log ('chat completion response:', response);
        }
      );
    });
    buttonsContainer.appendChild (aiCallButton);

    // Overwrite Text button
    const overwriteButton = document.createElement ('button');
    overwriteButton.className = 'floating-button overwrite';
    overwriteButton.innerHTML = '⤵️';
    overwriteButton.title = 'Overwrite with AI Response';
    overwriteButton.addEventListener ('click', e => {
      e.stopPropagation ();

      const currentText = element.innerText.trim ();
      if (currentText) {
        if (
          confirm (
            `Do you want to overwrite the following text with an AI response?\n\n${currentText.substring (0, 100)}${currentText.length > 100 ? '...' : ''}`
          )
        ) {
          sendOverwriteRequest (element);
        } else {
          console.log ('Overwrite cancelled by user');
        }
      } else {
        sendOverwriteRequest (element);
      }
    });
    buttonsContainer.appendChild (overwriteButton);

    function sendOverwriteRequest (element) {
      chrome.runtime.sendMessage (
        {
          action: 'overwriteTextRequest',
          elementInfo: {
            id: element.id,
            classes: Array.from (element.classList),
            text: element.innerText,
          },
        },
        response => {
          console.log ('Overwrite response:', response);
          if (response && response.content) {
            element.innerHTML = response.content;
          } else if (response && response.error) {
            console.error ('Error in overwrite:', response.error);
            alert (`Failed to overwrite text: ${response.error}`);
          }
        }
      );
    }

    // Close button
    const closeButton = document.createElement ('button');
    closeButton.className = 'floating-button close';
    closeButton.innerHTML = '❌';
    closeButton.title = 'Close Buttons';
    closeButton.addEventListener ('click', e => {
      e.stopPropagation ();
      buttonsContainer.remove ();
      element.style.border = ''; // Remove the green border
    });
    buttonsContainer.appendChild (closeButton);

    // Position the buttons above the element
    const rect = element.getBoundingClientRect ();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;

    buttonsContainer.style.top = `${rect.top + scrollTop - 40}px`; // 40px above the element
    buttonsContainer.style.left = `${rect.left + scrollLeft + buttonsContainer.offsetWidth}px`;

    // Add buttons to the body
    document.body.appendChild (buttonsContainer);

    setupTextChangeListener (element);

    // Remove the border and buttons after 5 seconds
    setTimeout (() => {
      element.style.border = '';
    }, 5000);
  } else {
    console.error ('No parent element found');
  }

  // Optional: Remove this event listener after the click
  // document.removeEventListener('click', handleClick, false);
  // console.log('Click event listener removed');
}

// Register the event listener

console.log ('Content script loaded');
