/*
 * CAMPUS BOARD — Stored XSS Teaching Lab
 * ------------------------------------------------------------
 * A deliberately small Node.js server for a LOCAL classroom demo.
 * The vulnerable route is intentionally unsafe; the protected route
 * applies HTML-context output encoding before inserting user content.
 * Never deploy this teaching lab or expose it to a network.
 */

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const HOST = '127.0.0.1'; // Keep the demo local to this computer.
const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = path.join(__dirname, 'data', 'posts.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

function readPosts() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function savePosts(posts) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

// MITIGATION: encode characters that have special meaning in HTML.
// This helper is appropriate for plain text placed inside an HTML element.
function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function send(res, status, body, type = 'text/html; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function pageShell(content, mode) {
  const modeLabel = mode === 'vulnerable' ? 'Vulnerable mode' : 'Protected mode';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Campus Board · Stored XSS Lab</title>
  <link rel="stylesheet" href="/styles.css">
  <script defer src="/app.js"></script>
</head>
<body data-mode="${mode}">
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="/"><span class="brand-mark">CB</span><span>Campus<span class="brand-light">Board</span></span></a>
      <div class="side-label">LEARNING LAB</div>
      <a class="nav-item active" href="/"><span>▦</span> Overview</a>
      <a class="nav-item" href="/#discussion"><span>◉</span> Discussion board</a>
      <a class="nav-item" href="/#code-lab"><span>⌘</span> Code explorer</a>
      <div class="sidebar-note"><span class="note-dot"></span><div><b>Local demo environment</b><small>Runs only on this computer</small></div></div>
    </aside>

    <main class="main-area">
      <header class="topbar"><div><div class="eyebrow">CYBER SECURITY · IT-30001</div><h1>Stored Cross-Site Scripting</h1></div><div class="top-right"><span class="semester">AUTUMN 2026</span><span class="avatar">IT</span></div></header>
      <section class="hero-card">
        <div class="hero-copy"><div class="pill"><span class="pulse"></span> INTERACTIVE SECURITY LAB</div><h2>See the vulnerability.<br><em>Understand the fix.</em></h2><p>Explore how untrusted comments become executable browser content — then compare the same input after HTML output encoding.</p><div class="hero-actions"><a class="button button-primary" href="#discussion">Run the demonstration <span>↗</span></a><a class="text-link" href="#code-lab">Explore the code ↓</a></div></div>
        <div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="shield"><span>〈/〉</span></div><div class="float-chip chip-top">HTML</div><div class="float-chip chip-bottom">ENCODED</div></div>
      </section>

      <section class="mode-row">
        <div><div class="section-kicker">RENDERING MODE</div><h3>Choose how comments are rendered</h3><p class="muted">Switch modes to compare the security behaviour of identical stored data.</p></div>
        <div class="mode-switch"><a class="mode-option ${mode === 'vulnerable' ? 'selected danger' : ''}" href="/?mode=vulnerable"><span class="mode-icon">!</span><span><b>Vulnerable</b><small>Raw HTML output</small></span></a><a class="mode-option ${mode === 'protected' ? 'selected safe' : ''}" href="/?mode=protected"><span class="mode-icon">✓</span><span><b>Protected</b><small>HTML output encoding</small></span></a></div>
      </section>

      <section class="status-banner ${mode === 'vulnerable' ? 'status-danger' : 'status-safe'}"><div class="status-symbol">${mode === 'vulnerable' ? '!' : '✓'}</div><div><b>${modeLabel}</b><p>${mode === 'vulnerable' ? 'User-controlled comment text is inserted into the HTML response without encoding. A script payload can execute when the page is rendered.' : 'Comment text is HTML-encoded before rendering. Markup characters are displayed as text, so the browser does not interpret them as elements or scripts.'}</p></div><span class="status-tag">${mode === 'vulnerable' ? 'UNSAFE BY DESIGN' : 'MITIGATION ACTIVE'}</span></section>

      <div class="content-grid" id="discussion">
        <section class="panel composer-panel"><div class="panel-heading"><div><div class="section-kicker">01 / INPUT</div><h3>Post to the discussion</h3></div><span class="mini-icon">＋</span></div><form id="post-form"><label for="author">Display name</label><input id="author" name="author" maxlength="40" placeholder="e.g. Alex Morgan" required><label for="message">Your comment</label><textarea id="message" name="message" rows="5" maxlength="500" placeholder="Share an idea with your campus community…" required></textarea><div class="form-tools"><button class="text-button" type="button" id="insert-payload">＋ Insert safe demo payload</button><span id="char-count">0 / 500</span></div><button class="button button-dark" type="submit">Publish comment <span>→</span></button><p class="form-hint">Use only the harmless alert payload provided for this local demonstration.</p></form></section>
        <section class="panel feed-panel"><div class="panel-heading"><div><div class="section-kicker">02 / OUTPUT</div><h3>Campus discussion</h3></div><span class="count-badge">${readPosts().length} POSTS</span></div><div class="post-list">${content}</div><form action="/reset" method="post" class="reset-form"><button class="text-button" type="submit">↺ Reset demo data</button><span>Stored locally in data/posts.json</span></form></section>
      </div>

      <section class="code-section" id="code-lab"><div class="code-intro"><div><div class="section-kicker">03 / UNDER THE HOOD</div><h3>Code, made explainable.</h3><p class="muted">Read the exact security decision, then use the explanation beside it to prepare for your viva.</p></div><span class="code-badge">SOURCE WALKTHROUGH</span></div>
        <div class="code-layout"><div class="code-tabs"><button class="code-tab active" data-code="vulnerable">01&nbsp; Vulnerable output</button><button class="code-tab" data-code="protected">02&nbsp; Protected output</button><button class="code-tab" data-code="helper">03&nbsp; Encoding helper</button></div><div class="code-window"><div class="code-titlebar"><div class="window-dots"><i></i><i></i><i></i></div><span id="filename">server.js · vulnerable renderer</span><span class="language">JAVASCRIPT</span></div><pre class="code-view" aria-label="Code example"><code id="code-content"></code></pre></div><aside class="explain-card"><div class="explain-number" id="explain-number">01</div><div class="section-kicker">WHAT THIS DOES</div><h4 id="explain-title">The vulnerable line</h4><p id="explain-text">The template inserts the stored comment directly into the HTML response. The browser parses the comment as markup rather than treating it as plain text.</p><div class="viva-tip"><b>Viva pointer</b><p id="viva-text">The core issue is not accepting input; it is using untrusted data in an unsafe output context.</p></div></aside></div>
      </section>
      <footer class="footer"><span>CampusBoard · Stored XSS teaching lab</span><span>Built for controlled localhost demonstration</span></footer>
    </main>
  </div>
</body>
</html>`;
}

function renderPosts(posts, mode) {
  if (!posts.length) return '<div class="empty-state"><div class="empty-icon">✳</div><b>No comments yet</b><p>Publish the first comment to begin the demonstration.</p></div>';
  return posts.slice().reverse().map((post) => {
    // Intentionally unsafe only in vulnerable mode; safe mode encodes both fields.
    const author = mode === 'vulnerable' ? post.author : escapeHtml(post.author);
    const message = mode === 'vulnerable' ? post.message : escapeHtml(post.message);
    return `<article class="post-card"><div class="post-avatar">${escapeHtml((post.author || '?').slice(0, 1).toUpperCase())}</div><div class="post-body"><div class="post-meta"><b>${author}</b><time>${escapeHtml(post.time)}</time></div><div class="post-message">${message}</div></div></article>`;
  }).join('');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; if (body.length > 20_000) reject(new Error('Request too large')); });
    req.on('end', () => resolve(new URLSearchParams(body)));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  if (req.method === 'GET' && url.pathname === '/') {
    const mode = url.searchParams.get('mode') === 'protected' ? 'protected' : 'vulnerable';
    const posts = readPosts();
    return send(res, 200, pageShell(renderPosts(posts, mode), mode));
  }
  if (req.method === 'POST' && url.pathname === '/posts') {
    try {
      const form = await readBody(req);
      const author = (form.get('author') || '').trim().slice(0, 40);
      const message = (form.get('message') || '').trim().slice(0, 500);
      if (!author || !message) return send(res, 400, 'Name and comment are required.', 'text/plain; charset=utf-8');
      const posts = readPosts();
      posts.push({ author, message, time: new Date().toLocaleString('en-IN') });
      savePosts(posts.slice(-30));
      res.writeHead(303, { Location: `/?mode=${url.searchParams.get('mode') === 'protected' ? 'protected' : 'vulnerable'}#discussion` });
      return res.end();
    } catch { return send(res, 400, 'Unable to save this comment.', 'text/plain; charset=utf-8'); }
  }
  if (req.method === 'POST' && url.pathname === '/reset') {
    savePosts([]);
    res.writeHead(303, { Location: '/#discussion' });
    return res.end();
  }
  if (req.method === 'GET' && ['/styles.css', '/app.js'].includes(url.pathname)) {
    const file = path.join(PUBLIC_DIR, path.basename(url.pathname));
    return fs.readFile(file, (err, data) => err ? send(res, 404, 'Not found', 'text/plain') : send(res, 200, data, url.pathname.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8'));
  }
  return send(res, 404, 'Not found', 'text/plain; charset=utf-8');
});

server.listen(PORT, HOST, () => {
  console.log(`CampusBoard Stored XSS Lab running at http://${HOST}:${PORT}`);
  console.log('Local classroom demo only. Do not expose or deploy this server.');
});
