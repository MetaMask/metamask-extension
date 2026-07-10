import { XlmScope } from '@metamask/keyring-api';
import {
  computeBaseReserve,
  computeSpendableBalance,
  isSupportBaseReserve,
  NATIVE_RESERVE_SLIP44_IDS,
} from './spendable-balance';

const STELLAR_NATIVE_ASSET_ID = `${XlmScope.Pubnet}/slip44:148`;
const ETHER_NATIVE_ASSET_ID = 'eip155:1/slip44:60';

describe('isSupportBaseReserve', () => {
  it('returns true for supported native reserve assets', () => {
    expect(isSupportBaseReserve(STELLAR_NATIVE_ASSET_ID)).toBe(true);
    expect(NATIVE_RESERVE_SLIP44_IDS.has(STELLAR_NATIVE_ASSET_ID)).toBe(true);
  });

  it('returns false for unsupported assets', () => {
    expect(isSupportBaseReserve(ETHER_NATIVE_ASSET_ID)).toBe(false);
    expect(isSupportBaseReserve('')).toBe(false);
    expect(isSupportBaseReserve('not-a-caip-asset-id')).toBe(false);
  });
});

describe('computeBaseReserve', () => {
  it('returns undefined for assets that do not support base reserve', () => {
    expect(
      computeBaseReserve({
        assetId: ETHER_NATIVE_ASSET_ID,
        assetMetadata: undefined,
      }),
    ).toBeUndefined();
  });

  it('extracts base reserve for supported native assets', () => {
    expect(
      computeBaseReserve({
        assetId: STELLAR_NATIVE_ASSET_ID,
        assetMetadata: { baseReserve: '0.5' },
      }),
    ).toStrictEqual('0.5');
  });

  it('defaults to "0" when account metadata is missing', () => {
    expect(
      computeBaseReserve({
        assetId: STELLAR_NATIVE_ASSET_ID,
        assetMetadata: undefined,
      }),
    ).toStrictEqual('0');
  });

  it('defaults to "0" when baseReserve is invalid', () => {
    expect(
      computeBaseReserve({
        assetId: STELLAR_NATIVE_ASSET_ID,
        assetMetadata: { baseReserve: 'not-a-number' },
      }),
    ).toStrictEqual('0');
  });
});

describe('computeSpendableBalance', () => {
  it('subtracts base reserve from total balance', () => {
    expect(computeSpendableBalance('250', '2.5')).toStrictEqual('247.5');
  });

  it('returns a negative spendable balance when reserve exceeds total', () => {
    expect(computeSpendableBalance('1', '2.5')).toStrictEqual('0');
  });

  it('throws when total balance is invalid', () => {
    expect(computeSpendableBalance('not-a-number', '2.5')).toStrictEqual('0');
  });

  it('throws when base reserve is invalid', () => {
    expect(computeSpendableBalance('250', 'not-a-number')).toStrictEqual('0');
  });
});
