import fs from 'fs';
import path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../..');
const SOURCE_DIRS = ['app', 'shared', 'ui'];
const TRACE_MODULE = path.join('shared', 'lib', 'trace.ts');

function listSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' ? [] : listSourceFiles(fullPath);
    }
    const isSource = /\.(ts|tsx|js|jsx)$/u.test(entry.name);
    const isTest = /\.(test|spec)\.(ts|tsx|js|jsx)$/u.test(entry.name);
    return isSource && !isTest ? [fullPath] : [];
  });
}

// `TraceRequest.root` is the one way to start a new trace. A second entry
// point lets call sites pick between two spellings of one concept, and an
// audit of which operations root their own traces then misses one of them.
describe('root-trace primitive', () => {
  it('calls Sentry startNewTrace from shared/lib/trace.ts only', () => {
    const callers = SOURCE_DIRS.flatMap((dir) =>
      listSourceFiles(path.join(REPO_ROOT, dir)),
    )
      .filter((file) =>
        /\bstartNewTrace\b/u.test(fs.readFileSync(file, 'utf8')),
      )
      .map((file) => path.relative(REPO_ROOT, file));

    expect(callers).toStrictEqual([TRACE_MODULE]);
  });

  it('starts a new trace from a single place inside trace.ts', () => {
    const source = fs.readFileSync(path.join(REPO_ROOT, TRACE_MODULE), 'utf8');
    const calls = source.match(/\bsentryStartNewTrace\(/gu) ?? [];

    // Its one call, in the `root` branch.
    expect(calls).toHaveLength(1);
  });
});
