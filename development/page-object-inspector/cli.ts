import fs from 'node:fs';
import path from 'node:path';
import { buildIndex, toRuntimeIndex, type SourceFile } from './build-index';
import type { Overlap, OverlapClassification } from './overlaps';

const REPO_ROOT = path.resolve(__dirname, '../..');
const PAGE_OBJECTS_ROOT = path.join(REPO_ROOT, 'test/e2e/page-objects');
const OUTPUT_PATH = path.join(
  REPO_ROOT,
  'development/page-object-inspector/.generated/index.json',
);
/**
 * The browser overlay imports this through webpack, so it has to exist in a
 * fresh checkout. It is committed, and deliberately carries no timestamp so
 * that regenerating it produces no diff unless a page object actually changed.
 *
 * It lives beside the overlay rather than here because `ui/` is not allowed to
 * import from `development/`.
 */
const RUNTIME_OUTPUT_PATH = path.join(
  REPO_ROOT,
  'ui/dev/page-object-inspector/runtime-index.json',
);

const FIX_HINTS: Record<OverlapClassification, string> = {
  shadowing: 'delete the subclass copy',
  sibling: 'hoist the selector to the shared ancestor',
  'cross-family': 'pick a canonical owner or extract a shared page object',
};

/**
 * Reads every page-object source file from disk.
 *
 * @returns The source files, sorted by path for stable output.
 */
function readPageObjectFiles(): SourceFile[] {
  return fs
    .readdirSync(PAGE_OBJECTS_ROOT, { recursive: true, encoding: 'utf8' })
    .filter((entry) => entry.endsWith('.ts') && !entry.endsWith('.test.ts'))
    .sort()
    .map((entry) => ({
      relativePath: entry.split(path.sep).join('/'),
      sourceText: fs.readFileSync(path.join(PAGE_OBJECTS_ROOT, entry), 'utf8'),
    }));
}

/**
 * Renders the overlap report.
 *
 * @param overlaps - The overlaps to report, most severe first.
 * @returns The report as lines of text.
 */
function formatOverlapReport(overlaps: Overlap[]): string[] {
  const counts = new Map<OverlapClassification, number>();
  for (const overlap of overlaps) {
    counts.set(
      overlap.classification,
      (counts.get(overlap.classification) ?? 0) + 1,
    );
  }

  const lines: string[] = [];
  let currentClassification: OverlapClassification | null = null;

  for (const overlap of overlaps) {
    if (overlap.classification !== currentClassification) {
      currentClassification = overlap.classification;
      const count = counts.get(currentClassification) ?? 0;
      lines.push(
        '',
        `${currentClassification.toUpperCase()} — ${count} selector(s) — fix: ${FIX_HINTS[currentClassification]}`,
        '',
      );
    }

    lines.push(
      `  ${overlap.display}  declared in ${overlap.declarations.length} places`,
    );
    for (const declaration of overlap.declarations) {
      lines.push(
        `    ${declaration.relativePath}:${declaration.line}  ${declaration.className}.${declaration.propertyName}`,
      );
    }
  }

  return lines;
}

const command = process.argv[2] ?? 'index';
const index = buildIndex({ files: readPageObjectFiles() });

if (command === 'overlaps') {
  console.log(formatOverlapReport(index.overlaps).join('\n'));
} else {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(
    OUTPUT_PATH,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), ...index }, null, 2)}\n`,
  );
  fs.writeFileSync(
    RUNTIME_OUTPUT_PATH,
    `${JSON.stringify(toRuntimeIndex(index), null, 2)}\n`,
  );
  console.log(
    `Wrote ${path.relative(REPO_ROOT, OUTPUT_PATH)}\nWrote ${path.relative(REPO_ROOT, RUNTIME_OUTPUT_PATH)}`,
  );
}

const { summary } = index;
console.log(
  [
    '',
    `files:        ${summary.files}`,
    `page objects: ${summary.pageObjects}`,
    `selectors:    ${summary.selectors}`,
    `unresolved:   ${summary.unresolved}`,
    `overlaps:     ${summary.overlaps}`,
  ].join('\n'),
);
