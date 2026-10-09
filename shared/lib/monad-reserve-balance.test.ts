import { CHAIN_IDS } from '../constants/chain-ids';
import {
  hasMonadReserveBalanceViolation,
  MONAD_RESERVE_BALANCE_MON,
} from './monad-reserve-balance';

const balance15Mon = `0x${(15n * 10n ** 18n).toString(16)}`;
const balance7Mon = `0x${(7n * 10n ** 18n).toString(16)}`;
const value6Mon = `0x${(6n * 10n ** 18n).toString(16)}`;
const value4Mon = `0x${(4n * 10n ** 18n).toString(16)}`;

describe('hasMonadReserveBalanceViolation', () => {
  it('detects simulation reserve errors', () => {
    for (const simulation of [
      {
        simulationData: {
          callTraceErrors: ['Error: Reserve Balance Violation in call'],
        },
      },
      {
        simulationFails: {
          reason: 'execution reverted: reserve balance violation',
        },
      },
      {
        simulationFails: {
          errorMessage: 'execution reverted: reserve balance violation',
        },
      },
    ]) {
      expect(
        hasMonadReserveBalanceViolation({
          chainId: CHAIN_IDS.MONAD,
          ...simulation,
        }),
      ).toBe(true);
    }
  });

  it('detects when a delegated account would spend below 10 MON', () => {
    expect(
      hasMonadReserveBalanceViolation({
        chainId: CHAIN_IDS.MONAD,
        balance: balance15Mon,
        value: value6Mon,
        isDelegatedAccount: true,
      }),
    ).toBe(true);
  });

  it('allows transactions without a reserve violation', () => {
    for (const options of [
      {
        chainId: CHAIN_IDS.MAINNET,
        balance: balance15Mon,
        value: value6Mon,
        isDelegatedAccount: true,
      },
      {
        chainId: CHAIN_IDS.MONAD,
        balance: balance15Mon,
        value: value6Mon,
        isDelegatedAccount: false,
      },
      {
        chainId: CHAIN_IDS.MONAD,
        balance: balance15Mon,
        value: value4Mon,
        isDelegatedAccount: true,
      },
      {
        chainId: CHAIN_IDS.MONAD,
        balance: balance7Mon,
        value: '0x0',
        isDelegatedAccount: false,
      },
      {
        chainId: CHAIN_IDS.MONAD,
        balance: balance7Mon,
        value: '0x0',
        isDelegatedAccount: true,
      },
    ]) {
      expect(hasMonadReserveBalanceViolation(options)).toBe(false);
    }
  });

  it('exports the 10 MON reserve amount', () => {
    expect(MONAD_RESERVE_BALANCE_MON).toBe('10');
  });
});
