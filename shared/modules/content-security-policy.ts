// ASCII whitespace is U+0009 TAB, U+000A LF, U+000C FF, U+000D CR, or U+0020 SPACE.
// See <https://infra.spec.whatwg.org/#ascii-whitespace>.
const ASCII_WHITESPACE_CHARS = ['\t', '\n', '\f', '\r', ' '].join('');

// A Content Security Policy is described using a series of policy directives
// each of which describes the policy for a certain resource type or policy area.
// See <https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy>.
const CSP_DIRECTIVES = [
  // Fetch directives
  'child-src',
  'connect-src',
  'default-src',
  'fenced-frame-src',
  'font-src',
  'frame-src',
  'img-src',
  'manifest-src',
  'media-src',
  'object-src',
  'prefetch-src',
  'script-src',
  'script-src-elem',
  'script-src-attr',
  'style-src',
  'style-src-elem',
  'style-src-attr',
  'worker-src',
  // Document directives
  'base-uri',
  'sandbox',
  // Navigation directives
  'form-action',
  'frame-ancestors',
  // Reporting directives
  'report-to',
  // Other directives
  'require-trusted-types-for',
  'trusted-types',
  'upgrade-insecure-requests',
  // Deprecated directives
  'block-all-mixed-content',
  'report-uri',
].join('|');

/* eslint-disable require-unicode-regexp */
const MATCH_CSP_DIRECTIVES = new RegExp(
  `^([${ASCII_WHITESPACE_CHARS}]*(${CSP_DIRECTIVES}))`, // Match any directive and leading ASCII whitespace
  'is', // Case-insensitive, including newlines
);

export type ContentSecurityPolicyDirective = {
  name: string;
  values: string;
};

/**
 * An intrinsic object that provides functions to handle the Content Security Policy (CSP) format.
 */
export const CSP = {
  /**
   * Converts a Content Security Policy (CSP) string into an array of directives according to [the spec][0].
   *
   * [0]: https://w3c.github.io/webappsec-csp/#parse-serialized-policy
   *
   * @param text - The Content Security Policy (CSP) string to parse.
   * @returns An array of Content Security Policy (CSP) directives.
   */
  parse: (text: string) => {
    const directives: ContentSecurityPolicyDirective[] = [];

    // For each token returned by strictly splitting serialized on the
    // U+003B SEMICOLON character (;):
    const tokens = text.split(';');
    for (const token of tokens) {
      const result = token.match(MATCH_CSP_DIRECTIVES);
      if (!result) {
        continue;
      }
      const name = result[0];
      if (!name) {
        continue;
      }
      const values = token.slice(name.length);
      directives.push({ name, values });
    }

    return directives;
  },
  /**
   * Converts an array of Content Security Policy (CSP) directives into a string.
   *
   * @param directives - An array of Content Security Policy (CSP) directives to stringify.
   * @returns A Content Security Policy (CSP) string.
   */
  stringify: (directives: ContentSecurityPolicyDirective[]) => {
    return directives.map(({ name, values }) => `${name}${values}`).join(';');
  },
  /**
   * Adds a nonce to a Content Security Policy (CSP) string.
   *
   * @param text - The Content Security Policy (CSP) string to add the nonce to.
   * @param nonce - The nonce to add to the Content Security Policy (CSP) string.
   * @returns The updated Content Security Policy (CSP) string.
   */
  addNonce: (text: string, nonce: string) => {
    const directives = CSP.parse(text);
    const formattedNonce = ` 'nonce-${nonce}'`;
    const scriptSrc = directives.find((directive) =>
      directive.name.toLowerCase().includes('script-src'),
    );
    if (scriptSrc) {
      scriptSrc.values += formattedNonce;
    } else {
      const defaultSrc = directives.find((directive) =>
        directive.name.toLowerCase().includes('default-src'),
      );
      if (defaultSrc) {
        defaultSrc.values += formattedNonce;
      }
    }
    return CSP.stringify(directives);
  },
};
