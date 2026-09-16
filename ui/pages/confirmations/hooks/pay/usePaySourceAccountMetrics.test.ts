import { Hex } from '@metamask/utils';
import { KeyringTypes } from '@metamask/keyring-controller';
import { TransactionType } from '@metamask/transaction-controller';
import { PaymentOverride } from '@metamask/transaction-pay-controller';
import { waitFor } from '@testing-library/react';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import {
  genUnapprovedContractInteractionConfirmation,
  CONTRACT_INTERACTION_SENDER_ADDRESS,
} from '../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import {
  getPaySourceAccountType,
  usePaySourceAccountMetrics,
} from './usePaySourceAccountMetrics';

const SENDER_ACCOUNT_ID = 'sender-account-id';
const PAYER_ACCOUNT_ID = 'payer-account-id';
const PAYER_ADDRESS = '0x1111111111111111111111111111111111111111' as Hex;

function buildAccount(id: string, address: string, keyringType: string) {
  return {
    address,
    id,
    metadata: {
      importTime: 0,
      name: id,
      keyring: { type: keyringType },
      lastSelected: 0,
    },
    options: {},
    methods: ['eth_signTransaction'],
    scopes: ['eip155:0'],
    type: 'eip155:eoa',
  };
}

function runHook({
  hasPayToken = true,
  senderKeyringType = KeyringTypes.hd,
  payerKeyringType,
  paymentOverride,
  transactionType = TransactionType.perpsDeposit,
}: {
  hasPayToken?: boolean;
  senderKeyringType?: string;
  payerKeyringType?: string;
  paymentOverride?: PaymentOverride;
  transactionType?: TransactionType;
} = {}) {
  const transaction = {
    ...genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS as Hex,
    }),
    type: transactionType,
  };

  const accounts: Record<string, ReturnType<typeof buildAccount>> = {
    [SENDER_ACCOUNT_ID]: buildAccount(
      SENDER_ACCOUNT_ID,
      CONTRACT_INTERACTION_SENDER_ADDRESS,
      senderKeyringType,
    ),
  };
  const accountIdByAddress: Record<string, string> = {
    [CONTRACT_INTERACTION_SENDER_ADDRESS]: SENDER_ACCOUNT_ID,
  };
  if (payerKeyringType) {
    accounts[PAYER_ACCOUNT_ID] = buildAccount(
      PAYER_ACCOUNT_ID,
      PAYER_ADDRESS,
      payerKeyringType,
    );
    accountIdByAddress[PAYER_ADDRESS] = PAYER_ACCOUNT_ID;
  }

  const transactionData: Record<string, unknown> = {};
  if (payerKeyringType) {
    transactionData.accountOverride = PAYER_ADDRESS;
  }
  if (paymentOverride) {
    transactionData.paymentOverride = paymentOverride;
  }

  const state = getMockConfirmStateForTransaction(transaction, {
    appState: {},
    metamask: {
      internalAccounts: { accounts, selectedAccount: SENDER_ACCOUNT_ID },
      accountIdByAddress,
      transactionData: { [transaction.id]: transactionData },
    },
  });

  return renderHookWithConfirmContextProvider(
    () => usePaySourceAccountMetrics(hasPayToken),
    state,
  );
}

describe('getPaySourceAccountType', () => {
  // @ts-expect-error This is missing from the Mocha type definitions
  it.each([
    [KeyringTypes.hd, 'metamask'],
    [KeyringTypes.simple, 'imported'],
    [KeyringTypes.snap, 'snap'],
    [KeyringTypes.ledger, 'Ledger'],
    [KeyringTypes.trezor, 'Trezor'],
    [KeyringTypes.lattice, 'Lattice'],
    [KeyringTypes.qr, 'QR Hardware'],
    [KeyringTypes.oneKey, 'QR Hardware'],
    [KeyringTypes.money, 'money-account'],
  ])('maps %s to %s', (keyringType: string, expected: string) => {
    expect(getPaySourceAccountType(keyringType)).toBe(expected);
  });

  it('falls back to crypto for unknown or missing keyring types', () => {
    expect(getPaySourceAccountType('Unknown Keyring')).toBe('crypto');
    expect(getPaySourceAccountType(undefined)).toBe('crypto');
  });
});

describe('usePaySourceAccountMetrics', () => {
  it('reports the sender keyring category when there is no payer override', async () => {
    const { result } = runHook({ senderKeyringType: KeyringTypes.ledger });

    await waitFor(() => {
      expect(result.current).toStrictEqual({
        presented: 'Ledger',
        selected: 'Ledger',
      });
    });
  });

  it('reports the paying account category for a hardware payer', async () => {
    const { result } = runHook({
      transactionType: TransactionType.moneyAccountDeposit,
      payerKeyringType: KeyringTypes.ledger,
    });

    await waitFor(() => {
      expect(result.current).toStrictEqual({
        presented: 'Ledger',
        selected: 'Ledger',
      });
    });
  });

  it('reports a Snap payer as snap', async () => {
    const { result } = runHook({ payerKeyringType: KeyringTypes.snap });

    await waitFor(() => {
      expect(result.current.selected).toBe('snap');
    });
  });

  it('reports the payment override section over the account type', async () => {
    const { result } = runHook({
      payerKeyringType: KeyringTypes.ledger,
      paymentOverride: PaymentOverride.MoneyAccount,
    });

    await waitFor(() => {
      expect(result.current).toStrictEqual({
        presented: 'money-account',
        selected: 'money-account',
      });
    });
  });

  it('does not present a Money Account deposit source until the payer override is known', async () => {
    const { result } = runHook({
      transactionType: TransactionType.moneyAccountDeposit,
      senderKeyringType: KeyringTypes.money,
    });

    await waitFor(() => {
      expect(result.current.presented).toBeUndefined();
    });
    await waitFor(() => {
      expect(result.current.selected).toBe('money-account');
    });
  });

  it('does not present until a pay token exists', async () => {
    const { result } = runHook({
      hasPayToken: false,
      payerKeyringType: KeyringTypes.ledger,
    });

    await waitFor(() => {
      expect(result.current.presented).toBeUndefined();
    });
    await waitFor(() => {
      expect(result.current.selected).toBe('Ledger');
    });
  });

  it('falls back to crypto when the paying account is unknown', async () => {
    const transaction = genUnapprovedContractInteractionConfirmation();
    const state = getMockConfirmStateForTransaction(transaction, {
      appState: {},
      metamask: {
        internalAccounts: { accounts: {}, selectedAccount: '' },
        accountIdByAddress: {},
      },
    });

    const { result } = renderHookWithConfirmContextProvider(
      () => usePaySourceAccountMetrics(true),
      state,
    );

    await waitFor(() => {
      expect(result.current).toStrictEqual({
        presented: 'crypto',
        selected: 'crypto',
      });
    });
  });
});
