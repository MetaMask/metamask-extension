/* eslint-disable @typescript-eslint/naming-convention -- API response fixtures use snake_case */
import type {
  VaultShareValuation,
  VaultShareValuationsResponse,
} from '@metamask/money-account-api-data-service';
import {
  cacheEntriesFromResponse,
  entriesByIdentity,
  getVaultShareValuationCacheIdentity,
  getVaultShareVaultKey,
  toCachedVaultShareValuation,
  type VaultShareValuationCacheEntry,
} from './vault-share-valuations';

const ACCOUNT = '0xbF4bC559f929cE3994Ba12D71d564737357bC8C2';
const VAULT = '0xb4563bcD3B7764CCBf497f515585f70B6C3EA5Ae';
const TX_HASH =
  '0x2b45bda071d8feff265c541e251a5e035e5f55270f8ad288dcd80f6740793847';

const valuation: VaultShareValuation = {
  vault_address: VAULT,
  vault_key: 'standard',
  asset_symbol: 'mUSD',
  asset_decimals: 6,
  type: 'transfer_out',
  log_index: 3,
  block_number: 123456,
  timestamp: '2026-06-04T11:53:51.000Z',
  shares_wei: '951755696',
  assets_wei: '968399999',
  rate: '1.017488',
  source: 'cash_flows',
};

const response = {
  address: ACCOUNT,
  chain_id: 143,
  results: [{ tx_hash: TX_HASH, found: true, valuations: [valuation] }],
  as_of_block: 123457,
  as_of_timestamp: '2026-06-04T11:54:00.000Z',
  data_freshness: 'live',
  indexer_lag_seconds: 0,
} satisfies VaultShareValuationsResponse;

describe('toCachedVaultShareValuation', () => {
  it('keeps a valid mUSD valuation', () => {
    expect(toCachedVaultShareValuation(valuation)).toStrictEqual({
      type: 'transfer_out',
      blockNumber: 123456,
      sharesWei: '951755696',
      assetsWei: '968399999',
      assetDecimals: 6,
    });
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    ['a non-mUSD asset', { asset_symbol: 'vmUSD' }],
    ['an unknown transfer type', { type: 'transfer' }],
    ['a missing block number', { block_number: null }],
    ['a fractional block number', { block_number: 1.5 }],
    ['negative decimals', { asset_decimals: -1 }],
    ['fractional shares', { shares_wei: '1.5' }],
    ['missing shares', { shares_wei: null }],
    ['non-numeric assets', { assets_wei: 'abc' }],
  ])('rejects %s', (_case: string, overrides: Partial<VaultShareValuation>) => {
    expect(
      toCachedVaultShareValuation({ ...valuation, ...overrides }),
    ).toBeUndefined();
  });
});

describe('cacheEntriesFromResponse', () => {
  it('builds one entry per account, chain, vault, and transaction', () => {
    expect(
      cacheEntriesFromResponse({
        response,
        account: ACCOUNT,
        chainId: '0x8f',
        vaultAddresses: [VAULT],
      }),
    ).toStrictEqual([
      {
        account: ACCOUNT.toLowerCase(),
        chainId: 143,
        vaultAddress: VAULT.toLowerCase(),
        txHash: TX_HASH.toLowerCase(),
        valuations: [
          {
            type: 'transfer_out',
            blockNumber: 123456,
            sharesWei: '951755696',
            assetsWei: '968399999',
            assetDecimals: 6,
          },
        ],
      },
    ]);
  });

  it('ignores a response for another chain', () => {
    expect(
      cacheEntriesFromResponse({
        response: { ...response, chain_id: 1 },
        account: ACCOUNT,
        chainId: '0x8f',
        vaultAddresses: [VAULT],
      }),
    ).toStrictEqual([]);
  });

  it('ignores unknown vaults, missing results, and malformed hashes', () => {
    expect(
      cacheEntriesFromResponse({
        response: {
          ...response,
          results: [
            { ...response.results[0], found: false },
            { ...response.results[0], tx_hash: '0x1234' },
            {
              ...response.results[0],
              valuations: [{ ...valuation, vault_address: ACCOUNT }],
            },
          ],
        },
        account: ACCOUNT,
        chainId: '0x8f',
        vaultAddresses: [VAULT],
      }),
    ).toStrictEqual([]);
  });
});

describe('cache identities', () => {
  const entry: VaultShareValuationCacheEntry = {
    account: ACCOUNT,
    chainId: 143,
    vaultAddress: VAULT,
    txHash: TX_HASH,
    valuations: [],
  };

  it('lowercases every address in the identity', () => {
    expect(getVaultShareValuationCacheIdentity(entry)).toBe(
      `${ACCOUNT.toLowerCase()}:143:${VAULT.toLowerCase()}:${TX_HASH.toLowerCase()}`,
    );
  });

  it('indexes entries by identity', () => {
    expect(
      entriesByIdentity([entry]).get(
        getVaultShareValuationCacheIdentity(entry),
      ),
    ).toBe(entry);
  });

  it('builds a vault key from the chain and vault address', () => {
    expect(getVaultShareVaultKey('0x8F', VAULT)).toBe(
      `0x8f:${VAULT.toLowerCase()}`,
    );
  });
});
