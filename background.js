console.log ('Background script loaded...');

chrome.action.onClicked.addListener (tab => {
  chrome.scripting.executeScript ({
    target: {tabId: tab.id},
    files: ['content.js'],
  });
});

chrome.runtime.onMessage.addListener ((request, sender, sendResponse) => {
  if (request.action === 'chatCompletion') {
    console.log ('Chat completion request received');
    chrome.runtime.sendMessage ({
      action: 'handleChatCompletion',
      data: request,
    });
  } else if (request.action === 'overwriteText') {
    console.log ('Overwrite text request received');
    chrome.runtime.sendMessage (
      {
        action: 'handleOverwriteText',
        data: request,
      },
      response => {
        sendResponse (response);
      }
    );
  }
});
