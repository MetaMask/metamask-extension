#!/usr/bin/env node
/**
 * Finds all non-test files that import from a given module path.
 * Used for building Layer 2, 3, ... in selector usage tracing.
 *
 * Usage: node find-importers.js <module-path> [search-root] [--with-symbols] [--symbols sym1,sym2] [--barrel] [--source-file path]
 *   module-path: e.g. "selectors/assets" or "selectors" (no .ts/.js)
 *   search-root: optional, e.g. "ui" to limit search (default: repo root)
 *   --with-symbols: output "path\tsymbol1,symbol2" per file
 *   --symbols sym1,sym2: only list files that import at least one of these symbols
 *   --barrel: match the module segment exactly, not a subpath such as selectors/foo
 *   --source-file: real file for this module. Relative imports are resolved only inside its directory.
 *   If module-path has no '/', barrel mode is inferred.
 * Output: One repo-relative path per line. With symbols: "path\tsymbol1, symbol2"
 *
 * Exit 0 when the search succeeds, including when nothing matches.
 * Exit 2 when ripgrep is missing. Exit 1 on any other failure.
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const EXCLUDE_GLOBS = [
  '--glob=!*.test.*',
  '--glob=!*.spec.*',
  '--glob=!*.stories.*',
  '--glob=!**/__tests__/**',
  '--glob=!**/__snapshots__/**',
  '--glob=!trace-selectors/**',
  '--glob=!**/node_modules/**',
  '--glob=!dist/**',
  '--glob=!build/**',
];

function moduleKey(filePath) {
  return filePath.replace(/\\/g, '/').replace(/\.(ts|tsx|js|jsx)$/, '');
}

function toRepoPath(filePath) {
  const absolute = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
  return path.relative(process.cwd(), absolute).split(path.sep).join('/');
}

function resolveRelative(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const resolved = path.normalize(path.join(path.dirname(fromFile), specifier));
  return moduleKey(resolved.split(path.sep).join('/'));
}

function specifierMatches(specifier, { pathFragment, barrelMode, sourceFile, importerFile }) {
  const withoutExt = specifier.replace(/\.(js|jsx|ts|tsx)$/, '');
  if (barrelMode) {
    if (withoutExt === pathFragment) return true;
    const suffix = `/${pathFragment}`;
    if (!withoutExt.endsWith(suffix)) return false;
    // `selectors/selectors` is the file selectors.js, not the barrel directory.
    const parent = withoutExt.slice(0, -suffix.length);
    return parent !== pathFragment && !parent.endsWith(suffix);
  }
  if (withoutExt === pathFragment || withoutExt.endsWith(`/${pathFragment}`)) {
    return true;
  }
  if (sourceFile && importerFile && specifier.startsWith('.')) {
    return resolveRelative(importerFile, specifier) === moduleKey(sourceFile);
  }
  return false;
}

function namesFromBrace(inner) {
  const names = [];
  for (const part of inner.split(',')) {
    const trimmed = part.trim();
    if (trimmed === '' || trimmed.startsWith('type ')) continue;
    const alias = trimmed.match(/^(\w+)\s+as\s+\w+$/);
    const name = alias ? alias[1] : trimmed.split(/\s+/)[0];
    if (/^\w+$/.test(name)) names.push(name);
  }
  return names;
}

function symbolsFromStatement(statement) {
  const symbols = [];
  const brace = statement.match(/\{([^}]*)\}/);
  if (brace) symbols.push(...namesFromBrace(brace[1]));

  const starAs = statement.match(/\*\s+as\s+(\w+)/);
  if (starAs) {
    symbols.push(`* as ${starAs[1]}`);
  } else if (/\*\s*(?:from|$)/.test(statement) || /export\s+\*/.test(statement)) {
    symbols.push('*');
  }

  const defaultImport = statement.match(/^\s*import\s+(?:type\s+)?(\w+)\s*(?:,|from)\b/);
  if (defaultImport && defaultImport[1] !== 'type') {
    symbols.push(defaultImport[1]);
  }
  return symbols;
}

