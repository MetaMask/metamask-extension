#!/usr/bin/env tsx
/**
 * Aligns the typed E2E mock fixtures with live API shapes.
 *
 * Existing values are kept. New fields get a placeholder (`0`, `''`,
 * `false`, `null`, or one placeholder element). Dropped fields are removed.
 * An empty mock array stays empty, because tests depend on it.
 *
 * Exit 0: no change. Exit 1: a fixture was written. Exit 2: a request failed.
 *
 * Usage: yarn test:e2e:sync-api-mocks
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { RAMPS_SDK_VERSION } from '@metamask/ramps-controller';

const FIXTURE_DIR = __dirname;

type Json = null | string | number | boolean | Json[] | { [key: string]: Json };

function kindOf(value: Json): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
}

const isObject = (value: Json): value is { [key: string]: Json } =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

/** Placeholder with none of the live data. */
function placeholder(value: Json): Json {
  if (Array.isArray(value)) {
    return value.length > 0 ? [placeholder(value[0])] : [];
  }
  if (typeof value === 'number') {
    return 0;
  }
  if (typeof value === 'string') {
    return '';
  }
  if (typeof value === 'boolean') {
    return false;
  }
  return null;
}

/** `mock` reshaped to `live`, keeping mock values whose kind did not change. */
function alignShape(mock: Json, live: Json): Json {
  if (kindOf(mock) !== kindOf(live)) {
    return placeholder(live);
  }
  if (Array.isArray(mock) && Array.isArray(live)) {
    if (mock.length === 0 || live.length === 0) {
      return mock;
    }
    return mock.map((item, index) =>
      alignShape(item, live[Math.min(index, live.length - 1)]),
    );
  }
  if (isObject(mock) && isObject(live)) {
    return Object.fromEntries(
      Object.keys(live).map((key) => [
        key,
        key in mock ? alignShape(mock[key], live[key]) : placeholder(live[key]),
      ]),
    );
  }
  return mock;
}

const canonical = (value: Json): string => {
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(',')}]`;
  }
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
};

const readFixture = (fileName: string): Json =>
  JSON.parse(readFileSync(path.join(FIXTURE_DIR, fileName), 'utf8'));

const writeFixture = (fileName: string, value: Json): void =>
  writeFileSync(
    path.join(FIXTURE_DIR, fileName),
    `${JSON.stringify(value, null, 2)}\n`,
  );

async function fetchJson(url: string): Promise<Json> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'metamask-e2e-mock-sync' },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url.split('?')[0]}`);
  }
  return (await response.json()) as Json;
}

function describeChange(before: Json, after: Json): string {
  if (!isObject(before) || !isObject(after)) {
    return `type ${kindOf(before)} -> ${kindOf(after)}`;
  }
  const beforeKeys = new Set(Object.keys(before));
  const afterKeys = Object.keys(after);
  const list = (keys: string[]) => keys.join(', ') || '-';
  return [
    `added ${list(afterKeys.filter((key) => !beforeKeys.has(key)))}`,
    `removed ${list([...beforeKeys].filter((key) => !afterKeys.includes(key)))}`,
    `retyped ${list(afterKeys.filter((key) => beforeKeys.has(key) && kindOf(before[key]) !== kindOf(after[key])))}`,
  ].join('; ');
}

/**
 * Aligns one fixture property and writes the file when the shape differs.
 *
 * @param fileName - Fixture file in this directory.
 * @param property - Property to align.
 * @param live - The live response.
 * @param label - Log label.
 * @returns Whether the file changed.
 */
function alignFixture(
  fileName: string,
  property: string,
  live: Json,
  label: string,
): boolean {
  const fixture = readFixture(fileName) as Record<string, Json>;
  const current = fixture[property];
  if (Array.isArray(current) && current.length === 0) {
    console.log(`${label}: empty fixture kept so tests stay deterministic`);
    return false;
  }
  const aligned = alignShape(current, live);
  if (canonical(current) === canonical(aligned)) {
    console.log(`${label}: no shape drift`);
    return false;
  }
  console.log(`${label}: ${describeChange(current, aligned)}`);
  fixture[property] = aligned;
  writeFixture(fileName, fixture);
  return true;
}

async function syncSpotPrices(): Promise<boolean> {
  const fixture = readFixture('price-api.json') as {
    templates: Record<string, { sample: string; body: Json }>;
  };
  const samples = [
    ...new Set(
      Object.values(fixture.templates).map((template) => template.sample),
    ),
  ];
  const url = new URL('https://price.api.cx.metamask.io/v3/spot-prices');
  url.searchParams.set('assetIds', samples.join(','));
  url.searchParams.set('vsCurrency', 'usd');
  url.searchParams.set('includeMarketData', 'true');
  const live = (await fetchJson(url.toString())) as Record<string, Json>;
  const ethereum = live['eip155:1/slip44:60'];
  if (!ethereum) {
    throw new Error('Price API returned no Ethereum sample');
  }

  let changed = false;
  for (const [name, template] of Object.entries(fixture.templates)) {
    const aligned = alignShape(
      template.body,
      live[template.sample] ?? ethereum,
    );
    if (canonical(template.body) === canonical(aligned)) {
      continue;
    }
    console.log(
      `spot-prices ${name}: ${describeChange(template.body, aligned)}`,
    );
    template.body = aligned;
    changed = true;
  }
  if (!changed) {
    console.log('spot-prices: no shape drift');
    return false;
  }
  writeFixture('price-api.json', fixture);
  return true;
}

async function main(): Promise<number> {
  console.log(
    'notifications: skipped, the list endpoint needs a profile bearer token',
  );
  console.log(
    'defi positions: skipped, tests assert the fixture in confirmations/helpers.ts',
  );
  const countriesUrl = `https://on-ramp-cache.api.cx.metamask.io/v2/regions/countries?sdk=${RAMPS_SDK_VERSION}&context=extension`;
  const changed = [
    await syncSpotPrices(),
    await alignFixture(
      'global-api-responses.json',
      'countries',
      await fetchJson(countriesUrl),
      'ramps countries',
    ),
  ];

  const spaceId = process.env.CONTENTFUL_ACCESS_SPACE_ID;
  const accessToken = process.env.CONTENTFUL_ACCESS_TOKEN;
  if (!spaceId || !accessToken) {
    console.log(
      'contentful: skipped, set CONTENTFUL_ACCESS_SPACE_ID and CONTENTFUL_ACCESS_TOKEN',
    );
  } else {
    const url = new URL(
      `https://cdn.contentful.com/spaces/${spaceId}/environments/master/entries`,
    );
    url.searchParams.set('access_token', accessToken);
    url.searchParams.set('content_type', 'promotionalBanner');
    url.searchParams.set('fields.showInExtension', 'true');
    changed.push(
      await alignFixture(
        'global-api-responses.json',
        'contentful',
        await fetchJson(url.toString()),
        'contentful',
      ),
    );
  }
  return changed.some(Boolean) ? 1 : 0;
}

main()
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 2;
  });
