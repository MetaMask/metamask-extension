#!/usr/bin/env node
/**
 * Recursion driver for selector usage tracing.
 * Writes each layer and terminal nodes to the output document as soon as they
 * are discovered (incremental write; no full trace kept in context).
 *
 * Usage:
 *   node trace-usage.js --config <config.json>
 *   node trace-usage.js <root-file> [output-doc]   (single root, backward compat)
 *
 * Config JSON: { "output": "...", "roots": [...], "completionFile": "path/to/completed.txt" }
 * completionFile: optional; one path per line (lines starting with # are comments). Listed files are excluded from the report (migrated).
 *
 * Requires: list-exports.js, find-importers.js, classify-file.js, selector-deps.js in same dir.
 * Requires: rg (ripgrep) on PATH.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { expandChainSymbols, getChainExportsOfFile } = require(path.join(__dirname, 'selector-deps.js'));

const SCRIPT_DIR = __dirname;
const searchRoot = '.';

function runListExports(rootPath) {
  const r = spawnSync('node', [path.join(SCRIPT_DIR, 'list-exports.js'), rootPath], {
    encoding: 'utf8',
    cwd: process.cwd(),
  });
  if (r.status !== 0) {
    process.stderr.write(r.stderr || 'list-exports failed\n');
    process.exit(1);
  }
  return r.stdout.trim().split('\n').filter(Boolean);
}

function runFindImporters(modulePath, searchRootArg, symbolsFilter, options = {}) {
  const args = [
    path.join(SCRIPT_DIR, 'find-importers.js'),
    modulePath,
    searchRootArg || searchRoot,
    '--with-symbols',
  ];
  if (symbolsFilter && symbolsFilter.length > 0) {
    args.push('--symbols', symbolsFilter.join(','));
  }
  if (options.barrel) {
    args.push('--barrel');
  }
  const r = spawnSync('node', args, {
    encoding: 'utf8',
    cwd: process.cwd(),
    maxBuffer: 10 * 1024 * 1024,
  });
  if (r.status !== 0 && r.status !== 1) {
    process.stderr.write(r.stderr || 'find-importers failed\n');
    process.exit(r.status == null ? 1 : r.status);
  }
  const lines = r.stdout.trim().split('\n').filter(Boolean);
  return lines.map((line) => {
    const idx = line.indexOf('\t');
    if (idx === -1) return { path: line, symbols: '' };
    return { path: line.slice(0, idx), symbols: line.slice(idx + 1) };
  });
}

/**
 * If the file is under a barrel dir (e.g. ui/selectors/) but not the barrel index itself,
 * return the barrel module path (e.g. "selectors") so we can find importers of the barrel.
 */
function getBarrelModulePathForFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const dirMatch = normalized.match(/^(?:.*\/)?(selectors|ducks)\//);
  if (!dirMatch) return null;
  const barrelDir = dirMatch[1];
  const base = path.basename(normalized, path.extname(normalized));
  if (base === 'index') return null;
  return barrelDir;
}

/**
 * Returns which tracked symbols appear as identifiers (word-boundary) in the file.
 * Used to filter barrel importers and to report only tracked "Uses" for barrel-originated files.
 */
function getTrackedSymbolsUsedInFile(filePath, trackedSymbolsSet) {
  const abs = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) return [];
  const content = fs.readFileSync(abs, 'utf8');
  const used = [];
  for (const sym of trackedSymbolsSet) {
    const escaped = sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp('\\b' + escaped + '\\b');
    if (re.test(content)) used.push(sym);
  }
  return used;
}

function runClassify(paths) {
  if (paths.length === 0) return [];
  const r = spawnSync('node', [path.join(SCRIPT_DIR, 'classify-file.js'), ...paths], {
    encoding: 'utf8',
    cwd: process.cwd(),
  });
  if (r.status !== 0) {
    process.stderr.write(r.stderr || 'classify-file failed\n');
    process.exit(1);
  }
  return r.stdout.trim().split('\n').filter(Boolean).map((line) => {
    const [p, type, term] = line.split('\t');
    return { path: p, type: type || 'other', terminal: term === 'true' };
  });
}

function countSymbolInstances(symbolsStr) {
  if (!symbolsStr || !String(symbolsStr).trim()) return 0;
  return String(symbolsStr)
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean).length;
}

function normalizedSymbols(symbolsStr) {
  if (!symbolsStr || !String(symbolsStr).trim()) return '';
  return String(symbolsStr)
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'en'))
    .join(', ');
}

