#!/usr/bin/env tsx
/**
 * Aligns the E2E API mock fixtures with the live API shapes. The endpoints
 * are the definitions in `api-responses/index.ts`: each one's `syncUrl` is
 * fetched and its `api-responses/<id>.json` fixture is aligned to it.
 *
 * Exit 0: no change. Exit 1: a fixture was written. Exit 2: nothing was
 * written and a fetch failed. Exit 3: the registry is inconsistent (a
 * duplicate id or endpoint, or a fixture without a definition).
 * Exit 5: a blocking row's write was refused. Exit 6: only a non-blocking row's
 * write was refused. Exit 6 passes a pull-request check and is not a clean run.
 *
 * `--changed-since <ref>` still writes all drift, but exit 1 only covers rows
 * whose definition is new or whose fixture differs from `<ref>`. Drift only in
 * other rows exits 4 and is noted on stderr as `info`.
 */
import { execFileSync } from 'child_process';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { API_ENDPOINTS } from './api-responses';
import { findDuplicateEndpoints } from './api-responses/define-api-mock';

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
  return mock.map((item) =>
    alignShape(item, listItemShape(item, live), false, options),
  );
}

/**
 * The live shape one list item is aligned to, applied at every depth. A field
 * every sample returns is required. A field only some samples return is kept
 * only where the mock already has it, so the sync does not add a field that
 * depends on which items one response happened to include. A nested object
 * gets the same rule. A sample that is `null` does not count toward the shape.
 *
 * @param mock - The current value at this position.
 * @param samples - The live values at this position, one per list entry.
 * @returns The live shape to align the mock value to.
 */
function listItemShape(mock: Json, samples: Json[]): Json {
  const present = samples.filter((sample) => sample !== null);
  if (present.length === 0) {
    return null;
  }
  if (present.every((sample) => Array.isArray(sample))) {
    // A nested list: align against the entries of every sample, so a field
    // only one entry's list has stays optional.
    return (present as Json[][]).flat();
  }
  if (!present.every(isObject)) {
    return present[0] ?? null;
  }
  const objects = present as { [key: string]: Json }[];
  if (!isObject(mock)) {
    return unionShape(objects);
  }
  const shape: { [key: string]: Json } = {};
  for (const key of Object.keys(unionShape(objects))) {
    const values = objects
      .filter((item) => key in item)
      .map((item) => item[key]);
    const everySampleHasKey = objects.every((item) => key in item);
    if (!everySampleHasKey && !(key in mock)) {
      continue;
    }
    shape[key] = listItemShape(mock[key], values);
  }
  return shape;
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
  /** Fixture path under `mock-response-data/`. */
  file: string;
  /** Dot paths under the fixture whose keys are data. `''` is the root. */
  mapPaths?: string[];
};

/** Concurrent fetches. With 3 attempts of 20s each, 43 rows stay under 10 minutes. */
export const FETCH_CONCURRENCY = 6;
const FETCH_ATTEMPTS = 3;
const FETCH_TIMEOUT_MS = 20_000;

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
 * @param row - Sync row.
 * @param live - Live response body.
 * @returns What happened to the row.
 */
