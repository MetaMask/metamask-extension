import chalk from 'chalk';
import { CLASSIFICATIONS, type CliOptions, type Command } from './args';
import type { IndexSummary, PageObjectIndex } from './build-index';
import type { UnresolvedSelector } from './extract';
import type { Overlap, OverlapClassification } from './overlaps';

export const PAGE_OBJECTS_PREFIX = 'test/e2e/page-objects/';

export const FIX_HINTS: Record<OverlapClassification, string> = {
  shadowing: 'delete the subclass copy',
  sibling: 'hoist the selector to the shared ancestor',
  'cross-family': 'pick a canonical owner or extract a shared page object',
};

export type FilterOptions = Pick<
  CliOptions,
  'filters' | 'className' | 'file' | 'search'
>;

export type ReportStyles = {
  title: (text: string) => string;
  section: (text: string) => string;
  dim: (text: string) => string;
  italic: (text: string) => string;
  bold: (text: string) => string;
  cyan: (text: string) => string;
  green: (text: string) => string;
  yellow: (text: string) => string;
  magenta: (text: string) => string;
  red: (text: string) => string;
  classification: (kind: OverlapClassification, text: string) => string;
};

const identity = (text: string) => text;

/**
 * Builds chalk (or no-op) style helpers for a report.
 *
 * @param color - Whether ANSI colors should be applied.
 * @returns Style functions used by the formatters.
 */
export function createStyles(color: boolean): ReportStyles {
  if (!color) {
    return {
      title: identity,
      section: identity,
      dim: identity,
      italic: identity,
      bold: identity,
      cyan: identity,
      green: identity,
      yellow: identity,
      magenta: identity,
      red: identity,
      classification: (_kind, text) => text,
    };
  }

  // Force a color level so reports stay styled in CI / non-TTY when the
  // caller explicitly asked for color (the CLI already resolved TTY/NO_COLOR).
  const paint = new chalk.Instance({ level: 1 });

  return {
    title: (text) => paint.cyan.bold(text),
    section: (text) => paint.bold(text),
    dim: (text) => paint.dim(text),
    italic: (text) => paint.italic.dim(text),
    bold: (text) => paint.bold(text),
    cyan: (text) => paint.cyan(text),
    green: (text) => paint.green(text),
    yellow: (text) => paint.yellow(text),
    magenta: (text) => paint.magenta(text),
    red: (text) => paint.red(text),
    classification: (kind, text) => {
      if (kind === 'shadowing') {
        return paint.yellow.bold(text);
      }
      if (kind === 'sibling') {
        return paint.magenta.bold(text);
      }
      return paint.red.bold(text);
    },
  };
}

/**
 * Counts overlaps by classification, in severity order.
 *
 * @param overlaps - The overlaps to count.
 * @returns A count for every classification, including zeros.
 */
export function countByClassification(
  overlaps: Overlap[],
): Record<OverlapClassification, number> {
  const counts: Record<OverlapClassification, number> = {
    'cross-family': 0,
    sibling: 0,
    shadowing: 0,
  };
  for (const overlap of overlaps) {
    counts[overlap.classification] += 1;
  }
  return counts;
}

/**
 * Counts extracted selectors by kind.
 *
 * @param index - The full page-object index.
 * @returns Kind counts, only for kinds that appear.
 */
export function countKinds(index: PageObjectIndex): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const pageObject of index.pageObjects) {
    for (const selector of pageObject.selectors) {
      counts[selector.kind] = (counts[selector.kind] ?? 0) + 1;
    }
  }
  return counts;
}

/**
 * Filters overlaps by classification, class, file, and search text.
 *
 * @param overlaps - The overlaps to filter.
 * @param options - The active CLI filters.
 * @returns Overlaps that match every provided filter.
 */
