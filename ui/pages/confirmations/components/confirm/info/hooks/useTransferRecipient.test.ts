import { TransactionMeta } from '@metamask/transaction-controller';
import { useTransferRecipient } from './useTransferRecipient';
import { renderHookWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../test/data/confirmations/token-transfer';

const ADDRESS_MOCK = '0x2e0D7E8c45221FcA00d74a3609A0f7097035d09B';

const TRANSACTION_METADATA_MOCK =
  genUnapprovedContractInteractionConfirmation() as TransactionMeta;

function runHook(transaction?: TransactionMeta) {
  const state = transaction
    ? getMockConfirmStateForTransaction(transaction)
    : {};

  const { result } = renderHookWithConfirmContextProvider(
    useTransferRecipient,
    state,
  );

  return result.current as string | undefined;
}

describe('useTransferRecipient', () => {
  it('returns undefined if no transaction', () => {
    expect(runHook()).toBeUndefined();
  });

  it('returns transaction to address if no token data', () => {
    expect(
      runHook({
        ...TRANSACTION_METADATA_MOCK,
        txParams: {
          ...TRANSACTION_METADATA_MOCK.txParams,
          to: ADDRESS_MOCK,
        },
      }),
    ).toBe(ADDRESS_MOCK);
  });

  it('returns transaction data to address if token transfer', () => {
    expect(
      runHook({
        ...TRANSACTION_METADATA_MOCK,
        txParams: {
          ...TRANSACTION_METADATA_MOCK.txParams,
          to: '0x123',
          data: genUnapprovedTokenTransferConfirmation().txParams.data,
        },
      }),
    ).toBe(ADDRESS_MOCK);
  });
});
