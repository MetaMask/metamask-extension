import { cloneDeep } from 'lodash';
import { migrate, version } from './215';

const mockedCaptureException = jest.fn();

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: (...args: unknown[]) => mockedCaptureException(...args),
}));

const VERSION = version;
const OLD_VERSION = VERSION - 1;

// Account / address fixtures
const ACCOUNT_1_ID = 'account-uuid-1';
const ACCOUNT_1_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

// Flare (chainId 14 / 0xe) — a niche chain not covered by the accounts API.
const FLARE_HEX = '0xe';
// WFLR (checksummed).
const WFLR_ADDRESS = '0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d';
const WFLR_CAIP19 = `eip155:14/erc20:${WFLR_ADDRESS}`;

// Mock Type for testing purposes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockVar = any;

type TestAssetsController = {
  assetsInfo: Record<string, unknown>;
  assetsBalance: Record<string, Record<string, { amount: string }>>;
  customAssets: Record<string, string[]>;
  assetPreferences: Record<string, { hidden?: boolean }>;
};

function getAssetsController(vd: { data: unknown }): TestAssetsController {
  return (vd.data as Record<string, unknown>)
    .AssetsController as TestAssetsController;
}

function buildBaseStorage(overrides: Record<string, unknown> = {}) {
  return {
    meta: { version: OLD_VERSION },
    data: {
      AccountsController: {
        internalAccounts: {
          selectedAccount: ACCOUNT_1_ID,
          accounts: {
            [ACCOUNT_1_ID]: {
              address: ACCOUNT_1_ADDRESS,
              id: ACCOUNT_1_ID,
              type: 'eip155:eoa',
            },
          },
        },
      },
      ...overrides,
    } as Record<string, unknown>,
  };
}

/**
 * Build storage with an AssetsController whose Flare metadata was wiped: the
 * WFLR asset is still tracked (customAssets + assetsBalance) but has no
 * assetsInfo entry, while the legacy TokensController still holds the metadata.
 *
 * @param acOverrides - Partial AssetsController state to merge in.
 * @param extra - Extra top-level controller state to merge in.
 */
function buildWipedFlareStorage(
  acOverrides: Partial<TestAssetsController> = {},
  extra: Record<string, unknown> = {},
) {
  return buildBaseStorage({
    TokensController: {
      allTokens: {
        [FLARE_HEX]: {
          [ACCOUNT_1_ADDRESS]: [
            { address: WFLR_ADDRESS, symbol: 'WFLR', decimals: 18 },
          ],
        },
      },
    },
    AssetsController: {
      assetsInfo: {}, // AssetsInfo is wiped
      assetsBalance: {
        [ACCOUNT_1_ID]: { [WFLR_CAIP19]: { amount: '100' } },
      },
      customAssets: { [ACCOUNT_1_ID]: [WFLR_CAIP19] },
      assetPreferences: {},
      ...acOverrides,
    },
    ...extra,
  });
}

