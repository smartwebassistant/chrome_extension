import {initUI} from './ui.js';
import {ID_MARKDOWN_CONTENT} from '../scripts/constants.js';

document.addEventListener ('DOMContentLoaded', () => {
  initUI ();
});

chrome.runtime.onMessage.addListener ((request, sender, sendResponse) => {
  if (request.action === 'getMarkdownContent') {
    const markdownContent = document.getElementById (ID_MARKDOWN_CONTENT)
      .innerText;
    sendResponse ({content: markdownContent});
    return true; // Indicates that the response is sent asynchronously
  }
});
