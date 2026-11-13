#!/usr/bin/env tsx
/**
 * Aligns the E2E API mock fixtures with the live API shapes, as listed in
 * `api-mock-catalog.md`.
 *
 * Exit 0: no change. Exit 1: a fixture was written. Exit 2: nothing was
 * written and a fetch failed. Exit 3: an `api-responses` fixture has no source.
 * Exit 5: nothing was written because a 200 body looked like an error.
 *
 * `--changed-since <ref>` still writes all drift, but exit 1 only covers rows
 * whose catalog entry or fixture value differs from `<ref>`. Drift only in
 * other rows exits 4 and is noted on stderr as `info`.
 */
import { execFileSync } from 'child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

export type Json =
  | null
  | string
  | number
  | boolean
  | Json[]
  | { [key: string]: Json };

const isObject = (value: Json): value is { [key: string]: Json } =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

function kindOf(value: Json): string {
  if (value === null) {
    return 'null';
  }
  return Array.isArray(value) ? 'array' : typeof value;
}

const PRIMITIVE_PLACEHOLDERS: Record<string, Json> = {
  number: 0,
  string: '',
  boolean: false,
};

/**
 * Placeholder with none of the live data. Objects keep their keys, and a list
 * of objects keeps one element so a new field still has the live shape. A list
 * of primitives becomes `[]`: `[""]` is not a valid id, hash, or address.
 *
 * @param value - A live value.
 * @returns The placeholder.
 */
export function placeholder(value: Json): Json {
  if (Array.isArray(value)) {
    return value.length > 0 && isObject(value[0])
      ? [placeholder(value[0])]
      : [];
  }
  if (isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, placeholder(item)]),
    );
  }
  return PRIMITIVE_PLACEHOLDERS[typeof value] ?? null;
}

/**
 * Merges `value` into `existing`. Objects and arrays of objects take the union
 * of their fields. A field some entries omit stays, with a value from an entry
 * that has it.
 *
 * @param existing - The shape so far.
 * @param value - A value from another entry.
 * @returns The merged shape.
 */
function mergeShape(existing: Json, value: Json): Json {
  if (isObject(existing) && isObject(value)) {
    return unionShape([existing, value]);
  }
  if (Array.isArray(existing) && Array.isArray(value)) {
    const objects = [...existing, ...value].filter(isObject);
    if (objects.length > 0) {
      return [unionShape(objects)];
    }
    return existing.length > 0 ? existing : value;
  }
  if (existing === null) {
    return value;
  }
  return existing;
}

/**
 * Every field any list entry returns. Entries are heterogeneous: a field that
 * only some tokens have is still part of the shape.
 *
 * @param list - Live list elements.
 * @returns One object with the union of their fields.
 */
function unionShape(list: { [key: string]: Json }[]): { [key: string]: Json } {
  const shape: { [key: string]: Json } = {};
  for (const item of list) {
    for (const [key, value] of Object.entries(item)) {
      shape[key] = key in shape ? mergeShape(shape[key], value) : value;
    }
  }
  return shape;
}

/**
 * Reshapes `mock` to `live`, keeping mock values whose kind did not change.
 * An empty mock list stays empty. A live `null` keeps the mock value: a new
 * asset often has `pricePercentChange1y: null`, and replacing that with null
 * (then `0` the next week) would wipe the fixture. For a list of objects, a
 * field no live item returns is dropped. A field only some items return stays
 * on mock items that already have it and is not copied onto the others.
 *
 * @param mock - The current fixture value.
 * @param live - The live value.
 * @param keepExtraKeys - Keep fixture fields this live sample does not show.
 * @param options - Data-map paths for this row and the current path.
 * @returns The aligned value.
 */
