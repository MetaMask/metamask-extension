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
        if (event.detail?.options?.category === 'Todo') {
          this.todoCount++;
          this.todoFiles.push(filename);
          break;
        }
        this.errorCount++;
        this.errorFiles.push(filename);
        console.error(
          `❌ React Compiler error in ${filename}: ${JSON.stringify(event.detail?.options) || 'Unknown error'}`,
        );
        break;
      default:
        // Ignore other event types
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
}

// Create a singleton logger instance
const reactCompilerLogger = new ReactCompilerLogger();

/**
 * Get the React Compiler logger instance for accessing statistics
 */
export function getReactCompilerLogger(): ReactCompilerLogger {
  return reactCompilerLogger;
}

export const getReactCompilerLoader = (
  target: ReactCompilerLoaderOption['target'],
  verbose: boolean,
) => {
  const reactCompilerOptions = {
    target,
    logger: verbose ? (reactCompilerLogger as Logger) : undefined,
  } as const satisfies ReactCompilerLoaderOption;

  return {
    loader: reactCompilerLoader,
    options: defineReactCompilerLoaderOption(reactCompilerOptions),
  };
};