function appendLayer(docPath, layerNum, entries, terminals) {
  // Non-terminal first, then terminal; within each group sort by path
  const sorted = [...entries].sort((a, b) => {
    if (a.terminal !== b.terminal) return a.terminal ? 1 : -1;
    return a.path.localeCompare(b.path, 'en');
  });
  const nonTerminal = entries.filter((e) => !e.terminal);
  const fileCount = nonTerminal.length;
  const instances = nonTerminal.reduce((n, e) => n + countSymbolInstances(e.symbols), 0);
  const lines = [];
  lines.push('');
  lines.push(`## Layer ${layerNum} - Files: ${fileCount}; Instances: ${instances}`);
  lines.push('');
  lines.push('| Path | Uses | Type | Terminal |');
  lines.push('| --- | --- | --- | --- |');
  for (const e of sorted) {
    const term = e.terminal ? 'yes' : 'no';
    const uses = normalizedSymbols(e.symbols).replace(/\|/g, '\\|');
    lines.push(`| ${e.path} | ${uses} | ${e.type} | ${term} |`);
  }
  lines.push('');
  fs.appendFileSync(docPath, lines.join('\n'));
}

function appendTerminalSection(docPath, terminals) {
  if (terminals.length === 0) return;
  const sorted = [...terminals].sort((a, b) => a.path.localeCompare(b.path, 'en'));
  const instances = terminals.reduce((n, t) => n + countSymbolInstances(t.symbols), 0);
  const lines = [];
  lines.push('');
  lines.push(`## Terminal nodes summary - Files: ${terminals.length}; Instances: ${instances}`);
  lines.push('');
  lines.push('All React components and hooks that consume the root selectors (directly or indirectly):');
  lines.push('');
  for (const t of sorted) {
    lines.push(`- **${t.path}** (${t.type}): \`${normalizedSymbols(t.symbols).replace(/`/g, "'")}\``);
  }
  lines.push('');
  fs.appendFileSync(docPath, lines.join('\n'));
}

/**
 * Load completion file: one file path per line. Returns a Set of normalized paths (forward slash).
 * Blank lines and lines starting with # are ignored.
 */
function loadCompletionSet(completionFilePath) {
  const abs = path.resolve(process.cwd(), completionFilePath);
  if (!fs.existsSync(abs)) {
    process.stderr.write(`Completion file not found: ${completionFilePath}\n`);
    process.exit(1);
  }
  const content = fs.readFileSync(abs, 'utf8');
  const set = new Set();
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.replace(/^\s+|\s+$/g, '').replace(/\\/g, '/');
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    set.add(trimmed);
  }
  return set;
}

function isCompleted(filePath, completedSet) {
  if (completedSet.size === 0) return false;
  return completedSet.has(filePath.replace(/\\/g, '/'));
}

function toModulePath(filePath) {
  const withoutExt = filePath.replace(/\.(ts|tsx|js|jsx)$/, '');
  if (withoutExt.includes('selectors/')) {
    return withoutExt.slice(withoutExt.indexOf('selectors/'));
  }
  if (withoutExt.includes('ducks/')) {
    return withoutExt.slice(withoutExt.indexOf('ducks/'));
  }
  return withoutExt;
}

/**
 * Recursively list all selector/duck files under dir (e.g. ui/selectors, ui/ducks)
 * for chain expansion. Excludes test/spec/stories.
 */
function listSelectorFilesUnder(dir, acc = []) {
  const full = path.resolve(process.cwd(), dir);
  if (!fs.existsSync(full)) return acc;
  const entries = fs.readdirSync(full, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(full, e.name);
    const rel = path.relative(process.cwd(), p).replace(/\\/g, '/');
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
      listSelectorFilesUnder(rel, acc);
    } else if (
      e.isFile() &&
      /\.(ts|js|tsx|jsx)$/.test(e.name) &&
      !/\.(test|spec|stories)\./.test(rel)
    ) {
      acc.push(rel);
    }
  }
  return acc;
}

// --- main: parse argv

const useConfig = process.argv[2] === '--config';
const configPath = useConfig ? process.argv[3] : null;
const rootFile = useConfig ? null : process.argv[2];
const outArg = useConfig ? null : process.argv[3];

let roots;
let docPath;
let completedPaths = new Set();

