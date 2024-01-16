import { TransactionType } from '@metamask/transaction-controller';
import { renderHookWithProvider } from '../../test/lib/render-helpers';
import mockState from '../../test/data/mock-state.json';
import { useTransactionFunctionType } from './useTransactionFunctionType';

describe('useTransactionFunctionType', () => {
  it('should return functionType depending on transaction data if present', () => {
    const { result } = renderHookWithProvider(
      () =>
        useTransactionFunctionType({
          txParams: {
            data: '0x095ea7b30000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000011170',
          },
          type: TransactionType.tokenMethodApprove,
        }),
      mockState,
    );
    expect(result.current.functionType).toStrictEqual('Approve spend limit');
  });
  it('should return functionType depending on transaction type if method not present in transaction data', () => {
    const { result } = renderHookWithProvider(
      () =>
        useTransactionFunctionType({
          txParams: {},
          type: TransactionType.tokenMethodTransfer,
        }),
      mockState,
    );
    expect(result.current.functionType).toStrictEqual('Transfer');
  });
  it('should return functionType Contract interaction by default', () => {
    const { result } = renderHookWithProvider(
      () =>
        useTransactionFunctionType({
          txParams: {},
        }),
      mockState,
    );
    expect(result.current.functionType).toStrictEqual('Contract interaction');
  });
  it('should return undefined is txData is not present', () => {
    const { result } = renderHookWithProvider(
      () => useTransactionFunctionType(),
      mockState,
    );
    expect(result.current.functionType).toBeUndefined();
  });
});
