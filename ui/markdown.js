// markdown.js

import {ID_MARKDOWN_CONTENT} from '../scripts/constants.js';
import {createLogger} from '../scripts/logger.js';

const logger = createLogger ();

// Define the 'codeblocks' extension to make the code blocks more readable
function codeblocks () {
  return [
    {
      type: 'output',
      filter: function (text) {
        // Replace <p><code> with <pre><code> and </code></p> with </code></pre> to properly format blocks
        return text
          .replace (/<p><code>/g, '<pre><code>')
          .replace (/<\/code><\/p>/g, '</code></pre>');
      },
    },
  ];
}
// Register the custom extension
showdown.extension ('codeblocks', codeblocks);

// Create a new Showdown converter instance
const converter = new showdown.Converter ({
  ghCodeBlocks: true, // Enable GitHub flavored markdown (GFM)
  simplifiedAutoLink: true,
  literalMidWordUnderscores: true,
  strikethrough: true,
  tables: true,
  extensions: ['codeblocks'],
});

// Get the markdown content element
const markdownContent = document.getElementById (ID_MARKDOWN_CONTENT);
// Buffer to hold Markdown content (chunks from stream) until ready for conversion
let contentBuffer = '';

// Function to convert the content to HTML and display it
// the original logic was to call displayMarkdown only when receving \n, but
// some of the markdown like tables and code blocks are not complete until the last chunk
// so now defined two functions to determine if the block is complete for code blocks and tables
// but if it's last chunk, we will force display it which might not be elegent but works
export function displayMarkdown (forceDisplay = false) {
  if (!forceDisplay) {
    if (isNotCompleteBlock (contentBuffer)) {
      return; // Don't display incomplete code blocks
    }
    if (isIncompleteTable (contentBuffer)) {
      return; // Don't display incomplete tables
    }
  }
  logger.debug ('Displaying Markdown content...' + contentBuffer);

  // Because the LLM takes time to finish outputing the texts, have to use stream to display each chunk while receiving
  // So the chunk will be appended to innerHTML so that it will show up in <div id="markdownContent"> but in raw markdown format
  // in the same time the raw markdown will be buffered in contentBuffer
  // Then when the last chunk is received or new line is received, the buffered content will be converted to html and appended
  // to the previous converted html content which is why in the code it searches for the last html tag and truncate the text after that
  // obvisously the buffered content will be flushed after that
  const html = converter.makeHtml (contentBuffer);

  // find out the last html tag in the innerHTML, truncate the text after that and append the new html
  const lastTagIndex = markdownContent.innerHTML.lastIndexOf ('</');
  if (lastTagIndex > 0) {
    markdownContent.innerHTML = markdownContent.innerHTML.substring (
      0,
      lastTagIndex
    );
  } else {
    markdownContent.innerHTML = '';
  }
  markdownContent.innerHTML += html;
  addCopyButtons (); // Call to add copy buttons to all code blocks
  contentBuffer = ''; // Clear the content buffer
}

// Function to append received chunks (markdown content)
// to the content buffer and display it
export function appendMarkdown (content) {
  contentBuffer += content;
  markdownContent.innerHTML += content; // display the content as it comes in
}

export function initMarkdown () {
  markdownContent.innerHTML = '';
  contentBuffer = ''; // Also clear the content buffer
}

// Function to determine if the buffer contains an incomplete code block
function isNotCompleteBlock (buffer) {
  // Check for unmatched code block ticks
  const codeTicks = (buffer.match (/```/g) || []).length;
  return codeTicks % 2 !== 0; // Returns true if there's an odd number of ticks
  logger.debug ('Incomplete code block detected.' + buffer);
}

// Function to determine if the buffer contains an incomplete table
function isIncompleteTable (buffer) {
  const lines = buffer.trim ().split ('\n');
  const lastLine = lines[lines.length - 1];
  // Check if the last line contains more than two pipe characters
  const count = (lastLine.match (/\|/g) || []).length;
  return count > 2; // Return true if more than two pipes, suggesting it's part of a table
}

// Function to add headers and copy buttons to all code blocks
function addCopyButtons () {
  const codeBlocks = document.querySelectorAll ('pre code');
  codeBlocks.forEach (code => {
    const pre = code.parentNode;
    const language = code.className.split ('-')[1] || ''; // Assumes class like 'language-python'

    // Create the header row and append it to the <pre>
    const header = document.createElement ('div');
    header.className = 'code-header'; // Add a class for styling
    if (language) {
      // Only add language text if it's present
      header.textContent = language.toUpperCase (); // Display the language
    }

    // Create the copy button as a div with an img inside
    const button = document.createElement ('div');
    button.className = 'div-pointer';
    button.title = 'Copy to clipboard';
    const img = document.createElement ('img');
    img.src = '../images/copy.svg'; // Initial copy icon
    img.alt = 'Copy';
    img.style.width = '12px';
    img.style.height = '12px';
    button.appendChild (img);

    button.onclick = function () {
      copyCodeToClipboard (button, code, img);
    };

    // Append the button to the header
    header.appendChild (button);
    pre.insertBefore (header, code);
  });
}

// Function to copy code block content to clipboard and change icon
function copyCodeToClipboard (button, block, img) {
  const range = document.createRange ();
  range.selectNodeContents (block);
  const selection = window.getSelection ();
  selection.removeAllRanges ();
  selection.addRange (range);
  try {
    const successful = document.execCommand ('copy');
    img.src = successful ? '../images/check2-square.svg' : '../images/copy.svg'; // Change icon based on success

    // Reset the icon after 10 seconds
    setTimeout (() => {
      img.src = '../images/copy.svg';
    }, 10000);
  } catch (err) {
    console.error ('Failed to copy text', err);
  }
  selection.removeAllRanges (); // Remove selection after copy
}
