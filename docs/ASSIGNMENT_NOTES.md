# Assignment Notes — Stored Cross-Site Scripting

## Objective
Demonstrate Stored Cross-Site Scripting in a controlled local discussion-board application, identify the root cause, implement one mitigation and discuss alternative defences.

## Vulnerability category and variant
**Cross-Site Scripting (XSS) — Stored XSS.** A user submits a comment containing HTML/JavaScript. The application stores the comment and later includes it in a page without safe output handling. When the browser renders the page, the injected script executes in the origin of the vulnerable application.

## Root cause
The vulnerable renderer inserts user-controlled `post.message` directly into an HTML template. The browser parses the resulting string as markup. The application fails to preserve the distinction between data and executable document structure.

## Evidence / demonstration procedure
1. Start the application locally.
2. Select Vulnerable mode and submit the built-in harmless alert payload.
3. Capture a screenshot of the alert and the resulting discussion post.
4. Open `data/posts.json` and capture evidence that the value was persisted.
5. Switch to Protected mode and capture the same stored payload displayed literally without execution.
6. Capture the protected code branch and `escapeHtml()` helper.

Use only the built-in alert demonstration on your own local instance. Do not attempt to access real cookies, credentials, or another user's browser data.

## Implemented mitigation: HTML-context output encoding
Before placing user-controlled text inside an HTML element, the protected renderer calls `escapeHtml()`. Characters with structural meaning in HTML are replaced with character references. The browser therefore treats the payload as text rather than as HTML markup.

The original comment is retained in storage. The mitigation is applied when rendering the output, where the application knows the context.

## Other mitigations — theoretical discussion

### 1. Context-aware output encoding
Encode data for its exact output context: HTML text, HTML attribute, JavaScript string, CSS value or URL. A single generic encoder is not safe for every context. Prefer avoiding the insertion of untrusted data into executable contexts.

### 2. Framework auto-escaping
Modern template engines and UI frameworks commonly escape interpolated text by default. Developers should use normal text interpolation and avoid bypass features such as raw HTML rendering unless content is trusted and carefully sanitised.

### 3. HTML sanitisation
If an application intentionally allows a restricted subset of HTML (for example, bold or italic formatting), use a reputable allowlist-based HTML sanitiser. Sanitisation is different from output encoding: it preserves approved markup while removing disallowed structures.

### 4. Content Security Policy (CSP)
A restrictive CSP can limit where scripts may load from and can block inline scripts when configured with nonces or hashes. It reduces the impact of some injection bugs but does not repair unsafe HTML insertion. Avoid broad policies such as `unsafe-inline` where possible.

### 5. HttpOnly cookies
Mark session cookies `HttpOnly` so client-side JavaScript cannot read them through `document.cookie`. Also use `Secure` and an appropriate `SameSite` setting. HttpOnly limits one possible consequence of XSS; it does not prevent script execution or all authenticated actions.

### 6. Safe DOM sinks
For plain text, use `textContent` instead of `innerHTML`. Avoid `document.write()` and unsafe HTML insertion APIs with untrusted values. If rich HTML is required, sanitise it with a maintained allowlist-based sanitiser.

## Conclusion
The demonstration shows that storing untrusted text is not itself the vulnerability. The vulnerability appears when the application later interprets that data as HTML. Context-appropriate output encoding preserves the content while preventing the browser from treating it as executable markup.
