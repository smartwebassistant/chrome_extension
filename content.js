// chrome.runtime.onMessage.addListener (function (request, sender, sendResponse) {
//   if (request.action == 'getText') {
//     let allText = document.body.innerText;
//     sendResponse ({text: allText});
//   }
// });

chrome.runtime.onMessage.addListener (function (request, sender, sendResponse) {
  if (request.action === 'getText') {
    var mainContentText = document.getElementById ('main-content')
      ? document.getElementById ('main-content').innerText
      : document.body.innerText;
    sendResponse ({text: mainContentText});
  }
});
