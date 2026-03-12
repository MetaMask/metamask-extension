#!/usr/bin/env node
/**
 * Extracts selector dependency graph from selector files and expands a seed set
 * to all symbols that (transitively) depend on the seeds.
 *
 * Used by trace-usage.js to compute "chain symbols" for filtering barrel/direct
 * importers and for usage checks.
 *
 * Usage (programmatic):
 *   const { getSelectorDeps, expandChainSymbols } = require('./selector-deps.js');
 *   const deps = getSelectorDeps(filePath);  // { exportName: [dep1, dep2, ...] }
 *   const chain = expandChainSymbols(selectorFiles, seedSymbols);
 *
 * Usage (CLI): node selector-deps.js <file> [--expand seed1,seed2]
 *   Without --expand: output "exportName\tdep1,dep2,..." per line.
 *   With --expand: output one symbol per line (expanded set).
 */

const fs = require('fs');
const path = require('path');

const CREATOR_RE =
  /export\s+const\s+(\w+)\s*=\s*(?:createSelector|createChainIdSelector|createDeepEqualSelector)\s*\(/g;

/**
 * Find the matching closing ");" for the opening "(" after createSelector(.
 * Returns the substring between the opening "(" and the closing ");".
 * startIndex is the position of the "(" itself; we start with depth 1 (inside it).
 */
function extractSelectorBody(content, startIndex) {
  let depth = 1;
  let i = startIndex + 1;
  const len = content.length;
  while (i < len) {
    const c = content[i];
    if (c === '(') {
      depth++;
      i++;
    } else if (c === ')') {
      depth--;
      i++;
      if (depth === 0) {
        return content.slice(startIndex + 1, i - 1);
      }
    } else if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      i++;
      while (i < len && content[i] !== quote) {
        if (content[i] === '\\') i++;
        i++;
      }
      if (i < len) i++;
    } else if (c === '/' && content[i + 1] === '*') {
      i += 2;
      while (i < len - 1 && !(content[i] === '*' && content[i + 1] === '/')) i++;
      i += 2;
    } else if (c === '/' && content[i + 1] === '/') {
      while (i < len && content[i] !== '\n') i++;
      i++;
    } else {
      i++;
    }
  }
  return null;
}

/** Matches selector-like names (getXxx, selectXxx) to avoid param names like state, chainId. */
const SELECTOR_LIKE = /^(get|select)[A-Z]\w+$/;

/**
 * From the inner content of createSelector( ... ), extract dependency
 * identifiers (selector names). Only collect identifiers at depth 0 that
 * look like selectors (getXxx, selectXxx); skip comments and strings.
 */
function parseDepsFromBody(body) {
  const deps = [];
  let depth = 0;
  let i = 0;
  const len = body.length;
  while (i < len) {
    const c = body[i];
    if (c === '(') {
      depth++;
      i++;
    } else if (c === ')') {
      depth--;
      i++;
    } else if ((c === '/' && body[i + 1] === '*') || (c === '/' && body[i + 1] === '/')) {
      if (body[i + 1] === '*') {
        i += 2;
        while (i < len - 1 && !(body[i] === '*' && body[i + 1] === '/')) i++;
        i += 2;
      } else {
        while (i < len && body[i] !== '\n') i++;
        i++;
      }
    } else if ((c === '"' || c === "'" || c === '`') && depth === 0) {
      const quote = c;
      i++;
      while (i < len && body[i] !== quote) {
        if (body[i] === '\\') i++;
        i++;
      }
      if (i < len) i++;
    } else if (depth === 0 && /\w/.test(c)) {
      let end = i;
      while (end < len && /\w/.test(body[end])) end++;
      const id = body.slice(i, end);
      if (SELECTOR_LIKE.test(id)) {
        deps.push(id);
      }
      i = end;
    } else {
      i++;
    }
  }
  return deps;
}

/**
 * Returns a map: exportName -> array of dependency selector names (identifiers)
 * for all createSelector/createChainIdSelector/createDeepEqualSelector exports
 * in the file.
 */
function getSelectorDeps(filePath) {
  const abs = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(abs)) return {};
  const content = fs.readFileSync(abs, 'utf8');
  const result = {};
  let m;
  CREATOR_RE.lastIndex = 0;
  while ((m = CREATOR_RE.exec(content)) !== null) {
    const exportName = m[1];
    const openParen = m.index + m[0].length - 1;
    const body = extractSelectorBody(content, openParen + 1);
    if (body !== null) {
      const deps = parseDepsFromBody(body);
      result[exportName] = deps;
    }
  }
  return result;
}

/**
 * Given a list of selector file paths and a set of seed symbols (e.g. root
 * selectors), returns the transitive closure: all export names that
 * (transitively) depend on any seed. Builds a reverse dependency graph and
 * expands from seeds.
 */
function expandChainSymbols(selectorFilePaths, seedSymbolsSet) {
  const seed = new Set(seedSymbolsSet);
  const allDeps = new Map();
  const reverseDeps = new Map();

  for (const filePath of selectorFilePaths) {
    const deps = getSelectorDeps(filePath);
    for (const [exportName, depList] of Object.entries(deps)) {
      allDeps.set(exportName, depList);
      for (const d of depList) {
        if (!reverseDeps.has(d)) reverseDeps.set(d, []);
        reverseDeps.get(d).push(exportName);
      }
    }
  }

  const chain = new Set(seed);
  let added = true;
  while (added) {
    added = false;
    for (const sym of chain) {
      const dependents = reverseDeps.get(sym);
      if (!dependents) continue;
      for (const dep of dependents) {
        if (!chain.has(dep)) {
          chain.add(dep);
          added = true;
        }
      }
    }
  }
  return chain;
}

/**
 * Given a single file path and a set of "current chain" symbols, returns
 * the set of export names from this file that (transitively) depend on
 * any symbol in the chain set. Used to get "chain exports of F" for
 * direct importer filtering.
 */
function getChainExportsOfFile(filePath, chainSymbolsSet) {
  const deps = getSelectorDeps(filePath);
  const chain = new Set(chainSymbolsSet);
  const chainExports = new Set();
  let added = true;
  while (added) {
    added = false;
    for (const [exportName, depList] of Object.entries(deps)) {
      if (chainExports.has(exportName)) continue;
      const dependsOnChain = depList.some((d) => chain.has(d) || chainExports.has(d));
      if (dependsOnChain) {
        chainExports.add(exportName);
        chain.add(exportName);
        added = true;
      }
    }
  }
  return chainExports;
}

// --- CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const expandIdx = args.indexOf('--expand');
  const fileArg = args[0];
  if (!fileArg) {
    process.stderr.write('Usage: node selector-deps.js <file> [--expand seed1,seed2]\n');
    process.exit(1);
  }
  const abs = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(abs)) {
    process.stderr.write(`File not found: ${fileArg}\n`);
    process.exit(1);
  }
  const deps = getSelectorDeps(abs);
  if (expandIdx !== -1 && args[expandIdx + 1]) {
    const seeds = args[expandIdx + 1].split(',').map((s) => s.trim()).filter(Boolean);
    const chain = expandChainSymbols([abs], seeds);
    [...chain].sort().forEach((s) => process.stdout.write(s + '\n'));
  } else {
    for (const [name, list] of Object.entries(deps).sort((a, b) => a[0].localeCompare(b[0]))) {
      process.stdout.write(`${name}\t${list.join(',')}\n`);
    }
  }
}

module.exports = {
  getSelectorDeps,
  expandChainSymbols,
  getChainExportsOfFile,
};