function lineNumberAt(content, index) {
  let line = 1;
  const stop = Math.min(index, content.length);
  for (let i = 0; i < stop; i += 1) {
    if (content.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function visibleSymbols(symbols, allowedSymbols) {
  if (allowedSymbols == null) return symbols;
  const named = symbols.filter((symbol) => allowedSymbols.has(symbol));
  if (named.length > 0) return named;
  return symbols.filter(
    (symbol) =>
      symbol === '(default or *)' ||
      symbol === '*' ||
      symbol.startsWith('* as '),
  );
}

/**
 * Import and re-export sites in one file that resolve to the traced module.
 * `line` is the 1-based line of the import or export keyword.
 */
function getImportOccurrences(file, matchOptions) {
  const abs = path.resolve(process.cwd(), file);
  const content = fs.readFileSync(abs, 'utf8');
  const occurrences = [];
  const fromRe = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = fromRe.exec(content)) !== null) {
    const specifier = match[1];
    if (
      !specifierMatches(specifier, {
        ...matchOptions,
        importerFile: file,
      })
    ) {
      continue;
    }
    const before = content.slice(0, match.index);
    const start = Math.max(
      before.lastIndexOf('import'),
      before.lastIndexOf('export'),
    );
    if (start === -1) continue;
    const statement = content.slice(start, match.index);
    const names = symbolsFromStatement(statement);
    const symbols =
      names.length > 0 ? names : statement.includes('{') ? [] : ['(default or *)'];
    if (symbols.length === 0) continue;
    const kept = visibleSymbols(symbols, matchOptions.allowedSymbols);
    if (kept.length === 0) continue;
    occurrences.push({
      symbols: kept,
      line: lineNumberAt(content, start),
    });
  }
  return occurrences;
}

const rgCache = new Map();

function runRg(pattern, searchAbs) {
  const cacheKey = `${searchAbs}\0${pattern}`;
  if (rgCache.has(cacheKey)) return rgCache.get(cacheKey);
  const result = spawnSync(
    'rg',
    ['-l', ...EXCLUDE_GLOBS, pattern, searchAbs],
    { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
  );
  if (result.error && result.error.code === 'ENOENT') {
    const error = new Error('ripgrep (rg) is required on PATH');
    error.exitCode = 2;
    throw error;
  }
  if (result.status !== 0 && result.status !== 1) {
    const error = new Error((result.stderr || 'rg failed').trim());
    error.exitCode = result.status == null ? 1 : result.status;
    throw error;
  }
  const files = (result.stdout || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((file) => toRepoPath(file));
  rgCache.set(cacheKey, files);
  return files;
}

function parseArgs(argv) {
  const symbolFilterIdx = argv.indexOf('--symbols');
  const sourceFileIdx = argv.indexOf('--source-file');
  let allowedSymbols = null;
  if (symbolFilterIdx !== -1 && argv[symbolFilterIdx + 1]) {
    allowedSymbols = new Set(
      argv[symbolFilterIdx + 1]
        .split(',')
        .map((symbol) => symbol.trim())
        .filter(Boolean),
    );
  }
  const sourceFile =
    sourceFileIdx !== -1 && argv[sourceFileIdx + 1]
      ? argv[sourceFileIdx + 1].replace(/\\/g, '/')
      : null;
  const positional = argv.filter((arg, index) => {
    if (arg === '--with-symbols' || arg === '--barrel') return false;
    if (symbolFilterIdx >= 0 && (index === symbolFilterIdx || index === symbolFilterIdx + 1)) {
      return false;
    }
    if (sourceFileIdx >= 0 && (index === sourceFileIdx || index === sourceFileIdx + 1)) {
      return false;
    }
    return true;
  });
  return {
    modulePath: positional[0],
    searchRoot: positional[1] || '.',
    withSymbols: argv.includes('--with-symbols') || allowedSymbols != null,
    barrelMode: argv.includes('--barrel') || (positional[0] && !positional[0].includes('/')),
    allowedSymbols,
    sourceFile,
  };
}

function findImporters({
  modulePath,
  searchRoot = '.',
  withSymbols = false,
  barrelMode = false,
  allowedSymbols = null,
  sourceFile = null,
}) {
  const pathFragment = modulePath.replace(/\.(ts|tsx|js|jsx)$/, '');
  const escaped = pathFragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rootAbs = path.resolve(process.cwd(), searchRoot);
  const extension = '(?:\\.(?:js|jsx|ts|tsx))?';
  const pattern = barrelMode
    ? `from\\s+['"](?:${escaped}|(?:[^'"]*\\/)${escaped})${extension}['"]`
    : `from\\s+['"](?:[^'"]*\\/)?${escaped}${extension}['"]`;

  let files = runRg(pattern, rootAbs);
  if (!barrelMode && sourceFile) {
    const sourceDir = path.resolve(process.cwd(), path.dirname(sourceFile));
    if (fs.existsSync(sourceDir)) {
      files = files.concat(runRg(`from\\s+['"]\\.[^'"]+['"]`, sourceDir));
    }
  }

  const matchOptions = { pathFragment, barrelMode, sourceFile, allowedSymbols };
  const seen = new Set();
  const rows = [];
  for (const file of files.sort((a, b) => a.localeCompare(b, 'en'))) {
    if (seen.has(file)) continue;
    seen.add(file);
    if (sourceFile && moduleKey(file) === moduleKey(sourceFile)) continue;
    if (barrelMode && /README\.(md|mdx)$/i.test(file)) continue;
    const occurrences = getImportOccurrences(file, matchOptions);
    if (occurrences.length === 0) continue;
    const symbols = [
      ...new Set(occurrences.flatMap((occurrence) => occurrence.symbols)),
    ].sort((a, b) => a.localeCompare(b, 'en'));
    const lines = [...new Set(occurrences.map((occurrence) => occurrence.line))].sort(
      (a, b) => a - b,
    );
    rows.push({
      path: file,
      symbols: withSymbols ? symbols.join(', ') : '',
      lines,
    });
  }
  return rows;
}

if (require.main === module) {
  const args = parseArgs(process.argv.slice(2));
  if (!args.modulePath) {
    process.stderr.write(
      'Usage: node find-importers.js <module-path> [search-root] [--with-symbols] [--symbols sym1,sym2] [--barrel] [--source-file path]\n',
    );
    process.exit(1);
  }
  try {
    const rows = findImporters(args);
    for (const row of rows) {
      if (args.withSymbols) {
        process.stdout.write(`${row.path}\t${row.symbols}\n`);
      } else {
        process.stdout.write(`${row.path}\n`);
      }
    }
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(error.exitCode || 1);
  }
}

module.exports = {
  findImporters,
  specifierMatches,
  moduleKey,
};
