import type { Compiler, RuleSetRule, RuleSetCondition } from 'webpack';
import {
  type ReactCompilerLoaderOption,
  defineReactCompilerLoaderOption,
  reactCompilerLoader,
} from 'react-compiler-webpack';
import type { Logger } from 'babel-plugin-react-compiler';

/**
 * React Compiler logger that tracks compilation statistics.
 */
class ReactCompilerLogger {
  private compiledCount = 0;

  private skippedCount = 0;

  private errorCount = 0;

  private todoCount = 0;

  private compiledFiles: string[] = [];

  private skippedFiles: string[] = [];

  private errorFiles: string[] = [];

  private todoFiles: string[] = [];

  logEvent(
    filename: string | null,
    event: { kind: string; detail: { options: { category: string } } },
  ) {
    if (filename === null) {
      return;
    }
    const { options: errorDetails } = event.detail ?? {};
    switch (event.kind) {
      case 'CompileSuccess':
        this.compiledCount++;
        this.compiledFiles.push(filename);
        console.log(`✅ Compiled: ${filename}`);
        break;
      case 'CompileSkip':
        this.skippedCount++;
        this.skippedFiles.push(filename);
        break;
      case 'CompileError':
        // This error is thrown for syntax that is not yet supported by the React Compiler.
        // We count these separately as "unsupported" errors, since there's no actionable fix we can apply.
        if (errorDetails?.category === 'Todo') {
          this.todoCount++;
          this.todoFiles.push(filename);
          break;
        }
        this.errorCount++;
        this.errorFiles.push(filename);
        console.error(
          `❌ React Compiler error in ${filename}: ${errorDetails ? JSON.stringify(errorDetails) : 'Unknown error'}`,
        );
        break;
      default:
        break;
    }
  }

  getStats() {
    return {
      compiled: this.compiledCount,
      skipped: this.skippedCount,
      errors: this.errorCount,
      unsupported: this.todoCount,
      total:
        this.compiledCount +
        this.skippedCount +
        this.errorCount +
        this.todoCount,
      compiledFiles: this.compiledFiles,
      skippedFiles: this.skippedFiles,
      errorFiles: this.errorFiles,
      unsupportedFiles: this.todoFiles,
    };
  }

  logSummary() {
    const stats = this.getStats();
    console.log('\n📊 React Compiler Statistics:');
    console.log(`   ✅ Compiled: ${stats.compiled} files`);
    console.log(`   ⏭️  Skipped: ${stats.skipped} files`);
    console.log(`   ❌ Errors: ${stats.errors} files`);
    console.log(`   🔍 Unsupported: ${stats.unsupported} files`);
    console.log(`   📦 Total processed: ${stats.total} files`);
  }

  reset() {
    this.compiledCount = 0;
    this.skippedCount = 0;
    this.errorCount = 0;
    this.todoCount = 0;
    this.compiledFiles = [];
    this.skippedFiles = [];
    this.errorFiles = [];
    this.todoFiles = [];
  }
}

export type ReactCompilerPluginOptions = {
  /**
   * The target React version for the compiler.
   */
  target: ReactCompilerLoaderOption['target'];
  /**
   * Enable verbose logging of compilation events.
   */
  verbose?: boolean;
  /**
   * Debug level for build failure behavior.
   * - 'all': Fail build on and display debug information for all compilation errors.
   * - 'critical': Fail build on and display debug information only for critical compilation errors.
   * - 'none': Prevent build from failing.
   */
  debug?: 'all' | 'critical' | 'none';
  /**
   * Regex pattern or patterns to include files for compilation.
   * Files must match at least one pattern to be processed.
   */
  include?: RuleSetCondition;
  /**
   * Regex pattern or patterns to exclude files from compilation.
   * Files matching any pattern will be skipped.
   */
  exclude?: RuleSetCondition;
  /**
   * Test pattern for matching files (e.g., /\.tsx?$/).
   * Defaults to match .js, .jsx, .ts, .tsx, .mjs, .mts files.
   */
  test?: RuleSetCondition;
};

/**
 * Webpack plugin that integrates React Compiler with logging and path filtering.
 *
 * @example
 * ```ts
 * const reactCompilerPlugin = new ReactCompilerPlugin({
 *   target: '17',
 *   verbose: true,
 *   debug: 'critical',
 *   include: /ui\/components/,
 *   exclude: /\.test\./,
 * });
 *
 * // Add to webpack config
 * plugins: [reactCompilerPlugin],
 * module: {
 *   rules: [reactCompilerPlugin.getLoaderRule()],
 * },
 * ```
 */
export class ReactCompilerPlugin {
  private readonly options: Required<ReactCompilerPluginOptions>;

  private readonly logger: ReactCompilerLogger;

  static readonly defaultTest =
    /(?:.(?!\.(?:test|stories|container)))+\.(?:m?[jt]s|[jt]sx)$/u;

  constructor(options: ReactCompilerPluginOptions) {
    this.options = {
      target: options.target,
      verbose: options.verbose ?? false,
      debug: options.debug ?? 'none',
      include: options.include ?? /.*/u,
      exclude: options.exclude ?? /(?!)/u, // Matches nothing by default
      test: options.test ?? ReactCompilerPlugin.defaultTest,
    };
    this.logger = new ReactCompilerLogger();
  }

  /**
   * Returns the webpack loader configuration for the React Compiler.
   * Use this in your module.rules array.
   */
  getLoaderRule(): RuleSetRule {
    const { target, verbose, debug, include, exclude, test } = this.options;

    const reactCompilerOptions = {
      target,
      logger: verbose ? (this.logger as Logger) : undefined,
      panicThreshold: debug === 'none' ? debug : `${debug}_errors`,
    } as const satisfies ReactCompilerLoaderOption;

    return {
      test,
      include,
      exclude,
      use: [
        {
          loader: reactCompilerLoader,
          options: defineReactCompilerLoaderOption(reactCompilerOptions),
        },
      ],
    };
  }

  /**
   * Get compilation statistics from the logger.
   */
  getStats() {
    return this.logger.getStats();
  }

  /**
   * Reset the logger statistics.
   */
  resetStats() {
    this.logger.reset();
  }

  apply(compiler: Compiler): void {
    compiler.hooks.afterEmit.tap(ReactCompilerPlugin.name, () => {
      const logger = getReactCompilerLogger();
      logger.logSummary();
      // Reset statistics after logging to prevent accumulation in watch mode
      logger.reset();
    });
  }
}