export function alignShape(
  mock: Json,
  live: Json,
  keepExtraKeys = false,
  options: AlignOptions = {},
): Json {
  if (live === null) {
    return mock;
  }
  if (kindOf(mock) !== kindOf(live)) {
    return placeholder(live);
  }
  if (Array.isArray(mock) && Array.isArray(live)) {
    if (mock.length === 0 || live.length === 0) {
      return mock;
    }
    const objects = live.filter(isObject);
    if (objects.length === live.length) {
      return alignObjectList(mock, objects, options);
    }
    return mock.map((item) =>
      alignShape(item, live[0], keepExtraKeys, options),
    );
  }
  if (isObject(mock) && isObject(live)) {
    return alignObject(mock, live, keepExtraKeys, options);
  }
  return mock;
}

export type AlignOptions = {
  /** Dot paths from the row's root whose keys are data, `''` for the root. */
  mapPaths?: string[];
  /** Path of the value being aligned. Arrays do not add a segment. */
  path?: string;
};

/**
 * Aligns each mock list item with the live list.
 *
 * A field no live item returns is dropped, including one the fixture already
 * has. A field only some live items return is optional: it stays on a mock
 * item that already has it, and it is not added to the others. Adding it
 * would invent a placeholder (`0`, `""`) for a field that item never had,
 * which a reader can mistake for a real value (`slip44: 0` is Bitcoin).
 * A field every live item returns is added where the mock item lacks it.
 *
 * @param mock - Current list items.
 * @param live - Live list items, all objects.
 * @param options - Data-map paths for this row and the current path.
 * @returns The aligned list.
 */
function alignObjectList(
  mock: Json[],
  live: { [key: string]: Json }[],
  options: AlignOptions,
): Json[] {
  const union = unionShape(live);
  const required = new Set(
    Object.keys(union).filter((key) => live.every((item) => key in item)),
  );
  return mock.map((item) => {
    const present = isObject(item) ? item : {};
    const shape: { [key: string]: Json } = {};
    for (const [key, value] of Object.entries(union)) {
      if (required.has(key) || key in present) {
        shape[key] = value;
      }
    }
    return alignShape(item, shape, false, options);
  });
}

/** Decimal chain ids and `0x` hex chain ids are data keys, not fields. */
export const isIdKey = (key: string): boolean =>
  /^\d+$/u.test(key) || /^0x[0-9a-f]+$/iu.test(key);

/**
 * Reshapes an object. Chain-id keys are data: the mock keeps its own entries.
 * With `keepExtraKeys`, fields the fixture already has stay even when this
 * response has no entry that includes them. A path listed in `mapPaths` is a
 * data map: every key is data, so live-only keys are not added, fixture-only
 * keys stay unchanged, and shared keys align with their own live value.
 *
 * @param mock - The current object.
 * @param live - The live object.
 * @param keepExtraKeys - Keep fixture fields missing from `live`.
 * @param options - Data-map paths for this row and the current path.
 * @returns The aligned object.
 */
function alignObject(
  mock: { [key: string]: Json },
  live: { [key: string]: Json },
  keepExtraKeys: boolean,
  options: AlignOptions,
): { [key: string]: Json } {
  const currentPath = options.path ?? '';
  const childOptions = (key: string): AlignOptions => ({
    ...options,
    path: currentPath ? `${currentPath}.${key}` : key,
  });
  if (options.mapPaths?.includes(currentPath)) {
    return Object.fromEntries(
      Object.keys(mock).map((key) => [
        key,
        key in live
          ? alignShape(mock[key], live[key], keepExtraKeys, childOptions(key))
          : mock[key],
      ]),
    );
  }
  const isId = isIdKey;
  const idShape = Object.entries(live).find(([key]) => isId(key))?.[1];
  const liveKeys = keepExtraKeys
    ? Object.keys(live)
    : Object.keys(live).filter((key) => !isId(key));
  const extraKeys = keepExtraKeys
    ? Object.keys(mock).filter((key) => !(key in live))
    : Object.keys(mock).filter(isId);
  return Object.fromEntries(
    [...liveKeys, ...extraKeys].map((key) => {
      if (!(key in live)) {
        if (keepExtraKeys || idShape === undefined) {
          return [key, mock[key]];
        }
        return [key, alignShape(mock[key], idShape, false, childOptions(key))];
      }
      if (!(key in mock)) {
        return [key, placeholder(live[key])];
      }
      return [
        key,
        alignShape(mock[key], live[key], keepExtraKeys, childOptions(key)),
      ];
    }),
  );
}

