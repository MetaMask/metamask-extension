import type { Hex } from '@metamask/utils';
import type { AccountsApiActivity } from '../types/money-activity';
import {
  getApproximateVaultShareDisplayAmount,
  getHistoricalVaultShareDisplayAmount,
  getVaultShareValuationTarget,
} from './vault-share-valuations';

const MONEY_ADDRESS = '0xbF4bC559f929cE3994Ba12D71d564737357bC8C2';
const VAULT = '0xb4563bcD3B7764CCBf497f515585f70B6C3EA5Ae';
const MUSD = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';
const TX_HASH =
  '0x2b45bda071d8feff265c541e251a5e035e5f55270f8ad288dcd80f6740793847' as Hex;

const vaultShareToken = { chainId: '0x8f', address: VAULT } as const;

const cardActivity = {
  kind: 'card',
  hash: TX_HASH,
  time: 1,
  chainId: '0x8f',
  blockNumber: 123456,
  token: { address: VAULT, symbol: 'vmUSD', decimals: 6 },
  amount: '1000000',
  paidTo: MONEY_ADDRESS,
} satisfies AccountsApiActivity;

const cashbackActivity = {
  kind: 'cashback',
  hash: TX_HASH,
  time: 1,
  chainId: '0x8f',
  blockNumber: 123456,
  token: { address: VAULT, symbol: 'vmUSD', decimals: 6 },
  amount: '1000000',
  receivedFrom: MONEY_ADDRESS,
} satisfies AccountsApiActivity;

describe('getVaultShareValuationTarget', () => {
  it('builds a cache key for a configured vault-share card row', () => {
    expect(
      getVaultShareValuationTarget({
        activity: cardActivity,
        moneyAddress: MONEY_ADDRESS,
        vaultShareTokens: [vaultShareToken],
      }),
    ).toStrictEqual(
      expect.objectContaining({
        vaultKey: `0x8f:${VAULT.toLowerCase()}`,
        key: {
          account: MONEY_ADDRESS.toLowerCase(),
          chainId: 143,
          vaultAddress: VAULT.toLowerCase(),
          txHash: TX_HASH.toLowerCase(),
        },
      }),
    );
  });

  it('ignores mUSD rows', () => {
    expect(
      getVaultShareValuationTarget({
        activity: {
          ...cardActivity,
          token: { ...cardActivity.token, address: MUSD },
        },
        moneyAddress: MONEY_ADDRESS,
        vaultShareTokens: [vaultShareToken],
      }),
    ).toBeUndefined();
  });

  it('ignores refunds', () => {
    expect(
      getVaultShareValuationTarget({
        activity: {
          kind: 'refund',
          hash: TX_HASH,
          time: 1,
          chainId: '0x8f',
          token: cardActivity.token,
          amount: '1000000',
          receivedFrom: MONEY_ADDRESS,
        },
        moneyAddress: MONEY_ADDRESS,
        vaultShareTokens: [vaultShareToken],
      }),
    ).toBeUndefined();
  });

  it('returns a target without a key when the row has no block number', () => {
    const activity = { ...cardActivity, blockNumber: undefined };

    expect(
      getVaultShareValuationTarget({
        activity,
        moneyAddress: MONEY_ADDRESS,
        vaultShareTokens: [vaultShareToken],
      }),
    ).toStrictEqual({
      activity,
      vaultKey: `0x8f:${VAULT.toLowerCase()}`,
    });
  });
});

describe('getHistoricalVaultShareDisplayAmount', () => {
  const cached = {
    type: 'transfer_out' as const,
    blockNumber: 123456,
    sharesWei: '1000000',
    assetsWei: '1017488',
    assetDecimals: 6,
  };

  it('returns the matching card valuation', () => {
    expect(
      getHistoricalVaultShareDisplayAmount(cardActivity, [cached]),
    ).toStrictEqual({ type: 'historical', value: '1017488', decimals: 6 });
  });

  it('returns the matching cashback valuation', () => {
    expect(
      getHistoricalVaultShareDisplayAmount(cashbackActivity, [
        { ...cached, type: 'transfer_in' },
      ]),
    ).toStrictEqual({ type: 'historical', value: '1017488', decimals: 6 });
  });

  it('requires the expected transfer direction', () => {
    expect(
      getHistoricalVaultShareDisplayAmount(cardActivity, []),
    ).toBeUndefined();
    expect(
      getHistoricalVaultShareDisplayAmount(cashbackActivity, [cached]),
    ).toBeUndefined();
  });

  it('rejects a different block or share amount', () => {
    expect(
      getHistoricalVaultShareDisplayAmount(cardActivity, [
        { ...cached, blockNumber: 1 },
      ]),
    ).toBeUndefined();
    expect(
      getHistoricalVaultShareDisplayAmount(cardActivity, [
        { ...cached, sharesWei: '2000000' },
      ]),
    ).toBeUndefined();
  });

  it('rejects more than one match', () => {
    expect(
      getHistoricalVaultShareDisplayAmount(cardActivity, [cached, cached]),
    ).toBeUndefined();
  });
});

describe('getApproximateVaultShareDisplayAmount', () => {
  it('converts shares at the current rate', () => {
    expect(
      getApproximateVaultShareDisplayAmount(
        { ...cardActivity, amount: '1000000' },
        '1.5',
      ),
    ).toStrictEqual({ type: 'approximate', value: '1500000', decimals: 6 });
  });

  it('floors the converted value', () => {
    expect(
      getApproximateVaultShareDisplayAmount(
        { ...cardActivity, amount: '1' },
        '1.5',
      ),
    ).toStrictEqual({ type: 'approximate', value: '1', decimals: 6 });
  });

  it('is unavailable without a rate', () => {
    expect(
      getApproximateVaultShareDisplayAmount(cardActivity, undefined),
    ).toStrictEqual({ type: 'unavailable' });
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each(['abc', '-1'])('is unavailable for a rate of %s', (rate: string) => {
    expect(
      getApproximateVaultShareDisplayAmount(cardActivity, rate),
    ).toStrictEqual({ type: 'unavailable' });
  });
});
