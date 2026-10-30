/**
 * Builds the machine-readable cleanup summary written next to the markdown trace.
 * Counts are distinct imported names per file, not call sites.
 */

function compareText(a, b) {
  return String(a).localeCompare(String(b), 'en');
}

function splitSymbols(symbolsStr) {
  if (!symbolsStr || !String(symbolsStr).trim()) return [];
  const unique = new Set();
  for (const part of String(symbolsStr).split(/[;,]/)) {
    const symbol = part.trim();
    if (symbol) unique.add(symbol);
  }
  return [...unique].sort(compareText);
}

function countBy(items, keyFn) {
  const counts = new Map();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || compareText(a[0], b[0]))
    .map(([key, count]) => ({ key, count }));
}

/**
 * @param {object} input
 * @param {string} input.configPath
 * @param {string} input.output Markdown path relative to the repo root.
 * @param {{ file: string, selectors?: string[] }[]} input.roots
 * @param {{ file: string, selector: string }[]} input.unresolvedSelectors
 * @param {number} input.completedCount
 * @param {{ layer: number, path: string, symbols: string, type: string, terminal: boolean }[]} input.entries
 * @param {boolean} input.truncated
 * @param {number} input.maxLayers
 * @param {{ from: string, to: string, selectors: string[] | string, migrationSelectors?: string[] | string, lines?: number[] }[]} [input.edges]
 */
function normalizeEdges(edges) {
  const merged = new Map();
  for (const edge of edges || []) {
    const key = `${edge.from}\0${edge.to}`;
    const selectors = splitSymbols(
      Array.isArray(edge.selectors) ? edge.selectors.join(', ') : edge.selectors,
    );
    const migrationSelectors = splitSymbols(
      Array.isArray(edge.migrationSelectors)
        ? edge.migrationSelectors.join(', ')
        : edge.migrationSelectors,
    );
    const lines = [...new Set(edge.lines || [])]
      .filter((line) => Number.isInteger(line) && line > 0)
      .sort((a, b) => a - b);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { from: edge.from, to: edge.to, selectors, migrationSelectors, lines });
      continue;
    }
    existing.selectors = splitSymbols(
      [...existing.selectors, ...selectors].join(', '),
    );
    existing.migrationSelectors = splitSymbols(
      [...existing.migrationSelectors, ...migrationSelectors].join(', '),
    );
    existing.lines = [...new Set([...existing.lines, ...lines])].sort((a, b) => a - b);
  }
  return [...merged.values()].sort(
    (a, b) => compareText(a.from, b.from) || compareText(a.to, b.to),
  );
}