function describeChange(before: Json, after: Json): string {
  if (!isObject(before) || !isObject(after)) {
    if (Array.isArray(before) && Array.isArray(after)) {
      return 'list shape changed';
    }
    return `type ${kindOf(before)} -> ${kindOf(after)}`;
  }
  const beforeKeys = new Set(Object.keys(before));
  const afterKeys = Object.keys(after);
  const list = (keys: string[]) => keys.join(', ');
  const parts = [
    list(afterKeys.filter((key) => !beforeKeys.has(key))),
    list([...beforeKeys].filter((key) => !afterKeys.includes(key))),
    list(
      afterKeys.filter(
        (key) =>
          beforeKeys.has(key) && kindOf(before[key]) !== kindOf(after[key]),
      ),
    ),
  ];
  const labels = ['added', 'removed', 'retyped'];
  const described = parts
    .map((keys, index) => (keys ? `${labels[index]} ${keys}` : ''))
    .filter(Boolean)
    .join('; ');
  return described || 'nested fields changed';
}

const canonical = (value: Json): string =>
  JSON.stringify(value, (_key, item) =>
    isObject(item)
      ? Object.fromEntries(
          Object.entries(item).sort(([a], [b]) => a.localeCompare(b)),
        )
      : item,
  );

export type SyncRow = {
  id: string;
  url: string;
  /** `write:<file>` or `write:<file>#<key>`. */
  mode: string;
  /** Dot paths under the row's value whose keys are data. `''` is the root. */
  mapPaths?: string[];
};

/** Concurrent fetches. With 3 attempts of 20s each, 43 rows stay under 10 minutes. */
export const FETCH_CONCURRENCY = 6;
const FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 20_000;

/**
 * Parses a catalog Sync cell. Options follow the mode, separated by spaces:
 * `map` marks the row's value as a data map, `map:a.b` marks a nested object.
 *
 * @param cell - The Sync cell without backticks.
 * @returns The mode and the data-map paths.
 */
