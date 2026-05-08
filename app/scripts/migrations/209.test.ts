import { cloneDeep } from 'lodash';
import { migrate, version } from './209';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

// Shared account / address fixtures
const ACCOUNT_1_ID = 'account-uuid-1';
const ACCOUNT_1_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const ACCOUNT_2_ID = 'account-uuid-2';
const ACCOUNT_2_ADDRESS = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

// EVM token addresses (checksummed)
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const DAI_ADDRESS = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

// CAIP-19 equivalents (checksummed ERC-20)
const USDC_CAIP19_MAINNET = `eip155:1/erc20:${USDC_ADDRESS}`;
const DAI_CAIP19_MAINNET = `eip155:1/erc20:${DAI_ADDRESS}`;

// Non-EVM (Solana)
const SOL_USDC_ASSET_ID =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/spl:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
// Native Solana (slip44) — should never be migrated.
const SOL_NATIVE_ASSET_ID =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';

type TestAssetsController = {
  assetsInfo: Record<string, unknown>;
  assetsBalance: Record<string, Record<string, { amount: string }>>;
  customAssets: Record<string, string[]>;
};

function getAC(vd: { data: unknown }): TestAssetsController {
  return (vd.data as Record<string, unknown>)
    .AssetsController as TestAssetsController;
}

function buildBaseStorage(
  overrides: Record<string, unknown> = {},
  options: { selectedAccount?: string } = {},
) {
  return {
    meta: { version: OLD_VERSION },
    data: {
      AccountsController: {
        internalAccounts: {
          selectedAccount: options.selectedAccount ?? ACCOUNT_1_ID,
          accounts: {
            [ACCOUNT_1_ID]: { address: ACCOUNT_1_ADDRESS, id: ACCOUNT_1_ID },
            [ACCOUNT_2_ID]: { address: ACCOUNT_2_ADDRESS, id: ACCOUNT_2_ID },
          },
        },
      },
      ...overrides,
    } as Record<string, unknown>,
  };
}

