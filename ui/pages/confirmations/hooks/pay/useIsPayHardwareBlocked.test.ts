import { Hex } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';
import { waitFor } from '@testing-library/react';
import {
  getMockConfirmStateForTransaction,
  getMockConfirmState,
} from '../../../../../test/data/confirmations/helper';
import {
  genUnapprovedContractInteractionConfirmation,
  CONTRACT_INTERACTION_SENDER_ADDRESS,
} from '../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { useIsPayHardwareBlocked } from './useIsPayHardwareBlocked';

function runHook(transactionType: TransactionType, flagEnabled: boolean) {
  const transaction = {
    ...genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS as Hex,
    }),
    type: transactionType,
  };

  const state = getMockConfirmStateForTransaction(transaction, {
    metamask: {
      remoteFeatureFlags: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        confirmations_pay_hardware: { enabled: flagEnabled },
      },
    },
  });

  return renderHookWithConfirmContextProvider(
    () => useIsPayHardwareBlocked(),
    state,
  );
}

describe('useIsPayHardwareBlocked', () => {
  // predictDeposit and predictWithdraw are in
  // PAY_HARDWARE_BLOCKED_TRANSACTION_TYPES but are not yet in
  // REDESIGN_USER_TRANSACTION_TYPES (confirmation.utils.ts), so
  // currentConfirmation is undefined for those types and the hook cannot fire.
  describe('always-blocked types', () => {
    const alwaysBlockedTypes = [
      TransactionType.perpsDeposit,
      TransactionType.perpsWithdraw,
    ];

    for (const txType of alwaysBlockedTypes) {
      it(`returns true for ${txType} when the flag is enabled`, async () => {
        const { result } = runHook(txType, true);
        await waitFor(() => {
          expect(result.current).toBe(true);
        });
      });

      it(`returns true for ${txType} when the flag is disabled`, async () => {
        const { result } = runHook(txType, false);
        await waitFor(() => {
          expect(result.current).toBe(true);
        });
      });
    }
  });

  describe('flag-gated types', () => {
    it('returns true for musdConversion when the flag is disabled', async () => {
      const { result } = runHook(TransactionType.musdConversion, false);
      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('returns false for musdConversion when the flag is enabled', async () => {
      const { result } = runHook(TransactionType.musdConversion, true);
      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });
  });

  it('returns false for an unrelated transaction type', async () => {
    const { result } = runHook(TransactionType.contractInteraction, false);
    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('returns false when there is no current confirmation', () => {
    const { result } = renderHookWithConfirmContextProvider(
      () => useIsPayHardwareBlocked(),
      getMockConfirmState(),
    );

    expect(result.current).toBe(false);
  });
});