export function parseSyncCell(cell: string): {
  mode: string;
  mapPaths: string[];
} {
  const [mode = '', ...options] = cell.trim().split(/\s+/u);
  const mapPaths = options
    .filter((option) => option === 'map' || option.startsWith('map:'))
    .map((option) => (option === 'map' ? '' : option.slice('map:'.length)));
  return { mode, mapPaths };
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * GETs JSON, retrying on 429, 5xx, and network errors with backoff (1s, 2s).
 *
 * @param url - Resolved endpoint.
 * @param options - Overrides for tests.
 * @param options.fetchImpl - The `fetch` to use.
 * @param options.wait - Delay between attempts.
 * @param options.attempts - Total attempts.
 * @returns The parsed body.
 */
export async function fetchJsonWithRetry(
  url: string,
  {
    fetchImpl = fetch,
    wait = sleep,
    attempts = FETCH_ATTEMPTS,
  }: {
    fetchImpl?: typeof fetch;
    wait?: (ms: number) => Promise<void>;
    attempts?: number;
  } = {},
): Promise<Json> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    let retryable = true;
    try {
      const response = await fetchImpl(url, {
        headers: { 'User-Agent': 'metamask-e2e-mock-sync' },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (response.ok) {
        return (await response.json()) as Json;
      }
      retryable = response.status === 429 || response.status >= 500;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (!retryable || attempt === attempts) {
      break;
    }
    await wait(1000 * 2 ** (attempt - 1));
  }
  throw lastError;
}

/**
 * Runs `task` for every item with at most `limit` running at once. Results
 * keep the input order.
 *
 * @param items - Inputs.
 * @param limit - Maximum concurrent tasks.
 * @param task - Async work per item.
 * @returns Results in input order.
 */
export async function mapWithConcurrency<Item, Result>(
  items: Item[],
  limit: number,
  task: (item: Item) => Promise<Result>,
): Promise<Result[]> {
  const results: Result[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await task(items[index]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

/**
 * A 200 response with an error body would wipe the fixture. Returns why the
 * aligned value looks like that, or `null` when it is safe to write.
 *
 * @param current - The fixture value.
 * @param aligned - The value the sync would write.
 * @returns A reason to refuse the write, or `null`.
 */
export function refuseWriteReason(current: Json, aligned: Json): string | null {
  if (current === null) {
    return null;
  }
  if (kindOf(current) !== kindOf(aligned)) {
    return `top-level ${kindOf(current)} would become ${kindOf(aligned)}`;
  }
  if (isObject(current) && isObject(aligned)) {
    const keys = Object.keys(current);
    const dropped = keys.filter((key) => !(key in aligned));
    if (keys.length > 0 && dropped.length / keys.length > 0.5) {
      return `${dropped.length} of ${keys.length} top-level fields would be removed (${dropped.join(', ')})`;
    }
  }
  return null;
}

/** Outcome of comparing one row with its live response. */
export type RowResult = 'unchanged' | 'changed' | 'refused';

/**
 * Aligns one row's fixture with an already-fetched live response.
 *
 * @param row - Catalog row.
 * @param live - Live response body.
 * @returns What happened to the row.
 */
async function applyRow(row: SyncRow, live: Json): Promise<RowResult> {
  const { id, url, mode, mapPaths = [] } = row;
  const [file, key] = mode.slice('write:'.length).split('#');
  const filePath = path.join(__dirname, file);
  const fixture = JSON.parse(readFileSync(filePath, 'utf8'));
  const current = key ? fixture[key] : fixture;
  const aligned = alignShape(current, live, false, { mapPaths });
  if (canonical(current) === canonical(aligned)) {
    return 'unchanged';
  }
  const refusal = refuseWriteReason(current, aligned);
  if (refusal) {
    console.warn(
      `refused ${id} ${url}: ${refusal}. The response may be an error body; the fixture was not changed.`,
    );
    return 'refused';
  }
  const next = key === undefined ? aligned : { ...fixture, [key]: aligned };
  // Loaded only when a file is written. A static import breaks Jest, which
  // loads this module through the E2E mocks.
  const { format, resolveConfig } = await import('prettier');
  const options = await resolveConfig(filePath);
  // Indent first. Prettier keeps that wrapping, then applies the repo config
  // (sorted keys, newline), matching `yarn prettier --write`.
  const formatted = await format(`${JSON.stringify(next, null, 2)}\n`, {
    ...options,
    filepath: filePath,
  });
  // Compare the formatted text, so a run that does not change the file writes nothing.
  if (readFileSync(filePath, 'utf8') === formatted) {
    return 'unchanged';
  }
  console.log(`${id} ${url}: ${describeChange(current, aligned)}`);
  writeFileSync(filePath, formatted);
  return 'changed';
}

/**
 * Whether a pull request changed a row: its catalog entry or its fixture
 * value differs from the base. A row missing from the base is changed.
 *
 * @param change - The row's entry and value at the base and at head.
 * @param change.baseEntry - Catalog line or source entry at the base.
 * @param change.headEntry - Catalog line or source entry at head.
 * @param change.baseValue - Fixture value at the base, if the base has it.
 * @param change.headValue - Fixture value at head.
 * @returns True when the pull request changed the row.
 */
export function isRowChanged({
  baseEntry,
  headEntry,
  baseValue,
  headValue,
}: {
  baseEntry: string | undefined;
  headEntry: string;
  baseValue: Json | undefined;
  headValue: Json;
}): boolean {
  if (baseEntry === undefined || baseValue === undefined) {
    return true;
  }
  return (
    baseEntry.trim() !== headEntry.trim() ||
    canonical(baseValue) !== canonical(headValue)
  );
}

/** Directory of one-file-per-endpoint fixtures. Absent until those files land. */
export const API_RESPONSES_DIR_NAME = 'api-responses';

/** Manifest beside the fixtures. Not itself a response body. */
export const API_RESPONSE_SOURCES_FILE = 'sources.json';

export type ApiResponseSource = {
  method?: string;
  url?: string;
  mode?: string;
  reason?: string;
  follows?: string;
  /** Data-map paths, as the catalog `map` option. `""` is the root. */
  map?: string[];
};

export type DiscoveredApiResponses = {
  errors: string[];
  warnings: string[];
  rows: SyncRow[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Fixture ids in `api-responses/`, excluding the source manifest.
 *
 * @param responsesDir - The `api-responses` directory.
 * @returns Sorted ids. Empty when the directory does not exist yet.
 */
export function listApiResponseFixtureIds(responsesDir: string): string[] {
  if (!existsSync(responsesDir)) {
    return [];
  }
  return readdirSync(responsesDir)
    .filter(
      (name) => name.endsWith('.json') && name !== API_RESPONSE_SOURCES_FILE,
    )
    .map((name) => name.slice(0, -'.json'.length))
    .sort();
}

/**
 * Tells the author exactly which object to add for a fixture with no source.
 *
 * @param id - Fixture id, the file name without `.json`.
 * @returns The check failure text.
 */
export function missingApiResponseSourceMessage(id: string): string {
  return [
    `${API_RESPONSES_DIR_NAME}/${id}.json has no source entry.`,
    `Add "${id}" to test/e2e/mock-response-data/${API_RESPONSES_DIR_NAME}/${API_RESPONSE_SOURCES_FILE}:`,
    '{ "method": "GET", "url": "https://...", "mode": "write" }',
    'For POST, auth, or an endpoint that needs a real id, use "mode": "skip" and a "reason".',
  ].join('\n');
}

/**
 * Reads `sources.json`. A missing file is an empty manifest.
 *
 * @param responsesDir - The `api-responses` directory.
 * @returns The manifest, or one error when the file is not a JSON object.
 */
export function readApiResponseSources(responsesDir: string): {
  sources: Record<string, ApiResponseSource>;
  error: string | null;
} {
  const filePath = path.join(responsesDir, API_RESPONSE_SOURCES_FILE);
  if (!existsSync(filePath)) {
    return { sources: {}, error: null };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    return {
      sources: {},
      error: `${API_RESPONSE_SOURCES_FILE} is not valid JSON: ${String(error)}`,
    };
  }
  if (!isRecord(parsed)) {
    return {
      sources: {},
      error: `${API_RESPONSE_SOURCES_FILE} must be a JSON object keyed by fixture id.`,
    };
  }
  const sources: Record<string, ApiResponseSource> = {};
  for (const [id, value] of Object.entries(parsed)) {
    sources[id] = isRecord(value) ? (value as ApiResponseSource) : {};
  }
  return { sources, error: null };
}

/**
 * Lines that describe a fixture write. Skip warnings and the no-drift line
 * are not fixture updates, even if a log mixed them into the same file.
 *
 * @param report - Captured stdout from a sync run.
 * @returns The changed-API lines only.
 */
export function selectFixtureChangeLines(report: string): string[] {
  return report.split('\n').filter((line) => {
    if (
      line === '' ||
      line.startsWith('skip ') ||
      line.startsWith('info ') ||
      line.startsWith('refused ')
    ) {
      return false;
    }
    return line.includes(' https://') || line.includes(' http://');
  });
}

/**
 * Plans sync rows for every discovered fixture. Skip entries become warnings.
 * A fixture with no entry, or a write entry that is not GET, is an error.
 *
 * @param responsesDir - The `api-responses` directory.
 * @returns Errors, skip warnings, and write rows.
 */
export function discoverApiResponses(
  responsesDir: string,
): DiscoveredApiResponses {
  const ids = listApiResponseFixtureIds(responsesDir);
  if (ids.length === 0) {
    return { errors: [], warnings: [], rows: [] };
  }
  const { sources, error } = readApiResponseSources(responsesDir);
  if (error) {
    return { errors: [error], warnings: [], rows: [] };
  }
  const errors: string[] = [];
  const warnings: string[] = [];
  const rows: DiscoveredApiResponses['rows'] = [];
  for (const id of ids) {
    const source = sources[id];
    if (!source || Object.keys(source).length === 0) {
      errors.push(missingApiResponseSourceMessage(id));
      continue;
    }
    const method = source.method ?? '';
    const url = source.url ?? '';
    const mode = source.mode ?? '';
    const reason = source.reason?.trim() ?? '';
    if (mode !== 'write' && mode !== 'derived' && mode !== 'skip') {
      errors.push(
        `${id}: sources.json "mode" must be "write", "derived", or "skip".`,
      );
      continue;
    }
    if (!url) {
      errors.push(`${id}: sources.json needs a "url".`);
      continue;
    }
    if (mode === 'skip') {
      if (!reason) {
        errors.push(
          `${id}: a skip entry needs a "reason", so the endpoint is not silently ignored.`,
        );
        continue;
      }
      warnings.push(`skip ${id} ${method || 'GET'} ${url}: ${reason}`);
      continue;
    }
    if (mode === 'derived') {
      if (!source.follows) {
        errors.push(`${id}: a derived entry needs "follows".`);
      }
      continue;
    }
    if (method.toUpperCase() !== 'GET') {
      errors.push(
        `${id}: ${method || 'non-GET'} cannot be synced. Set "mode" to "skip" and add a "reason".`,
      );
      continue;
    }
    rows.push({
      id,
      url,
      mode: `write:${API_RESPONSES_DIR_NAME}/${id}.json`,
      mapPaths: source.map ?? [],
    });
  }
  return { errors, warnings, rows };
}

/** Catalog rows with their raw line, for comparing against a base revision. */
export function parseCatalogRows(
  text: string,
): (SyncRow & { entry: string })[] {
  return text
    .split('\n')
    .filter((line) => /^\| [a-z0-9]/u.test(line))
    .map((line) => {
      const [id, , url, , syncCell] = line
        .slice(1, -1)
        .split(/(?<!\\)\|/u)
        .map((cell) => cell.trim().replace(/^`|`$/gu, ''));
      return { id, url, ...parseSyncCell(syncCell), entry: line };
    })
    .filter(({ mode }) => mode.startsWith('write:'));
}

/**
 * Skip warnings for catalog rows. `sources.json` skips are warned during
 * discovery; catalog skips used to be dropped, so the job summary never
 * showed them.
 *
 * @param text - `api-mock-catalog.md`.
 * @returns One `skip <id> <method> <url>: <reason>` line per skip row.
 */
export function catalogSkipWarnings(text: string): string[] {
  return text
    .split('\n')
    .filter((line) => /^\| [a-z0-9]/u.test(line))
    .flatMap((line) => {
      const [id, method, url, , syncCell, reason = ''] = line
        .slice(1, -1)
        .split(/(?<!\\)\|/u)
        .map((cell) => cell.trim().replace(/^`|`$/gu, ''));
      if (syncCell !== 'skip') {
        return [];
      }
      return [
        `skip ${id} ${method || 'GET'} ${url}: ${reason || 'catalog skip'}`,
      ];
    });
}

/**
 * Exit code for one sync run, after discovery errors (exit 3) are handled.
 *
 * `refused` means a 200 body looked like an error on a row this run blocks
 * on: every row in weekly mode, and only rows the pull request changed
 * otherwise. That fails the check (exit 5) and is not hidden by drift that
 * only touched other rows (exit 4). A refused write on a non-blocking row is
 * a warning and is not passed here.
 *
 * @param outcome - What the run did.
 * @param outcome.changed - A blocking row was written.
 * @param outcome.changedOther - Only a non-blocking row was written.
 * @param outcome.refused - A blocking row's write was refused.
 * @param outcome.failed - A fetch failed.
 * @returns 0, 1, 2, 4, or 5.
 */
export function syncExitCode({
  changed,
  changedOther,
  refused,
  failed,
}: {
  changed: boolean;
  changedOther: boolean;
  refused: boolean;
  failed: boolean;
}): number {
  if (changed) {
    return 1;
  }
  if (refused) {
    return 5;
  }
  if (changedOther) {
    return 4;
  }
  if (failed) {
    return 2;
  }
  return 0;
}

const MOCK_DATA_DIR = 'test/e2e/mock-response-data';

/**
 * Git path of a fixture. `path.posix.normalize` collapses `..`, which `git
 * show` rejects (exit 128). The PPOM row is `../mock-cdn/ppom-version.json`.
 *
 * @param relativePath - Path under `mock-response-data/`, possibly with `..`.
 * @returns Path from the repository root.
 */
export function fixtureGitPath(relativePath: string): string {
  return path.posix.normalize(`${MOCK_DATA_DIR}/${relativePath}`);
}

/**
 * Reads a file as it was at `ref`.
 *
 * @param ref - Git revision.
 * @param relativePath - Path under `mock-response-data/`.
 * @returns The file text, or `undefined` when it did not exist.
 */
export function readFixtureAtRef(
  ref: string,
  relativePath: string,
): string | undefined {
  try {
    return execFileSync(
      'git',
      ['show', `${ref}:${fixtureGitPath(relativePath)}`],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
        maxBuffer: 64 * 1024 * 1024,
      },
    );
  } catch {
    return undefined;
  }
}

/**
 * The value a row writes, from a fixture file's text.
 *
 * @param text - Fixture file text, or `undefined`.
 * @param mode - `write:<file>` or `write:<file>#<key>`.
 * @returns The row's value, or `undefined`.
 */
function rowValue(text: string | undefined, mode: string): Json | undefined {
  if (text === undefined) {
    return undefined;
  }
  const key = mode.slice('write:'.length).split('#')[1];
  try {
    const parsed = JSON.parse(text) as Json;
    if (key === undefined) {
      return parsed;
    }
    return isObject(parsed) ? parsed[key] : undefined;
  } catch {
    return undefined;
  }
}

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function main(): Promise<number> {
  const responsesDir = path.join(__dirname, API_RESPONSES_DIR_NAME);
  const discovered = discoverApiResponses(responsesDir);
  if (discovered.errors.length > 0) {
    for (const error of discovered.errors) {
      console.error(error);
    }
    return 3;
  }
  for (const warning of discovered.warnings) {
    console.warn(warning);
  }

  const catalogText = readFileSync(
    path.join(__dirname, 'api-mock-catalog.md'),
    'utf8',
  );
  for (const warning of catalogSkipWarnings(catalogText)) {
    console.warn(warning);
  }
  const catalogRows = parseCatalogRows(catalogText);
  const { sources } = readApiResponseSources(responsesDir);
  const rows: (SyncRow & { entry: string })[] = catalogRows.concat(
    discovered.rows.map((row) => ({
      ...row,
      entry: JSON.stringify(sources[row.id] ?? {}),
    })),
  );

  // With a base revision, every drifted row is still written, so a pull
  // request can apply all of it, but only rows that pull request changed
  // make the run fail. Decided before any write.
  const changedSince = argValue('--changed-since');
  let isBlocking = (_row: SyncRow & { entry: string }) => true;
  if (changedSince) {
    const baseCatalog = readFixtureAtRef(changedSince, 'api-mock-catalog.md');
    const baseEntries = new Map(
      parseCatalogRows(baseCatalog ?? '').map((row) => [row.id, row.entry]),
    );
    const baseSourcesText = readFixtureAtRef(
      changedSince,
      `${API_RESPONSES_DIR_NAME}/${API_RESPONSE_SOURCES_FILE}`,
    );
    const baseSources = (
      baseSourcesText ? JSON.parse(baseSourcesText) : {}
    ) as Record<string, unknown>;
    for (const row of discovered.rows) {
      if (row.id in baseSources) {
        baseEntries.set(row.id, JSON.stringify(baseSources[row.id]));
      }
    }
    isBlocking = (row) => {
      const file = row.mode.slice('write:'.length).split('#')[0];
      return isRowChanged({
        baseEntry: baseEntries.get(row.id),
        headEntry: row.entry,
        baseValue: rowValue(readFixtureAtRef(changedSince, file), row.mode),
        headValue: rowValue(
          readFileSync(path.join(__dirname, file), 'utf8'),
          row.mode,
        ) as Json,
      });
    };
  }

  const fetchable = rows.filter((row) => {
    const missing = [...row.url.matchAll(/\$([A-Z_]+)/gu)]
      .map(([, name]) => name)
      .filter((name) => !process.env[name]);
    if (missing.length > 0) {
      console.warn(
        `skip ${row.id}: ${missing.map((name) => `$${name}`).join(', ')} not set`,
      );
      return false;
    }
    return true;
  });
  const blocking = new Set(
    fetchable.filter((row) => isBlocking(row)).map((row) => row.id),
  );
  const fetched = await mapWithConcurrency(
    fetchable,
    FETCH_CONCURRENCY,
    async (row) => {
      const url = row.url.replace(
        /\$([A-Z_]+)/gu,
        (_match, name) => process.env[name] ?? '',
      );
      try {
        return { live: await fetchJsonWithRetry(url) };
      } catch (error) {
        return { error };
      }
    },
  );

  // Rows are applied one at a time, in catalog order: several share a file.
  let changed = false;
  let changedOther = false;
  let failed = false;
  let refused = false;
  let refusedOther = false;
  for (const [index, row] of fetchable.entries()) {
    const result = fetched[index];
    if ('error' in result) {
      failed = true;
      console.error(`${row.id} ${row.url}: ${String(result.error)}`);
      continue;
    }
    const outcome = await applyRow(row, result.live);
    if (outcome === 'refused') {
      if (blocking.has(row.id)) {
        refused = true;
      } else {
        refusedOther = true;
        console.warn(
          `info ${row.id} ${row.url}: refused write is not in rows this pull request changed, so it does not fail the check`,
        );
      }
      continue;
    }
    if (outcome !== 'changed') {
      continue;
    }
    if (blocking.has(row.id)) {
      changed = true;
    } else {
      changedOther = true;
      console.warn(
        `info ${row.id} ${row.url}: not changed by this pull request, so this drift does not fail the check`,
      );
    }
  }
  const exitCode = syncExitCode({ changed, changedOther, refused, failed });
  if (exitCode === 5 || refusedOther) {
    console.warn(
      'refused: a response looked like an error body, so the fixture was not written',
    );
  } else if (exitCode === 0) {
    console.log('No API changes detected');
  }
  return exitCode;
}

if (process.argv[1]?.endsWith('sync-api-mocks.ts')) {
  main()
    .then((exitCode) => {
      process.exitCode = exitCode;
    })
    .catch((error: unknown) => {
      console.error(String(error));
      process.exitCode = 2;
    });
}
