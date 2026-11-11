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
 * Fields shared by the elements of a live list. A field on only one element
 * is that element's data, and the list does not always include it.
 *
 * @param list - Live list elements.
 * @returns One element with the shared fields.
 */
function sharedShape(list: { [key: string]: Json }[]): Json {
  const minimum = list.length === 1 ? 1 : 2;
  const seen = new Map<string, { count: number; value: Json }>();
  for (const [key, value] of list.flatMap(Object.entries)) {
    const entry = seen.get(key) ?? { count: 0, value };
    entry.count += 1;
    seen.set(key, entry);
  }
  return Object.fromEntries(
    [...seen]
      .filter(([, { count }]) => count >= minimum)
      .map(([key, { value }]) => [key, value]),
  );
}

/**
 * Reshapes `mock` to `live`, keeping mock values whose kind did not change.
 * An empty mock list stays empty.
 *
 * @param mock - The current fixture value.
 * @param live - The live value.
 * @returns The aligned value.
 */
function alignShape(mock: Json, live: Json): Json {
  if (kindOf(mock) !== kindOf(live)) {
    return placeholder(live);
  }
  if (Array.isArray(mock) && Array.isArray(live)) {
    if (mock.length === 0 || live.length === 0) {
      return mock;
    }
    const element = live.every(isObject) ? sharedShape(live) : live[0];
    return mock.map((item) => alignShape(item, element));
  }
  if (isObject(mock) && isObject(live)) {
    // Numeric keys (chain ids) are data: keep the mock's own entries and give
    // them the live entries' shape, but do not add the live chains.
    const isId = (key: string) => /^\d+$/u.test(key);
    const idShape = Object.entries(live).find(([key]) => isId(key))?.[1];
    const keys = [
      ...Object.keys(live).filter((key) => !isId(key)),
      ...Object.keys(mock).filter(isId),
    ];
    return Object.fromEntries(
      keys.map((key) => {
        const shape = key in live ? live[key] : idShape;
        if (!(key in mock)) {
          return [key, placeholder(live[key])];
        }
        return [
          key,
          shape === undefined ? mock[key] : alignShape(mock[key], shape),
        ];
      }),
    );
  }
  return mock;
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
    console.log(`${id}: skipped, set ${missing.join(' and ')}`);
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
    console.log(`${id}: no shape drift`);
    return false;
  }
  console.log(`${id}: shape updated`);
  writeFileSync(
    filePath,
    `${JSON.stringify(key ? { ...fixture, [key]: aligned } : aligned, null, 2)}\n`,
  );
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
      console.error(`${row.id}: ${String(error)}`);
    }
  }
  if (changed) {
    return 1;
  }
  return failed ? 2 : 0;
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
