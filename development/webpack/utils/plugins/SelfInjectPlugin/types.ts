import type { Asset } from 'webpack';

export type { Compiler } from 'webpack';
export type Source = Asset['source'];

/**
 * Options for the SelfInjectPlugin.
 */
export type SelfInjectPluginOptions = {
  /**
   * Specify which chunks to apply the transformation to.
   *
   * @example
   * ```js
   * {
   *  test: /inpage/,
   * }
   * ```
   */
  test?: string | RegExp | (string | RegExp)[];
  /**
   * A function that returns a JavaScript expression escaped as a string which
   * will be injected into matched file to provide a sourceURL for the self
   * injected script.
   *
   * Defaults to `(filename: string) => (globalThis.browser||globalThis.chrome).runtime.getURL("${filename}")`
   *
   * @example Custom
   * ```js
   *  Appends a runtime URL for a website, e.g.,
   *  `// //# sourceURL=https://google.com/scripts/myfile.js`
   * {
   *   sourceUrlExpression: (filename) => `document.location.origin/${filename}`
   * }
   * ```
   * @example Default
   * Appends a runtime URL for a browser extension, e.g.,
   * `//# sourceURL=chrome-extension://<extension-id>/scripts/inpage.js`
   *
   * ```js
   * {
   *   sourceUrlExpression: (filename) => `(globalThis.browser||globalThis.chrome).runtime.getURL("${filename}")`
   * }
   * ```
   * @param filename - the chunk's relative filename as it will exist in the output directory
   * @returns
   */
  sourceUrlExpression?: (filename: string) => string;
};
