import { BatchTransactionParams } from '@metamask/transaction-controller';
import { renderHookWithProvider } from '../../../../../../../test/lib/render-helpers';
import mockState from '../../../../../../../test/data/mock-state.json';
import { useNestedTransactionLabels } from './useNestedTransactionLabels';

const DATA_MOCK = '0xd0e30db0';
const TO_MOCK = '0x1234567890123456789012345678901234567890';

describe('useNestedTransactionLabels', () => {
  it('returns function names when method data is known', () => {
    const nestedTransactions = [
      { data: DATA_MOCK, to: TO_MOCK },
      { data: DATA_MOCK, to: TO_MOCK },
    ] as BatchTransactionParams[];

    const { result } = renderHookWithProvider(
      () => useNestedTransactionLabels({ nestedTransactions }),
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

    expect(result.current).toEqual(['Deposit', 'Deposit']);
  });

  it('returns fallback labels if method data is not known', () => {
    const nestedTransactions = [
      { data: DATA_MOCK, to: TO_MOCK },
      { data: DATA_MOCK, to: TO_MOCK },
    ] as BatchTransactionParams[];

    const { result } = renderHookWithProvider(
      () => useNestedTransactionLabels({ nestedTransactions }),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          use4ByteResolution: true,
          knownMethodData: {},
        },
      },
    );

    expect(result.current).toEqual(['Transaction 1', 'Transaction 2']);
  });

  it('returns fallback labels when resolution is disabled', () => {
    const nestedTransactions = [
      { data: DATA_MOCK, to: TO_MOCK },
    ] as BatchTransactionParams[];

    const { result } = renderHookWithProvider(
      () => useNestedTransactionLabels({ nestedTransactions }),
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

    expect(result.current).toEqual(['Transaction 1']);
  });

  it('returns fallback label if transaction is missing "to" address', () => {
    const nestedTransactions = [
      { data: DATA_MOCK },
    ] as BatchTransactionParams[];

    const { result } = renderHookWithProvider(
      () => useNestedTransactionLabels({ nestedTransactions }),
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

    expect(result.current).toEqual(['Transaction 1']);
  });

  it('respects custom useIndex override', () => {
    const nestedTransactions = [
      { data: DATA_MOCK, to: TO_MOCK },
    ] as BatchTransactionParams[];

    const { result } = renderHookWithProvider(
      () => useNestedTransactionLabels({ nestedTransactions, useIndex: 5 }),
      {
        ...mockState,
        metamask: {
          ...mockState.metamask,
          use4ByteResolution: true,
          knownMethodData: {},
        },
      },
    );

    expect(result.current).toEqual(['Transaction 6']);
  });
});
