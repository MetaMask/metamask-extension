#!/usr/bin/env node
/**
 * Recursion driver for selector usage tracing.
 *
 * Usage:
 *   node trace-usage.js --config <config.json>
 *   node trace-usage.js <root-file> [output-doc]
 *
 * Writes the markdown trace atomically, plus a JSON summary and two CSV files
 * beside it. Exit 0 when the report is complete. Exit 2 when ripgrep is
 * missing. Exit 3 when configured selectors are missing or the layer walk was
 * capped. The summary files are still written on exit 3.
 *
 * Requires rg (ripgrep) on PATH.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { expandChainSymbols, getChainExportsOfFile } = require('./selector-deps.js');
const { listExportsFromFile } = require('./list-exports.js');
const { findImporters } = require('./find-importers.js');
const { classifyPaths } = require('./classify-file.js');
const { splitSymbols, buildSummary, toTypeCsv, toSelectorCsv } = require('./summary.js');

const searchRoot = '.';

function requireRg() {
  const result = spawnSync('rg', ['--version'], { encoding: 'utf8' });
  if ((result.error && result.error.code === 'ENOENT') || result.status !== 0) {
    process.stderr.write('ripgrep (rg) is required on PATH\n');
    process.exit(2);
  }
}

function repoPath(filePath) {
  return filePath.replace(/\\/g, '/');
}

function atomicWrite(filePath, contents) {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
  const temporary = path.join(
    directory,
    `.${path.basename(filePath)}.${process.pid}.tmp`,
  );
  fs.writeFileSync(temporary, contents);
  fs.renameSync(temporary, filePath);
}

function relativeToCwd(filePath) {
  return path.relative(process.cwd(), filePath).split(path.sep).join('/');
}

function loadCompletionSet(completionFilePath) {
  const absolute = path.resolve(process.cwd(), completionFilePath);
  if (!fs.existsSync(absolute)) {
    process.stderr.write(`Completion file not found: ${completionFilePath}\n`);
    process.exit(1);
  }
  const completed = new Set();
  for (const line of fs.readFileSync(absolute, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim().replace(/\\/g, '/');
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    completed.add(trimmed);
  }
  return completed;
}

function toModulePath(filePath) {
  const withoutExt = repoPath(filePath).replace(/\.(ts|tsx|js|jsx)$/, '');
  if (withoutExt.includes('selectors/')) {
    return withoutExt.slice(withoutExt.indexOf('selectors/'));
  }
  if (withoutExt.includes('ducks/')) {
    return withoutExt.slice(withoutExt.indexOf('ducks/'));
  }
  return withoutExt;
}

function getBarrelModulePathForFile(filePath) {
  const normalized = repoPath(filePath);
  const dirMatch = normalized.match(/(?:^|\/)(selectors|ducks)\//);
  if (!dirMatch) return null;
  return dirMatch[1];
}

function getTrackedSymbolsUsedInFile(filePath, trackedSymbolsSet) {
  const absolute = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolute)) return [];
  const content = fs.readFileSync(absolute, 'utf8');
  const used = [];
  for (const symbol of trackedSymbolsSet) {
    const escaped = symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`).test(content)) used.push(symbol);
  }
  return used.sort((a, b) => a.localeCompare(b, 'en'));
}

function listSelectorFilesUnder(dir, acc = []) {
  const full = path.resolve(process.cwd(), dir);
  if (!fs.existsSync(full)) return acc;
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const relative = path
      .relative(process.cwd(), path.join(full, entry.name))
      .split(path.sep)
      .join('/');
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      listSelectorFilesUnder(relative, acc);
    } else if (
      entry.isFile() &&
      /\.(ts|js|tsx|jsx)$/.test(entry.name) &&
      !/\.(test|spec|stories)\./.test(relative)
    ) {
      acc.push(relative);
    }
  }
  return acc;
}

function isFile(filePath) {
  const absolute = path.resolve(process.cwd(), filePath);
  return fs.existsSync(absolute) && fs.statSync(absolute).isFile();
}

function resolveSourceFile(fromFile, specifier) {
  if (!specifier.startsWith('.')) return null;
  const base = path.normalize(path.join(path.dirname(fromFile), specifier));
  const absoluteBase = path.resolve(process.cwd(), base);
  const candidates =
    fs.existsSync(absoluteBase) && fs.statSync(absoluteBase).isDirectory()
      ? ['index.ts', 'index.tsx', 'index.js', 'index.jsx'].map((name) =>
          path.join(base, name),
        )
      : [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`];
  return candidates.find((candidate) => isFile(candidate)) || null;
}

function chainSymbolsReexportedBy(file, chainSymbols) {
  const absolute = path.resolve(process.cwd(), file);
  if (!fs.existsSync(absolute)) return [];
  const content = fs.readFileSync(absolute, 'utf8');
  const found = new Set();
  const named = /export\s*\{([^}]+)\}/g;
  let match;
  while ((match = named.exec(content)) !== null) {
    for (const part of match[1].split(',')) {
      const trimmed = part.trim();
      if (trimmed === '' || trimmed.startsWith('type ')) continue;
      const alias = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
      const local = alias ? alias[1] : trimmed.split(/\s+/)[0];
      const publicName = alias ? alias[2] : local;
      if (chainSymbols.has(local) || chainSymbols.has(publicName)) {
        found.add(publicName);
      }
    }
  }
  const star = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = star.exec(content)) !== null) {
    const source = resolveSourceFile(file, match[1]);
    if (!source) continue;
    for (const name of listExportsFromFile(source)) {
      if (chainSymbols.has(name)) found.add(name);
    }
  }
  return [...found];
}

function directSymbolsForFile(file, chainSymbols) {
  const fromDeps = getChainExportsOfFile(file, chainSymbols);
  for (const name of chainSymbolsReexportedBy(file, chainSymbols)) {
    fromDeps.add(name);
  }
  return [...fromDeps];
}

function runFindImporters(modulePath, symbolsFilter, options = {}) {
  try {
    return findImporters({
      modulePath,
      searchRoot,
      withSymbols: true,
      barrelMode: Boolean(options.barrel),
      allowedSymbols: symbolsFilter && symbolsFilter.length > 0 ? new Set(symbolsFilter) : null,
      sourceFile: options.sourceFile || null,
    });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(error.exitCode || 1);
  }
}

function mergeImporter(map, importer) {
  const existing = map.get(importer.path);
  const symbols = splitSymbols(importer.symbols).join(', ');
  const lines = [...new Set(importer.lines || [])].sort((a, b) => a - b);
  if (!existing) {
    map.set(importer.path, { path: repoPath(importer.path), symbols, lines });
    return;
  }
  existing.symbols = splitSymbols(`${existing.symbols}; ${symbols}`).join(', ');
  existing.lines = [...new Set([...existing.lines, ...lines])].sort((a, b) => a - b);
}

function barrelSource(barrelPath) {
  for (const extension of ['js', 'ts', 'jsx', 'tsx']) {
    const candidate = `ui/${barrelPath}/index.${extension}`;
    if (isFile(candidate)) return candidate;
  }
  return `ui/${barrelPath}`;
}

function renderDocument(roots, rootSymbolLists, layers, terminals) {
  const trackedCount = new Set(rootSymbolLists.flat()).size;
  const lines = [
    `# Selector usage trace: ${roots.length === 1 ? roots[0].file : 'multi-root (config)'}`,
    '',
    'Generated by `trace-selectors/scripts/trace-usage.js`.',
    '',
    `Remaining files: ${layers.reduce((total, layer) => total + layer.entries.length, 0)} (terminal ${layers.reduce((total, layer) => total + layer.entries.filter((entry) => entry.terminal).length, 0)}, non-terminal ${layers.reduce((total, layer) => total + layer.entries.filter((entry) => !entry.terminal).length, 0)}). Layer headers below count non-terminal files only.`,
    '',
    `## Layer 1 (root) - Files: ${roots.length}; Instances: ${trackedCount}`,
    '',
  ];
  roots.forEach((root, index) => {
    const symbols = [...rootSymbolLists[index]].sort((a, b) => a.localeCompare(b, 'en'));
    lines.push(`- **File:** \`${root.file}\``);
    if (symbols.length === 0) {
      lines.push('- **Tracked symbols:** (none or filter matched no exports)');
    } else {
      lines.push('- **Tracked symbols:**');
      symbols.forEach((symbol) => lines.push(`  - \`${symbol}\``));
    }
    lines.push('');
  });

  for (const layer of layers) {
    const sorted = [...layer.entries].sort((a, b) => {
      if (a.terminal !== b.terminal) return a.terminal ? 1 : -1;
      return a.path.localeCompare(b.path, 'en');
    });
    const nonTerminal = sorted.filter((entry) => !entry.terminal);
    const instances = nonTerminal.reduce(
      (total, entry) => total + splitSymbols(entry.symbols).length,
      0,
    );
    lines.push('');
    lines.push(
      `## Layer ${layer.layer} - Files: ${nonTerminal.length}; Instances: ${instances}`,
    );
    lines.push('');
    if (sorted.length === 0) {
      lines.push('No remaining importers (excluding tests and completed files).');
      lines.push('');
      continue;
    }
    lines.push('| Path | Uses | Type | Terminal |');
    lines.push('| --- | --- | --- | --- |');
    for (const entry of sorted) {
      const uses = splitSymbols(entry.symbols).join(', ').replace(/\|/g, '\\|');
      lines.push(
        `| ${entry.path} | ${uses} | ${entry.type} | ${entry.terminal ? 'yes' : 'no'} |`,
      );
    }
    lines.push('');
  }

  if (terminals.length > 0) {
    const sorted = [...terminals].sort((a, b) => a.path.localeCompare(b.path, 'en'));
    const instances = sorted.reduce(
      (total, entry) => total + splitSymbols(entry.symbols).length,
      0,
    );
    lines.push('');
    lines.push(
      `## Terminal nodes summary - Files: ${sorted.length}; Instances: ${instances}`,
    );
    lines.push('');
    lines.push(
      'All React components and hooks that consume the root selectors (directly or indirectly):',
    );
    lines.push('');
    for (const entry of sorted) {
      const symbols = splitSymbols(entry.symbols).join(', ').replace(/`/g, "'");
      lines.push(`- **${entry.path}** (${entry.type}): \`${symbols}\``);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function parseInvocation(argv) {
  if (argv[2] === '--config') {
    const configPath = argv[3];
    if (!configPath) {
      process.stderr.write('Usage: node trace-usage.js --config <config.json>\n');
      process.exit(1);
    }
    const configAbs = path.resolve(process.cwd(), configPath);
    if (!fs.existsSync(configAbs)) {
      process.stderr.write(`Config not found: ${configPath}\n`);
      process.exit(1);
    }
    let config;
    try {
      config = JSON.parse(fs.readFileSync(configAbs, 'utf8'));
    } catch (error) {
      process.stderr.write(`Config is not valid JSON: ${error.message}\n`);
      process.exit(1);
    }
    const roots = Array.isArray(config.roots) ? config.roots : [];
    if (roots.length === 0) {
      process.stderr.write('Config must have a non-empty "roots" array.\n');
      process.exit(1);
    }
    return {
      configPath: repoPath(configPath),
      roots: roots.map((root) => ({
        file: root.file,
        selectors: Array.isArray(root.selectors) ? root.selectors : undefined,
      })),
      docPath: config.output
        ? path.resolve(process.cwd(), config.output)
        : path.resolve(
            process.cwd(),
            'trace-selectors',
            'output',
            `selector-usage-trace-${path.basename(configPath, path.extname(configPath))}.md`,
          ),
      completionFile: config.completionFile || null,
    };
  }

  const rootFile = argv[2];
  if (!rootFile) {
    process.stderr.write('Usage: node trace-usage.js --config <config.json>\n');
    process.stderr.write('   or: node trace-usage.js <root-file> [output-doc]\n');
    process.exit(1);
  }
  const baseName = path.basename(rootFile, path.extname(rootFile));
  return {
    configPath: null,
    roots: [{ file: rootFile, selectors: undefined }],
    docPath: argv[3]
      ? path.resolve(process.cwd(), argv[3])
      : path.resolve(
          process.cwd(),
          'trace-selectors',
          'output',
          `selector-usage-trace-${baseName}.md`,
        ),
    completionFile: null,
  };
}

function summaryPathsFor(docPath) {
  const directory = path.dirname(docPath);
  const base = path.basename(docPath, path.extname(docPath));
  return {
    json: path.join(directory, `${base}.json`),
    byType: path.join(directory, `${base}.by-type.csv`),
    bySelector: path.join(directory, `${base}.by-selector.csv`),
  };
}

function main() {
  requireRg();
  const invocation = parseInvocation(process.argv);
  const completedPaths = invocation.completionFile
    ? loadCompletionSet(invocation.completionFile)
    : new Set();

  const unresolvedSelectors = [];
  const rootSymbolLists = [];
  for (const root of invocation.roots) {
    const absolute = path.resolve(process.cwd(), root.file);
    if (!fs.existsSync(absolute)) {
      process.stderr.write(`Root file not found: ${root.file}\n`);
      process.exit(1);
    }
    let exportNames;
    try {
      exportNames = listExportsFromFile(root.file);
    } catch (error) {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }
    const symbols =
      root.selectors && root.selectors.length > 0
        ? root.selectors.filter((symbol) => {
            const found = exportNames.includes(symbol);
            if (!found) unresolvedSelectors.push({ file: root.file, selector: symbol });
            return found;
          })
        : exportNames;
    rootSymbolLists.push(symbols);
  }

  const trackedSymbols = new Set(rootSymbolLists.flat());
  const selectorFilesForExpansion = [
    ...listSelectorFilesUnder('ui/selectors', []),
    ...listSelectorFilesUnder('ui/ducks', []),
  ];
  const chainSymbols = expandChainSymbols(selectorFilesForExpansion, trackedSymbols);
  const chainSymbolsArray = [...chainSymbols].sort((a, b) => a.localeCompare(b, 'en'));

  const reported = [];
  invocation.roots.forEach((root, index) => {
    reported.push({
      layer: 1,
      path: repoPath(root.file),
      symbols: rootSymbolLists[index].join(', '),
      type: 'selector',
      terminal: false,
    });
  });

  const allTerminals = [];
  const layers = [];
  const seenPaths = new Set();
  const rawEdges = [];

  function addEdge(from, importer, symbols = importer.symbols) {
    const to = repoPath(importer.path);
    if (!from || completedPaths.has(to)) return;
    rawEdges.push({
      from: repoPath(from),
      to,
      selectors: splitSymbols(symbols),
      lines: importer.lines || [],
    });
  }
  let layerNum = 2;
  const maxLayers = parseInt(process.env.TRACE_MAX_LAYERS || '0', 10) || 0;
  let truncated = false;

  function consumeImporters(importers) {
    const visibleCandidates = [];
    const classified = classifyPaths(importers.map((importer) => importer.path));
    const byPath = new Map(classified.map((item) => [item.path, item]));
    for (const importer of importers) {
      const info = byPath.get(importer.path) || { type: 'other', terminal: false };
      const entry = {
        layer: layerNum,
        path: repoPath(importer.path),
        symbols: importer.symbols,
        type: info.type,
        terminal: info.terminal,
      };
      if (!completedPaths.has(entry.path)) {
        visibleCandidates.push(entry);
        reported.push(entry);
        if (entry.terminal) allTerminals.push(entry);
      }
    }
    layers.push({ layer: layerNum, entries: visibleCandidates });
    process.stderr.write(
      `Layer ${layerNum}: ${visibleCandidates.length} remaining files\n`,
    );
    return importers
      .filter((importer) => {
        const info = byPath.get(importer.path) || { terminal: false };
        return !info.terminal;
      })
      .map((importer) => repoPath(importer.path));
  }

  const layer2 = new Map();
  invocation.roots.forEach((root, index) => {
    const symbols = rootSymbolLists[index];
    if (symbols.length === 0) return;
    const importers = runFindImporters(toModulePath(root.file), symbols, {
      sourceFile: root.file,
    });
    importers.forEach((importer) => {
      addEdge(root.file, importer);
      mergeImporter(layer2, importer);
    });
  });
  for (const importer of layer2.values()) seenPaths.add(importer.path);
  let currentLayerFiles = consumeImporters([...layer2.values()]);
  layerNum += 1;

  const barrelImporterCache = new Map();
  function getBarrelImporters(barrelPath) {
    if (!barrelImporterCache.has(barrelPath)) {
      barrelImporterCache.set(
        barrelPath,
        runFindImporters(barrelPath, chainSymbolsArray, { barrel: true }),
      );
    }
    return barrelImporterCache.get(barrelPath);
  }

  while (currentLayerFiles.length > 0) {
    if (maxLayers > 0 && layerNum > maxLayers) {
      truncated = true;
      break;
    }
    const nextImporters = new Map();
    for (const file of currentLayerFiles) {
      const directSymbols = directSymbolsForFile(file, chainSymbols);
      if (directSymbols.length > 0) {
        for (const importer of runFindImporters(toModulePath(file), directSymbols, {
          sourceFile: file,
        })) {
          addEdge(file, importer);
          if (seenPaths.has(importer.path)) continue;
          seenPaths.add(importer.path);
          mergeImporter(nextImporters, importer);
        }
      }
      const barrelPath = getBarrelModulePathForFile(file);
      if (!barrelPath) continue;
      const barrelFrom = barrelSource(barrelPath);
      for (const importer of getBarrelImporters(barrelPath)) {
        if (!repoPath(importer.path).startsWith('ui/')) continue;
        const imported = splitSymbols(importer.symbols);
        const broad = imported.some(
          (symbol) =>
            symbol === '*' ||
            symbol === '(default or *)' ||
            symbol.startsWith('* as '),
        );
        const symbols = broad
          ? getTrackedSymbolsUsedInFile(importer.path, chainSymbols)
          : imported.filter((symbol) => chainSymbols.has(symbol));
        if (symbols.length === 0) continue;
        addEdge(barrelFrom, { ...importer, symbols: symbols.join(', ') }, symbols);
        if (seenPaths.has(importer.path)) continue;
        seenPaths.add(importer.path);
        mergeImporter(nextImporters, {
          path: importer.path,
          symbols: symbols.join(', '),
          lines: importer.lines,
        });
      }
    }
    const nextList = [...nextImporters.values()];
    if (nextList.length === 0) break;
    currentLayerFiles = consumeImporters(nextList);
    layerNum += 1;
  }

  const markdown = renderDocument(
    invocation.roots,
    rootSymbolLists,
    layers,
    allTerminals,
  );
  atomicWrite(invocation.docPath, markdown);

  const summary = buildSummary({
    configPath: invocation.configPath,
    output: relativeToCwd(invocation.docPath),
    roots: invocation.roots,
    unresolvedSelectors,
    completedCount: completedPaths.size,
    entries: reported,
    truncated,
    maxLayers,
    edges: rawEdges,
  });
  const outputs = summaryPathsFor(invocation.docPath);
  atomicWrite(outputs.json, `${JSON.stringify(summary, null, 2)}\n`);
  atomicWrite(outputs.byType, toTypeCsv(summary));
  atomicWrite(outputs.bySelector, toSelectorCsv(summary));

  process.stdout.write(`Wrote ${relativeToCwd(invocation.docPath)}\n`);
  process.stdout.write(`Wrote ${relativeToCwd(outputs.json)}\n`);
  process.stdout.write(`Wrote ${relativeToCwd(outputs.byType)}\n`);
  process.stdout.write(`Wrote ${relativeToCwd(outputs.bySelector)}\n`);

  if (unresolvedSelectors.length > 0) {
    for (const missing of summary.unresolvedSelectors) {
      process.stderr.write(
        `Configured selector is not exported: ${missing.selector} (${missing.file})\n`,
      );
    }
  }
  if (summary.status !== 'ok') process.exit(3);
}

main();
