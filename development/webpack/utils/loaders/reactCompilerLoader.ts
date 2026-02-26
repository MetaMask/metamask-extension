import {
  type ReactCompilerLoaderOption,
  defineReactCompilerLoaderOption,
  reactCompilerLoader,
} from 'react-compiler-webpack';
import type { Logger } from 'babel-plugin-react-compiler';

/**
 * React Compiler logger that tracks compilation statistics
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

  /**
   * Reset all statistics. Should be called after each build in watch mode
   * to prevent accumulation across rebuilds.
   */
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

const reactCompilerLogger = new ReactCompilerLogger();

/**
 * Get the React Compiler logger singleton instance to access statistics.
 */
export function getReactCompilerLogger(): ReactCompilerLogger {
  return reactCompilerLogger;
}

/**
 * Get the React Compiler loader.
 *
 * @param target - The target version of the React Compiler.
 * @param verbose - Whether to enable verbose mode.
 * @param debug - The debug level to use.
 * - 'all': Fail build on and display debug information for all compilation errors.
 * - 'critical': Fail build on and display debug information only for critical compilation errors.
 * - 'none': Prevent build from failing.
 * @returns The React Compiler loader object with the loader and configured options.
 */
export const getReactCompilerLoader = (
  target: ReactCompilerLoaderOption['target'],
  verbose: boolean,
  debug: 'all' | 'critical' | 'none',
) => {
  const reactCompilerOptions = {
    target,
    logger: verbose ? (reactCompilerLogger as Logger) : undefined,
    panicThreshold: debug === 'none' ? undefined : `${debug}_errors`,
  } as const satisfies ReactCompilerLoaderOption;

  return {
    loader: reactCompilerLoader,
    options: defineReactCompilerLoaderOption(reactCompilerOptions),
  };
};
