// ASCII whitespace is U+0009 TAB, U+000A LF, U+000C FF, U+000D CR, or U+0020 SPACE.
// See <https://infra.spec.whatwg.org/#ascii-whitespace>.
const ASCII_WHITESPACE_CHARS = '\t\n\f\r ';
const ASCII_WHITESPACE = new RegExp(`[${ASCII_WHITESPACE_CHARS}]+`);
const ASCII_WHITESPACE_AT_START = new RegExp(`^[${ASCII_WHITESPACE_CHARS}]+`);
const ASCII_WHITESPACE_AT_END = new RegExp(`[${ASCII_WHITESPACE_CHARS}]+$`);

// An ASCII code point is a code point in the range U+0000 NULL to U+007F DELETE, inclusive.
// See <https://infra.spec.whatwg.org/#ascii-string>.
const ASCII = /^[\x00-\x7f]*$/;

export interface ContentSecurityPolicyDirective {
  name: string;
  values: string[];
}

/**
 * An intrinsic object that provides functions to handle the Content Security Policy (CSP) format.
 */
export const CSP = {
  /**
   * Converts a Content Security Policy (CSP) string into an array of directives according to [the spec][0].
   *
   * [0]: https://w3c.github.io/webappsec-csp/#parse-serialized-policy
   *
   * @param text The Content Security Policy (CSP) string to parse.
   * @returns An array of Content Security Policy (CSP) directives.
   */
  parse: (text: string) => {
    const directives: ContentSecurityPolicyDirective[] = [];

    // For each token returned by strictly splitting serialized on the
    // U+003B SEMICOLON character (;):
    const tokens = text.split(';');

    for (const token of tokens) {
      // Strip leading and trailing ASCII whitespace from token.
      const strippedToken = token
        .replace(ASCII_WHITESPACE_AT_START, '')
        .replace(ASCII_WHITESPACE_AT_END, '');

      // If strippedToken is an empty string, or if strippedToken is not an ASCII string, continue.
      if (!strippedToken || !ASCII.test(strippedToken)) continue;

      // Directive name is the result of collecting a sequence of code points from token which are not ASCII whitespace.
      // Directive values are the result of splitting token on ASCII whitespace.
      const [name, ...values] = strippedToken.split(ASCII_WHITESPACE);

      directives.push({ name, values });
    }

    return directives;
  },
  /**
   * Converts an array of Content Security Policy (CSP) directives into a string.
   *
   * @param directives An array of Content Security Policy (CSP) directives to stringify.
   * @returns A Content Security Policy (CSP) string.
   */
  stringify: (directives: ContentSecurityPolicyDirective[]) => {
    return directives
      .map(({ name, values }) => {
        const value = values.length ? ` ${values.join(' ')}` : '';
        return `${name}${value}`;
      })
      .join('; ');
  },
};
