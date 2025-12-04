import type { LoggerEvent, Logger } from 'babel-plugin-react-compiler';

// Re-export Logger type for convenience
export type { Logger } from 'babel-plugin-react-compiler';

/**
 * Logger for tracking React Compiler compilation statistics.
 * Implements the `Logger` interface from babel-plugin-react-compiler.
 *
 * Tracks:
 * - Successful compilations (CompileSuccess events)
 * - Skipped files (CompileSkip events)
 * - Compilation errors (CompileError events)
 * - Unsupported syntax (CompileError events with 'Todo' category)
 */
export class ReactCompilerLogger implements Logger {
  private compiledCount = 0;

  private skippedCount = 0;

  private errorCount = 0;

  private todoCount = 0;

  private compiledFiles: string[] = [];

  private skippedFiles: string[] = [];

  private errorFiles: string[] = [];

  private todoFiles: string[] = [];

  /**
   * Log a compilation event from the React Compiler.
   * This method implements the `Logger.logEvent` interface.
   *
   * @param filename - The path of the file being compiled
   * @param event - The compilation event from the React Compiler
   */
  logEvent(filename: string | null, event: LoggerEvent): void {
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

      case 'CompileError': {
        const { detail } = event;
        // Check if the error is a "Todo" category (unsupported syntax)
        // This error is thrown for syntax that is not yet supported by the React Compiler.
        // We count these separately as "unsupported" errors, since there's no actionable fix.
        const category =
          'category' in detail ? detail.category : detail.options?.category;
        if (category === 'Todo') {
          this.todoCount++;
          this.todoFiles.push(filename);
          break;
        }
        this.errorCount++;
        this.errorFiles.push(filename);
        console.error(
          `❌ React Compiler error in ${filename}: ${
            detail
              ? JSON.stringify(
                  'reason' in detail ? detail.reason : detail,
                  null,
                  2,
                )
              : 'Unknown error'
          }`,
        );
        break;
      }

      case 'CompileDiagnostic':
        // Diagnostics are informational, we don't track them in stats
        // but could log them in verbose mode if needed
        break;

      case 'PipelineError':
        // Pipeline errors are internal compiler errors
        this.errorCount++;
        this.errorFiles.push(filename);
        console.error(
          `❌ React Compiler pipeline error in ${filename}: ${event.data}`,
        );
        break;

      case 'Timing':
      case 'AutoDepsDecorations':
      case 'AutoDepsEligible':
        // These are informational events, not tracked in basic stats
        break;

      default:
        // Exhaustive check - TypeScript will error if we miss a case
        break;
    }
  }

  /**
   * Get the current compilation statistics.
   *
   * @returns Object containing counts and file lists for each category
   */
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

  /**
   * Log a summary of compilation statistics to the console.
   */
  logSummary(): void {
    const stats = this.getStats();
    console.log('\n📊 React Compiler Statistics:');
    console.log(`   ✅ Compiled: ${stats.compiled} files`);
    console.log(`   ⏭️  Skipped: ${stats.skipped} files`);
    console.log(`   ❌ Errors: ${stats.errors} files`);
    console.log(`   🔍 Unsupported: ${stats.unsupported} files`);
    console.log(`   📦 Total processed: ${stats.total} files`);
  }

  /**
   * Reset all statistics to initial state.
   * Called at the start of each compilation to ensure accurate per-build stats.
   */
  reset(): void {
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
