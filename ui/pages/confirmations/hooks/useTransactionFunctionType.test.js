import { CHAIN_IDS, TransactionType } from '@metamask/transaction-controller';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { mockNetworkState } from '../../../../test/stub/networks';
import { useTransactionFunctionType } from './useTransactionFunctionType';

const CHAIN_ID_MOCK = CHAIN_IDS.GOERLI;

const STATE_MOCK = {
  ...mockState,
  metamask: {
    ...mockState.metamask,
    ...mockNetworkState({ chainId: CHAIN_ID_MOCK }),
  },
};

describe('useTransactionFunctionType', () => {
  it('should return functionType depending on transaction data if present', () => {
    const { result } = renderHookWithProvider(
      () =>
        useTransactionFunctionType({
          chainId: CHAIN_ID_MOCK,
          txParams: {
            data: '0x095ea7b30000000000000000000000002f318c334780961fb129d2a6c30d0763d9a5c9700000000000000000000000000000000000000000000000000000000000011170',
          },
          type: TransactionType.tokenMethodApprove,
        }),
      STATE_MOCK,
    );
    expect(result.current.functionType).toStrictEqual('Approve spend limit');
  });

  it('should return functionType depending on transaction type if method not present in transaction data', () => {
    const { result } = renderHookWithProvider(
      () =>
        useTransactionFunctionType({
          chainId: CHAIN_ID_MOCK,
          txParams: {},
          type: TransactionType.tokenMethodTransfer,
        }),
      STATE_MOCK,
    );
    expect(result.current.functionType).toStrictEqual('Transfer');
  });

  it('should return functionType Contract interaction by default', () => {
    const { result } = renderHookWithProvider(
      () =>
        useTransactionFunctionType({
          chainId: CHAIN_ID_MOCK,
          txParams: {},
        }),
      STATE_MOCK,
    );
    expect(result.current.functionType).toStrictEqual('Contract interaction');
  });

  it('should return undefined is txData is not present', () => {
    const { result } = renderHookWithProvider(
      () => useTransactionFunctionType(),
      STATE_MOCK,
    );
    expect(result.current.functionType).toBeUndefined();
  });
});
