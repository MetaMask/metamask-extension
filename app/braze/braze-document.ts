type BrazeEndpoint = {
  href: string;
  readonly pathname: string;
  toString: () => string;
};

type BrazeDocument = {
  readonly location: Readonly<{ hostname: string }>;
  readonly hidden: boolean;
  cookie: string;
  createElement: (tagName: string) => BrazeEndpoint;
  querySelectorAll: (selector?: string) => readonly never[];
  getElementById: (id?: string) => null;
  getElementsByClassName: (className?: string) => readonly never[];
};

/**
 * Compatibility surface for the Web SDK inside its worker. None of these
 * objects are DOM nodes, and no operation touches a real document.
 *
 * Only endpoint parsing and the SDK's empty message cleanup are supported.
 * New SDK features fail closed when they try to create other elements.
 *
 * @param href - The worker's URL, used as the base for endpoint parsing.
 * @returns The SDK's document facade.
 */
export function createBrazeDocument(href: string): BrazeDocument {
  const location = Object.freeze({ hostname: new URL(href).hostname });
  const empty = Object.freeze([]);

  return Object.freeze({
    location,
    hidden: false,
    // Cookies are disabled. The SDK still probes them during initialization.
    get cookie() {
      return '';
    },
    set cookie(_value: string) {
      // Deliberately discard the SDK's cookie probes and cleanup writes.
    },
    createElement(tagName: string): BrazeEndpoint {
      if (tagName !== 'a') {
        throw new Error(`Braze cannot create DOM elements: ${tagName}`);
      }
      let url = new URL(href);
      // A URL adapter, with no ownerDocument, prototype DOM APIs, or setters
      // that navigate. It is never appended to a document.
      return Object.freeze({
        get href() {
          return url.href;
        },
        set href(value: string) {
          url = new URL(value, href);
        },
        get pathname() {
          return url.pathname;
        },
        toString: () => url.href,
      });
    },
    querySelectorAll: () => empty,
    getElementById: () => null,
    getElementsByClassName: () => empty,
  });
}
