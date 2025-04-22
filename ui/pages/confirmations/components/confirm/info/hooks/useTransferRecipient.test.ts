import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { renderHookWithConfirmContextProvider } from '../../../../../../../test/lib/confirmations/render-helpers';
import { getMockConfirmStateForTransaction } from '../../../../../../../test/data/confirmations/helper';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../../../test/data/confirmations/contract-interaction';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../test/data/confirmations/token-transfer';
import { useTransferRecipient } from './useTransferRecipient';

const ADDRESS_MOCK = '0x2e0D7E8c45221FcA00d74a3609A0f7097035d09B';
const ADDRESS_2_MOCK = '0x2e0D7E8c45221FcA00d74a3609A0f7097035d09C';

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

  it('returns parameter to address if simple send', () => {
    expect(
      runHook({
        ...TRANSACTION_METADATA_MOCK,
        type: TransactionType.simpleSend,
        txParams: {
          ...TRANSACTION_METADATA_MOCK.txParams,
          to: ADDRESS_MOCK,
        },
      }),
    ).toBe(ADDRESS_MOCK);
  });

  it('returns data to address if token data', () => {
    expect(
      runHook({
        ...TRANSACTION_METADATA_MOCK,
        txParams: {
          ...TRANSACTION_METADATA_MOCK.txParams,
          to: ADDRESS_2_MOCK,
          data: genUnapprovedTokenTransferConfirmation().txParams.data,
        },
      }),
    ).toBe(ADDRESS_MOCK);
  });

  it('returns parameter to address if token data but type is simple send', () => {
    expect(
      runHook({
        ...TRANSACTION_METADATA_MOCK,
        type: TransactionType.simpleSend,
        txParams: {
          ...TRANSACTION_METADATA_MOCK.txParams,
          to: ADDRESS_2_MOCK,
          data: genUnapprovedTokenTransferConfirmation().txParams.data,
        },
      }),
    ).toBe(ADDRESS_2_MOCK);
  });
});
