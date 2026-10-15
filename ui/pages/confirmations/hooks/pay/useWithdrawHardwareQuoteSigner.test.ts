import { Hex } from '@metamask/utils';
import { KeyringTypes } from '@metamask/keyring-controller';
import { TransactionType } from '@metamask/transaction-controller';
import { TransactionPayStrategy } from '@metamask/transaction-pay-controller';
import { waitFor } from '@testing-library/react';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import {
  genUnapprovedContractInteractionConfirmation,
  CONTRACT_INTERACTION_SENDER_ADDRESS,
} from '../../../../../test/data/confirmations/contract-interaction';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { useWithdrawHardwareQuoteSigner } from './useWithdrawHardwareQuoteSigner';

const RECIPIENT_ADDRESS = '0x2222222222222222222222222222222222222222' as Hex;
const RECIPIENT_ACCOUNT_ID = 'recipient-account-id';

function runHook({
  transactionType,
  recipientKeyringType = KeyringTypes.ledger,
  quoteFrom = RECIPIENT_ADDRESS,
  strategy = TransactionPayStrategy.Relay,
  hasQuotes = true,
}: {
  transactionType: TransactionType;
  recipientKeyringType?: KeyringTypes;
  quoteFrom?: Hex;
  strategy?: TransactionPayStrategy;
  hasQuotes?: boolean;
}) {
  const transaction = {
    ...genUnapprovedContractInteractionConfirmation({
      address: CONTRACT_INTERACTION_SENDER_ADDRESS as Hex,
    }),
    type: transactionType,
  };

  const state = getMockConfirmStateForTransaction(transaction, {
    metamask: {
      internalAccounts: {
        selectedAccount: RECIPIENT_ACCOUNT_ID,
        accounts: {
          [RECIPIENT_ACCOUNT_ID]: {
            address: RECIPIENT_ADDRESS,
            id: RECIPIENT_ACCOUNT_ID,
            metadata: {
              importTime: 0,
              name: 'Recipient',
              keyring: { type: recipientKeyringType },
            },
            options: {},
            methods: [],
            scopes: ['eip155:0'],
            type: 'eip155:eoa',
          },
        },
      },
      accountIdByAddress: { [RECIPIENT_ADDRESS]: RECIPIENT_ACCOUNT_ID },
      transactionData: {
        [transaction.id]: {
          accountOverride: RECIPIENT_ADDRESS,
          quotes: hasQuotes
            ? [{ strategy, request: { from: quoteFrom } }]
            : undefined,
        },
      },
    },
  });

  return renderHookWithConfirmContextProvider(
    () => useWithdrawHardwareQuoteSigner(),
    state,
  );
}

describe('useWithdrawHardwareQuoteSigner', () => {
  it('returns the hardware recipient that a withdraw quote would make sign', async () => {
    const { result } = runHook({
      transactionType: TransactionType.moneyAccountWithdraw,
    });

    await waitFor(() => {
      expect(result.current).toBe(RECIPIENT_ADDRESS);
    });
  });

  it('returns undefined for a direct withdraw without quotes', () => {
    const { result } = runHook({
      transactionType: TransactionType.moneyAccountWithdraw,
      hasQuotes: false,
    });

    expect(result.current).toBeUndefined();
  });

  it('returns undefined for a no-op quote', () => {
    const { result } = runHook({
      transactionType: TransactionType.moneyAccountWithdraw,
      strategy: TransactionPayStrategy.None,
    });

    expect(result.current).toBeUndefined();
  });

  it('returns undefined when the quote is signed by txParams.from', () => {
    const { result } = runHook({
      transactionType: TransactionType.moneyAccountWithdraw,
      quoteFrom: CONTRACT_INTERACTION_SENDER_ADDRESS as Hex,
    });

    expect(result.current).toBeUndefined();
  });

  it('returns undefined for a software recipient', () => {
    const { result } = runHook({
      transactionType: TransactionType.moneyAccountWithdraw,
      recipientKeyringType: KeyringTypes.hd,
    });

    expect(result.current).toBeUndefined();
  });

  for (const transactionType of [
    TransactionType.moneyAccountDeposit,
    TransactionType.musdConversion,
  ]) {
    it(`returns undefined for ${transactionType}, whose override is the payer`, () => {
      const { result } = runHook({ transactionType });

      expect(result.current).toBeUndefined();
    });
  }
});