describe(`migration #${VERSION}`, () => {
  // ─── version bump ──────────────────────────────────────────────────────────

  it('bumps the version regardless of whether data changed', async () => {
    const vd = cloneDeep(buildBaseStorage());
    await migrate(vd, new Set());
    expect(vd.meta.version).toBe(VERSION);
  });

  // ─── EVM tokens → customAssets ─────────────────────────────────────────────

  it('adds EVM tokens to customAssets and writes metadata to assetsInfo', async () => {
    const vd = cloneDeep(
      buildBaseStorage({
        TokensController: {
          allTokens: {
            '0x1': {
              [ACCOUNT_1_ADDRESS]: [
                {
                  address: USDC_ADDRESS,
                  symbol: 'USDC',
                  decimals: 6,
                  name: 'USD Coin',
                  image: 'https://example.com/usdc.png',
                  aggregators: ['1inch', 'Uniswap'],
                },
              ],
            },
          },
        },
        // Even with a balance, the migration writes to customAssets only.
        TokenBalancesController: {
          tokenBalances: {
            [ACCOUNT_1_ADDRESS]: {
              '0x1': { [USDC_ADDRESS]: '0x5f5e100' },
            },
          },
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    expect(changed).toContain('AssetsController');
    const ac = getAC(vd);
    expect(ac.customAssets[ACCOUNT_1_ID]).toContain(USDC_CAIP19_MAINNET);
    expect(
      ac.assetsBalance[ACCOUNT_1_ID]?.[USDC_CAIP19_MAINNET],
    ).toBeUndefined();
    expect(ac.assetsInfo[USDC_CAIP19_MAINNET]).toMatchObject({
      type: 'erc20',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      image: 'https://example.com/usdc.png',
      aggregators: ['1inch', 'Uniswap'],
    });
  });

  it('falls back to symbol when token name is missing', async () => {
    const vd = cloneDeep(
      buildBaseStorage({
        TokensController: {
          allTokens: {
            '0x1': {
              [ACCOUNT_1_ADDRESS]: [
                { address: DAI_ADDRESS, symbol: 'DAI', decimals: 18 },
              ],
            },
          },
        },
      }),
    );

    await migrate(vd, new Set());
    const ac = getAC(vd);
    expect(ac.assetsInfo[DAI_CAIP19_MAINNET]).toMatchObject({
      type: 'erc20',
      symbol: 'DAI',
      name: 'DAI',
      decimals: 18,
    });
  });

  it('skips ERC-721 tokens', async () => {
    const NFT_ADDRESS = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
    const vd = cloneDeep(
      buildBaseStorage({
        TokensController: {
          allTokens: {
            '0x1': {
              [ACCOUNT_1_ADDRESS]: [
                {
                  address: NFT_ADDRESS,
                  symbol: 'BAYC',
                  decimals: 0,
                  isERC721: true,
                },
              ],
            },
          },
        },
      }),
    );

    await migrate(vd, new Set());
    const ac = getAC(vd);
    const nftId = `eip155:1/erc20:${NFT_ADDRESS}`;
    expect(ac.assetsInfo[nftId]).toBeUndefined();
    expect(ac.customAssets[ACCOUNT_1_ID] ?? []).not.toContain(nftId);
  });

  it('handles multiple accounts and chains correctly', async () => {
    const POLYGON_CHAIN_ID = '0x89';
    const USDC_CAIP19_POLYGON = `eip155:137/erc20:${USDC_ADDRESS}`;

    const vd = cloneDeep(
      buildBaseStorage({
        TokensController: {
          allTokens: {
            '0x1': {
              [ACCOUNT_1_ADDRESS]: [
                { address: USDC_ADDRESS, symbol: 'USDC', decimals: 6 },
              ],
              [ACCOUNT_2_ADDRESS]: [
                { address: DAI_ADDRESS, symbol: 'DAI', decimals: 18 },
              ],
            },
            [POLYGON_CHAIN_ID]: {
              [ACCOUNT_1_ADDRESS]: [
                { address: USDC_ADDRESS, symbol: 'USDC', decimals: 6 },
              ],
            },
          },
        },
      }),
    );

    await migrate(vd, new Set());
    const ac = getAC(vd);
    expect(ac.customAssets[ACCOUNT_1_ID]).toEqual(
      expect.arrayContaining([USDC_CAIP19_MAINNET, USDC_CAIP19_POLYGON]),
    );
    expect(ac.customAssets[ACCOUNT_2_ID]).toContain(DAI_CAIP19_MAINNET);
  });

  // ─── Idempotency ───────────────────────────────────────────────────────────

  it('does not overwrite existing assetsInfo entries', async () => {
    const existingMeta = {
      type: 'erc20',
      symbol: 'USDC-API',
      name: 'USD Coin from API',
      decimals: 6,
    };

    const vd = cloneDeep(
      buildBaseStorage({
        TokensController: {
          allTokens: {
            '0x1': {
              [ACCOUNT_1_ADDRESS]: [
                {
                  address: USDC_ADDRESS,
                  symbol: 'USDC-OLD',
                  decimals: 6,
                  name: 'Old',
                },
              ],
            },
          },
        },
        AssetsController: {
          assetsInfo: { [USDC_CAIP19_MAINNET]: existingMeta },
          assetsBalance: {},
          customAssets: {},
        },
      }),
    );

    await migrate(vd, new Set());
    const ac = getAC(vd);
    expect(ac.assetsInfo[USDC_CAIP19_MAINNET]).toMatchObject(existingMeta);
  });

  it('does not duplicate entries already present in customAssets', async () => {
    const vd = cloneDeep(
      buildBaseStorage({
        TokensController: {
          allTokens: {
            '0x1': {
              [ACCOUNT_1_ADDRESS]: [
                { address: DAI_ADDRESS, symbol: 'DAI', decimals: 18 },
              ],
            },
          },
        },
        AssetsController: {
          assetsInfo: {},
          assetsBalance: {},
          customAssets: { [ACCOUNT_1_ID]: [DAI_CAIP19_MAINNET] },
        },
      }),
    );

    await migrate(vd, new Set());
    const ac = getAC(vd);
    const count = ac.customAssets[ACCOUNT_1_ID].filter(
      (id) => id === DAI_CAIP19_MAINNET,
    ).length;
    expect(count).toBe(1);
  });

  it('does not add to customAssets when the asset is already in assetsBalance (mutual exclusion)', async () => {
    const vd = cloneDeep(
      buildBaseStorage({
        TokensController: {
          allTokens: {
            '0x1': {
              [ACCOUNT_1_ADDRESS]: [
                { address: DAI_ADDRESS, symbol: 'DAI', decimals: 18 },
              ],
            },
          },
        },
        AssetsController: {
          assetsInfo: {},
          assetsBalance: {
            [ACCOUNT_1_ID]: { [DAI_CAIP19_MAINNET]: { amount: '42' } },
          },
          customAssets: {},
        },
      }),
    );

    await migrate(vd, new Set());
    const ac = getAC(vd);
    expect(ac.customAssets[ACCOUNT_1_ID] ?? []).not.toContain(
      DAI_CAIP19_MAINNET,
    );
    // pre-existing balance is preserved
    expect(ac.assetsBalance[ACCOUNT_1_ID][DAI_CAIP19_MAINNET]).toEqual({
      amount: '42',
    });
  });

  // ─── Non-EVM (Solana) → customAssets ───────────────────────────────────────

  it('adds non-EVM SPL tokens to customAssets and writes metadata to assetsInfo', async () => {
    const vd = cloneDeep(
      buildBaseStorage({
        MultichainAssetsController: {
          accountsAssets: { [ACCOUNT_1_ID]: [SOL_USDC_ASSET_ID] },
          assetsMetadata: {
            [SOL_USDC_ASSET_ID]: {
              fungible: true,
              name: 'USD Coin',
              symbol: 'USDC',
              iconUrl: 'https://example.com/usdc.png',
              units: [{ decimals: 6, symbol: 'USDC' }],
            },
          },
        },
        // A balance is present but the migration still writes to customAssets only.
        MultichainBalancesController: {
          balances: {
            [ACCOUNT_1_ID]: {
              [SOL_USDC_ASSET_ID]: { amount: '500.5', unit: 'USDC' },
            },
          },
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    expect(changed).toContain('AssetsController');
    const ac = getAC(vd);
    expect(ac.customAssets[ACCOUNT_1_ID]).toContain(SOL_USDC_ASSET_ID);
    expect(ac.assetsBalance[ACCOUNT_1_ID]?.[SOL_USDC_ASSET_ID]).toBeUndefined();
    expect(ac.assetsInfo[SOL_USDC_ASSET_ID]).toMatchObject({
      type: 'spl',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      image: 'https://example.com/usdc.png',
    });
  });

  it('writes a placeholder assetsInfo entry when snap metadata is missing', async () => {
    const vd = cloneDeep(
      buildBaseStorage({
        MultichainAssetsController: {
          accountsAssets: { [ACCOUNT_1_ID]: [SOL_USDC_ASSET_ID] },
          assetsMetadata: {},
        },
      }),
    );

    await migrate(vd, new Set());
    const ac = getAC(vd);
    expect(ac.assetsInfo[SOL_USDC_ASSET_ID]).toMatchObject({
      type: 'spl',
      symbol: '',
      name: '',
      decimals: 0,
    });
    expect(ac.customAssets[ACCOUNT_1_ID]).toContain(SOL_USDC_ASSET_ID);
  });

  // ─── Native (slip44) is skipped ────────────────────────────────────────────

  it('skips native (slip44) assets entirely', async () => {
    const vd = cloneDeep(
      buildBaseStorage({
        MultichainAssetsController: {
          accountsAssets: {
            [ACCOUNT_1_ID]: [SOL_NATIVE_ASSET_ID, SOL_USDC_ASSET_ID],
          },
          assetsMetadata: {
            [SOL_NATIVE_ASSET_ID]: {
              fungible: true,
              symbol: 'SOL',
              units: [{ decimals: 9 }],
            },
            [SOL_USDC_ASSET_ID]: {
              fungible: true,
              symbol: 'USDC',
              units: [{ decimals: 6 }],
            },
          },
        },
      }),
    );

    await migrate(vd, new Set());
    const ac = getAC(vd);
    expect(ac.assetsInfo[SOL_NATIVE_ASSET_ID]).toBeUndefined();
    expect(ac.customAssets[ACCOUNT_1_ID] ?? []).not.toContain(
      SOL_NATIVE_ASSET_ID,
    );
    expect(ac.customAssets[ACCOUNT_1_ID]).toContain(SOL_USDC_ASSET_ID);
  });

  it('does not create per-account entries for accounts that hold only native assets', async () => {
    const vd = cloneDeep(
      buildBaseStorage({
        MultichainAssetsController: {
          accountsAssets: {
            [ACCOUNT_1_ID]: [SOL_USDC_ASSET_ID],
            [ACCOUNT_2_ID]: [SOL_NATIVE_ASSET_ID],
          },
          assetsMetadata: {},
        },
      }),
    );

    await migrate(vd, new Set());
    const ac = getAC(vd);
    expect(ac.customAssets[ACCOUNT_1_ID]).toContain(SOL_USDC_ASSET_ID);
    expect(ac.customAssets[ACCOUNT_2_ID]).toBeUndefined();
  });

  // ─── Relevant-account gating ───────────────────────────────────────────────

  it('skips per-account writes for accounts that have no imported tokens and are not selected', async () => {
    const vd = cloneDeep(
      buildBaseStorage(
        {
          TokensController: {
            allTokens: {
              '0x1': {
                [ACCOUNT_1_ADDRESS]: [
                  { address: USDC_ADDRESS, symbol: 'USDC', decimals: 6 },
                ],
              },
            },
          },
        },
        { selectedAccount: ACCOUNT_1_ID },
      ),
    );

    await migrate(vd, new Set());
    const ac = getAC(vd);
    expect(ac.customAssets[ACCOUNT_1_ID]).toContain(USDC_CAIP19_MAINNET);
    expect(ac.customAssets[ACCOUNT_2_ID]).toBeUndefined();
  });

  it('migrates non-selected accounts that have imported tokens', async () => {
    const vd = cloneDeep(
      buildBaseStorage(
        {
          TokensController: {
            allTokens: {
              '0x1': {
                [ACCOUNT_1_ADDRESS]: [
                  { address: USDC_ADDRESS, symbol: 'USDC', decimals: 6 },
                ],
              },
            },
          },
        },
        { selectedAccount: ACCOUNT_2_ID },
      ),
    );

    await migrate(vd, new Set());
    const ac = getAC(vd);
    expect(ac.customAssets[ACCOUNT_1_ID]).toContain(USDC_CAIP19_MAINNET);
    expect(ac.customAssets[ACCOUNT_2_ID]).toBeUndefined();
  });

  it('skips per-account writes for unrecognized addresses but still writes metadata', async () => {
    const UNKNOWN_ADDRESS = '0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead';
    const vd = cloneDeep(
      buildBaseStorage({
        TokensController: {
          allTokens: {
            '0x1': {
              [UNKNOWN_ADDRESS]: [
                { address: USDC_ADDRESS, symbol: 'USDC', decimals: 6 },
              ],
            },
          },
        },
      }),
    );

    await migrate(vd, new Set());
    const ac = getAC(vd);
    expect(ac.assetsInfo[USDC_CAIP19_MAINNET]).toBeDefined();
    expect(Object.keys(ac.customAssets)).toHaveLength(0);
  });

  // ─── Cleanup of pre-existing buggy customAssets entries ────────────────────

  it('removes pre-existing native (slip44) entries from customAssets but preserves SPL/ERC-20 entries', async () => {
    const NATIVE_ETH_MAINNET = 'eip155:1/slip44:60';
    const vd = cloneDeep(
      buildBaseStorage({
        AssetsController: {
          assetsInfo: {},
          assetsBalance: {},
          customAssets: {
            [ACCOUNT_1_ID]: [
              SOL_USDC_ASSET_ID, // SPL — preserved
              NATIVE_ETH_MAINNET, // native — removed
              USDC_CAIP19_MAINNET, // ERC-20 — preserved
            ],
            [ACCOUNT_2_ID]: [SOL_NATIVE_ASSET_ID, SOL_USDC_ASSET_ID],
          },
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);
    expect(changed).toContain('AssetsController');
    expect(ac.customAssets[ACCOUNT_1_ID]).toEqual([
      SOL_USDC_ASSET_ID,
      USDC_CAIP19_MAINNET,
    ]);
    expect(ac.customAssets[ACCOUNT_2_ID]).toEqual([SOL_USDC_ASSET_ID]);
  });

  // ─── No-op cases ───────────────────────────────────────────────────────────

  it('does nothing when both source controllers are absent', async () => {
    const vd = cloneDeep(buildBaseStorage());
    const changed = new Set<string>();
    await migrate(vd, changed);

    expect(vd.meta.version).toBe(VERSION);
    expect(changed.size).toBe(0);
  });

  it('does not mark AssetsController changed when all entries already exist', async () => {
    const vd = cloneDeep(
      buildBaseStorage({
        TokensController: {
          allTokens: {
            '0x1': {
              [ACCOUNT_1_ADDRESS]: [
                { address: DAI_ADDRESS, symbol: 'DAI', decimals: 18 },
              ],
            },
          },
        },
        AssetsController: {
          assetsInfo: {
            [DAI_CAIP19_MAINNET]: {
              type: 'erc20',
              symbol: 'DAI',
              name: 'DAI',
              decimals: 18,
            },
          },
          assetsBalance: {},
          customAssets: { [ACCOUNT_1_ID]: [DAI_CAIP19_MAINNET] },
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);
    expect(changed.size).toBe(0);
  });
});
