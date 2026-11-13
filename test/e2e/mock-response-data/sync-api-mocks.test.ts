import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import {
  alignShape,
  catalogSkipWarnings,
  discoverApiResponses,
  fetchJsonWithRetry,
  fixtureGitPath,
  type Json,
  isIdKey,
  isRowChanged,
  listApiResponseFixtureIds,
  mapWithConcurrency,
  missingApiResponseSourceMessage,
  parseSyncCell,
  placeholder,
  readFixtureAtRef,
  refuseWriteReason,
  selectFixtureChangeLines,
  syncExitCode,
} from './sync-api-mocks';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('placeholder', () => {
  it('turns a list of primitives into an empty list', () => {
    expect(placeholder(['0xabc', '0xdef'])).toStrictEqual([]);
    expect(placeholder([1, 2])).toStrictEqual([]);
  });

  it('keeps one shaped element for a list of objects', () => {
    expect(
      placeholder([{ id: 'a', tags: ['x'], enabled: true }]),
    ).toStrictEqual([{ id: '', tags: [], enabled: false }]);
  });
});

describe('alignShape lists and nulls', () => {
  it('drops a field once no live list item returns it', () => {
    const mock: Json[] = [
      { symbol: 'ETH', decimals: 18, legacy: true },
      { symbol: 'DAI', legacy: false },
    ];
    const live: Json[] = [
      { symbol: 'ETH', decimals: 18 },
      { symbol: 'USDC', name: 'USD Coin' },
    ];
    expect(alignShape(mock, live)).toStrictEqual([
      { symbol: 'ETH', decimals: 18 },
      { symbol: 'DAI' },
    ]);
  });

  it('adds a field every live item returns and leaves optional fields off items that lack them', () => {
    const mock: Json[] = [{ symbol: 'ETH' }];
    const live: Json[] = [
      { symbol: 'ETH', chainId: 1, name: 'Ether' },
      { symbol: 'DAI', chainId: 2 },
    ];
    expect(alignShape(mock, live)).toStrictEqual([
      { symbol: 'ETH', chainId: 0 },
    ]);
  });

  it('keeps the mock value when the live value is null', () => {
    expect(
      alignShape(
        { pricePercentChange1y: 1.2, price: 3 },
        { pricePercentChange1y: null, price: 4 },
      ),
    ).toStrictEqual({ pricePercentChange1y: 1.2, price: 3 });
    expect(alignShape(5, null)).toBe(5);
    expect(alignShape(null, null)).toBeNull();
  });
});

describe('alignShape map keys', () => {
  it('treats decimal and 0x hex chain ids as data keys', () => {
    expect(isIdKey('137')).toBe(true);
    expect(isIdKey('0x8f')).toBe(true);
    expect(isIdKey('0X1')).toBe(true);
    expect(isIdKey('ethereum')).toBe(false);
    expect(isIdKey('0xzz')).toBe(false);

    const mock = { chains: { '0x8f': { address: '0x1' } } };
    const live = {
      chains: {
        '0x1': { address: '0x2', vault: '' },
        '0x8f': { address: '0x3', vault: '' },
      },
    };
    expect(alignShape(mock, live)).toStrictEqual({
      chains: { '0x8f': { address: '0x1', vault: '' } },
    });
  });

  it('keeps a catalog data map to the fixture keys', () => {
    const mock = {
      ethereum: { active: true },
      migrateToV2: { enabled: false },
    };
    const live = {
      ethereum: { active: false, v2: true },
      newchain: { active: true },
    };
    expect(alignShape(mock, live, false, { mapPaths: [''] })).toStrictEqual({
      ethereum: { active: true, v2: false },
      migrateToV2: { enabled: false },
    });
  });

  it('marks a nested object as a data map', () => {
    const mock = { config: { a: 1 }, flags: { bsc: { on: true } } };
    const live = { config: { a: 2, b: 3 }, flags: { base: { on: true } } };
    expect(
      alignShape(mock, live, false, { mapPaths: ['flags'] }),
    ).toStrictEqual({ config: { a: 1, b: 0 }, flags: { bsc: { on: true } } });
  });

  it('parses the map option from a catalog Sync cell', () => {
    expect(
      parseSyncCell('write:api-fixtures.json#swaps-feature-flags map'),
    ).toStrictEqual({
      mode: 'write:api-fixtures.json#swaps-feature-flags',
      mapPaths: [''],
    });
    expect(parseSyncCell('write:a.json map:chains map:x.y')).toStrictEqual({
      mode: 'write:a.json',
      mapPaths: ['chains', 'x.y'],
    });
    expect(parseSyncCell('write:a.json')).toStrictEqual({
      mode: 'write:a.json',
      mapPaths: [],
    });
  });
});