async function applyRow(row: SyncRow, live: Json): Promise<RowResult> {
  const { id, url, file, mapPaths = [] } = row;
  const filePath = path.join(__dirname, file);
  const current = JSON.parse(readFileSync(filePath, 'utf8')) as Json;
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
  const next = aligned;
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
 * Whether a pull request changed a row: its definition entry or its fixture
 * value differs from the base. A row missing from the base is changed.
 *
 * @param change - The row's entry and value at the base and at head.
 * @param change.baseEntry - The definition's sync entry at the base.
 * @param change.headEntry - The definition's sync entry at head.
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

/** Directory of the endpoint definitions and their one fixture each. */
export const API_RESPONSES_DIR_NAME = 'api-responses';

/** The parts of an endpoint definition the sync reads. */
export type SyncEndpoint = {
  id: string;
  method: string;
  url: string | RegExp;
  syncUrl: string;
  syncSkip?: string;
  syncMapPaths: readonly string[];
};

/**
 * A definition's sync entry: what has to change at the base for the row to
 * count as changed by a pull request.
 *
 * @param endpoint - The definition.
 * @returns The entry text.
 */
export function syncEntry(endpoint: SyncEndpoint): string {
  return JSON.stringify([
    endpoint.method,
    endpoint.syncUrl,
    endpoint.syncSkip ?? null,
    endpoint.syncMapPaths,
  ]);
}

/**
 * The entry a definition had at the base, read from the base `index.ts`
 * text. A definition whose id or sync URL is not there is new or moved.
 *
 * @param baseIndex - `api-responses/index.ts` at the base, if it existed.
 * @param endpoint - The definition at head.
 * @returns The entry at the base, or `undefined` when it did not have it.
 */
export function baseSyncEntry(
  baseIndex: string | undefined,
  endpoint: SyncEndpoint,
): string | undefined {
  if (
    !baseIndex?.includes(`id: '${endpoint.id}'`) ||
    !baseIndex.includes(endpoint.syncUrl)
  ) {
    return undefined;
  }
  return syncEntry(endpoint);
}

/**
 * Plans the sync from the endpoint definitions. Duplicate ids or endpoints,
 * and a fixture file without a definition (or the reverse), are errors.
 * POST endpoints and definitions with `syncSkip` are not fetched; each one
 * is a `skip` warning, so the job summary lists it.
 *
 * @param entries - `[key, definition]` pairs from `API_ENDPOINTS`.
 * @param fixtureIds - The `*.json` file names in `api-responses/`, without
 * the extension.
 * @returns Errors, skip warnings, and the rows to fetch.
 */
export function planSyncRows(
  entries: [string, SyncEndpoint][],
  fixtureIds: string[],
): {
  errors: string[];
  warnings: string[];
  rows: (SyncRow & { entry: string })[];
} {
  const errors = findDuplicateEndpoints(entries);
  const defined = new Set(entries.map(([key]) => key));
  for (const id of fixtureIds) {
    if (!defined.has(id)) {
      errors.push(
        `${API_RESPONSES_DIR_NAME}/${id}.json has no definition. Add a defineApiMock entry for "${id}" to ${API_RESPONSES_DIR_NAME}/index.ts and to API_ENDPOINTS.`,
      );
    }
  }
  const files = new Set(fixtureIds);
  const warnings: string[] = [];
  const rows: (SyncRow & { entry: string })[] = [];
  for (const [key, endpoint] of entries) {
    if (!files.has(key)) {
      errors.push(
        `${key} has no ${API_RESPONSES_DIR_NAME}/${key}.json fixture.`,
      );
      continue;
    }
    if (endpoint.method !== 'GET' || endpoint.syncSkip) {
      const reason =
        endpoint.syncSkip ?? `${endpoint.method} endpoints are not fetched`;
      warnings.push(
        `skip ${endpoint.id} ${endpoint.method} ${endpoint.syncUrl}: ${reason}`,
      );
      continue;
    }
    rows.push({
      id: endpoint.id,
      url: endpoint.syncUrl,
      file: `${API_RESPONSES_DIR_NAME}/${endpoint.id}.json`,
      mapPaths: [...endpoint.syncMapPaths],
      entry: syncEntry(endpoint),
    });
  }
  return { errors, warnings, rows };
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
 * Exit code for one sync run, after discovery errors (exit 3) are handled.
 *
 * `refused` means a 200 body looked like an error on a row this run blocks
 * on: every row in weekly mode, and only rows the pull request changed
 * otherwise. That fails the check (exit 5) and is not hidden by drift that
 * only touched other rows (exit 4). `refusedOther` is the same for a row this
 * pull request did not change. That is exit 6: the check passes, and it is
 * not exit 0, so a previous drift comment is kept.
 *
 * @param outcome - What the run did.
 * @param outcome.changed - A blocking row was written.
 * @param outcome.changedOther - Only a non-blocking row was written.
 * @param outcome.refused - A blocking row's write was refused.
 * @param outcome.refusedOther - Only a non-blocking row's write was refused.
 * @param outcome.failed - A fetch failed.
 * @returns 0, 1, 2, 4, 5, or 6.
 */
export function syncExitCode({
  changed,
  changedOther,
  refused,
  refusedOther = false,
  failed,
}: {
  changed: boolean;
  changedOther: boolean;
  refused: boolean;
  refusedOther?: boolean;
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
  if (refusedOther) {
    return 6;
  }
  return 0;
}

const MOCK_DATA_DIR = 'test/e2e/mock-response-data';

/**
 * Git path of a fixture. `path.posix.normalize` collapses `..`, which `git
 * show` rejects (exit 128).
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
 * A fixture's value, from its file text.
 *
 * @param text - Fixture file text, or `undefined`.
 * @returns The value, or `undefined` when the file is missing or invalid.
 */
function fixtureValue(text: string | undefined): Json | undefined {
  if (text === undefined) {
    return undefined;
  }
  try {
    return JSON.parse(text) as Json;
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
  const fixtureIds = readdirSync(responsesDir)
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.slice(0, -'.json'.length));
  const plan = planSyncRows(
    Object.entries(API_ENDPOINTS) as [string, SyncEndpoint][],
    fixtureIds,
  );
  if (plan.errors.length > 0) {
    for (const error of plan.errors) {
      console.error(error);
    }
    return 3;
  }
  for (const warning of plan.warnings) {
    console.warn(warning);
  }
  const { rows } = plan;

  // With a base revision, every drifted row is still written, so a pull
  // request can apply all of it, but only rows that pull request changed
  // make the run fail. Decided before any write.
  const changedSince = argValue('--changed-since');
  let isBlocking = (_row: SyncRow & { entry: string }) => true;
  if (changedSince) {
    const baseIndex = readFixtureAtRef(
      changedSince,
      `${API_RESPONSES_DIR_NAME}/index.ts`,
    );
    const endpoints = API_ENDPOINTS as Record<string, SyncEndpoint>;
    isBlocking = (row) =>
      isRowChanged({
        baseEntry: baseSyncEntry(baseIndex, endpoints[row.id]),
        headEntry: row.entry,
        baseValue: fixtureValue(readFixtureAtRef(changedSince, row.file)),
        headValue: fixtureValue(
          readFileSync(path.join(__dirname, row.file), 'utf8'),
        ) as Json,
      });
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

  // Rows are applied one at a time, in registry order.
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
  const exitCode = syncExitCode({
    changed,
    changedOther,
    refused,
    refusedOther,
    failed,
  });
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
