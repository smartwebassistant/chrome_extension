// markdown.js
const converter = new showdown.Converter ();
const markdownContent = document.getElementById ('markdownContent');
export function displayMarkdown () {
  const html = converter.makeHtml (markdownContent.innerHTML);
  markdownContent.innerHTML = html;
}

export function appendMarkdown (content) {
  markdownContent.innerHTML += content;
}

export function initMarkdown () {
  markdownContent.innerHTML = '';
}