describe('fetchJsonWithRetry', () => {
  it('retries 429 and 5xx with backoff, then returns the body', async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse(429, {}))
      .mockResolvedValueOnce(jsonResponse(503, {}))
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));
    const wait = jest.fn().mockResolvedValue(undefined);
    await expect(
      fetchJsonWithRetry('https://example.test', { fetchImpl, wait }),
    ).resolves.toStrictEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(wait.mock.calls).toStrictEqual([[1000], [2000]]);
  });

  it('retries network errors and gives up after three attempts', async () => {
    const fetchImpl = jest
      .fn()
      .mockRejectedValue(new TypeError('fetch failed'));
    const wait = jest.fn().mockResolvedValue(undefined);
    await expect(
      fetchJsonWithRetry('https://example.test', { fetchImpl, wait }),
    ).rejects.toThrow('fetch failed');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('does not retry a 404', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(jsonResponse(404, {}));
    const wait = jest.fn().mockResolvedValue(undefined);
    await expect(
      fetchJsonWithRetry('https://example.test', { fetchImpl, wait }),
    ).rejects.toThrow('HTTP 404');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(wait).not.toHaveBeenCalled();
  });
});

describe('mapWithConcurrency', () => {
  it('caps tasks in flight and keeps the input order', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const results = await mapWithConcurrency(
      [5, 1, 4, 2, 3, 6, 0, 7],
      3,
      async (delay) => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((resolve) => setTimeout(resolve, delay));
        inFlight -= 1;
        return delay * 10;
      },
    );
    expect(maxInFlight).toBe(3);
    expect(results).toStrictEqual([50, 10, 40, 20, 30, 60, 0, 70]);
  });
});

describe('refuseWriteReason', () => {
  it('refuses when most top-level fields would disappear', () => {
    expect(
      refuseWriteReason(
        { data: [], total: 1, page: 1 },
        { error: { message: '' } },
      ),
    ).toBe('3 of 3 top-level fields would be removed (data, total, page)');
  });

  it('refuses when the top-level kind changes', () => {
    expect(refuseWriteReason([{ id: 1 }], { message: '' })).toBe(
      'top-level array would become object',
    );
  });

  it('allows a normal shape change', () => {
    expect(
      refuseWriteReason({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, d: 0 }),
    ).toBeNull();
  });
});

describe('isRowChanged', () => {
  const row = {
    baseEntry: '| gas | GET | `url` | mock | `write:a.json#gas` | |',
    headEntry: '| gas | GET | `url` | mock | `write:a.json#gas` | |',
    baseValue: { low: '1' },
    headValue: { low: '1' },
  };

  it('is false when the entry and value match the base', () => {
    expect(isRowChanged(row)).toBe(false);
  });

  it('ignores surrounding whitespace and is true when the catalog entry changed', () => {
    expect(isRowChanged({ ...row, headEntry: `${row.headEntry} ` })).toBe(
      false,
    );
    expect(
      isRowChanged({ ...row, headEntry: row.headEntry.replace('url', 'url2') }),
    ).toBe(true);
  });

  it('is true when the fixture value changed or is new', () => {
    expect(isRowChanged({ ...row, headValue: { low: '2' } })).toBe(true);
    expect(isRowChanged({ ...row, baseValue: undefined })).toBe(true);
    expect(isRowChanged({ ...row, baseEntry: undefined })).toBe(true);
  });
});

function responsesDir(): string {
  return mkdtempSync(path.join(tmpdir(), 'api-responses-'));
}

function writeJson(dir: string, name: string, value: unknown) {
  writeFileSync(path.join(dir, name), `${JSON.stringify(value, null, 2)}\n`);
}

describe('catalog skips and refused writes', () => {
  it('warns for a catalog skip row and ignores write rows', () => {
    const text = [
      '| id | method | url | where | sync | notes |',
      '| --- | --- | --- | --- | --- | --- |',
      '| gas-prices | GET | `https://gas.example/p` | mock-e2e.js | `write:a.json` | |',
      '| client-config-flags | GET | `client-config.example/flags` | mock-e2e.js | skip | owned by feature-flags |',
    ].join('\n');
    expect(catalogSkipWarnings(text)).toStrictEqual([
      'skip client-config-flags GET client-config.example/flags: owned by feature-flags',
    ]);
    const catalog = catalogSkipWarnings(
      readFileSync(path.join(__dirname, 'api-mock-catalog.md'), 'utf8'),
    );
    expect(catalog.length).toBeGreaterThan(0);
    expect(catalog.every((line) => line.startsWith('skip '))).toBe(true);
  });

  it('fails a blocking refused write even when other rows drifted', () => {
    const base = {
      changed: false,
      changedOther: false,
      refused: false,
      failed: false,
    };
    expect(syncExitCode({ ...base, refused: true })).toBe(5);
    expect(syncExitCode({ ...base, refused: true, changedOther: true })).toBe(
      5,
    );
    expect(syncExitCode({ ...base, changed: true, refused: true })).toBe(1);
    expect(syncExitCode({ ...base, changedOther: true })).toBe(4);
    expect(syncExitCode(base)).toBe(0);
  });
});

