import type { Compiler, Compilation, Module } from 'webpack';
import {
  REACT_COMPILER_STATUS_KEY,
  type ReactCompilerLogEntry,
  type ReactCompilerStats,
  type ReactCompilerStatus,
  type ReactCompilerStatusCounts,
} from '../../loaders/reactCompilerLoader';

const STATUS_ORDER = [
  'error',
  'unsupported',
  'skipped',
  'compiled',
] as const satisfies ReactCompilerStatus[];

function worstStatus(
  counts: ReactCompilerStatusCounts,
): ReactCompilerStatus | null {
  for (const s of STATUS_ORDER) {
    if ((counts[s] ?? 0) > 0) return s;
  }
  return null;
}

function hasMultipleStatuses(counts: ReactCompilerStatusCounts): boolean {
  let nonzero = 0;
  for (const s of STATUS_ORDER) {
    if ((counts[s] ?? 0) > 0) nonzero++;
    if (nonzero > 1) return true;
  }
  return false;
}

function toLogEntry(
  filename: string,
  raw: Record<string, unknown>,
): ReactCompilerLogEntry {
  const status = raw.status as ReactCompilerStatus;
  const kind = raw.kind as ReactCompilerLogEntry['kind'];
  const loc = raw.loc as { line: number; column: number } | undefined;
  return {
    filename,
    status: STATUS_ORDER.includes(status) ? status : 'compiled',
    kind: ['CompileSuccess', 'CompileSkip', 'CompileError'].includes(kind)
      ? kind
      : 'CompileSuccess',
    ...(typeof raw.message === 'string' && { message: raw.message }),
    ...(loc &&
      typeof loc.line === 'number' &&
      typeof loc.column === 'number' && { loc }),
  };
}

/**
 * Collect React Compiler statistics from all modules' buildMeta.
 *
 * NOTE: This does NOT work with thread-loader because workers cannot access
 * `_module.buildMeta` (it's null in worker contexts). The webpack config
 * automatically disables thread-loader when --reactCompilerVerbose is used.
 *
 * @param compilation - The webpack compilation object.
 * @returns The React Compiler statistics.
 */
function collectStats(compilation: Compilation): ReactCompilerStats {
  const componentCounts: ReactCompilerStatusCounts = {
    compiled: 0,
    skipped: 0,
    error: 0,
    unsupported: 0,
  };
  const allEvents: ReactCompilerLogEntry[] = [];
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
    componentCounts,
    fileDetails: [],
    events: allEvents,
  };

  const processModule = (module: Module) => {
    const buildMeta = module.buildMeta as Record<string, unknown> | undefined;
    const stored = buildMeta?.[REACT_COMPILER_STATUS_KEY];

    if (stored === null) {
      return;
    }

    const filename =
      'resource' in module ? (module.resource as string) : module.identifier();

    stats.total++;

    let counts: ReactCompilerStatusCounts;
    const storedObj = stored as Record<string, unknown>;

    if (
      typeof stored === 'object' &&
      stored !== null &&
      Array.isArray(storedObj.events)
    ) {
      counts = { compiled: 0, skipped: 0, error: 0, unsupported: 0 };
      for (const raw of storedObj.events as Record<string, unknown>[]) {
        const entry = toLogEntry(filename, raw);
        allEvents.push(entry);
        counts[entry.status] = (counts[entry.status] ?? 0) + 1;
      }
    } else if (
      typeof stored === 'object' &&
      stored !== null &&
      !Array.isArray(stored)
    ) {
      counts = {
        compiled: (storedObj.compiled as number) ?? 0,
        skipped: (storedObj.skipped as number) ?? 0,
        error: (storedObj.error as number) ?? 0,
        unsupported: (storedObj.unsupported as number) ?? 0,
      };
    } else if (
      typeof stored === 'string' &&
      STATUS_ORDER.includes(stored as ReactCompilerStatus)
    ) {
      counts = { compiled: 0, skipped: 0, error: 0, unsupported: 0 };
      counts[stored as ReactCompilerStatus] = 1;
    } else {
      counts = { compiled: 0, skipped: 0, error: 0, unsupported: 0 };
    }

    for (const s of STATUS_ORDER) {
      componentCounts[s] = (componentCounts[s] ?? 0) + (counts[s] ?? 0);
    }

    const status = worstStatus(counts);
    if (!status) return;

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

    if (hasMultipleStatuses(counts)) {
      stats.fileDetails.push({ filename, counts });
    }
  };

  for (const module of compilation.modules) {
    processModule(module);
  }

  return stats;
}

const STATUS_ICON: Record<ReactCompilerStatus, string> = {
  compiled: '✅',
  skipped: '⏭️',
  error: '❌',
  unsupported: '🔍',
};

/**
 * Log the React Compiler statistics summary with file-, component-, and event-level detail.
 *
 * @param stats - React Compiler run statistics.
 */
function logSummary(stats: ReactCompilerStats): void {
  console.log('\n📊 React Compiler Statistics:');
  console.log('   Files:');
  console.log(`   ✅ Compiled: ${stats.compiled} files`);
  console.log(`   ⏭️  Skipped: ${stats.skipped} files`);
  console.log(`   ❌ Errors: ${stats.errors} files`);
  console.log(`   🔍 Unsupported: ${stats.unsupported} files`);
  console.log(`   📦 Total: ${stats.total} files`);

  const totalComponents =
    (stats.componentCounts.compiled ?? 0) +
    (stats.componentCounts.skipped ?? 0) +
    (stats.componentCounts.error ?? 0) +
    (stats.componentCounts.unsupported ?? 0);
  if (totalComponents > 0) {
    console.log('   Components:');
    console.log(`   ✅ Compiled: ${stats.componentCounts.compiled ?? 0}`);
    console.log(`   ⏭️  Skipped: ${stats.componentCounts.skipped ?? 0}`);
    console.log(`   ❌ Errors: ${stats.componentCounts.error ?? 0}`);
    console.log(`   🔍 Unsupported: ${stats.componentCounts.unsupported ?? 0}`);
    console.log(`   📦 Total: ${totalComponents}`);
  }

  if (stats.events.length > 0) {
    console.log('   Event log:');
    for (const e of stats.events) {
      const icon = STATUS_ICON[e.status];
      const loc = e.loc ? ` (${e.loc.line}:${e.loc.column})` : '';
      const msg = e.message ? ` - ${e.message}` : '';
      console.log(
        `   ${icon} ${e.filename}${loc}: ${e.status} (${e.kind})${msg}`,
      );
    }
  }

  if (stats.fileDetails.length > 0) {
    console.log('   Files with mixed results:');
    for (const { filename, counts } of stats.fileDetails) {
      const parts: string[] = [];
      if ((counts.compiled ?? 0) > 0) parts.push(`${counts.compiled} compiled`);
      if ((counts.skipped ?? 0) > 0) parts.push(`${counts.skipped} skipped`);
      if ((counts.error ?? 0) > 0) parts.push(`${counts.error} error(s)`);
      if ((counts.unsupported ?? 0) > 0) {
        parts.push(`${counts.unsupported} unsupported`);
      }
      console.log(`   ${filename}: ${parts.join(', ')}`);
    }
  }
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
