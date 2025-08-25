import { dirname, relative } from 'node:path';
import { ModuleFilenameHelpers, Compilation, sources } from 'webpack';
import { validate } from 'schema-utils';
import { schema } from './schema';
import type { SelfInjectPluginOptions, Source, Compiler } from './types';

export { type SelfInjectPluginOptions } from './types';

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
const getRuntimeURLExpression = (path: string) =>
  `(globalThis.browser||chrome).runtime.getURL(${JSON.stringify(path)})`;

/**
 * Default options for the SelfInjectPlugin.
 */
const defaultOptions = {
  // The default `sourceUrlExpression` is configured for browser extensions.
  // It generates the absolute url of the given file as an extension url.
  // e.g., `chrome-extension://<extension-id>/scripts/inpage.js`
  sourceUrlExpression: getRuntimeURLExpression,
  // The default `nonceExpression` is configured for browser extensions.
  // It generates the absolute url of a path as an extension url in base64.
  // e.g., `Y2hyb21lLWV4dGVuc2lvbjovLzxleHRlbnNpb24taWQ+Lw==`
  nonceExpression: (path: string) => `btoa(${getRuntimeURLExpression(path)})`,
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
    newSource.add(`document.INJECT_ONCE(`);
    newSource.add(this.escapeJs(source + sourceMappingURLComment));
    newSource.add(`);`);

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
