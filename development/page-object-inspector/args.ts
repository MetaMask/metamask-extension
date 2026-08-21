import { parseArgs } from 'node:util';
import type { OverlapClassification } from './overlaps';

export type Command = 'index' | 'overlaps';

export const CLASSIFICATIONS: readonly OverlapClassification[] = [
  'cross-family',
  'sibling',
  'shadowing',
];

const CLASSIFICATION_SET = new Set<string>(CLASSIFICATIONS);

export type CliOptions = {
  command: Command;
  json: boolean;
  color: boolean;
  filters: OverlapClassification[];
  className: string | undefined;
  file: string | undefined;
  search: string | undefined;
  /** Per-classification cap. `null` means unlimited (`--all`). */
  limit: number | null;
  failOnOverlap: boolean;
  failOn: OverlapClassification[];
};

export type ParseResult =
  | { kind: 'run'; options: CliOptions }
  | { kind: 'help' }
  | { kind: 'error'; message: string };

export const DEFAULT_LIMIT = 10;

export const HELP_TEXT = `Usage:
  yarn page-objects:index [options]
  yarn page-objects:overlaps [options]

Commands:
  index      Build the page-object index and print a coverage report
  overlaps   Print overlapping selectors, grouped by classification

Options:
  --json                       Print machine-readable JSON
  --no-color                   Disable ANSI colors
  --filter <classification>    Repeatable: shadowing | sibling | cross-family
  --class <name>               Limit to overlaps involving this class
  --file <substr>              Limit to paths containing this substring
  --search <text>              Match selector, class, property, or path
  --limit <n>                  Cap items per classification (default: ${DEFAULT_LIMIT})
  --all                        Show every item (disables --limit)
  --fail-on-overlap            Exit 1 if any overlap remains after filters
  --fail-on <classification>   Exit 1 only for those classifications
  --help                       Show this help
`;

export type ParseCliArgsContext = {
  env?: NodeJS.ProcessEnv;
  isTTY?: boolean;
};

/**
 * Parses argv for the page-object inspector CLI.
 *
 * @param argv - Arguments after the script name (`process.argv.slice(2)`).
 * @param context - Environment used to resolve color. Defaults to the process.
 * @returns A run / help / error result.
 */
export function parseCliArgs(
  argv: string[],
  context: ParseCliArgsContext = {},
): ParseResult {
  let values: ReturnType<typeof parseArgs>['values'];
  let positionals: string[];

  try {
    ({ values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        json: { type: 'boolean', default: false },
        'no-color': { type: 'boolean', default: false },
        filter: { type: 'string', multiple: true },
        class: { type: 'string' },
        file: { type: 'string' },
        search: { type: 'string' },
        limit: { type: 'string' },
        all: { type: 'boolean', default: false },
        'fail-on-overlap': { type: 'boolean', default: false },
        'fail-on': { type: 'string', multiple: true },
        help: { type: 'boolean', short: 'h', default: false },
      },
    }));
  } catch (error) {
    return {
      kind: 'error',
      message: error instanceof Error ? error.message : String(error),
    };
  }

  if (values.help) {
    return { kind: 'help' };
  }

  if (positionals.length > 1) {
    return {
      kind: 'error',
      message: `Unexpected arguments: ${positionals.slice(1).join(' ')}`,
    };
  }

  const command = positionals[0] ?? 'index';
  if (command !== 'index' && command !== 'overlaps') {
    return { kind: 'error', message: `Unknown command: ${command}` };
  }

  const filters = parseClassifications(values.filter, '--filter');
  if (typeof filters === 'string') {
    return { kind: 'error', message: filters };
  }

  const failOn = parseClassifications(values['fail-on'], '--fail-on');
  if (typeof failOn === 'string') {
    return { kind: 'error', message: failOn };
  }

  const limit = resolveLimit(values.limit, Boolean(values.all));
  if (typeof limit === 'string') {
    return { kind: 'error', message: limit };
  }

  const env = context.env ?? process.env;
  const isTTY = context.isTTY ?? process.stdout.isTTY === true;
  const color = !values['no-color'] && !env.NO_COLOR && isTTY;

  return {
    kind: 'run',
    options: {
      command,
      json: Boolean(values.json),
      color,
      filters,
      className: values.class,
      file: values.file,
      search: values.search,
      limit,
      failOnOverlap: Boolean(values['fail-on-overlap']),
      failOn,
    },
  };
}

/**
 * Parses a list of overlap classifications from a repeatable flag.
 *
 * @param values - Raw flag values, if the flag was passed.
 * @param flag - The flag name, used in error messages.
 * @returns The classifications, or an error message.
 */
function parseClassifications(
  values: string[] | undefined,
  flag: string,
): OverlapClassification[] | string {
  if (!values?.length) {
    return [];
  }

  const classifications: OverlapClassification[] = [];
  for (const value of values) {
    if (!CLASSIFICATION_SET.has(value)) {
      return `Invalid ${flag}: ${value}. Expected shadowing, sibling, or cross-family.`;
    }
    classifications.push(value as OverlapClassification);
  }
  return classifications;
}

/**
 * Resolves the per-classification display cap.
 *
 * @param raw - The `--limit` value, if passed.
 * @param showAll - Whether `--all` was passed.
 * @returns `null` for unlimited, a positive integer, or an error message.
 */
function resolveLimit(
  raw: string | undefined,
  showAll: boolean,
): number | null | string {
  if (showAll) {
    return null;
  }
  if (raw === undefined) {
    return DEFAULT_LIMIT;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || String(parsed) !== raw) {
    return `Invalid --limit: ${raw}. Expected a positive integer.`;
  }
  return parsed;
}
