import type { Compiler } from 'webpack';
import {
  defineReactCompilerLoaderOption,
  reactCompilerLoader,
  type ReactCompilerLoaderOption,
} from 'react-compiler-webpack';
import { validate } from 'schema-utils';
import { schema } from './schema';
import { ReactCompilerLogger } from './logger';

const NAME = 'ReactCompilerPlugin';

/**
 * Default test pattern for matching React component files.
 * Matches .js, .jsx, .ts, .tsx, .mjs, .mts files,
 * excluding test, stories, and container files.
 */
const DEFAULT_TEST =
  /(?:.(?!\.(?:test|stories|container)))+\.(?:m?[jt]s|[jt]sx)$/u;

/**
 * Default options for the ReactCompilerPlugin.
 */
const defaultOptions = {
  verbose: false,
  debug: 'none',
  test: DEFAULT_TEST,
} as const;

/**
 * Webpack plugin that integrates React Compiler with logging and path filtering.
 *
 * This plugin provides:
 * - Automatic setup of the React Compiler webpack loader
 * - Configurable include/exclude patterns for file filtering
 * - Compilation statistics tracking and reporting
 * - Schema validation for plugin options
 * - Full support for all babel-plugin-react-compiler options
 *
 * @example
 * // Basic usage
 * const reactCompilerPlugin = new ReactCompilerPlugin({
 *   target: '17',
 *   verbose: true,
 *   debug: 'critical',
 *   include: /ui\/components/,
 *   exclude: /\.test\./,
 * });
 *
 * // Add to webpack config
 * module.exports = {
 *   plugins: [reactCompilerPlugin],
 *   module: {
 *     rules: [reactCompilerPlugin.getLoaderRule()],
 *   },
 * };
 * @example
 * // With gating
 * const reactCompilerPlugin = new ReactCompilerPlugin({
 *   target: '18',
 *   gating: {
 *     source: 'my-gating-module',
 *     importSpecifierName: 'isCompilerEnabled',
 *   },
 * });
 * @example
 * // With compilation mode
 * const reactCompilerPlugin = new ReactCompilerPlugin({
 *   target: '19',
 *   compilationMode: 'annotation', // Only compile annotated functions
 * });
 */
export class ReactCompilerPlugin {
  private readonly options: ReactCompilerLoaderOption;

  private readonly logger: ReactCompilerLogger;

  /**
   * Default test pattern for matching React component files.
   * Exposed for use in custom configurations.
   */
  static readonly defaultTest = DEFAULT_TEST;

  constructor(options: ReactCompilerLoaderOption) {
    validate(schema, options, { name: NAME });

    this.options = {
      ...defaultOptions,
      ...options,
    };
    this.logger = new ReactCompilerLogger();
  }

  /**
   * Returns the webpack loader configuration for the React Compiler.
   * Use this in your module.rules array.
   *
   * @returns A webpack RuleSetRule configured for React Compiler
   */
  getLoaderRule() {
    const {
      target,
      verbose,
      debug,
      include,
      exclude,
      test,
      // Compiler options
      compilationMode,
      gating,
      dynamicGating,
      noEmit,
      eslintSuppressionRules,
      flowSuppressions,
      ignoreUseNoForget,
      customOptOutDirectives,
      sources,
      enableReanimatedCheck,
      // Babel options
      babelTransformOptions,
    } = this.options;

    const reactCompilerOptions = defineReactCompilerLoaderOption({
      target,
      logger: verbose ? this.logger : undefined,
      panicThreshold: debug === 'none' ? undefined : `${debug}_errors`,
      // Pass through additional compiler options if provided
      ...(compilationMode !== undefined && { compilationMode }),
      ...(gating !== undefined && { gating }),
      ...(dynamicGating !== undefined && { dynamicGating }),
      ...(noEmit !== undefined && { noEmit }),
      ...(eslintSuppressionRules !== undefined && { eslintSuppressionRules }),
      ...(flowSuppressions !== undefined && { flowSuppressions }),
      ...(ignoreUseNoForget !== undefined && { ignoreUseNoForget }),
      ...(customOptOutDirectives !== undefined && { customOptOutDirectives }),
      ...(sources !== undefined && { sources }),
      ...(enableReanimatedCheck !== undefined && { enableReanimatedCheck }),
      ...(babelTransformOptions !== undefined && {
        babelTransFormOpt: babelTransformOptions,
      }),
    });

    return {
      test,
      ...(include !== undefined && { include }),
      ...(exclude !== undefined && { exclude }),
      use: [
        {
          loader: reactCompilerLoader,
          options: reactCompilerOptions,
        },
      ],
    };
  }

  /**
   * Webpack plugin apply method.
   * Hooks into the compilation lifecycle to log summaries and reset stats.
   *
   * @param compiler - The webpack compiler instance
   */
  apply(compiler: Compiler): void {
    compiler.hooks.afterEmit.tap(ReactCompilerPlugin.name, () => {
      this.logger.logSummary();
      this.logger.reset();
    });
  }
}
