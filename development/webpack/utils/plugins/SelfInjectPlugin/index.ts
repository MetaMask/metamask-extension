import { dirname, relative } from 'node:path';
import { ModuleFilenameHelpers, Compilation, sources } from 'webpack';
import { validate } from 'schema-utils';
import { schema } from './schema';
import type { SelfInjectPluginOptions, Source, Compiler } from './types';

export { type SelfInjectPluginOptions } from './types';

/**
 * Default options for the SelfInjectPlugin.
 */
const defaultOptions = {
  // The default `sourceUrlExpression` is configured for browser extensions.
  // It generates the absolute url of the given file as an extension url.
  // e.g., `chrome-extension://<extension-id>/scripts/inpage.js`
  sourceUrlExpression: (filename: string) =>
    `(globalThis.browser||chrome).runtime.getURL(${JSON.stringify(filename)})`,
} satisfies SelfInjectPluginOptions;

/**
 * Modifies processed assets to inject a script tag that will execute the asset
 * as an inline script. Primarily used in Chromium extensions that need to
 * access a tab's `window` object from a `content_script`.
 *
 * @example
 * Input:
 * ```js
 * // webpack.config.js
 * module.exports = {plugins: [new SelfInjectPlugin({ test: /\.js$/ })]};
 * ```
 *
 * ```js
 * // src/index.js
 * console.log("hello world");
 * ```
 * Output:
 * ```js
 * // dist/main.js
 * {let d=document,s=d.createElement('script');s.textContent="console.log(\"hello world\");\n//# sourceMappingURL=main.js.map"+`\n//# sourceURL=${(globalThis.browser||chrome).runtime.getURL("main.js")};`;d.documentElement.appendChild(s).remove()}
 * ```
 * ```json
 * // dist/main.js.map (example)
 * {"version":3,"file":"x","mappings":"AAAAA,QAAQC,IAAI","sources":["webpack://./src/index.js"],"sourcesContent":["console.log(\"hello world\");"],"names":["console","log"]}
 * ```
 */
export class SelfInjectPlugin {
  private options: SelfInjectPluginOptions & typeof defaultOptions;

  constructor(options: SelfInjectPluginOptions) {
    validate(schema, options, { name: SelfInjectPlugin.name });

    this.options = { ...defaultOptions, ...options };
  }

  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(SelfInjectPlugin.name, (compilation) => {
      this.processAssets(compilation);
    });
  }

  /**
   * Hooks into the compilation process to modify assets.
   *
   * @param compilation
   */
  processAssets(compilation: Compilation): void {
    const opts = {
      name: SelfInjectPlugin.name,
      stage: Compilation.PROCESS_ASSETS_STAGE_DEV_TOOLING,
    };
    compilation.hooks.processAssets.tap(opts, () => this.process(compilation));
  }

  /**
   * Processes compilation assets to inject a script tag that will execute the
   * asset as an inline script.
   *
   * @param compilation
   */
  process(compilation: Compilation): void {
    const { test } = this.options;
    const match = ModuleFilenameHelpers.matchObject.bind(null, { test });

    for (const chunk of compilation.chunks) {
      for (const file of chunk.files) {
        if (match(file)) {
          compilation.updateAsset(file, (asset: Source) => {
            return this.updateAsset(compilation, file, asset);
          });
        }
      }
    }
  }

  /**
   * Updates the given asset to inject a script tag that will execute the asset
   * as an inline script.
   *
   * @param compilation
   * @param file
   * @param asset
   */
  updateAsset(compilation: Compilation, file: string, asset: Source): Source {
    const { ConcatSource, RawSource } = sources;
    const { map, source } = asset.sourceAndMap();

    let sourceMappingURLComment = '';
    // emit a separate source map file (if this asset already has one)
    if (map /* `map` can be `null`; webpack's types are wrong */) {
      const { devtool } = compilation.options;
      const sourceMapPath = `${file}.map`;

      // we're removing the source map from the original webpack asset, since
      // it's now a different file that isn't mappable, so we need to re-add it
      // as a new asset:
      const mapSource = new RawSource(JSON.stringify(map));
      compilation.emitAsset(sourceMapPath, mapSource);

      // we must "hide" the `sourceMappingURL` from the file when `hidden`
      // source maps are requested by omitting the reference from the source
      if (devtool && !devtool.startsWith('hidden-')) {
        // `sourceMappingURL` needs to be relative to the file so that the
        // browser's dev tools can find it.
        const sourceMappingURL = relative(dirname(file), sourceMapPath);
        sourceMappingURLComment = `\n//# sourceMappingURL=${sourceMappingURL}`;
      }
    }

    // generate the new self-injecting source code:
    const newSource = new ConcatSource();
    // wrapped in a new lexical scope so we don't pollute the global namespace
    newSource.add(`{`);
    newSource.add(`let d=document,s=d.createElement('script');`);
    newSource.add(`s.textContent=`);
    newSource.add(this.escapeJs(source + sourceMappingURLComment));
    newSource.add(`+`);
    // The browser's dev tools can't map our inline javascript back to its
    // source. We add a sourceURL directive to help with that. It also helps
    // organize the Sources panel in browser dev tools by separating the inline
    // script into its own origin.
    newSource.add(
      `\`\\n//# sourceURL=\${${this.options.sourceUrlExpression(file)}};\``,
    );
    newSource.add(`;`);
    newSource.add(`s.nonce=btoa(browser.runtime.id);`);
    // add and immediately remove the script to avoid modifying the DOM.
    newSource.add(`d.documentElement.appendChild(s).remove()`);
    newSource.add(`}`);

    return newSource;
  }

  /**
   * Escapes the given JavaScript source as a JavaScript string.
   *
   * Replaces line separators and paragraph separators with their unicode escape
   * sequences.
   *
   * @example
   * ```js
   * escapeJs(`console.log('hello world');`);
   * // => "\"console.log('hello world');\""
   * ```
   * @param source
   * @returns
   */
  private escapeJs(source: string): string {
    return (
      JSON.stringify(source)
        // replace line separators
        .replace(/\u2028/gu, '\\u2028')
        // and paragraph separators
        .replace(/\u2029/gu, '\\u2029')
    );
  }
}
