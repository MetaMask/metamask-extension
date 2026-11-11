#!/usr/bin/env tsx
/**
 * Aligns the E2E API mock fixtures with the live API shapes, as listed in
 * `api-mock-catalog.md`.
 *
 * Exit 0: no change. Exit 1: a fixture was written. Exit 2: nothing was
 * written and a fetch failed.
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { format, resolveConfig } from 'prettier';

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
 * Placeholder with none of the live data. Objects keep their keys and arrays
 * keep one element, so a new field still has the live shape.
 *
 * @param value - A live value.
 * @returns The placeholder.
 */
export function placeholder(value: Json): Json {
  if (Array.isArray(value)) {
    return value.length > 0 ? [placeholder(value[0])] : [];
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
 * An empty mock list stays empty. For a list of objects, `keepExtraKeys` is
 * set so a field only some entries have is optional: once the fixture has it,
 * a later response that omits it is not drift.
 *
 * @param mock - The current fixture value.
 * @param live - The live value.
 * @param keepExtraKeys - Keep fixture fields this live sample does not show.
 * @returns The aligned value.
 */
function alignShape(mock: Json, live: Json, keepExtraKeys = false): Json {
  if (kindOf(mock) !== kindOf(live)) {
    // A later sample that is only null must not flip a value we already kept.
    if (keepExtraKeys && live === null && mock !== null) {
      return mock;
    }
    return placeholder(live);
  }
  if (Array.isArray(mock) && Array.isArray(live)) {
    if (mock.length === 0 || live.length === 0) {
      return mock;
    }
    const objects = live.filter(isObject);
    if (objects.length === live.length) {
      const union = unionShape(objects);
      return mock.map((item) => alignShape(item, union, true));
    }
    return mock.map((item) => alignShape(item, live[0], keepExtraKeys));
  }
  if (isObject(mock) && isObject(live)) {
    return alignObject(mock, live, keepExtraKeys);
  }
  return mock;
}

/**
 * Reshapes an object. Chain-id keys are data: the mock keeps its own entries.
 * With `keepExtraKeys`, fields the fixture already has stay even when this
 * response has no entry that includes them.
 *
 * @param mock - The current object.
 * @param live - The live object.
 * @param keepExtraKeys - Keep fixture fields missing from `live`.
 * @returns The aligned object.
 */
function alignObject(
  mock: { [key: string]: Json },
  live: { [key: string]: Json },
  keepExtraKeys: boolean,
): { [key: string]: Json } {
  const isId = (key: string) => /^\d+$/u.test(key);
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
        return [key, alignShape(mock[key], idShape)];
      }
      if (!(key in mock)) {
        return [key, placeholder(live[key])];
      }
      return [key, alignShape(mock[key], live[key], keepExtraKeys)];
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

/**
 * Aligns one catalog row's fixture with its live endpoint.
 *
 * @param row - Catalog cells: id, endpoint and sync mode.
 * @param row.id - Catalog id.
 * @param row.url - Live endpoint. `$NAME` is read from the environment.
 * @param row.mode - `write:<file>` or `write:<file>#<key>`.
 * @returns Whether the fixture changed.
 */
async function syncRow({
  id,
  url,
  mode,
}: {
  id: string;
  url: string;
  mode: string;
}): Promise<boolean> {
  const missing = [...url.matchAll(/\$([A-Z_]+)/gu)]
    .map(([, name]) => name)
    .filter((name) => !process.env[name]);
  if (missing.length > 0) {
    return false;
  }
  const response = await fetch(
    url.replace(/\$([A-Z_]+)/gu, (_match, name) => process.env[name] ?? ''),
    {
      headers: { 'User-Agent': 'metamask-e2e-mock-sync' },
      signal: AbortSignal.timeout(30_000),
    },
  );
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const live = (await response.json()) as Json;

  const [file, key] = mode.slice('write:'.length).split('#');
  const filePath = path.join(__dirname, file);
  const fixture = JSON.parse(readFileSync(filePath, 'utf8'));
  const current = key ? fixture[key] : fixture;
  const aligned = alignShape(current, live);
  if (canonical(current) === canonical(aligned)) {
    return false;
  }
  const next = key === undefined ? aligned : { ...fixture, [key]: aligned };
  const options = await resolveConfig(filePath);
  // Indent first. Prettier keeps that wrapping, then applies the repo config
  // (sorted keys, newline), matching `yarn prettier --write`.
  const formatted = await format(`${JSON.stringify(next, null, 2)}\n`, {
    ...options,
    filepath: filePath,
  });
  // Compare the formatted text, so a run that does not change the file writes nothing.
  if (readFileSync(filePath, 'utf8') === formatted) {
    return false;
  }
  console.log(`${id} ${url}: ${describeChange(current, aligned)}`);
  writeFileSync(filePath, formatted);
  return true;
}

async function main(): Promise<number> {
  const rows = readFileSync(path.join(__dirname, 'api-mock-catalog.md'), 'utf8')
    .split('\n')
    .filter((line) => /^\| [a-z0-9]/u.test(line))
    .map((line) =>
      line
        .slice(1, -1)
        .split(/(?<!\\)\|/u)
        .map((cell) => cell.trim().replace(/^`|`$/gu, '')),
    )
    .map(([id, , url, , mode]) => ({ id, url, mode }))
    .filter(({ mode }) => mode.startsWith('write:'));

  let changed = false;
  let failed = false;
  for (const row of rows) {
    try {
      changed = (await syncRow(row)) || changed;
    } catch (error) {
      failed = true;
      console.error(`${row.id} ${row.url}: ${String(error)}`);
    }
  }
  if (!changed && !failed) {
    console.log('No API changes detected');
    return 0;
  }
  return changed ? 1 : 2;
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
