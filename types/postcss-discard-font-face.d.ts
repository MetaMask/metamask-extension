declare module 'postcss-discard-font-face' {
  import type { Plugin as PostCSSPlugin } from 'postcss';

  /**
   * A filter function that determines whether to keep, remove, or transform
   * a font-face URL.
   *
   * Return:
   * - `false` → removes the font
   * - `true`  → keeps the font
   * - `string` → transforms the URL
   *
   * @example
   * ```ts
   * (url, format) => !url.endsWith('.exe')
   * ```
   */
  export type FilterFunction = (url: string, format: string) => boolean | string;

  /**
   * An array of font formats to keep.
   *
   * @example
   * ```ts
   * ['ttf', 'svg']
   * ```
   */
  export type Allowlist = string[];

  /**
   * Font-face property configuration.
   *
   * @example
   * ```ts
   * {
   *   weight: [400],
   *   style: ['normal']
   * }
   * ```
   */
  export interface Properties {
    [property: string]: (string | number)[];
  }

  /**
   * Plugin configuration options.
   *
   * @example
   * ```ts
   * const options = {
   *   font: {
   *     Arial: {
   *       weight: [400],
   *       style: ['normal']
   *     }
   *   }
   * }
   * ```
   */
  export interface Options {
    font: Record<string, Properties>;
  }
