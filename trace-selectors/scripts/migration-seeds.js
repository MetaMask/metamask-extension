/**
 * Tracks which assets-migration exports a later selector still depends on.
 *
 * A consumer often imports an alias (`getAllTokens`) or a wrapper
 * (`selectAllTokensFlat`). The trace still records that name, and this map
 * says which root export it came from (`getTokensControllerAllTokens`).
 */

const fs = require('fs');
const path = require('path');
const { getSelectorDeps } = require('./selector-deps.js');

function repoPath(filePath) {
  return filePath.replace(/\\/g, '/');
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

function braceBindings(inner) {
  const bindings = [];
  for (const part of inner.split(',')) {
    const trimmed = part.trim();
    if (trimmed === '' || trimmed.startsWith('type ')) continue;
    const alias = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
    if (alias) {
      bindings.push({ imported: alias[1], local: alias[2] });
      continue;
    }
    if (/^\w+$/.test(trimmed)) bindings.push({ imported: trimmed, local: trimmed });
  }
  return bindings;
}

function addSeeds(map, name, seeds) {
  if (!name || !seeds || seeds.size === 0) return false;
  let current = map.get(name);
  if (!current) {
    map.set(name, new Set(seeds));
    return true;
  }
  let changed = false;
  for (const seed of seeds) {
    if (!current.has(seed)) {
      current.add(seed);
      changed = true;
    }
  }
  return changed;
}

function serializeMap(map) {
  if (!map || map.size === 0) return '';
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], 'en'))
    .map(([name, seeds]) => `${name}:${[...seeds].sort().join(',')}`)
    .join('|');
}

function readContent(filePath) {
  const absolute = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return '';
  return fs.readFileSync(absolute, 'utf8');
}

/**
 * One pass. Dependency maps that are still empty contribute nothing, so the
 * caller repeats this until the maps stop changing.
 */
function computeOnce(filePath, maps) {
  const content = readContent(filePath);
  const localSeeds = new Map();
  const exportSeeds = new Map();
  const fromRe = /from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = fromRe.exec(content)) !== null) {
    const specifier = match[1];
    if (!specifier.startsWith('.')) continue;
    const source = resolveSourceFile(filePath, specifier);
    const sourceMap = source ? maps.get(repoPath(source)) : null;
    const before = content.slice(0, match.index);
    const start = Math.max(before.lastIndexOf('import'), before.lastIndexOf('export'));
    if (start === -1) continue;
    const statement = content.slice(start, match.index);
    const trimmed = statement.trimStart();
    if (trimmed.startsWith('import type') || trimmed.startsWith('export type')) continue;
    const isExport = trimmed.startsWith('export');
    if (
      isExport &&
      /export\s+\*/.test(statement) &&
      !/\*\s+as\s+/.test(statement) &&
      sourceMap
    ) {
      for (const name of [...sourceMap.keys()].sort((a, b) => a.localeCompare(b, 'en'))) {
        addSeeds(exportSeeds, name, sourceMap.get(name));
      }
    }
    const brace = statement.match(/\{([^}]*)\}/);
    if (!brace || !sourceMap) continue;
    for (const binding of braceBindings(brace[1])) {
      const seeds = sourceMap.get(binding.imported);
      if (!seeds) continue;
      if (isExport) addSeeds(exportSeeds, binding.local, seeds);
      else addSeeds(localSeeds, binding.local, seeds);
    }
  }

  const exportOnly = /export\s*\{([^}]+)\}/g;
  while ((match = exportOnly.exec(content)) !== null) {
    const after = content.slice(match.index + match[0].length, match.index + match[0].length + 16);
    if (/^\s*from\b/.test(after)) continue;
    for (const binding of braceBindings(match[1])) {
      const seeds = localSeeds.get(binding.imported) || exportSeeds.get(binding.imported);
      addSeeds(exportSeeds, binding.local, seeds);
    }
  }

  const aliasAssign =
    /export\s+const\s+(\w+)\s*=\s*(\w+)\s*(?:;|\n)/g;
  while ((match = aliasAssign.exec(content)) !== null) {
    const seeds = localSeeds.get(match[2]) || exportSeeds.get(match[2]);
    addSeeds(exportSeeds, match[1], seeds);
  }

  const deps = getSelectorDeps(filePath);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [exportName, depList] of Object.entries(deps)) {
      const seeds = new Set();
      for (const dep of depList) {
        const known = localSeeds.get(dep) || exportSeeds.get(dep);
        if (!known) continue;
        for (const seed of known) seeds.add(seed);
      }
      if (addSeeds(exportSeeds, exportName, seeds)) changed = true;
    }
  }
  return exportSeeds;
}

function createSeedIndex(rootEntries) {
  const maps = new Map();
  const roots = new Set();
  for (const root of rootEntries) {
    const key = repoPath(root.file);
    roots.add(key);
    const map = new Map();
    for (const symbol of root.symbols) map.set(symbol, new Set([symbol]));
    maps.set(key, map);
  }

  function relax(files) {
    const pending = [...new Set(files.map(repoPath))]
      .filter((file) => !roots.has(file) && isFile(file))
      .sort((a, b) => a.localeCompare(b, 'en'));
    let changed = true;
    for (let pass = 0; changed && pass < 30; pass += 1) {
      changed = false;
      for (const file of pending) {
        const next = computeOnce(file, maps);
        if (serializeMap(maps.get(file)) !== serializeMap(next)) {
          maps.set(file, next);
          changed = true;
        }
      }
    }
  }

  function ensure(file) {
    const key = repoPath(file);
    if (maps.has(key)) return maps.get(key);
    if (!isFile(key)) {
      const empty = new Map();
      maps.set(key, empty);
      return empty;
    }
    const map = computeOnce(key, maps);
    maps.set(key, map);
    return map;
  }

  function seededExportNames() {
    const names = new Set();
    for (const map of maps.values()) {
      for (const name of map.keys()) names.add(name);
    }
    return [...names].sort((a, b) => a.localeCompare(b, 'en'));
  }

  return { maps, roots, relax, ensure, seededExportNames };
}

module.exports = {
  createSeedIndex,
  computeOnce,
  braceBindings,
};