function buildSummary({
  configPath,
  output,
  roots,
  unresolvedSelectors,
  completedCount,
  entries,
  truncated,
  maxLayers,
  edges = [],
}) {
  const consumers = entries
    .filter((entry) => entry.layer >= 2)
    .map((entry) => ({
      ...entry,
      symbols: splitSymbols(entry.symbols),
    }))
    .sort((a, b) => a.layer - b.layer || compareText(a.path, b.path));

  const normalizedEdges = normalizeEdges(edges);
  const linesByFile = new Map();
  const selectorsByFile = new Map();
  const migrationByFile = new Map();
  for (const edge of normalizedEdges) {
    linesByFile.set(edge.to, (linesByFile.get(edge.to) || []).concat(edge.lines));
    selectorsByFile.set(
      edge.to,
      (selectorsByFile.get(edge.to) || []).concat(edge.selectors),
    );
    migrationByFile.set(
      edge.to,
      (migrationByFile.get(edge.to) || []).concat(edge.migrationSelectors),
    );
  }
  for (const entry of consumers) {
    const fromEdges = splitSymbols((selectorsByFile.get(entry.path) || []).join(', '));
    if (fromEdges.length > 0) entry.symbols = fromEdges;
  }
  const terminalFiles = consumers.filter((entry) => entry.terminal).length;
  const issues = [];
  if (unresolvedSelectors.length > 0) {
    issues.push(
      'Configured selectors are not exported. The report omits them until the config is updated.',
    );
  }
  if (truncated) {
    issues.push(
      `Layer walk stopped at TRACE_MAX_LAYERS=${maxLayers}. Raise or unset it for a full report.`,
    );
  }

  const layers = [];
  const layerNumbers = [...new Set(entries.map((entry) => entry.layer))].sort(
    (a, b) => a - b,
  );
  for (const layer of layerNumbers) {
    const visible =
      layer === 1
        ? entries.filter((entry) => entry.layer === layer)
        : consumers.filter((entry) => entry.layer === layer);
    layers.push({
      layer,
      files: visible.length,
      terminalFiles: visible.filter((entry) => entry.terminal).length,
      nonTerminalFiles: visible.filter((entry) => !entry.terminal).length,
      importedSymbolSlots: visible.reduce(
        (total, entry) => total + splitSymbols(entry.symbols).length,
        0,
      ),
    });
  }

  const migrationSelectors = consumers.flatMap((entry) =>
    splitSymbols((migrationByFile.get(entry.path) || []).join(', ')),
  );

  return {
    schemaVersion: 3,
    status: issues.length > 0 ? 'attention' : 'ok',
    issues,
    metricsNote:
      'importedSymbolSlots counts distinct imported names on each file. It is not a count of call sites. selectors are those imported names. migrationSelectors are the shared/lib/selectors/assets-migration.ts exports those names trace back to. edges[].lines and files[].lines are 1-based lines of the import or export keyword in the consumer.',
    configPath,
    output,
    truncated: Boolean(truncated),
    maxLayers,
    completedFileCount: completedCount,
    unresolvedSelectors: [...unresolvedSelectors].sort(
      (a, b) => compareText(a.file, b.file) || compareText(a.selector, b.selector),
    ),
    roots: roots.map((root) => ({
      file: root.file,
      selectors: root.selectors ? [...root.selectors].sort(compareText) : null,
    })),
    remaining: {
      files: consumers.length,
      terminalFiles,
      nonTerminalFiles: consumers.length - terminalFiles,
      importedSymbolSlots: consumers.reduce(
        (total, entry) => total + entry.symbols.length,
        0,
      ),
    },
    layers,
    byType: countBy(consumers, (entry) => entry.type).map((item) => ({
      type: item.key,
      files: item.count,
    })),
    bySelector: countBy(
      consumers.flatMap((entry) => entry.symbols),
      (symbol) => symbol,
    ).map((item) => ({
      selector: item.key,
      files: item.count,
    })),
    byMigrationSelector: countBy(migrationSelectors, (symbol) => symbol).map((item) => ({
      selector: item.key,
      files: item.count,
    })),
    edges: normalizedEdges,
    files: consumers.map((entry) => ({
      path: entry.path,
      layer: entry.layer,
      type: entry.type,
      terminal: entry.terminal,
      selectors: entry.symbols,
      migrationSelectors: splitSymbols((migrationByFile.get(entry.path) || []).join(', ')),
      lines: [...new Set(linesByFile.get(entry.path) || [])].sort((a, b) => a - b),
    })),
  };
}

function toTypeCsv(summary) {
  const lines = ['type,files'];
  for (const row of summary.byType) {
    lines.push(`${row.type},${row.files}`);
  }
  return `${lines.join('\n')}\n`;
}

function toSelectorCsv(summary) {
  const lines = ['selector,files'];
  for (const row of summary.bySelector) {
    lines.push(`${row.selector},${row.files}`);
  }
  return `${lines.join('\n')}\n`;
}

function toMigrationSelectorCsv(summary) {
  const lines = ['selector,files'];
  for (const row of summary.byMigrationSelector) {
    lines.push(`${row.selector},${row.files}`);
  }
  return `${lines.join('\n')}\n`;
}

module.exports = {
  splitSymbols,
  normalizeEdges,
  buildSummary,
  toTypeCsv,
  toSelectorCsv,
  toMigrationSelectorCsv,
};
