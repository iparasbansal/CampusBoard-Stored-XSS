# Code Walkthrough — CampusBoard Stored XSS Lab

This guide follows the application's execution path. Keep `server.js` open in your editor while presenting.

## 1. Big picture: request to browser

```text
Browser form
    │ POST /posts
    ▼
Node.js HTTP server
    │ read form fields
    ▼
 data/posts.json          ← comment is stored here
    │
    ▼
GET /?mode=vulnerable or /?mode=protected
    │ read stored posts
    ▼
renderPosts(posts, mode)
    │
    ├── vulnerable: raw message → HTML response → browser interprets markup
    │
    └── protected: escapeHtml(message) → HTML response → browser displays text
```

## 2. `server.js` — important sections

### A. Imports and configuration

- `node:http`: creates a small web server without Express.
- `node:fs`: reads and writes the JSON file used as a tiny local data store.
- `node:path`: constructs safe filesystem paths independent of operating system.
- `node:url`: parses request paths and query parameters.
- `HOST = '127.0.0.1'`: binds the server to the local machine only.
- `DATA_FILE`: points to `data/posts.json`.

**Say in viva:** “I used Node's built-in modules to keep the application small and make the request flow visible. The server binds to localhost because the vulnerable route is only for a controlled demonstration.”

### B. `readPosts()` and `savePosts(posts)`

`readPosts()` reads JSON text from disk and converts it into a JavaScript array using `JSON.parse()`. If the file is missing or invalid, it safely falls back to an empty array for this demo.

`savePosts(posts)` converts the array back to formatted JSON using `JSON.stringify(posts, null, 2)` and writes it to disk.

**Security concept:** Persistence makes the example Stored XSS rather than a reflected-only example. The submitted value survives the POST request and is rendered on a later page request.

### C. `escapeHtml(value)` — mitigation

The helper converts five special characters:

| Character | Encoded form | Why |
|---|---|---|
| `&` | `&amp;` | Must be encoded first to avoid re-encoding generated entities |
| `<` | `&lt;` | Prevents starting an HTML tag |
| `>` | `&gt;` | Prevents closing an HTML tag |
| `"` | `&quot;` | Safe representation in HTML text/attribute contexts |
| `'` | `&#39;` | Safe representation of a single quote |

The replacement for `&` is first. This matters: if ampersands were encoded last, the ampersands introduced by `&lt;` and other entities would themselves be changed.

**Important precision:** This helper is used for plain text inside an HTML element. It is not a universal encoder for JavaScript, CSS, URL or every attribute context.

### D. `renderPosts(posts, mode)` — the key comparison

The function loops over saved posts and creates one HTML card per post.

- Vulnerable branch: `post.message` is inserted directly into the HTML template. A `<script>` element remains a real HTML element.
- Protected branch: `escapeHtml(post.message)` is inserted. The `<` and `>` characters become entities, so the browser displays the payload as text.

This is the key root-cause/mitigation pair. Explain these two branches side by side.

### E. `POST /posts`

1. `readBody(req)` collects the form body.
2. `URLSearchParams` reads `author` and `message`.
3. `.trim()` removes surrounding whitespace; `.slice()` enforces demo length limits.
4. The post is appended to the array and saved to JSON.
5. The server redirects back to the selected mode.

Input length limits are useful validation, but they do **not** prevent XSS. A short script can still be malicious. The security fix is at output rendering.

### F. `GET /`

The query string selects `vulnerable` or `protected`. The server reads saved posts, renders them using that mode, and returns the resulting HTML page.

## 3. `public/app.js` — browser-side behaviour

- `demoPayload` is a harmless alert-only string used for the assignment demonstration.
- The Insert button copies it into the textarea; it does not send anything automatically.
- `updateCount()` updates the character counter.
- The submit listener sends the form using `fetch()` and returns to the current mode.
- `examples` contains the three short code excerpts shown in the Code Explorer.
- `showCode()` creates line-numbered rows with `textContent`. Using `textContent` here ensures the code sample is displayed as text, not interpreted as markup.

## 4. `public/styles.css` — presentation

The stylesheet is intentionally separate from the server logic. It controls the dashboard, responsive layout, status banners, forms and readable code panel. Keeping CSS separate makes the security-sensitive server logic easier to locate and review.

## 5. A concise viva explanation

“Stored XSS happens when an application saves untrusted input and later places it into a page without safe output handling. In my vulnerable mode, the stored comment is concatenated into an HTML response as raw markup. The browser parses it, so the harmless script payload executes. In protected mode, I encode HTML-significant characters before rendering. The browser then displays the payload as text. The root cause is unsafe output handling, and the implemented mitigation is context-appropriate HTML output encoding.”

## 6. Likely viva questions

**Q1. Why is it called Stored XSS?**  
Because the payload is persisted on the server and executes when a page later renders that stored value.

**Q2. Why doesn't input validation solve this?**  
Validation checks whether data meets expected rules; it is not a reliable substitute for output encoding. Content can be valid text and still contain markup characters.

**Q3. Why encode at output time?**  
The correct encoding depends on where data is inserted. Encoding at the output boundary lets the application apply the right transformation for that context.

**Q4. Does encoding remove the comment?**  
No. The original data remains stored. Only its representation in the HTML response changes.

**Q5. Is `escapeHtml()` enough for every context?**  
No. This helper is for HTML text nodes. Other contexts need context-specific safe APIs/encoding. Avoid constructing JavaScript or CSS from untrusted strings.

**Q6. What is the difference between Stored and Reflected XSS?**  
Stored XSS persists in application storage and affects later viewers. Reflected XSS is returned immediately in a response to a crafted request and is not necessarily persisted.

**Q7. What is DOM-based XSS?**  
It occurs when client-side JavaScript takes untrusted data from a source such as the URL and passes it to an unsafe DOM sink.

**Q8. What does HttpOnly do?**  
It prevents JavaScript from reading a cookie through `document.cookie`. It does not stop XSS or prevent the browser from sending the cookie with eligible requests.

**Q9. What is CSP?**  
Content Security Policy is a browser-enforced policy that can restrict script sources and reduce the impact of injection. It is defence-in-depth, not a replacement for safe rendering.

**Q10. What is a safer DOM API than `innerHTML` for plain text?**  
`textContent` or `innerText`, because they insert text rather than parsing it as HTML.
