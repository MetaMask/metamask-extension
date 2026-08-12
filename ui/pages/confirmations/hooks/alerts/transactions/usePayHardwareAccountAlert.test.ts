import { Hex } from '@metamask/utils';
import { KeyringTypes } from '@metamask/keyring-controller';
import { TransactionType } from '@metamask/transaction-controller';
import { waitFor } from '@testing-library/react';
import {
  getMockConfirmStateForTransaction,
  getMockConfirmState,
} from '../../../../../../test/data/confirmations/helper';
import {
  genUnapprovedContractInteractionConfirmation,
  CONTRACT_INTERACTION_SENDER_ADDRESS,
} from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { AlertsName } from '../constants';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { usePayHardwareAccountAlert } from './usePayHardwareAccountAlert';

const HARDWARE_ACCOUNT_ID = 'hardware-account-id';

function buildAccountState(keyringType: string) {
  return {
    internalAccounts: {
      accounts: {
        [HARDWARE_ACCOUNT_ID]: {
          address: CONTRACT_INTERACTION_SENDER_ADDRESS,
          id: HARDWARE_ACCOUNT_ID,
          metadata: {
            importTime: 0,
            name: 'Hardware Account',
            keyring: { type: keyringType },
            lastSelected: 0,
          },
          options: {},
          methods: [
            'personal_sign',
            'eth_signTransaction',
            'eth_signTypedData_v1',
            'eth_signTypedData_v3',
            'eth_signTypedData_v4',
          ],
          scopes: ['eip155:0'],
          type: 'eip155:eoa',
        },
      },
      selectedAccount: HARDWARE_ACCOUNT_ID,
    },
    accountIdByAddress: {
      [CONTRACT_INTERACTION_SENDER_ADDRESS]: HARDWARE_ACCOUNT_ID,
    },
  };
}

function buildState(keyringType: string, flagEnabled: boolean) {
  return {
    metamask: {
      ...buildAccountState(keyringType),
      remoteFeatureFlags: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        confirmations_pay_hardware: { enabled: flagEnabled },
      },
    },
  };
}

function runHook(
  transactionType: TransactionType,
  keyringType: string,
  flagEnabled: boolean,
) {
  const transaction = {
    ...genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS as Hex,
    }),
    type: transactionType,
  };

  const state = getMockConfirmStateForTransaction(
    transaction,
    buildState(keyringType, flagEnabled),
  );

  return renderHookWithConfirmContextProvider(
    () => usePayHardwareAccountAlert(),
    state,
  );
}

function runHookWithoutTransaction() {
  return renderHookWithConfirmContextProvider(
    () => usePayHardwareAccountAlert(),
    getMockConfirmState(),
  );
}

const EXPECTED_ALERT = {
  key: AlertsName.PayHardwareAccount,
  field: RowAlertKey.PayWith,
  reason: 'Wallet not supported',
  message: "Hardware wallets aren't supported.\nSwitch wallets to continue.",
  severity: Severity.Danger,
  isBlocking: true,
};

describe('usePayHardwareAccountAlert', () => {
  // predictDeposit and predictWithdraw are in PAY_HARDWARE_ALERT_TRANSACTION_TYPES
  // but are not yet in REDESIGN_USER_TRANSACTION_TYPES (confirmation.utils.ts),
  // so currentConfirmation is undefined for those types and the hook cannot fire.
  // Tests below cover the types that go through the redesigned confirmation flow.
  describe('PAY_HARDWARE_ALERT_TRANSACTION_TYPES — always blocked regardless of flag', () => {
    const alwaysBlockedTypes = [
      TransactionType.perpsDeposit,
      TransactionType.perpsWithdraw,
    ];

    for (const txType of alwaysBlockedTypes) {
      it(`returns alert for ${txType} when flag is enabled`, async () => {
        const { result } = runHook(txType, KeyringTypes.ledger, true);
        await waitFor(() => {
          expect(result.current).toStrictEqual([EXPECTED_ALERT]);
        });
      });

      it(`returns alert for ${txType} when flag is disabled`, async () => {
        const { result } = runHook(txType, KeyringTypes.ledger, false);
        await waitFor(() => {
          expect(result.current).toStrictEqual([EXPECTED_ALERT]);
        });
      });

      it(`returns no alert for ${txType} when non-hardware wallet`, async () => {
        const { result } = runHook(txType, 'HD Key Tree', true);
        await waitFor(() => {
          expect(result.current).toStrictEqual([]);
        });
      });
    }
  });

  describe('PAY_HARDWARE_FLAG_GATED_TYPES — blocked only when flag is disabled', () => {
    it('returns alert for musdConversion when flag is disabled', async () => {
      const { result } = runHook(
        TransactionType.musdConversion,
        KeyringTypes.ledger,
        false,
      );
      await waitFor(() => {
        expect(result.current).toStrictEqual([EXPECTED_ALERT]);
      });
    });

    it('returns no alert for musdConversion when flag is enabled', async () => {
      const { result } = runHook(
        TransactionType.musdConversion,
        KeyringTypes.ledger,
        true,
      );
      await waitFor(() => {
        expect(result.current).toStrictEqual([]);
      });
    });

    it('returns no alert for musdConversion with non-hardware wallet regardless of flag', async () => {
      const { result } = runHook(
        TransactionType.musdConversion,
        'HD Key Tree',
        false,
      );
      await waitFor(() => {
        expect(result.current).toStrictEqual([]);
      });
    });
  });

  describe('hardware wallet keyring types', () => {
    it('returns alert for Ledger', async () => {
      const { result } = runHook(
        TransactionType.perpsDeposit,
        KeyringTypes.ledger,
        false,
      );
      await waitFor(() => {
        expect(result.current).toStrictEqual([EXPECTED_ALERT]);
      });
    });

    it('returns alert for Trezor', async () => {
      const { result } = runHook(
        TransactionType.perpsDeposit,
        KeyringTypes.trezor,
        false,
      );
      await waitFor(() => {
        expect(result.current).toStrictEqual([EXPECTED_ALERT]);
      });
    });

    it('returns alert for Lattice', async () => {
      const { result } = runHook(
        TransactionType.perpsDeposit,
        KeyringTypes.lattice,
        false,
      );
      await waitFor(() => {
        expect(result.current).toStrictEqual([EXPECTED_ALERT]);
      });
    });
  });

  describe('non-applicable transaction types', () => {
    it('returns no alert for contractInteraction with hardware wallet', async () => {
      const { result } = runHook(
        TransactionType.contractInteraction,
        KeyringTypes.ledger,
        false,
      );
      await waitFor(() => {
        expect(result.current).toStrictEqual([]);
      });
    });
  });

  it('returns no alert if there is no current confirmation', () => {
    const { result } = runHookWithoutTransaction();
    expect(result.current).toStrictEqual([]);
  });
});