if (useConfig && configPath) {
  const configAbs = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(configAbs)) {
    process.stderr.write(`Config not found: ${configPath}\n`);
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(configAbs, 'utf8'));
  roots = Array.isArray(config.roots) ? config.roots : [];
  if (roots.length === 0) {
    process.stderr.write('Config must have a non-empty "roots" array.\n');
    process.exit(1);
  }
  roots = roots.map((r) => ({
    file: r.file,
    selectors: Array.isArray(r.selectors) ? r.selectors : undefined,
  }));
  for (const r of roots) {
    const abs = path.resolve(process.cwd(), r.file);
    if (!fs.existsSync(abs)) {
      process.stderr.write(`Root file not found: ${r.file}\n`);
      process.exit(1);
    }
  }
  if (config.output) {
    docPath = path.resolve(process.cwd(), config.output);
  } else {
    const baseName = path.basename(configPath, path.extname(configPath));
    const defaultOutputDir = path.resolve(process.cwd(), 'trace-selectors', 'output');
    docPath = path.join(defaultOutputDir, `selector-usage-trace-${baseName}.md`);
  }
  if (config.completionFile) {
    completedPaths = loadCompletionSet(config.completionFile);
  }
} else if (rootFile) {
  const rootAbs = path.resolve(process.cwd(), rootFile);
  if (!fs.existsSync(rootAbs)) {
    process.stderr.write(`File not found: ${rootFile}\n`);
    process.exit(1);
  }
  roots = [{ file: rootFile, selectors: undefined }];
  const baseName = path.basename(rootFile, path.extname(rootFile));
  const defaultOutputDir = path.resolve(process.cwd(), 'trace-selectors', 'output');
  docPath = outArg
    ? path.resolve(process.cwd(), outArg)
    : path.join(defaultOutputDir, `selector-usage-trace-${baseName}.md`);
} else {
  process.stderr.write('Usage: node trace-usage.js --config <config.json>\n');
  process.stderr.write('   or: node trace-usage.js <root-file> [output-doc]\n');
  process.exit(1);
}

const docDir = path.dirname(docPath);
if (!fs.existsSync(docDir)) {
  fs.mkdirSync(docDir, { recursive: true });
}

// Build the set of root tracked symbols, then expand to full chain (transitive dependents)
const trackedSymbols = new Set();
for (const root of roots) {
  const exportNames = runListExports(root.file);
  const symbols = root.selectors && root.selectors.length > 0
    ? root.selectors.filter((s) => exportNames.includes(s))
    : exportNames;
  symbols.forEach((s) => trackedSymbols.add(s));
}
const selectorFilesForExpansion = [
  ...listSelectorFilesUnder('ui/selectors', []),
  ...listSelectorFilesUnder('ui/ducks', []),
];
const chainSymbols = expandChainSymbols(selectorFilesForExpansion, trackedSymbols);
const chainSymbolsArray = [...chainSymbols];

// --- Layer 1: list each root and its (filtered) symbols
const layer1Lines = [
  `# Selector usage trace: ${roots.length === 1 ? roots[0].file : 'multi-root (config)'}`,
  '',
  'Generated by `trace-selectors/scripts/trace-usage.js`.',
  '',
  `## Layer 1 (root) - Files: ${roots.length}; Instances: ${trackedSymbols.size}`,
  '',
];

for (const root of roots) {
  const exportNames = runListExports(root.file);
  const symbols = root.selectors && root.selectors.length > 0
    ? root.selectors.filter((s) => exportNames.includes(s))
    : exportNames;
  const sortedSymbols = [...symbols].sort((a, b) => a.localeCompare(b, 'en'));
  layer1Lines.push(`- **File:** \`${root.file}\``);
  if (sortedSymbols.length === 0) {
    layer1Lines.push('- **Tracked symbols:** (none or filter matched no exports)');
  } else {
    layer1Lines.push('- **Tracked symbols:**');
    sortedSymbols.forEach((s) => layer1Lines.push(`  - \`${s}\``));
  }
  layer1Lines.push('');
}

fs.writeFileSync(docPath, layer1Lines.join('\n'));

const allTerminals = [];
let currentLayerFiles = [];
let layerNum = 2;
const seenPaths = new Set();
const maxLayers = parseInt(process.env.TRACE_MAX_LAYERS || '0', 10) || 0; // 0 = no limit

