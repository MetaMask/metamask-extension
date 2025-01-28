declare module 'postcss-discard-font-face' {
  import { type Plugin as PostCssPlugin } from 'postcss';

  /**
   * For each font, return `false` to remove, or a new string if you would like
   * to transform the *URL*.
   *
   * @example
   * ```typescript
   * (url: string, format: string) => {
   *   return !url.includes('.exe'); // remove if url ends with `.exe`
   * }
   * ```
   */
  type FilterFunction = (url: string, format: string) => boolean | string;

  /**
   * Allowlist is an array of formats to *keep*.
   *
   * @example
   * ```javascript
   * ['ttf', 'svg'] // keep ttf and svg formats
   * ```
   */
  type Allowlist = string[];

  /**
   * @example
   * ```javascript
   * {
   *   weight: [400],
   *   style: ['normal']
   * }
   * ```
   */
  type Properties = Record<string, unknown[]>;

  /**
   * @example
   * ```typescript
   * const options = {
   *   font: {
   *     // keep `Arial` with `weight: 400` and `style: normal`
   *     Arial: {
   *       weight: [400],
   *       style: ["normal"]
   *     }
   *   }
   * }
   * ```
   */
  type Options = {
    font: {
      [fontName: string]: Properties;
    };
  };

  /**
   * Discard font faces with PostCSS.
   *
   * @param filter - A filter function, allowlist, or options object
   */
  function discardFontFace(
    filter: Allowlist | FilterFunction | Options,
  ): PostCssPlugin;

  export = discardFontFace;
}
