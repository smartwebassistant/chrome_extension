import {consoleLog, LOG_LEVELS} from './utils.js';

// Define the 'codeblocks' extension to correct HTML formatting for code blocks
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

// markdown.js
const converter = new showdown.Converter ({
  ghCodeBlocks: true, // Enable GitHub flavored markdown (GFM)
  simplifiedAutoLink: true,
  literalMidWordUnderscores: true,
  strikethrough: true,
  tables: true,
  extensions: ['codeblocks'],
});

const markdownContent = document.getElementById ('markdownContent');
let contentBuffer = ''; // Buffer to hold Markdown content until ready for conversion

export function displayMarkdown (forceDisplay = false) {
  if (!forceDisplay) {
    if (isNotCompleteBlock (contentBuffer)) {
      return; // Don't display incomplete code blocks
    }
    if (isIncompleteTable (contentBuffer)) {
      return; // Don't display incomplete tables
    }
  }
  consoleLog (
    'Displaying Markdown content...' + contentBuffer,
    LOG_LEVELS.DEBUG
  );
  const html = converter.makeHtml (markdownContent.innerHTML);
  markdownContent.innerHTML = html;
  contentBuffer = ''; // Clear the content buffer
}

export function appendMarkdown (content) {
  contentBuffer += content;
  markdownContent.innerHTML += content;
}

export function initMarkdown () {
  markdownContent.innerHTML = '';
  contentBuffer = ''; // Also clear the content buffer
}

function isNotCompleteBlock (buffer) {
  // Check for unmatched code block ticks
  const codeTicks = (buffer.match (/```/g) || []).length;
  return codeTicks % 2 !== 0; // Returns true if there's an odd number of ticks
  consoleLog ('Incomplete code block detected.' + buffer, LOG_LEVELS.DEBUG);
}

function isIncompleteTable (buffer) {
  const lines = buffer.trim ().split ('\n');
  const lastLine = lines[lines.length - 1];
  // Check if the last line contains more than two pipe characters
  const count = (lastLine.match (/\|/g) || []).length;
  return count > 2; // Return true if more than two pipes, suggesting it's part of a table
}
