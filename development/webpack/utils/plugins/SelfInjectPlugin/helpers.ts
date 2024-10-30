/**
 * Generates a runtime URL expression for a given path.
 *
 * This function constructs a URL string using the `runtime.getURL` method
 * from either the `globalThis.browser` or `chrome` object, depending on
 * which one is available in the global scope.
 *
 * @param path - The path of the runtime URL.
 * @returns The constructed runtime URL string.
 */
export const getRuntimeURLExpression = (path: string) =>
  `(globalThis.browser||chrome).runtime.getURL(${JSON.stringify(path)})`;
