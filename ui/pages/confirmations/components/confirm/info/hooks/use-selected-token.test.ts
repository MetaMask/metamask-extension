import { TransactionMeta } from '@metamask/transaction-controller';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../test/data/confirmations/token-transfer';
import mockState from '../../../../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers';
import { useSelectedToken } from './use-selected-token';

describe('useSelectedToken', () => {
  it('returns undefined for empty state', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const { result } = renderHookWithProvider(
      () => useSelectedToken(transactionMeta),
      mockState,
    );

    expect(result.current).toEqual({ selectedToken: undefined });
  });

  it('returns token with address of transactionMeta.txParams.to', () => {
    const transactionMeta = genUnapprovedTokenTransferConfirmation(
      {},
    ) as TransactionMeta;

    const TEST_TOKEN = {
      id: 'f5168b92-2d1d-442d-a0dc-bc02af987796',
      address: '0x076146c765189d51be3160a2140cf80bfc73ad68',
      options: {},
      methods: [
        'personal_sign',
        'eth_sign',
        'eth_signTransaction',
        'eth_signTypedData_v1',
        'eth_signTypedData_v3',
        'eth_signTypedData_v4',
      ],
      type: 'eip155:eoa',
      metadata: {
        name: 'Account 1',
        importTime: 1727786707545,
        lastSelected: 1727786707545,
        keyring: {
          type: 'HD Key Tree',
        },
      },
      balance: '0x42e29677a88e18',
    };

    const { result } = renderHookWithProvider(
      () => useSelectedToken(transactionMeta),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          allTokens: {
            '0x5': {
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': [TEST_TOKEN],
            },
          },
        },
      },
    );

    expect(result.current).toEqual({ selectedToken: TEST_TOKEN });
  });
});
