chrome.runtime.onMessage.addListener (function (request, sender, sendResponse) {
  if (request.action === 'getText') {
    if (window.location.href.startsWith ('https://docs.google.com')) {
      sendResponse ({text: getDocText ()});
    } else {
      var mainContentText = document.getElementById ('main-content')
        ? document.getElementById ('main-content').innerText
        : document.body.innerText;
      sendResponse ({text: mainContentText});
    }
  }
});

// Following logic is for accessing Google Docs content
// Calls the extractor via synchronous DOM messaging
// function getDocText () {
//   let res;
//   window.addEventListener (
//     `${eventId}res`,
//     e => {
//       res = e.detail;
//     },
//     {once: true}
//   );
//   window.dispatchEvent (new CustomEvent (eventId));
//   return res;
// }

// Check the URL of the current tab to determine which script to inject.
// if (window.location.href.startsWith ('https://docs.google.com')) {
//   // Google Docs specific script
//   var s = document.createElement ('script');
//   s.src = chrome.runtime.getURL ('injector.js'); // This should be your Google Docs specific script
//   s.onload = function () {
//     this.remove ();
//   };
//   (document.head || document.documentElement).appendChild (s);
// }