export function filterOverlaps(
  overlaps: Overlap[],
  options: FilterOptions,
): Overlap[] {
  return overlaps.filter((overlap) => {
    if (
      options.filters.length > 0 &&
      !options.filters.includes(overlap.classification)
    ) {
      return false;
    }
    if (
      options.className &&
      !overlap.declarations.some(
        (declaration) => declaration.className === options.className,
      )
    ) {
      return false;
    }
    const {file} = options;
    if (
      file &&
      !overlap.declarations.some((declaration) =>
        declaration.relativePath.includes(file),
      )
    ) {
      return false;
    }
    if (options.search) {
      const query = options.search.toLowerCase();
      const haystack = [
        overlap.display,
        ...overlap.declarations.flatMap((declaration) => [
          declaration.className,
          declaration.propertyName,
          declaration.relativePath,
        ]),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Filters unresolved selectors by class, file, and search text.
 *
 * @param unresolved - The unresolved selectors to filter.
 * @param options - The active CLI filters.
 * @returns Unresolved selectors that match every provided filter.
 */
export function filterUnresolved(
  unresolved: UnresolvedSelector[],
  options: FilterOptions,
): UnresolvedSelector[] {
  return unresolved.filter((item) => {
    if (options.className && item.className !== options.className) {
      return false;
    }
    if (options.file && !item.relativePath.includes(options.file)) {
      return false;
    }
    if (options.search) {
      const query = options.search.toLowerCase();
      const haystack = [
        item.className,
        item.propertyName,
        item.relativePath,
        item.reason,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(query)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Decides whether the CLI should exit non-zero for the remaining overlaps.
 *
 * @param overlaps - Overlaps remaining after filters.
 * @param options - The fail-on flags.
 * @returns True when the process should exit 1.
 */
export function shouldFail(
  overlaps: Overlap[],
  options: Pick<CliOptions, 'failOnOverlap' | 'failOn'>,
): boolean {
  if (options.failOnOverlap && overlaps.length > 0) {
    return true;
  }
  if (
    options.failOn.length > 0 &&
    overlaps.some((overlap) => options.failOn.includes(overlap.classification))
  ) {
    return true;
  }
  return false;
}

export type JsonReport = {
  command: Command;
  summary: IndexSummary;
  overlapCounts: Record<OverlapClassification, number>;
  kinds: Record<string, number>;
  overlaps: Overlap[];
  unresolved: UnresolvedSelector[];
  wrote?: string[];
};

/**
 * Renders the machine-readable report. Always includes the full filtered set.
 *
 * @param report - The JSON payload.
 * @returns Pretty-printed JSON.
 */
export function formatJson(report: JsonReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export type FormatIndexReportOptions = {
  index: PageObjectIndex;
  overlaps: Overlap[];
  unresolved: UnresolvedSelector[];
  wrote: string[];
  color: boolean;
  limit: number | null;
};

/**
 * Renders the human-readable index report.
 *
 * @param options - The index, filtered findings, and style options.
 * @param options.index
 * @param options.overlaps
 * @param options.unresolved
 * @param options.wrote
 * @param options.color
 * @param options.limit
 * @returns Report lines.
 */
export function formatIndexReport({
  index,
  overlaps,
  unresolved,
  wrote,
  color,
  limit,
}: FormatIndexReportOptions): string[] {
  const styles = createStyles(color);
  const counts = countByClassification(overlaps);
  const kinds = countKinds(index);
  const lines: string[] = [
    sectionRule('Page Object Index', styles),
    '',
    styles.section('WROTE'),
    ...wrote.map((filePath) => `  ${styles.cyan(filePath)}`),
    '',
    styles.section('SUMMARY'),
    ...formatSummaryRows(index.summary, styles),
    '',
    styles.section('OVERLAPS BY CLASS'),
    ...formatOverlapClassRows(counts, overlaps.length, styles),
    '',
    styles.section('KINDS'),
    ...formatKindRows(kinds, styles),
  ];

  lines.push('', ...formatUnresolvedSection(unresolved, styles, limit));
  lines.push(
    '',
    styles.section('NEXT'),
    `  yarn page-objects:overlaps --filter shadowing`,
    `  yarn page-objects:overlaps --search sort-by-networks`,
  );

  return lines;
}

export type FormatOverlapReportOptions = {
  overlaps: Overlap[];
  color: boolean;
  limit: number | null;
};

/**
 * Renders the human-readable overlap report.
 *
 * @param options - The filtered overlaps and style options.
 * @param options.overlaps
 * @param options.color
 * @param options.limit
 * @returns Report lines.
 */
export function formatOverlapReport({
  overlaps,
  color,
  limit,
}: FormatOverlapReportOptions): string[] {
  const styles = createStyles(color);
  const counts = countByClassification(overlaps);
  const lines: string[] = [
    sectionRule('Page Object Overlaps', styles),
    '',
    styles.section('SUMMARY'),
    `  ${formatOverlapSummaryLine(overlaps.length, counts, styles)}`,
  ];

  if (overlaps.length === 0) {
    lines.push('', styles.green('No overlapping selectors found.'));
    return lines;
  }

  for (const classification of CLASSIFICATIONS) {
    const group = overlaps.filter(
      (overlap) => overlap.classification === classification,
    );
    if (group.length === 0) {
      continue;
    }

    const shown = limit === null ? group : group.slice(0, limit);
    const hidden = group.length - shown.length;
    const heading = `${classification.toUpperCase()} — ${group.length} selector(s) — fix: ${FIX_HINTS[classification]}`;

    lines.push(
      '',
      sectionRule(heading, styles, (text) =>
        styles.classification(classification, text),
      ),
      '',
    );

    shown.forEach((overlap, index) => {
      const placeLabel =
        overlap.declarations.length === 1 ? 'place' : 'places';
      lines.push(
        `  ${styles.dim(`${index + 1}.`)} ${styles.bold(overlap.display)}  ${styles.dim(`·  ${overlap.declarations.length} ${placeLabel}`)}`,
      );
      for (const declaration of overlap.declarations) {
        const location = `${PAGE_OBJECTS_PREFIX}${declaration.relativePath}:${declaration.line}`;
        lines.push(
          `     ${styles.cyan(location)}  ${declaration.className}.${declaration.propertyName}`,
        );
      }
    });

    if (hidden > 0) {
      lines.push(
        '',
        styles.dim(`  … ${hidden} more. Re-run with --all`),
      );
    }
  }

  return lines;
}

/**
 * Builds a `── TITLE ──` section rule.
 *
 * @param title - The section title.
 * @param styles - Style helpers.
 * @param paintTitle - Optional override for the title itself.
 * @returns The formatted rule.
 */
function sectionRule(
  title: string,
  styles: ReportStyles,
  paintTitle: (text: string) => string = styles.title,
): string {
  return `${styles.dim('──')} ${paintTitle(title)} ${styles.dim('──')}`;
}

/**
 * Formats the five-number index summary as aligned rows.
 *
 * @param summary - The index summary.
 * @param styles - Style helpers.
 * @returns Aligned summary lines.
 */
function formatSummaryRows(
  summary: IndexSummary,
  styles: ReportStyles,
): string[] {
  const rows: { label: string; value: number; paint: (text: string) => string }[] =
    [
      { label: 'files', value: summary.files, paint: identity },
      { label: 'page objects', value: summary.pageObjects, paint: identity },
      { label: 'selectors', value: summary.selectors, paint: identity },
      {
        label: 'unresolved',
        value: summary.unresolved,
        paint: summary.unresolved > 0 ? styles.yellow : styles.green,
      },
      {
        label: 'overlaps',
        value: summary.overlaps,
        paint: summary.overlaps > 0 ? styles.red : styles.green,
      },
    ];

  const labelWidth = Math.max(...rows.map((row) => row.label.length));
  const valueWidth = Math.max(
    ...rows.map((row) => String(row.value).length),
  );

  return rows.map((row) => {
    const label = row.label.padEnd(labelWidth);
    const value = String(row.value).padStart(valueWidth);
    return `  ${label}   ${row.paint(value)}`;
  });
}

/**
 * Formats the overlap-by-classification dashboard.
 *
 * @param counts - Counts by classification.
 * @param total - Total filtered overlaps.
 * @param styles - Style helpers.
 * @returns Dashboard rows.
 */
function formatOverlapClassRows(
  counts: Record<OverlapClassification, number>,
  total: number,
  styles: ReportStyles,
): string[] {
  if (total === 0) {
    return [`  ${styles.green('0')}`];
  }

  const labelWidth = Math.max(
    ...CLASSIFICATIONS.map((classification) => classification.length),
  );
  const valueWidth = Math.max(
    ...CLASSIFICATIONS.map((classification) =>
      String(counts[classification]).length,
    ),
  );

  return CLASSIFICATIONS.map((classification) => {
    const count = counts[classification];
    const label = classification.padEnd(labelWidth);
    const value = String(count).padStart(valueWidth);
    const painted =
      count === 0
        ? styles.dim(value)
        : styles.classification(classification, value);
    return `  ${label}   ${painted}   ${styles.italic(FIX_HINTS[classification])}`;
  });
}

/**
 * Formats selector-kind counts, most common first.
 *
 * @param kinds - Kind to count.
 * @param styles - Style helpers.
 * @returns Kind rows.
 */
function formatKindRows(
  kinds: Record<string, number>,
  styles: ReportStyles,
): string[] {
  const entries = Object.entries(kinds).sort(
    ([kindA, countA], [kindB, countB]) =>
      countB - countA || kindA.localeCompare(kindB),
  );
  if (entries.length === 0) {
    return [`  ${styles.dim('none')}`];
  }

  const labelWidth = Math.max(...entries.map(([kind]) => kind.length));
  const valueWidth = Math.max(
    ...entries.map(([, count]) => String(count).length),
  );

  return entries.map(([kind, count]) => {
    const label = kind.padEnd(labelWidth);
    const value = String(count).padStart(valueWidth);
    return `  ${label}   ${value}`;
  });
}

/**
 * Formats the unresolved-selector section, applying the display limit.
 *
 * @param unresolved - Filtered unresolved selectors.
 * @param styles - Style helpers.
 * @param limit - Per-section cap, or `null` for unlimited.
 * @returns Section lines, including the header.
 */
function formatUnresolvedSection(
  unresolved: UnresolvedSelector[],
  styles: ReportStyles,
  limit: number | null,
): string[] {
  const header = styles.section(`UNRESOLVED (${unresolved.length})`);
  if (unresolved.length === 0) {
    return [header, `  ${styles.green('none')}`];
  }

  const shown = limit === null ? unresolved : unresolved.slice(0, limit);
  const hidden = unresolved.length - shown.length;
  const lines = [
    header,
    ...shown.map((item) => {
      const location = `${PAGE_OBJECTS_PREFIX}${item.relativePath}:${item.line}`;
      return `  ${styles.cyan(location)}  ${item.className}.${item.propertyName}  ${styles.yellow(item.reason)}`;
    }),
  ];

  if (hidden > 0) {
    lines.push(styles.dim(`  … ${hidden} more. Re-run with --all`));
  }

  return lines;
}

/**
 * Builds the one-line overlap summary.
 *
 * @param total - Total filtered overlaps.
 * @param counts - Counts by classification.
 * @param styles - Style helpers.
 * @returns A single summary line.
 */
function formatOverlapSummaryLine(
  total: number,
  counts: Record<OverlapClassification, number>,
  styles: ReportStyles,
): string {
  const noun = total === 1 ? 'overlap' : 'overlaps';
  const paintedTotal =
    total === 0 ? styles.green(String(total)) : styles.bold(String(total));
  const parts = [`${paintedTotal} ${noun}`];

  for (const classification of CLASSIFICATIONS) {
    const count = counts[classification];
    if (count === 0) {
      continue;
    }
    parts.push(
      `${styles.classification(classification, String(count))} ${classification}`,
    );
  }

  return parts.join(styles.dim('  ·  '));
}
