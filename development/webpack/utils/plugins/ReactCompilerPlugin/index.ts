import type { Compiler, Compilation, Module } from 'webpack';
import {
  REACT_COMPILER_STATUS_KEY,
  type ReactCompilerStatus,
  type ReactCompilerStats,
} from '../../loaders/reactCompilerLoader';

/**
 * Collect React Compiler statistics from all modules' buildMeta.
 * This works with thread-loader because buildMeta is collected by webpack
 * in the main process after all loaders complete.
 *
 * @param compilation - The webpack compilation object.
 * @returns The React Compiler statistics.
 */
function collectStats(compilation: Compilation): ReactCompilerStats {
  const stats: ReactCompilerStats = {
    compiled: 0,
    skipped: 0,
    errors: 0,
    unsupported: 0,
    total: 0,
    compiledFiles: [],
    skippedFiles: [],
    errorFiles: [],
    unsupportedFiles: [],
  };

  const processModule = (module: Module) => {
    const buildMeta = module.buildMeta as Record<string, unknown> | undefined;
    const status = buildMeta?.[REACT_COMPILER_STATUS_KEY] as
      | ReactCompilerStatus
      | undefined;

    if (!status) {
      return;
    }

    // Get the module's resource path (filename)
    const filename =
      'resource' in module ? (module.resource as string) : module.identifier();

    stats.total++;

    switch (status) {
      case 'compiled':
        stats.compiled++;
        stats.compiledFiles.push(filename);
        break;
      case 'skipped':
        stats.skipped++;
        stats.skippedFiles.push(filename);
        break;
      case 'error':
        stats.errors++;
        stats.errorFiles.push(filename);
        break;
      case 'unsupported':
        stats.unsupported++;
        stats.unsupportedFiles.push(filename);
        break;
      default:
        break;
    }
  };

  // Iterate through all modules in the compilation
  for (const module of compilation.modules) {
    processModule(module);
  }

  return stats;
}

/**
 * Log the React Compiler statistics summary.
 *
 * @param stats - React Compiler run statistics.
 */
function logSummary(stats: ReactCompilerStats): void {
  console.log('\n📊 React Compiler Statistics:');
  console.log(`   ✅ Compiled: ${stats.compiled} files`);
  console.log(`   ⏭️  Skipped: ${stats.skipped} files`);
  console.log(`   ❌ Errors: ${stats.errors} files`);
  console.log(`   🔍 Unsupported: ${stats.unsupported} files`);
  console.log(`   📦 Total processed: ${stats.total} files`);
}

export class ReactCompilerPlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.afterEmit.tap(ReactCompilerPlugin.name, (compilation) => {
      const stats = collectStats(compilation);

      // Only log summary if any modules were processed
      if (stats.total > 0) {
        logSummary(stats);
      }
    });
  }
}