describe(`migration #${VERSION}`, () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('bumps the version regardless of whether data changed', async () => {
    const vd = cloneDeep(buildBaseStorage());
    await migrate(vd, new Set());
    expect(vd.meta.version).toBe(VERSION);
  });

  it('restores wiped assetsInfo metadata for a niche-chain token', async () => {
    const vd = cloneDeep(buildWipedFlareStorage());

    const changed = new Set<string>();
    await migrate(vd, changed);

    expect(changed).toContain('AssetsController');
    const ac = getAssetsController(vd);
    expect(ac.assetsInfo[WFLR_CAIP19]).toStrictEqual({
      type: 'erc20',
      symbol: 'WFLR',
      name: 'WFLR',
      decimals: 18,
    });
  });

  const customAssetsTestCases = [
    {
      name: 'leaves customAssets untouched when the asset already has a balance entry',
      state: () => {
        const s = buildWipedFlareStorage();
        (s.data.AssetsController as MockVar).assetsBalance = {
          [ACCOUNT_1_ID]: { [WFLR_CAIP19]: { amount: '100' } },
        };
        return s;
      },
    },
    {
      name: 'adds the asset to customAssets when tracking was lost',
      state: () => {
        const s = buildWipedFlareStorage();
        (s.data.AssetsController as MockVar).assetsBalance = {};
        return s;
      },
    },
  ];

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each(customAssetsTestCases)(
    'customAssetsTestCases - $name',
    async ({ state }: (typeof customAssetsTestCases)[number]) => {
      const vd = cloneDeep(state());

      await migrate(vd, new Set());

      const ac = getAssetsController(vd);
      expect(ac.customAssets[ACCOUNT_1_ID]).toStrictEqual([WFLR_CAIP19]);
    },
  );

  it('restores metadata even for an account not in internalAccounts (global registry)', async () => {
    const vd = cloneDeep(
      buildWipedFlareStorage(
        { assetsBalance: {}, customAssets: {} },
        {
          AccountsController: {
            internalAccounts: { selectedAccount: '', accounts: {} },
          },
        },
      ),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    expect(changed).toContain('AssetsController');
    const ac = getAssetsController(vd);
    expect(ac.assetsInfo[WFLR_CAIP19]).toBeDefined();
    // No account mapping → nothing added to customAssets.
    expect(ac.customAssets).toStrictEqual({});
  });

  const accountsApiNetworkTestCases = [
    { hexChainId: '0x1', chainName: 'Ethereum' },
    { hexChainId: '0xa', chainName: 'Optimism' },
    { hexChainId: '0x38', chainName: 'BNB Smart Chain' },
    { hexChainId: '0x89', chainName: 'Polygon' },
    { hexChainId: '0x8f', chainName: 'Monad' },
    { hexChainId: '0x3e7', chainName: 'HyperEVM' },
    { hexChainId: '0x531', chainName: 'Sei' },
    { hexChainId: '0x13b2', chainName: 'Arc' },
    { hexChainId: '0x2105', chainName: 'Base' },
    { hexChainId: '0xa4b1', chainName: 'Arbitrum One' },
    { hexChainId: '0xa86a', chainName: 'Avalanche' },
    { hexChainId: '0xe708', chainName: 'Linea' },
  ];

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each(accountsApiNetworkTestCases)(
    'does not touch the accounts-API-supported network $chainName',
    async ({ hexChainId }: (typeof accountsApiNetworkTestCases)[number]) => {
      const vd = cloneDeep(
        buildBaseStorage({
          TokensController: {
            allTokens: {
              [hexChainId]: {
                [ACCOUNT_1_ADDRESS]: [
                  {
                    address: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
                    symbol: 'TKN',
                    decimals: 6,
                  },
                ],
              },
            },
          },
          AssetsController: {
            assetsInfo: {},
            assetsBalance: {},
            customAssets: {},
            assetPreferences: {},
          },
        }),
      );

      const changed = new Set<string>();
      await migrate(vd, changed);

      expect(changed.size).toBe(0);
      expect(Object.keys(getAssetsController(vd).assetsInfo)).toHaveLength(0);
    },
  );

  it('heals custom networks not supported by the accounts API (e.g. zkSync Era)', async () => {
    // zkSync Era (chainId 324 / 0x144) is absent from
    // ACCOUNT_API_SUPPORTED_CHAIN_IDS, so it is treated as a custom chain.
    const ZKSYNC_HEX = '0x144';
    const TOKEN_ADDRESS = '0x176211869cA2b568f2A7D4EE941E073a821EE1ff';
    const vd = cloneDeep(
      buildBaseStorage({
        TokensController: {
          allTokens: {
            [ZKSYNC_HEX]: {
              [ACCOUNT_1_ADDRESS]: [
                { address: TOKEN_ADDRESS, symbol: 'TKN', decimals: 6 },
              ],
            },
          },
        },
        AssetsController: {
          assetsInfo: {},
          assetsBalance: {},
          customAssets: {},
          assetPreferences: {},
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    expect(changed).toContain('AssetsController');
    const ac = getAssetsController(vd);
    const assetIds = Object.keys(ac.assetsInfo);
    expect(assetIds).toHaveLength(1);
    expect(assetIds[0]).toMatch(/^eip155:324\/erc20:/u);
    expect(ac.assetsInfo[assetIds[0]]).toStrictEqual({
      type: 'erc20',
      symbol: 'TKN',
      name: 'TKN',
      decimals: 6,
    });
    expect(ac.customAssets[ACCOUNT_1_ID]).toContain(assetIds[0]);
  });

  it('skips tokens hidden in the legacy allIgnoredTokens', async () => {
    const vd = cloneDeep(
      buildWipedFlareStorage(
        { assetsBalance: {}, customAssets: {} },
        {
          TokensController: {
            allTokens: {
              [FLARE_HEX]: {
                [ACCOUNT_1_ADDRESS]: [
                  { address: WFLR_ADDRESS, symbol: 'WFLR', decimals: 18 },
                ],
              },
            },
            allIgnoredTokens: {
              [FLARE_HEX]: {
                // Stored lowercase by TokensController.
                [ACCOUNT_1_ADDRESS]: [WFLR_ADDRESS.toLowerCase()],
              },
            },
          },
        },
      ),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    expect(changed.size).toBe(0);
    const ac = getAssetsController(vd);
    expect(ac.assetsInfo[WFLR_CAIP19]).toBeUndefined();
    expect(ac.customAssets[ACCOUNT_1_ID]).toBeUndefined();
  });

  it('skips tokens hidden via assetPreferences in the new controller', async () => {
    const vd = cloneDeep(
      buildWipedFlareStorage({
        assetsBalance: {},
        customAssets: {},
        assetPreferences: { [WFLR_CAIP19]: { hidden: true } },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    expect(changed.size).toBe(0);
    expect(getAssetsController(vd).assetsInfo[WFLR_CAIP19]).toBeUndefined();
  });

  it('matches assetPreferences case-insensitively (lowercase hidden key)', async () => {
    const vd = cloneDeep(
      buildWipedFlareStorage({
        assetsBalance: {},
        customAssets: {},
        assetPreferences: { [WFLR_CAIP19.toLowerCase()]: { hidden: true } },
      }),
    );

    await migrate(vd, new Set());

    expect(getAssetsController(vd).assetsInfo[WFLR_CAIP19]).toBeUndefined();
  });

  it('never overwrites an existing assetsInfo entry', async () => {
    const existing = {
      type: 'erc20',
      symbol: 'WFLR-RICH',
      name: 'Wrapped Flare (rich)',
      decimals: 18,
      image: 'https://example.com/wflr.png',
    };
    const vd = cloneDeep(
      buildWipedFlareStorage({ assetsInfo: { [WFLR_CAIP19]: existing } }),
    );

    await migrate(vd, new Set());

    expect(getAssetsController(vd).assetsInfo[WFLR_CAIP19]).toStrictEqual(
      existing,
    );
  });

  it('skips ERC-721 tokens', async () => {
    const vd = cloneDeep(
      buildWipedFlareStorage(
        { assetsBalance: {}, customAssets: {} },
        {
          TokensController: {
            allTokens: {
              [FLARE_HEX]: {
                [ACCOUNT_1_ADDRESS]: [
                  {
                    address: WFLR_ADDRESS,
                    symbol: 'NFT',
                    decimals: 0,
                    isERC721: true,
                  },
                ],
              },
            },
          },
        },
      ),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    expect(changed.size).toBe(0);
    expect(getAssetsController(vd).assetsInfo[WFLR_CAIP19]).toBeUndefined();
  });

  it('does nothing when AssetsController state is absent', async () => {
    const vd = cloneDeep(
      buildBaseStorage({
        TokensController: {
          allTokens: {
            [FLARE_HEX]: {
              [ACCOUNT_1_ADDRESS]: [
                { address: WFLR_ADDRESS, symbol: 'WFLR', decimals: 18 },
              ],
            },
          },
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    expect(changed.size).toBe(0);
    expect(
      (vd.data as Record<string, unknown>).AssetsController,
    ).toBeUndefined();
  });

  it('falls back to symbol when token name is missing and preserves image/aggregators', async () => {
    const vd = cloneDeep(
      buildWipedFlareStorage(
        { assetsBalance: {}, customAssets: {} },
        {
          TokensController: {
            allTokens: {
              [FLARE_HEX]: {
                [ACCOUNT_1_ADDRESS]: [
                  {
                    address: WFLR_ADDRESS,
                    symbol: 'WFLR',
                    decimals: 18,
                    image: 'https://example.com/wflr.png',
                    aggregators: ['CoinGecko'],
                  },
                ],
              },
            },
          },
        },
      ),
    );

    await migrate(vd, new Set());

    expect(getAssetsController(vd).assetsInfo[WFLR_CAIP19]).toStrictEqual({
      type: 'erc20',
      symbol: 'WFLR',
      name: 'WFLR',
      decimals: 18,
      image: 'https://example.com/wflr.png',
      aggregators: ['CoinGecko'],
    });
  });

  it('captures and swallows errors, still bumping the version', async () => {
    const vd = cloneDeep(buildBaseStorage());
    // Force a throw inside the try block.
    (vd.data as Record<string, unknown>).AssetsController = {
      get assetsInfo() {
        throw new Error('boom');
      },
    };

    const changed = new Set<string>();
    await expect(migrate(vd, changed)).resolves.not.toThrow();
    expect(vd.meta.version).toBe(VERSION);
    expect(changed.size).toBe(0);
    expect(mockedCaptureException).toHaveBeenCalledTimes(1);
  });
});
