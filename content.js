chrome.runtime.onMessage.addListener (function (request, sender, sendResponse) {
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
  }
});
