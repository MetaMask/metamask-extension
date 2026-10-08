import { CHAIN_IDS } from '../constants/chain-ids';
import {
  hasMonadReserveBalanceRule,
  hasMonadReserveBalanceViolation,
  isMonadReserveBalanceError,
  MONAD_RESERVE_BALANCE_MON,
  MONAD_RESERVE_BALANCE_WEI_HEX,
  simulationIndicatesMonadReserveBalanceViolation,
  wouldViolateMonadReserveBalance,
} from './monad-reserve-balance';

describe('monad-reserve-balance', () => {
  describe('hasMonadReserveBalanceRule', () => {
    it('returns true for Monad mainnet and testnet', () => {
      expect(hasMonadReserveBalanceRule(CHAIN_IDS.MONAD)).toBe(true);
      expect(hasMonadReserveBalanceRule(CHAIN_IDS.MONAD_TESTNET)).toBe(true);
    });

    it('returns false for other chains', () => {
      expect(hasMonadReserveBalanceRule(CHAIN_IDS.MAINNET)).toBe(false);
      expect(hasMonadReserveBalanceRule(undefined)).toBe(false);
    });
  });

  describe('isMonadReserveBalanceError', () => {
    it('matches reserve balance violation strings case-insensitively', () => {
      expect(isMonadReserveBalanceError('reserve balance violation')).toBe(
        true,
      );
      expect(
        isMonadReserveBalanceError('Error: Reserve Balance Violation in call'),
      ).toBe(true);
    });

    it('returns false for unrelated errors', () => {
      expect(isMonadReserveBalanceError('insufficient funds for gas')).toBe(
        false,
      );
      expect(isMonadReserveBalanceError(undefined)).toBe(false);
    });
  });

  describe('simulationIndicatesMonadReserveBalanceViolation', () => {
    it('detects callTraceErrors', () => {
      expect(
        simulationIndicatesMonadReserveBalanceViolation({
          simulationData: {
            callTraceErrors: ['reserve balance violation'],
          },
        }),
      ).toBe(true);
    });

    it('detects simulationFails.reason', () => {
      expect(
        simulationIndicatesMonadReserveBalanceViolation({
          simulationFails: {
            reason: 'execution reverted: reserve balance violation',
          },
        }),
      ).toBe(true);
    });

    it('returns false when no matching errors', () => {
      expect(
        simulationIndicatesMonadReserveBalanceViolation({
          simulationData: { callTraceErrors: ['other error'] },
          simulationFails: { reason: 'out of gas' },
        }),
      ).toBe(false);
    });
  });

  describe('wouldViolateMonadReserveBalance', () => {
    // 15 MON
    const balance15Mon = `0x${(15n * 10n ** 18n).toString(16)}`;
    // 7 MON
    const balance7Mon = `0x${(7n * 10n ** 18n).toString(16)}`;
    // 6 MON
    const value6Mon = `0x${(6n * 10n ** 18n).toString(16)}`;
    // 4 MON
    const value4Mon = `0x${(4n * 10n ** 18n).toString(16)}`;

    it('returns true when remaining balance would be below 10 MON', () => {
      expect(
        wouldViolateMonadReserveBalance({
          chainId: CHAIN_IDS.MONAD,
          balance: balance15Mon,
          value: value6Mon,
          isDelegatedAccount: true,
        }),
      ).toBe(true);
    });

    it('returns false for undelegated accounts', () => {
      expect(
        wouldViolateMonadReserveBalance({
          chainId: CHAIN_IDS.MONAD,
          balance: balance15Mon,
          value: value6Mon,
          isDelegatedAccount: false,
        }),
      ).toBe(false);
    });

    it('returns false when delegation is not confirmed, even if remaining balance would be below 10 MON', () => {
      // `TransactionMeta.delegationAddress` is undefined for ordinary EOAs, so
      // the proactive check must not fail closed when it is omitted.
      expect(
        wouldViolateMonadReserveBalance({
          chainId: CHAIN_IDS.MONAD,
          balance: balance15Mon,
          value: value6Mon,
        }),
      ).toBe(false);
    });

    it('returns false for a gas-only call from an undelegated account already under 10 MON', () => {
      expect(
        wouldViolateMonadReserveBalance({
          chainId: CHAIN_IDS.MONAD,
          balance: balance7Mon,
          value: '0x0',
          isDelegatedAccount: false,
        }),
      ).toBe(false);
    });

    it('returns true for a delegated account already under 10 MON when value decreases the balance', () => {
      expect(
        wouldViolateMonadReserveBalance({
          chainId: CHAIN_IDS.MONAD,
          balance: balance7Mon,
          value: '0x1',
          isDelegatedAccount: true,
        }),
      ).toBe(true);
    });

    it('returns false for a gas-only call from a delegated account already under 10 MON', () => {
      // Monad accepts a delegated call whose balance is unchanged, including
      // when the account is already below the reserve.
      expect(
        wouldViolateMonadReserveBalance({
          chainId: CHAIN_IDS.MONAD,
          balance: balance7Mon,
          value: '0x0',
          isDelegatedAccount: true,
        }),
      ).toBe(false);
      expect(
        wouldViolateMonadReserveBalance({
          chainId: CHAIN_IDS.MONAD,
          balance: '0x0',
          value: '0x0',
          isDelegatedAccount: true,
        }),
      ).toBe(false);
    });

    it('returns false when remaining balance would stay at or above 10 MON', () => {
      expect(
        wouldViolateMonadReserveBalance({
          chainId: CHAIN_IDS.MONAD,
          balance: balance15Mon,
          value: value4Mon,
          isDelegatedAccount: true,
        }),
      ).toBe(false);
    });

    it('returns false on non-Monad chains', () => {
      expect(
        wouldViolateMonadReserveBalance({
          chainId: CHAIN_IDS.MAINNET,
          balance: balance15Mon,
          value: value6Mon,
          isDelegatedAccount: true,
        }),
      ).toBe(false);
    });
  });

  describe('hasMonadReserveBalanceViolation', () => {
    it('combines simulation and proactive checks', () => {
      expect(
        hasMonadReserveBalanceViolation({
          chainId: CHAIN_IDS.MONAD,
          simulationData: {
            callTraceErrors: ['reserve balance violation'],
          },
        }),
      ).toBe(true);

      expect(
        hasMonadReserveBalanceViolation({
          chainId: CHAIN_IDS.MONAD,
          balance: MONAD_RESERVE_BALANCE_WEI_HEX,
          value: '0x1',
          isDelegatedAccount: true,
        }),
      ).toBe(true);
    });

    it('does not flag the proactive check for undelegated accounts', () => {
      expect(
        hasMonadReserveBalanceViolation({
          chainId: CHAIN_IDS.MONAD,
          balance: MONAD_RESERVE_BALANCE_WEI_HEX,
          value: '0x1',
          isDelegatedAccount: false,
        }),
      ).toBe(false);
    });

    it('does not flag a zero-value transaction for a delegated account already under 10 MON', () => {
      expect(
        hasMonadReserveBalanceViolation({
          chainId: CHAIN_IDS.MONAD,
          balance: `0x${(7n * 10n ** 18n).toString(16)}`,
          value: '0x0',
          isDelegatedAccount: true,
        }),
      ).toBe(false);
    });

    it('still reports simulation violations for a zero-value delegated transaction', () => {
      expect(
        hasMonadReserveBalanceViolation({
          chainId: CHAIN_IDS.MONAD,
          balance: '0x0',
          value: '0x0',
          isDelegatedAccount: true,
          simulationFails: {
            reason: 'execution reverted: reserve balance violation',
          },
        }),
      ).toBe(true);
    });

    it('still reports simulation violations for undelegated accounts', () => {
      expect(
        hasMonadReserveBalanceViolation({
          chainId: CHAIN_IDS.MONAD,
          balance: MONAD_RESERVE_BALANCE_WEI_HEX,
          value: '0x0',
          isDelegatedAccount: false,
          simulationFails: {
            reason: 'execution reverted: reserve balance violation',
          },
        }),
      ).toBe(true);
    });
  });

  it('exports the documented 10 MON reserve constant', () => {
    expect(MONAD_RESERVE_BALANCE_MON).toBe('10');
  });
});