// --- Layer 2: importers of all roots (merged)
const layer2ImportersMap = new Map();
for (const root of roots) {
  const rootRelative = path.relative(process.cwd(), path.resolve(process.cwd(), root.file)).replace(/\\/g, '/');
  const modulePath = toModulePath(rootRelative);
  const symbolsFilter = root.selectors && root.selectors.length > 0 ? root.selectors : undefined;
  const importers = runFindImporters(modulePath, searchRoot, symbolsFilter);
  for (const imp of importers) {
    const existing = layer2ImportersMap.get(imp.path);
    if (existing) {
      existing.symbols = [existing.symbols, imp.symbols].filter(Boolean).join('; ');
    } else {
      layer2ImportersMap.set(imp.path, { path: imp.path, symbols: imp.symbols });
    }
  }
}

const layer2Importers = [...layer2ImportersMap.values()];
layer2Importers.forEach((e) => seenPaths.add(e.path));

if (layer2Importers.length === 0) {
  fs.appendFileSync(docPath, '\n## Layer 2 - Files: 0; Instances: 0\n\nNo direct importers (excluding tests).\n');
} else {
  const pathsOnly = layer2Importers.map((e) => e.path);
  const classified = runClassify(pathsOnly);
  const byPath = new Map(classified.map((c) => [c.path, c]));
  let entries = layer2Importers.map((e) => {
    const c = byPath.get(e.path) || { type: 'other', terminal: false };
    return {
      path: e.path,
      symbols: e.symbols,
      type: c.type,
      terminal: c.terminal,
    };
  });
  entries = entries.filter((e) => !isCompleted(e.path, completedPaths));
  const terminalsThisLayer = entries.filter((e) => e.terminal);
  terminalsThisLayer.forEach((t) => allTerminals.push(t));
  appendLayer(docPath, layerNum, entries, terminalsThisLayer);
  currentLayerFiles = entries.filter((e) => !e.terminal).map((e) => e.path);
  layerNum++;
}

// --- Layers 3..N: importers of non-terminal files from previous layer (including barrel importers)
while (currentLayerFiles.length > 0) {
  if (maxLayers > 0 && layerNum > maxLayers) break;
  const nextImporters = new Map();
  for (const file of currentLayerFiles) {
    const modPath = toModulePath(file);
    const chainExportsOfFile = getChainExportsOfFile(file, chainSymbols);
    const directSymbolFilter =
      chainExportsOfFile.size > 0 ? [...chainExportsOfFile] : null;
    if (directSymbolFilter && directSymbolFilter.length > 0) {
      const importerList = runFindImporters(modPath, searchRoot, directSymbolFilter);
      for (const imp of importerList) {
        if (seenPaths.has(imp.path)) continue;
        seenPaths.add(imp.path);
        nextImporters.set(imp.path, { path: imp.path, symbols: imp.symbols });
      }
    }
    const barrelPath = getBarrelModulePathForFile(file);
    if (barrelPath) {
      const barrelImporters = runFindImporters(barrelPath, searchRoot, chainSymbolsArray, {
        barrel: true,
      });
      for (const imp of barrelImporters) {
        if (seenPaths.has(imp.path)) continue;
        // Only follow barrel importers under ui/ to keep the trace tractable (exclude app/, shared/, etc.)
        if (!imp.path.replace(/\\/g, '/').startsWith('ui/')) continue;
        const usedSymbols = getTrackedSymbolsUsedInFile(imp.path, chainSymbols);
        if (usedSymbols.length === 0) continue;
        seenPaths.add(imp.path);
        nextImporters.set(imp.path, { path: imp.path, symbols: usedSymbols.join(', ') });
      }
    }
  }
  const nextList = [...nextImporters.values()];
  if (nextList.length === 0) break;

  const pathsOnly = nextList.map((e) => e.path);
  const classified = runClassify(pathsOnly);
  const byPath = new Map(classified.map((c) => [c.path, c]));
  let entries = nextList.map((e) => {
    const c = byPath.get(e.path) || { type: 'other', terminal: false };
    return {
      path: e.path,
      symbols: e.symbols,
      type: c.type,
      terminal: c.terminal,
    };
  });
  entries = entries.filter((e) => !isCompleted(e.path, completedPaths));
  const terminalsThisLayer = entries.filter((e) => e.terminal);
  terminalsThisLayer.forEach((t) => allTerminals.push(t));
  appendLayer(docPath, layerNum, entries, terminalsThisLayer);
  currentLayerFiles = entries.filter((e) => !e.terminal).map((e) => e.path);
  layerNum++;
}

const remainingTerminals = allTerminals.filter((t) => !isCompleted(t.path, completedPaths));
appendTerminalSection(docPath, remainingTerminals);

process.stdout.write(`Wrote ${docPath}\n`);
