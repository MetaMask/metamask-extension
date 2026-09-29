import { Hex } from '@metamask/utils';
import { KeyringTypes } from '@metamask/keyring-controller';
import { TransactionType } from '@metamask/transaction-controller';
import { waitFor } from '@testing-library/react';
import { getMockConfirmStateForTransaction } from '../../../../../../test/data/confirmations/helper';
import {
  genUnapprovedContractInteractionConfirmation,
  CONTRACT_INTERACTION_SENDER_ADDRESS,
} from '../../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { AlertsName } from '../constants';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../../helpers/constants/design-system';
import { usePayHardwareAccountAlert } from './usePayHardwareAccountAlert';

const SENDER_ACCOUNT_ID = 'hardware-account-id';
const PAYER_ACCOUNT_ID = 'payer-account-id';
const PAYER_ADDRESS = '0x1111111111111111111111111111111111111111' as Hex;

type PayHardwareFlag =
  | boolean
  | {
      enabled?: boolean;
      default?: { enabled?: boolean };
      overrides?: Record<string, { enabled?: boolean }>;
    };

function buildAccount(address: string, id: string, keyringType: string) {
  return {
    address,
    id,
    metadata: {
      importTime: 0,
      name: `Account ${id}`,
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
  };
}

function buildState({
  senderKeyringType,
  payerKeyringType,
  flag,
  transactionId,
}: {
  senderKeyringType: string;
  payerKeyringType?: string;
  flag: PayHardwareFlag;
  transactionId?: string;
}) {
  const accounts = {
    [SENDER_ACCOUNT_ID]: buildAccount(
      CONTRACT_INTERACTION_SENDER_ADDRESS,
      SENDER_ACCOUNT_ID,
      senderKeyringType,
    ),
  } as Record<string, ReturnType<typeof buildAccount>>;
  const accountIdByAddress = {
    [CONTRACT_INTERACTION_SENDER_ADDRESS]: SENDER_ACCOUNT_ID,
  } as Record<string, string>;

  if (payerKeyringType) {
    accounts[PAYER_ACCOUNT_ID] = buildAccount(
      PAYER_ADDRESS,
      PAYER_ACCOUNT_ID,
      payerKeyringType,
    );
    accountIdByAddress[PAYER_ADDRESS] = PAYER_ACCOUNT_ID;
  }

  return {
    metamask: {
      internalAccounts: { accounts, selectedAccount: SENDER_ACCOUNT_ID },
      accountIdByAddress,
      remoteFeatureFlags: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        confirmations_pay_hardware:
          typeof flag === 'boolean' ? { enabled: flag } : flag,
      },
      ...(payerKeyringType && transactionId
        ? {
            transactionData: {
              [transactionId]: { accountOverride: PAYER_ADDRESS },
            },
          }
        : {}),
    },
  };
}

function runHook({
  transactionType,
  senderKeyringType = KeyringTypes.ledger,
  payerKeyringType,
  flag = false,
}: {
  transactionType: TransactionType;
  senderKeyringType?: string;
  payerKeyringType?: string;
  flag?: PayHardwareFlag;
}) {
  const transaction = {
    ...genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS as Hex,
    }),
    type: transactionType,
  };

  const state = getMockConfirmStateForTransaction(
    transaction,
    buildState({
      senderKeyringType,
      payerKeyringType,
      flag,
      transactionId: transaction.id,
    }),
  );

  return renderHookWithConfirmContextProvider(
    () => usePayHardwareAccountAlert(),
    state,
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

const FLAG_OFF: PayHardwareFlag = { enabled: false };
const FLAG_ON: PayHardwareFlag = { enabled: true };
const DEPOSIT_ONLY: PayHardwareFlag = {
  default: { enabled: false },
  overrides: { moneyAccountDeposit: { enabled: true } },
};

describe('usePayHardwareAccountAlert', () => {
  // predictDeposit and predictWithdraw are in PAY_HARDWARE_ALERT_TRANSACTION_TYPES
  // but are not yet in REDESIGN_USER_TRANSACTION_TYPES (confirmation.utils.ts),
  // so currentConfirmation is undefined for those types and the hook cannot fire.
  // Tests below cover the types that go through the redesigned confirmation flow.
  describe('PAY_HARDWARE_ALERT_TRANSACTION_TYPES — always blocked regardless of flag', () => {
    const alwaysBlockedTypes = [
      TransactionType.moneyAccountWithdraw,
      TransactionType.perpsDeposit,
      TransactionType.perpsWithdraw,
    ];

    for (const txType of alwaysBlockedTypes) {
      it(`returns alert for ${txType} when flag is disabled`, async () => {
        const { result } = runHook({
          transactionType: txType,
          senderKeyringType: KeyringTypes.ledger,
          flag: FLAG_OFF,
        });
        await waitFor(() => {
          expect(result.current).toStrictEqual([EXPECTED_ALERT]);
        });
      });
    }
  });

  describe('musdConversion — blocked only when flag is disabled', () => {
    it('returns alert when flag is disabled', async () => {
      const { result } = runHook({
        transactionType: TransactionType.musdConversion,
        senderKeyringType: KeyringTypes.ledger,
        flag: FLAG_OFF,
      });
      await waitFor(() => {
        expect(result.current).toStrictEqual([EXPECTED_ALERT]);
      });
    });

    it('returns no alert when flag is enabled', async () => {
      const { result } = runHook({
        transactionType: TransactionType.musdConversion,
        senderKeyringType: KeyringTypes.ledger,
        flag: FLAG_ON,
      });
      await waitFor(() => {
        expect(result.current).toStrictEqual([]);
      });
    });
  });

  describe('moneyAccountDeposit — evaluates the paying account', () => {
    it('returns alert for a Ledger payer when the deposit override is disabled', async () => {
      const { result } = runHook({
        transactionType: TransactionType.moneyAccountDeposit,
        senderKeyringType: 'HD Key Tree',
        payerKeyringType: KeyringTypes.ledger,
        flag: FLAG_OFF,
      });
      await waitFor(() => {
        expect(result.current).toStrictEqual([EXPECTED_ALERT]);
      });
    });

    it('returns no alert for a Ledger payer when the deposit override is enabled', async () => {
      const { result } = runHook({
        transactionType: TransactionType.moneyAccountDeposit,
        senderKeyringType: 'HD Key Tree',
        payerKeyringType: KeyringTypes.ledger,
        flag: DEPOSIT_ONLY,
      });
      await waitFor(() => {
        expect(result.current).toStrictEqual([]);
      });
    });

    it('returns alert for a QR payer even when the deposit override is enabled', async () => {
      const { result } = runHook({
        transactionType: TransactionType.moneyAccountDeposit,
        senderKeyringType: 'HD Key Tree',
        payerKeyringType: KeyringTypes.qr,
        flag: DEPOSIT_ONLY,
      });
      await waitFor(() => {
        expect(result.current).toStrictEqual([EXPECTED_ALERT]);
      });
    });

    it('ignores a hardware signer when the payer is a software account', async () => {
      const { result } = runHook({
        transactionType: TransactionType.moneyAccountDeposit,
        senderKeyringType: KeyringTypes.ledger,
        payerKeyringType: 'HD Key Tree',
        flag: FLAG_OFF,
      });
      await waitFor(() => {
        expect(result.current).toStrictEqual([]);
      });
    });
  });
});
