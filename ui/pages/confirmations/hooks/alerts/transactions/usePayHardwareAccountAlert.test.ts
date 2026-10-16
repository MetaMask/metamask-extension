import { Hex } from '@metamask/utils';
import { KeyringTypes } from '@metamask/keyring-controller';
import { TransactionType } from '@metamask/transaction-controller';
import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';
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

type QuoteMock = { strategy: TransactionPayStrategy; request: { from: Hex } };

function buildState({
  senderKeyringType,
  payerKeyringType,
  flag,
  transactionId,
  quotes,
}: {
  senderKeyringType?: string;
  payerKeyringType?: string;
  flag: PayHardwareFlag;
  transactionId?: string;
  quotes?: QuoteMock[];
}) {
  const accounts = {} as Record<string, ReturnType<typeof buildAccount>>;
  const accountIdByAddress = {} as Record<string, string>;

  // The Money Account is not an internal account, so withdraw tests omit it.
  if (senderKeyringType) {
    accounts[SENDER_ACCOUNT_ID] = buildAccount(
      CONTRACT_INTERACTION_SENDER_ADDRESS,
      SENDER_ACCOUNT_ID,
      senderKeyringType,
    );
    accountIdByAddress[CONTRACT_INTERACTION_SENDER_ADDRESS] = SENDER_ACCOUNT_ID;
  }

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
      internalAccounts: {
        accounts,
        selectedAccount: senderKeyringType
          ? SENDER_ACCOUNT_ID
          : PAYER_ACCOUNT_ID,
      },
      accountIdByAddress,
      remoteFeatureFlags: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        confirmations_pay_hardware:
          typeof flag === 'boolean' ? { enabled: flag } : flag,
      },
      ...(payerKeyringType && transactionId
        ? {
            transactionData: {
              [transactionId]: { accountOverride: PAYER_ADDRESS, quotes },
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
  quotes,
}: {
  transactionType: TransactionType;
  senderKeyringType?: string | null;
  payerKeyringType?: string;
  flag?: PayHardwareFlag;
  quotes?: QuoteMock[];
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
      senderKeyringType: senderKeyringType ?? undefined,
      payerKeyringType,
      flag,
      transactionId: transaction.id,
      quotes,
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

const EXPECTED_WITHDRAW_RECIPIENT_ALERT = {
  ...EXPECTED_ALERT,
  message:
    "Hardware wallets can't receive this token.\nChoose a different token or account.",
};

const FLAG_OFF: PayHardwareFlag = { enabled: false };
const DEPOSIT_ONLY: PayHardwareFlag = {
  default: { enabled: false },
  overrides: { moneyAccountDeposit: { enabled: true } },
};

describe('usePayHardwareAccountAlert', () => {
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

  describe('moneyAccountWithdraw — only the Money Account signs', () => {
    const HARDWARE_KEYRING_TYPES = [
      KeyringTypes.ledger,
      KeyringTypes.trezor,
      KeyringTypes.lattice,
      KeyringTypes.qr,
      KeyringTypes.oneKey,
    ];
    const SOFTWARE_KEYRING_TYPES = [
      KeyringTypes.hd,
      KeyringTypes.simple,
      KeyringTypes.snap,
    ];
    const RECIPIENT_QUOTE: QuoteMock = {
      strategy: TransactionPayStrategy.Relay,
      request: { from: PAYER_ADDRESS },
    };

    for (const keyringType of HARDWARE_KEYRING_TYPES) {
      it(`returns no alert for a direct withdraw to a ${keyringType} recipient`, async () => {
        const { result } = runHook({
          transactionType: TransactionType.moneyAccountWithdraw,
          senderKeyringType: null,
          payerKeyringType: keyringType,
          flag: FLAG_OFF,
        });
        await waitFor(() => {
          expect(result.current).toStrictEqual([]);
        });
      });

      it(`returns an alert when a quote would make a ${keyringType} recipient sign`, async () => {
        const { result } = runHook({
          transactionType: TransactionType.moneyAccountWithdraw,
          senderKeyringType: null,
          payerKeyringType: keyringType,
          flag: FLAG_OFF,
          quotes: [RECIPIENT_QUOTE],
        });
        await waitFor(() => {
          expect(result.current).toStrictEqual([
            EXPECTED_WITHDRAW_RECIPIENT_ALERT,
          ]);
        });
      });
    }

    for (const keyringType of SOFTWARE_KEYRING_TYPES) {
      it(`returns no alert for a quoted withdraw to a ${keyringType} recipient`, async () => {
        const { result } = runHook({
          transactionType: TransactionType.moneyAccountWithdraw,
          senderKeyringType: null,
          payerKeyringType: keyringType,
          flag: FLAG_OFF,
          quotes: [RECIPIENT_QUOTE],
        });
        await waitFor(() => {
          expect(result.current).toStrictEqual([]);
        });
      });
    }

    it('returns no alert for a no-op quote to a hardware recipient', async () => {
      const { result } = runHook({
        transactionType: TransactionType.moneyAccountWithdraw,
        senderKeyringType: null,
        payerKeyringType: KeyringTypes.ledger,
        flag: FLAG_OFF,
        quotes: [{ ...RECIPIENT_QUOTE, strategy: TransactionPayStrategy.None }],
      });
      await waitFor(() => {
        expect(result.current).toStrictEqual([]);
      });
    });

    it('returns no alert when the quote is signed by the Money Account', async () => {
      const { result } = runHook({
        transactionType: TransactionType.moneyAccountWithdraw,
        senderKeyringType: null,
        payerKeyringType: KeyringTypes.ledger,
        flag: FLAG_OFF,
        quotes: [
          {
            ...RECIPIENT_QUOTE,
            request: { from: CONTRACT_INTERACTION_SENDER_ADDRESS as Hex },
          },
        ],
      });
      await waitFor(() => {
        expect(result.current).toStrictEqual([]);
      });
    });
  });
});
