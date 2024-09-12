console.log ('Content script loading');
let writingContent = '';

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
  while (element && element.tagName !== 'BODY' && !element.id) {
    element = element.parentNode;
  }

  // Check if an element with an ID has been found
  if (element && element.id) {
    console.log ('Clicked element ID:', element.id);
    // Add a red border to the element
    element.style.border = '2px solid green';
    setupTextChangeListener (element);
    // Remove the border after 1 second
    setTimeout (() => {
      element.style.border = '';
    }, 1000);
  } else {
    console.log ('No parent element with an ID found');
  }

  // Optional: Remove this event listener after the click
  // document.removeEventListener('click', handleClick, false);
  // console.log('Click event listener removed');
}

// Register the event listener

console.log ('Content script loaded');
