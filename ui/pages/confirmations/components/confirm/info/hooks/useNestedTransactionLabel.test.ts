import { BatchTransactionParams } from '@metamask/transaction-controller';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../../test/data/mock-state.json';
import { useNestedTransactionLabel } from './useNestedTransactionLabel';

const DATA_MOCK = '0xd0e30db0';
const TO_MOCK = '0x1234567890123456789012345678901234567890';

describe('useNestedTransactionLabel', () => {
  it('returns the function name when method data is known', () => {
    const nestedTransaction = {
      data: DATA_MOCK,
      to: TO_MOCK,
    } as BatchTransactionParams;

    const { result } = renderHookWithProvider(
      () => useNestedTransactionLabel({ nestedTransaction }),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          use4ByteResolution: true,
          knownMethodData: {
            [DATA_MOCK]: { name: 'Deposit', params: [] },
          },
        },
      },
    );

    expect(result.current.functionName).toEqual('Deposit');
  });

  it('returns undefined if resolution is disabled', () => {
    const nestedTransaction = {
      data: DATA_MOCK,
      to: TO_MOCK,
    } as BatchTransactionParams;

    const { result } = renderHookWithProvider(
      () => useNestedTransactionLabel({ nestedTransaction }),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          use4ByteResolution: false,
          knownMethodData: {
            [DATA_MOCK]: { name: 'Deposit', params: [] },
          },
        },
      },
    );

    expect(result.current.functionName).toBeUndefined();
  });

  it('returns undefined if method data is not known', () => {
    const nestedTransaction = {
      data: DATA_MOCK,
      to: TO_MOCK,
    } as BatchTransactionParams;

    const { result } = renderHookWithProvider(
      () => useNestedTransactionLabel({ nestedTransaction }),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          use4ByteResolution: true,
          knownMethodData: {},
        },
      },
    );

    expect(result.current.functionName).toBeUndefined();
  });

  it('returns undefined if no transaction to address', () => {
    const nestedTransaction = { data: DATA_MOCK } as BatchTransactionParams;

    const { result } = renderHookWithProvider(
      () => useNestedTransactionLabel({ nestedTransaction }),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          use4ByteResolution: true,
          knownMethodData: {
            [DATA_MOCK]: { name: 'Deposit', params: [] },
          },
        },
      },
    );

    expect(result.current.functionName).toBeUndefined();
  });
});
