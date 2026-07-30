import { XlmScope } from '@metamask/keyring-api';
import {
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