describe('fixture git paths', () => {
  it('normalizes a path that steps out of mock-response-data', () => {
    expect(fixtureGitPath('../mock-cdn/ppom-version.json')).toBe(
      'test/e2e/mock-cdn/ppom-version.json',
    );
    const text = readFixtureAtRef('HEAD', '../mock-cdn/ppom-version.json');
    const onDisk = readFileSync(
      path.join(__dirname, '../mock-cdn/ppom-version.json'),
      'utf8',
    );
    expect(text).toBe(onDisk);
  });
});

describe('selectFixtureChangeLines', () => {
  it('drops skip warnings from a mixed sync report', () => {
    const report = [
      'skip bridge-get-tokens-popular POST https://bridge.api.cx.metamask.io/getTokens/popular: POST with a request-specific body',
      'info chomp https://chomp.api.cx.metamask.io/v1/chomp: added auth (not changed by this pull request; left for the weekly sync)',
      'refused gas https://gas.api.cx.metamask.io/networks/1/gasPrices: 3 of 3 top-level fields would be removed',
      'gas-prices https://gas.api.cx.metamask.io/networks/1/gasPrices: added low',
      'No API changes detected',
      '',
    ].join('\n');
    expect(selectFixtureChangeLines(report)).toStrictEqual([
      'gas-prices https://gas.api.cx.metamask.io/networks/1/gasPrices: added low',
    ]);
  });
});

describe('api-responses discovery', () => {
  it('ignores a missing directory and the source manifest', () => {
    expect(
      listApiResponseFixtureIds(path.join(tmpdir(), 'missing-api-responses')),
    ).toStrictEqual([]);
    const dir = responsesDir();
    writeJson(dir, 'sources.json', {});
    writeJson(dir, 'gas-prices.json', { low: '' });
    expect(listApiResponseFixtureIds(dir)).toStrictEqual(['gas-prices']);
  });

  it('fails with the object to add when a fixture has no source entry', () => {
    const dir = responsesDir();
    writeJson(dir, 'gas-prices.json', {});
    const plan = discoverApiResponses(dir);
    expect(plan.rows).toStrictEqual([]);
    expect(plan.errors).toStrictEqual([
      missingApiResponseSourceMessage('gas-prices'),
    ]);
    expect(plan.errors[0]).toContain('api-responses/sources.json');
    expect(plan.errors[0]).toContain('"mode": "write"');
  });

  it('syncs a GET fixture from its declared url', () => {
    const dir = responsesDir();
    writeJson(dir, 'gas-prices.json', {});
    writeJson(dir, 'sources.json', {
      'gas-prices': {
        method: 'GET',
        url: 'https://gas.api.cx.metamask.io/networks/1/gasPrices',
        mode: 'write',
      },
    });
    expect(discoverApiResponses(dir)).toStrictEqual({
      errors: [],
      warnings: [],
      rows: [
        {
          id: 'gas-prices',
          url: 'https://gas.api.cx.metamask.io/networks/1/gasPrices',
          mode: 'write:api-responses/gas-prices.json',
          mapPaths: [],
        },
      ],
    });
  });

  it('warns for a skip entry and does not fetch it', () => {
    const dir = responsesDir();
    writeJson(dir, 'bridge-get-tokens-popular.json', {});
    writeJson(dir, 'sources.json', {
      'bridge-get-tokens-popular': {
        method: 'POST',
        url: 'https://bridge.api.cx.metamask.io/getTokens/popular',
        mode: 'skip',
        reason: 'POST with a request-specific body',
      },
    });
    const plan = discoverApiResponses(dir);
    expect(plan.errors).toStrictEqual([]);
    expect(plan.rows).toStrictEqual([]);
    expect(plan.warnings).toStrictEqual([
      'skip bridge-get-tokens-popular POST https://bridge.api.cx.metamask.io/getTokens/popular: POST with a request-specific body',
    ]);
  });

  it('rejects a skip entry with no reason and a non-GET write', () => {
    const dir = responsesDir();
    mkdirSync(dir, { recursive: true });
    writeJson(dir, 'needs-id.json', {});
    writeJson(dir, 'popular.json', {});
    writeJson(dir, 'sources.json', {
      'needs-id': {
        method: 'GET',
        url: 'https://example.test/status',
        mode: 'skip',
      },
      popular: {
        method: 'POST',
        url: 'https://example.test/popular',
        mode: 'write',
      },
    });
    const { errors, rows } = discoverApiResponses(dir);
    expect(rows).toStrictEqual([]);
    expect(errors.join('\n')).toContain('needs a "reason"');
    expect(errors.join('\n')).toContain('Set "mode" to "skip"');
  });
});
