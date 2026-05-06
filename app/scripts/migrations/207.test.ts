import { cloneDeep } from 'lodash';
import { migrate, version } from './207';

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

type TestAssetsController = {
  assetsInfo: Record<string, unknown>;
  assetsBalance: Record<string, Record<string, { amount: string }>>;
  customAssets: Record<string, string[]>;
};

function getAC(vd: { data: unknown }): TestAssetsController {
  return (vd.data as Record<string, unknown>)
    .AssetsController as TestAssetsController;
}

function buildBaseStorage(overrides: Record<string, unknown> = {}) {
  return {
    meta: { version: OLD_VERSION },
    data: {
      AccountsController: {
        internalAccounts: {
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
  // ─── EVM: tokens with balance ───────────────────────────────────────────────

  it('moves EVM tokens WITH non-zero balance into assetsBalance', async () => {
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
                },
              ],
            },
          },
        },
        TokenBalancesController: {
          tokenBalances: {
            [ACCOUNT_1_ADDRESS]: {
              '0x1': { [USDC_ADDRESS]: '0x5f5e100' }, // 100 USDC
            },
          },
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    expect(vd.meta.version).toBe(VERSION);
    expect(changed).toContain('AssetsController');

    const ac = getAC(vd);
    expect(ac.assetsBalance[ACCOUNT_1_ID]).toMatchObject({
      [USDC_CAIP19_MAINNET]: { amount: '100.000000' },
    });
    expect(ac.customAssets[ACCOUNT_1_ID] ?? []).not.toContain(
      USDC_CAIP19_MAINNET,
    );
  });

  it('writes EVM amounts as decimal-display strings (DAI, 18 decimals)', async () => {
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
        TokenBalancesController: {
          tokenBalances: {
            [ACCOUNT_1_ADDRESS]: {
              '0x1': { [DAI_ADDRESS]: '0x1c29255dad77b800' },
            },
          },
        },
      }),
    );

    await migrate(vd, new Set());

    const ac = getAC(vd);
    expect(ac.assetsBalance[ACCOUNT_1_ID][DAI_CAIP19_MAINNET]).toEqual({
      amount: '2.029194191379609600',
    });
  });

  it('pads sub-unit EVM amounts with leading zeros (USDC.E 0.000009, 6 decimals)', async () => {
    // raw int = 9, decimals = 6 → "0.000009"
    const USDC_E_POLYGON = `eip155:137/erc20:${USDC_ADDRESS}`;
    const vd = cloneDeep(
      buildBaseStorage({
        TokensController: {
          allTokens: {
            '0x89': {
              [ACCOUNT_1_ADDRESS]: [
                { address: USDC_ADDRESS, symbol: 'USDC.E', decimals: 6 },
              ],
            },
          },
        },
        TokenBalancesController: {
          tokenBalances: {
            [ACCOUNT_1_ADDRESS]: { '0x89': { [USDC_ADDRESS]: '0x9' } },
          },
        },
      }),
    );

    await migrate(vd, new Set());

    const ac = getAC(vd);
    expect(ac.assetsBalance[ACCOUNT_1_ID][USDC_E_POLYGON]).toEqual({
      amount: '0.000009',
    });
  });

  it('returns the raw integer for zero-decimal EVM tokens', async () => {
    // decimals = 0 → no decimal point, raw integer preserved
    const TOKEN_ADDR = '0x1111111111111111111111111111111111111111';
    const TOKEN_CAIP19 = `eip155:1/erc20:${TOKEN_ADDR}`;
    const vd = cloneDeep(
      buildBaseStorage({
        TokensController: {
          allTokens: {
            '0x1': {
              [ACCOUNT_1_ADDRESS]: [
                { address: TOKEN_ADDR, symbol: 'WHOLE', decimals: 0 },
              ],
            },
          },
        },
        TokenBalancesController: {
          tokenBalances: {
            [ACCOUNT_1_ADDRESS]: { '0x1': { [TOKEN_ADDR]: '0x2a' } }, // 42
          },
        },
      }),
    );

    await migrate(vd, new Set());

    const ac = getAC(vd);
    expect(ac.assetsBalance[ACCOUNT_1_ID][TOKEN_CAIP19]).toEqual({
      amount: '42',
    });
  });

  // ─── EVM: tokens without balance ────────────────────────────────────────────

  it('moves EVM tokens with ZERO balance into customAssets', async () => {
    const vd = cloneDeep(
      buildBaseStorage({
        TokensController: {
          allTokens: {
            '0x1': {
              [ACCOUNT_1_ADDRESS]: [
                {
                  address: DAI_ADDRESS,
                  symbol: 'DAI',
                  decimals: 18,
                  name: 'Dai',
                },
              ],
            },
          },
        },
        TokenBalancesController: {
          tokenBalances: {
            [ACCOUNT_1_ADDRESS]: { '0x1': { [DAI_ADDRESS]: '0x0' } },
          },
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);
    expect(ac.customAssets[ACCOUNT_1_ID]).toContain(DAI_CAIP19_MAINNET);
    expect(
      ac.assetsBalance[ACCOUNT_1_ID]?.[DAI_CAIP19_MAINNET],
    ).toBeUndefined();
  });

  it('moves EVM tokens with MISSING balance entry into customAssets', async () => {
    const vd = cloneDeep(
      buildBaseStorage({
        TokensController: {
          allTokens: {
            '0x1': {
              [ACCOUNT_1_ADDRESS]: [
                {
                  address: DAI_ADDRESS,
                  symbol: 'DAI',
                  decimals: 18,
                  name: 'Dai',
                },
              ],
            },
          },
        },
        // No TokenBalancesController at all
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);
    expect(ac.customAssets[ACCOUNT_1_ID]).toContain(DAI_CAIP19_MAINNET);
  });

  // ─── EVM: metadata written to assetsInfo ────────────────────────────────────

  it('writes EVM token metadata to assetsInfo', async () => {
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
        TokenBalancesController: { tokenBalances: {} },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);
    expect(ac.assetsInfo[USDC_CAIP19_MAINNET]).toMatchObject({
      type: 'erc20',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      image: 'https://example.com/usdc.png',
      aggregators: ['1inch', 'Uniswap'],
    });
  });

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
        TokenBalancesController: { tokenBalances: {} },
        AssetsController: {
          assetsInfo: { [USDC_CAIP19_MAINNET]: existingMeta },
          assetsBalance: {},
          customAssets: {},
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);
    expect(ac.assetsInfo[USDC_CAIP19_MAINNET]).toMatchObject(existingMeta);
  });

  it('does not overwrite existing assetsBalance entries', async () => {
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
                },
              ],
            },
          },
        },
        TokenBalancesController: {
          tokenBalances: {
            [ACCOUNT_1_ADDRESS]: {
              '0x1': { [USDC_ADDRESS]: '0x5f5e100' }, // 100 USDC
            },
          },
        },
        AssetsController: {
          assetsInfo: {},
          assetsBalance: {
            [ACCOUNT_1_ID]: { [USDC_CAIP19_MAINNET]: { amount: '999999' } },
          },
          customAssets: {},
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);
    // Existing balance must not be overwritten
    expect(ac.assetsBalance[ACCOUNT_1_ID][USDC_CAIP19_MAINNET]).toMatchObject({
      amount: '999999',
    });
  });

  it('does not add duplicate customAssets entries', async () => {
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
        TokenBalancesController: { tokenBalances: {} },
        AssetsController: {
          assetsInfo: {},
          assetsBalance: {},
          customAssets: { [ACCOUNT_1_ID]: [DAI_CAIP19_MAINNET] },
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);
    const count = ac.customAssets[ACCOUNT_1_ID].filter(
      (id) => id === DAI_CAIP19_MAINNET,
    ).length;
    expect(count).toBe(1);
  });

  // ─── EVM: ERC-721 tokens are skipped ────────────────────────────────────────

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
        TokenBalancesController: { tokenBalances: {} },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);
    const nftId = `eip155:1/erc20:${NFT_ADDRESS}`;
    expect(ac.assetsInfo[nftId]).toBeUndefined();
  });

  // ─── EVM: multi-account, multi-chain ────────────────────────────────────────

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
        TokenBalancesController: {
          tokenBalances: {
            [ACCOUNT_1_ADDRESS]: {
              '0x1': { [USDC_ADDRESS]: '0xde0b6b3a7640000' }, // 1e18
              [POLYGON_CHAIN_ID]: { [USDC_ADDRESS]: '0x0' },
            },
            [ACCOUNT_2_ADDRESS]: { '0x1': {} },
          },
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);

    // Account 1 mainnet USDC: has balance.
    // Raw 1e18 / 10^6 = 1e12, formatted with full 6-decimal precision.
    expect(ac.assetsBalance[ACCOUNT_1_ID]?.[USDC_CAIP19_MAINNET]).toMatchObject(
      {
        amount: '1000000000000.000000',
      },
    );
    // Account 1 polygon USDC: zero balance → customAssets
    expect(ac.customAssets[ACCOUNT_1_ID]).toContain(USDC_CAIP19_POLYGON);
    // Account 2 DAI: no balance → customAssets
    expect(ac.customAssets[ACCOUNT_2_ID]).toContain(DAI_CAIP19_MAINNET);
  });

  // ─── Non-EVM: assets with balance ───────────────────────────────────────────

  it('moves non-EVM assets WITH balance into assetsBalance', async () => {
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

    const ac = getAC(vd);
    expect(ac.assetsBalance[ACCOUNT_1_ID]?.[SOL_USDC_ASSET_ID]).toMatchObject({
      amount: '500.5',
    });
    expect(ac.customAssets[ACCOUNT_1_ID] ?? []).not.toContain(
      SOL_USDC_ASSET_ID,
    );
  });

  // ─── Non-EVM: assets without balance ────────────────────────────────────────

  it('moves non-EVM assets with ZERO balance into customAssets', async () => {
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
              units: [{ decimals: 6 }],
            },
          },
        },
        MultichainBalancesController: {
          balances: {
            [ACCOUNT_1_ID]: {
              [SOL_USDC_ASSET_ID]: { amount: '0', unit: 'USDC' },
            },
          },
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);
    expect(ac.customAssets[ACCOUNT_1_ID]).toContain(SOL_USDC_ASSET_ID);
    expect(ac.assetsBalance[ACCOUNT_1_ID]?.[SOL_USDC_ASSET_ID]).toBeUndefined();
  });

  it('moves non-EVM assets with MISSING balance into customAssets', async () => {
    const vd = cloneDeep(
      buildBaseStorage({
        MultichainAssetsController: {
          accountsAssets: { [ACCOUNT_1_ID]: [SOL_USDC_ASSET_ID] },
          assetsMetadata: {},
        },
        // No MultichainBalancesController
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);
    expect(ac.customAssets[ACCOUNT_1_ID]).toContain(SOL_USDC_ASSET_ID);
  });

  // ─── Non-EVM: metadata conversion ───────────────────────────────────────────

  it('converts snaps-sdk FungibleAssetMetadata into assetsInfo format', async () => {
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
              units: [{ decimals: 6, name: 'USDC', symbol: 'USDC' }],
            },
          },
        },
        MultichainBalancesController: { balances: {} },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);
    expect(ac.assetsInfo[SOL_USDC_ASSET_ID]).toMatchObject({
      type: 'spl',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      image: 'https://example.com/usdc.png',
    });
  });

  // ─── guard: missing source controllers ──────────────────────────────────────

  it('does nothing when both source controllers are absent', async () => {
    const vd = cloneDeep(buildBaseStorage());
    const changed = new Set<string>();
    await migrate(vd, changed);

    expect(vd.meta.version).toBe(VERSION);
    // No controllers should be marked as changed
    expect(changed.size).toBe(0);
  });

  it('skips accounts not found in AccountsController', async () => {
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
        TokenBalancesController: { tokenBalances: {} },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);
    // assetsInfo is global — metadata is written even for unrecognized accounts
    expect(ac.assetsInfo[USDC_CAIP19_MAINNET]).toBeDefined();
    // but no per-account entries without a known accountId
    expect(Object.keys(ac.customAssets)).toHaveLength(0);
    expect(Object.keys(ac.assetsBalance)).toHaveLength(0);
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
        TokenBalancesController: { tokenBalances: {} },
        AssetsController: {
          assetsInfo: {
            [DAI_CAIP19_MAINNET]: {
              type: 'erc20',
              symbol: 'DAI',
              name: 'Dai',
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

  it('does not mark AssetsController changed when non-EVM entries already exist', async () => {
    const vd = cloneDeep(
      buildBaseStorage({
        MultichainAssetsController: {
          accountsAssets: { [ACCOUNT_1_ID]: [SOL_USDC_ASSET_ID] },
          assetsMetadata: {
            [SOL_USDC_ASSET_ID]: {
              fungible: true,
              name: 'USD Coin',
              symbol: 'USDC',
              units: [{ decimals: 6 }],
            },
          },
        },
        MultichainBalancesController: { balances: {} },
        AssetsController: {
          assetsInfo: {
            [SOL_USDC_ASSET_ID]: {
              type: 'spl',
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
            },
          },
          assetsBalance: {},
          customAssets: { [ACCOUNT_1_ID]: [SOL_USDC_ASSET_ID] },
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    expect(changed.size).toBe(0);
  });

  it('does not add non-EVM assets to customAssets when assetsBalance already contains the same asset with different casing', async () => {
    const lowerCasedSolUsdcAssetId = SOL_USDC_ASSET_ID.toLowerCase();
    const vd = cloneDeep(
      buildBaseStorage({
        MultichainAssetsController: {
          accountsAssets: { [ACCOUNT_1_ID]: [SOL_USDC_ASSET_ID] },
          assetsMetadata: {
            [SOL_USDC_ASSET_ID]: {
              fungible: true,
              name: 'USD Coin',
              symbol: 'USDC',
              units: [{ decimals: 6 }],
            },
          },
        },
        MultichainBalancesController: { balances: {} },
        AssetsController: {
          assetsInfo: {},
          assetsBalance: {
            [ACCOUNT_1_ID]: {
              [lowerCasedSolUsdcAssetId]: { amount: '5' },
            },
          },
          customAssets: {},
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);
    expect(ac.customAssets[ACCOUNT_1_ID] ?? []).not.toContain(
      SOL_USDC_ASSET_ID,
    );
    expect(Object.keys(ac.assetsBalance[ACCOUNT_1_ID] ?? {})).toEqual([
      lowerCasedSolUsdcAssetId,
    ]);
  });

  // ─── exclusivity between assetsBalance and customAssets ─────────────────────

  it('does not duplicate an asset into customAssets when already in assetsBalance', async () => {
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
        TokenBalancesController: {
          tokenBalances: {
            [ACCOUNT_1_ADDRESS]: { '0x1': { [DAI_ADDRESS]: '0x0' } },
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

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);
    expect(ac.customAssets[ACCOUNT_1_ID] ?? []).not.toContain(
      DAI_CAIP19_MAINNET,
    );
    expect(ac.assetsBalance[ACCOUNT_1_ID][DAI_CAIP19_MAINNET]).toMatchObject({
      amount: '42',
    });
  });

  it('removes an asset from customAssets when a non-zero balance is migrated for it', async () => {
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
                },
              ],
            },
          },
        },
        TokenBalancesController: {
          tokenBalances: {
            [ACCOUNT_1_ADDRESS]: {
              '0x1': { [USDC_ADDRESS]: '0x5f5e100' }, // 100 USDC
            },
          },
        },
        AssetsController: {
          assetsInfo: {},
          assetsBalance: {},
          customAssets: {
            [ACCOUNT_1_ID]: [USDC_CAIP19_MAINNET, DAI_CAIP19_MAINNET],
          },
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);
    expect(ac.assetsBalance[ACCOUNT_1_ID]?.[USDC_CAIP19_MAINNET]).toMatchObject(
      { amount: '100.000000' },
    );
    expect(ac.customAssets[ACCOUNT_1_ID]).not.toContain(USDC_CAIP19_MAINNET);
    // unrelated custom assets must be preserved
    expect(ac.customAssets[ACCOUNT_1_ID]).toContain(DAI_CAIP19_MAINNET);
  });

  it('removes a non-EVM asset from customAssets when a non-zero balance is migrated for it', async () => {
    const vd = cloneDeep(
      buildBaseStorage({
        MultichainAssetsController: {
          accountsAssets: { [ACCOUNT_1_ID]: [SOL_USDC_ASSET_ID] },
          assetsMetadata: {
            [SOL_USDC_ASSET_ID]: {
              fungible: true,
              name: 'USD Coin',
              symbol: 'USDC',
              units: [{ decimals: 6 }],
            },
          },
        },
        MultichainBalancesController: {
          balances: {
            [ACCOUNT_1_ID]: {
              [SOL_USDC_ASSET_ID]: { amount: '12.5', unit: 'USDC' },
            },
          },
        },
        AssetsController: {
          assetsInfo: {},
          assetsBalance: {},
          customAssets: { [ACCOUNT_1_ID]: [SOL_USDC_ASSET_ID] },
        },
      }),
    );

    const changed = new Set<string>();
    await migrate(vd, changed);

    const ac = getAC(vd);
    expect(ac.assetsBalance[ACCOUNT_1_ID]?.[SOL_USDC_ASSET_ID]).toMatchObject({
      amount: '12.5',
    });
    expect(ac.customAssets[ACCOUNT_1_ID] ?? []).not.toContain(
      SOL_USDC_ASSET_ID,
    );
  });

  // ─── version bump ────────────────────────────────────────────────────────────

  it('bumps the version regardless of whether data changed', async () => {
    const vd = cloneDeep(buildBaseStorage());
    await migrate(vd, new Set());
    expect(vd.meta.version).toBe(VERSION);
  });
});
