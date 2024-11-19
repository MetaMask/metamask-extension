// ASCII whitespace is U+0009 TAB, U+000A LF, U+000C FF, U+000D CR, or U+0020 SPACE.
// See <https://infra.spec.whatwg.org/#ascii-whitespace>.
const ASCII_WHITESPACE_CHARS = ['\t', '\n', '\f', '\r', ' '].join('');

const matchDirective = (directive: string) =>
  /* eslint-disable require-unicode-regexp */
  new RegExp(
    `^([${ASCII_WHITESPACE_CHARS}]*${directive}[${ASCII_WHITESPACE_CHARS}]*)`, // Match the directive and surrounding ASCII whitespace
    'is', // Case-insensitive, including newlines
  );
const matchScript = matchDirective('script-src');
const matchDefault = matchDirective('default-src');

/**
 * Adds a nonce to a Content Security Policy (CSP) string.
 *
 * @param text - The Content Security Policy (CSP) string to add the nonce to.
 * @param nonce - The nonce to add to the Content Security Policy (CSP) string.
 * @returns The updated Content Security Policy (CSP) string.
 */
export const addNonceToCsp = (text: string, nonce: string) => {
  const formattedNonce = ` 'nonce-${nonce}'`;
  const directives = text.split(';');
  const scriptIndex = directives.findIndex((directive) =>
    matchScript.test(directive),
  );
  if (scriptIndex >= 0) {
    directives[scriptIndex] += formattedNonce;
  } else {
    const defaultIndex = directives.findIndex((directive) =>
      matchDefault.test(directive),
    );
    if (defaultIndex >= 0) {
      directives[defaultIndex] += formattedNonce;
    }
  }
  return directives.join(';');
};
