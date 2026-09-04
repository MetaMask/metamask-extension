/**
 * The serialization the browser uses for an opaque security origin.
 *
 * @see https://html.spec.whatwg.org/multipage/browsers.html#concept-origin-opaque
 */
export const OPAQUE_ORIGIN = 'null';

/**
 * A subset of `browser.runtime.MessageSender` — only the fields needed to
 * decide whether the browser gave this sender an opaque security origin.
 */
type OriginBearingSender = {
  origin?: string;
  url?: string;
};

/**
 * Whether the browser assigned this sender an opaque security origin while
 * still reporting an http(s) URL.
 *
 * A frame sandboxed without `allow-same-origin`, and a document served with
 * `Content-Security-Policy: sandbox`, both get an opaque origin. The browser
 * still reports the http(s) URL that served the document, so deriving a
 * principal from `sender.url` gives such a frame the URL origin's identity —
 * and with it any wallet session granted to that origin.
 *
 * `MessageSender.origin` is available in Chrome 80+, Firefox 126+ and Safari
 * 14+, all below the minimum versions this extension supports. When a browser
 * does not report it we cannot tell an opaque origin from an ordinary one, so
 * this returns `false` and leaves the existing derivation untouched.
 *
 * Scoped to http(s) on purpose. `new URL('file:///x').origin` is already the
 * string `"null"`, so local pages share a principal today; changing that is a
 * separate decision and is deliberately not made here.
 *
 * @param sender - The message sender to inspect.
 * @returns True when the sender's security origin is opaque and its URL is
 * http(s).
 */
export function isOpaqueWebSender(sender?: OriginBearingSender): boolean {
  // Absent (older browser, or a non-`MessageSender` sender such as a Snap):
  // no signal, so no change in behavior.
  if (typeof sender?.origin !== 'string' || sender.origin !== OPAQUE_ORIGIN) {
    return false;
  }

  let protocol: string;
  try {
    protocol = new URL(sender.url ?? '').protocol;
  } catch {
    return false;
  }

  return protocol === 'http:' || protocol === 'https:';
}
