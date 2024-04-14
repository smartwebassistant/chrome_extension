chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action == "getText") {
      let allText = document.body.innerText;
      sendResponse({text: allText});
    }
  });
  