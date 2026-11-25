import { API_ENDPOINTS } from './api-responses';
import {
  alignShape,
  baseSyncEntry,
  fetchJsonWithRetry,
  fixtureGitPath,
  type Json,
  isIdKey,
  isRowChanged,
  mapWithConcurrency,
  placeholder,
  planSyncRows,
  readFixtureAtRef,
  refuseWriteReason,
  selectFixtureChangeLines,
  syncEntry,
  syncExitCode,
  type SyncEndpoint,
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

  it('does not add a nested field only some list items return', () => {
    const mock: Json[] = [{ storage: { balance: 0, approval: 0 } }];
    const live: Json[] = [
      { storage: { balance: 1, approval: 2, approvalStr: 'x' } },
      { storage: { balance: 3, approval: 4 } },
    ];
    expect(alignShape(mock, live)).toStrictEqual([
      { storage: { balance: 0, approval: 0 } },
    ]);
  });

  it('keeps a nested field only some list items return when the mock has it', () => {
    const mock: Json[] = [{ storage: { balance: 0, approvalStr: 'kept' } }];
    const live: Json[] = [
      { storage: { balance: 1, approvalStr: 'x' } },
      { storage: { balance: 3 } },
    ];
    expect(alignShape(mock, live)).toStrictEqual([
      { storage: { balance: 0, approvalStr: 'kept' } },
    ]);
  });

  it('adds a nested field every list item returns', () => {
    const mock: Json[] = [{ storage: { balance: 0 } }];
    const live: Json[] = [
      { storage: { balance: 1, approval: 2 } },
      { storage: { balance: 3, approval: 4 } },
    ];
    expect(alignShape(mock, live)).toStrictEqual([
      { storage: { balance: 0, approval: 0 } },
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
    baseEntry: '["GET","https://gas.example/p",null,[]]',
    headEntry: '["GET","https://gas.example/p",null,[]]',
    baseValue: { low: '1' },
    headValue: { low: '1' },
  };

  it('is false when the entry and value match the base', () => {
    expect(isRowChanged(row)).toBe(false);
  });

  it('ignores surrounding whitespace and is true when the definition entry changed', () => {
    expect(isRowChanged({ ...row, headEntry: `${row.headEntry} ` })).toBe(
      false,
    );
    expect(
      isRowChanged({ ...row, headEntry: row.headEntry.replace('/p', '/q') }),
    ).toBe(true);
  });

  it('is true when the fixture value changed or is new', () => {
    expect(isRowChanged({ ...row, headValue: { low: '2' } })).toBe(true);
    expect(isRowChanged({ ...row, baseValue: undefined })).toBe(true);
    expect(isRowChanged({ ...row, baseEntry: undefined })).toBe(true);
  });
});

describe('syncExitCode', () => {
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
    expect(syncExitCode({ ...base, refusedOther: true })).toBe(6);
    expect(
      syncExitCode({ ...base, refusedOther: true, changedOther: true }),
    ).toBe(4);
    expect(syncExitCode(base)).toBe(0);
  });
});

describe('fixture git paths', () => {
  it('normalizes a path that steps out of mock-response-data', () => {
    expect(fixtureGitPath('../other/file.json')).toBe(
      'test/e2e/other/file.json',
    );
    expect(fixtureGitPath('api-responses/chomp.json')).toBe(
      'test/e2e/mock-response-data/api-responses/chomp.json',
    );
  });

  it('reads a fixture as committed at a revision', () => {
    expect(
      readFixtureAtRef('HEAD', 'api-responses/gas-prices.json'),
    ).toStrictEqual(expect.stringContaining('"SafeGasPrice"'));
    expect(
      readFixtureAtRef('HEAD', 'api-responses/does-not-exist.json'),
    ).toBeUndefined();
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

const endpoint = (overrides: Partial<SyncEndpoint> = {}): SyncEndpoint => ({
  id: 'gas-prices',
  method: 'GET',
  url: 'https://gas.example/p',
  syncUrl: 'https://gas.example/p',
  syncMapPaths: [],
  ...overrides,
});

describe('planSyncRows', () => {
  it('plans one row per GET definition, reading its own fixture', () => {
    const plan = planSyncRows(
      [['gas-prices', endpoint({ syncMapPaths: [''] })]],
      ['gas-prices'],
    );
    expect(plan.errors).toStrictEqual([]);
    expect(plan.warnings).toStrictEqual([]);
    expect(plan.rows).toStrictEqual([
      {
        id: 'gas-prices',
        url: 'https://gas.example/p',
        file: 'api-responses/gas-prices.json',
        mapPaths: [''],
        entry: syncEntry(endpoint({ syncMapPaths: [''] })),
      },
    ]);
  });

  it('warns for a POST or a syncSkip definition and does not fetch it', () => {
    const plan = planSyncRows(
      [
        ['popular', endpoint({ id: 'popular', method: 'POST' })],
        [
          'auth',
          endpoint({
            id: 'auth',
            url: 'https://auth.example/a',
            syncUrl: 'https://auth.example/a',
            syncSkip: 'needs a profile token',
          }),
        ],
      ],
      ['popular', 'auth'],
    );
    expect(plan.rows).toStrictEqual([]);
    expect(plan.warnings).toStrictEqual([
      'skip popular POST https://gas.example/p: POST endpoints are not fetched',
      'skip auth GET https://auth.example/a: needs a profile token',
    ]);
  });

  it('fails on a fixture without a definition and a definition without a fixture', () => {
    const plan = planSyncRows([['gas-prices', endpoint()]], ['orphan']);
    expect(plan.errors).toStrictEqual([
      'api-responses/orphan.json has no definition. Add a defineApiMock entry for "orphan" to api-responses/index.ts and to API_ENDPOINTS.',
      'gas-prices has no api-responses/gas-prices.json fixture.',
    ]);
  });

  it('fails on a duplicate endpoint', () => {
    const plan = planSyncRows(
      [
        ['gas-prices', endpoint()],
        ['gas-prices-copy', endpoint({ id: 'gas-prices-copy' })],
      ],
      ['gas-prices', 'gas-prices-copy'],
    );
    expect(plan.errors).toStrictEqual([
      'gas-prices-copy and gas-prices define the same URL matcher: GET https://gas.example/p',
      'gas-prices-copy and gas-prices define the same sync URL: GET https://gas.example/p',
    ]);
  });

  it('plans every committed definition without errors', () => {
    const fixtureIds = Object.keys(API_ENDPOINTS);
    const plan = planSyncRows(
      Object.entries(API_ENDPOINTS) as [string, SyncEndpoint][],
      fixtureIds,
    );
    expect(plan.errors).toStrictEqual([]);
    expect(plan.rows.length + plan.warnings.length).toBe(fixtureIds.length);
  });
});

describe('baseSyncEntry', () => {
  it('is the head entry when the base index defines the id and sync URL', () => {
    const baseIndex = "id: 'gas-prices',\n  syncUrl: 'https://gas.example/p',";
    expect(baseSyncEntry(baseIndex, endpoint())).toBe(syncEntry(endpoint()));
  });

  it('is undefined for a new definition or a changed sync URL', () => {
    expect(baseSyncEntry(undefined, endpoint())).toBeUndefined();
    expect(baseSyncEntry("id: 'other'", endpoint())).toBeUndefined();
    expect(
      baseSyncEntry(
        "id: 'gas-prices',\n  syncUrl: 'https://gas.example/old',",
        endpoint(),
      ),
    ).toBeUndefined();
  });
});
