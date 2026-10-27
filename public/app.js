const form = document.querySelector('#post-form');
const message = document.querySelector('#message');
const count = document.querySelector('#char-count');
const mode = document.body.dataset.mode;

// A harmless payload that only displays an alert in this local lab.
const demoPayload = "<script>alert('Stored XSS demo')</script>";

document.querySelector('#insert-payload').addEventListener('click', () => {
  message.value = demoPayload;
  updateCount();
  message.focus();
});

function updateCount() {
  count.textContent = `${message.value.length} / 500`;
}
message.addEventListener('input', updateCount);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = new URLSearchParams(new FormData(form));
  const response = await fetch(`/posts?mode=${mode}`, { method: 'POST', body });
  if (response.redirected) {
    window.location.href = response.url;
    return;
  }
  if (response.ok) window.location.href = `/?mode=${mode}#discussion`;
  else alert('Could not publish the comment. Please try again.');
});

const examples = {
  vulnerable: {
    filename: 'server.js · vulnerable renderer', number: '01', title: 'The vulnerable line',
    text: 'The stored message is interpolated directly into an HTML template. If it contains markup, the browser parses that markup. A script element can therefore execute when another user loads the page.',
    viva: 'Stored XSS persists on the server and affects users who later view the stored content. The dangerous operation is inserting untrusted data into an HTML context without encoding.',
    code: `// renderPosts() — intentionally unsafe branch\nconst message = post.message;\n\nreturn \`<article class="post-card">\n  <div class="post-message">\n    \${message}\n  </div>\n</article>\`;`
  },
  protected: {
    filename: 'server.js · protected renderer', number: '02', title: 'The security fix',
    text: 'The protected branch runs the stored message through escapeHtml() before placing it inside the HTML element. Characters such as < and > become entities, so the browser displays them instead of treating them as tags.',
    viva: 'The same input is still stored. The mitigation is applied at the output boundary, in the correct HTML text context.',
    code: `// renderPosts() — protected branch\nconst message = escapeHtml(post.message);\n\nreturn \`<article class="post-card">\n  <div class="post-message">\n    \${message}\n  </div>\n</article>\`;`
  },
  helper: {
    filename: 'server.js · escapeHtml()', number: '03', title: 'How encoding works',
    text: 'This helper replaces five HTML-significant characters. For example, < becomes &amp;lt;. The browser renders the characters visibly as text and does not create an HTML element from them.',
    viva: 'Output encoding must match the output context. This helper is for HTML text nodes; JavaScript, CSS, URL and attribute contexts need their own safe handling.',
    code: `function escapeHtml(value) {\n  return String(value)\n    .replaceAll('&', '&amp;')\n    .replaceAll('<', '&lt;')\n    .replaceAll('>', '&gt;')\n    .replaceAll('"', '&quot;')\n    .replaceAll("'", '&#39;');\n}`
  }
};

function showCode(key) {
  const item = examples[key];
  document.querySelector('#filename').textContent = item.filename;
  document.querySelector('#explain-number').textContent = item.number;
  document.querySelector('#explain-title').textContent = item.title;
  document.querySelector('#explain-text').textContent = item.text;
  document.querySelector('#viva-text').textContent = item.viva;
  const code = document.querySelector('#code-content');
  code.replaceChildren();
  item.code.split('\n').forEach((line, index) => {
    const row = document.createElement('span');
    row.className = 'code-line';
    const number = document.createElement('span');
    number.className = 'line-number';
    number.textContent = String(index + 1).padStart(2, '0');
    const text = document.createElement('span');
    text.className = 'line-text';
    text.textContent = line || ' ';
    row.append(number, text);
    code.append(row);
  });
  document.querySelectorAll('.code-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.code === key));
}

document.querySelectorAll('.code-tab').forEach(tab => tab.addEventListener('click', () => showCode(tab.dataset.code)));
showCode('vulnerable');
updateCount();
