// markdown.js
export function displayMarkdown () {
  const converter = new showdown.Converter ();

  const html = converter.makeHtml (markdownContent.innerHTML);
  markdownContent.innerHTML = html;
}

export function appendMarkdown (content) {
  markdownContent.innerHTML += content;
}

export function initMarkdown () {
  markdownContent.innerHTML = '';
}
