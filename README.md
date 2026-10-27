# CampusBoard — Stored XSS Explainer

A presentation-ready, beginner-friendly Cyber Security mini-project demonstrating **Stored Cross-Site Scripting (Stored XSS)** and **HTML-context output encoding**.

> **Safety:** This is an intentionally vulnerable teaching lab. It binds only to `127.0.0.1`. Do not deploy it, expose it to a LAN, or use it against any website. Use only the harmless alert payload built into the page.

## 1. Run the project

**Requirement:** Node.js 18 or newer. No third-party packages and no `npm install` are needed.

```bash
# Open the extracted project folder
npm start
```

Visit **http://127.0.0.1:3000**. Stop the server with `Ctrl + C`.

If port 3000 is busy:

```bash
PORT=3001 npm start
```

Then visit `http://127.0.0.1:3001`.

## 2. Demonstrate Stored XSS

1. Keep **Vulnerable** mode selected.
2. Enter a display name.
3. Click **Insert safe demo payload**. The field is filled with:

   ```html
   <script>alert('Stored XSS demo')</script>
   ```

4. Click **Publish comment**. The server stores the comment in `data/posts.json`.
5. The page reloads and renders the stored comment as raw HTML. The browser executes the harmless alert.
6. Select **Protected** mode. The exact same stored comment is now HTML-encoded and shown as literal text; the script does not execute.
7. Use **Reset demo data** to clear the lab.

## 3. What to explain

- **Stored:** The submitted content is saved in `data/posts.json` and remains there after the request ends.
- **Cross-site:** The injected script runs in the browser context of the site when a page visitor views the stored post.
- **Scripting:** The browser interprets attacker-controlled markup as HTML/JavaScript because the vulnerable renderer inserts it directly into the document.
- **Root cause:** Untrusted data is placed into an HTML text context without output encoding.
- **Implemented mitigation:** `escapeHtml()` converts HTML-significant characters to entities before rendering.

## 4. Project structure

```text
campus-xss-explainer/
├── server.js                 # HTTP server, storage, vulnerable and protected renderers
├── package.json              # Start command; no external dependencies
├── data/
│   └── posts.json            # Locally stored discussion posts
├── public/
│   ├── app.js                # Form behaviour, demo payload, code explorer
│   └── styles.css            # Layout, responsive design, code visibility
└── docs/
    ├── CODE_WALKTHROUGH.md   # Explain the implementation and viva points
    └── ASSIGNMENT_NOTES.md   # Report-ready explanation and other mitigations
```

## 5. Code explorer

Scroll to **Code, made explainable**. The tabs show the vulnerable output, protected output and encoding helper. Each tab has line numbers and a plain-language explanation plus a viva pointer. The full source remains in separate, readable files so it can be opened in VS Code and discussed during evaluation.

## 6. Important technical note

The `escapeHtml()` helper is suitable for plain text placed inside an HTML element. Output encoding is context-sensitive: HTML attributes, JavaScript strings, CSS and URLs require different handling. Prefer framework auto-escaping and safe DOM APIs where possible. A Content Security Policy is defence-in-depth, not a substitute for correct output encoding.
