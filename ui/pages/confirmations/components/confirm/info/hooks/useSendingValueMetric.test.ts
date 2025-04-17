import { TransactionMeta } from '@metamask/transaction-controller';
import { renderHook } from '@testing-library/react-hooks';
import { useEffect, useState } from 'react';
import { genUnapprovedTokenTransferConfirmation } from '../../../../../../../test/data/confirmations/token-transfer';
import { useTransactionEventFragment } from '../../../../hooks/useTransactionEventFragment';
import { useSendingValueMetric } from './useSendingValueMetric';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useEffect: jest.fn(),
  useState: jest.fn(),
}));

jest.mock('../../../../hooks/useTransactionEventFragment');

describe('useSimulationMetrics', () => {
  const useTransactionEventFragmentMock = jest.mocked(
    useTransactionEventFragment,
  );

  const useStateMock = jest.mocked(useState);
  const useEffectMock = jest.mocked(useEffect);

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let updateTransactionEventFragmentMock: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.resetAllMocks();

    updateTransactionEventFragmentMock = jest.fn();

    useTransactionEventFragmentMock.mockReturnValue({
      updateTransactionEventFragment: updateTransactionEventFragmentMock,
    });

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useStateMock.mockImplementation(((initialValue: any) => [
      initialValue,
      jest.fn(),
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ]) as any);

    useEffectMock.mockImplementation((fn) => fn());
  });

  describe('useSendingValueMetric', () => {
    it('Updates the event property', async () => {
      const MOCK_FIAT_VALUE = 10;
      const transactionMeta = genUnapprovedTokenTransferConfirmation(
        {},
      ) as TransactionMeta;
      const props = { transactionMeta, fiatValue: MOCK_FIAT_VALUE };

      renderHook(() => useSendingValueMetric(props));

      expect(updateTransactionEventFragmentMock).toHaveBeenCalledWith(
        expect.objectContaining({
          properties: expect.objectContaining({
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            sending_value: MOCK_FIAT_VALUE,
          }),
        }),
        '1d7c08c0-fe54-11ee-9243-91b1e533746a',
      );

      jest.restoreAllMocks();
    });

    it('Does not updates the event property if fiat value is undefined', async () => {
      const MOCK_FIAT_VALUE = undefined;
      const transactionMeta = genUnapprovedTokenTransferConfirmation(
        {},
      ) as TransactionMeta;
      const props = { transactionMeta, fiatValue: MOCK_FIAT_VALUE };

      renderHook(() => useSendingValueMetric(props));

      expect(updateTransactionEventFragmentMock).not.toHaveBeenCalled();

      jest.restoreAllMocks();
    });

    it('Does not updates the event property if fiat value is empty string', async () => {
      const MOCK_FIAT_VALUE = '' as const;
      const transactionMeta = genUnapprovedTokenTransferConfirmation(
        {},
      ) as TransactionMeta;
      const props = { transactionMeta, fiatValue: MOCK_FIAT_VALUE };

      renderHook(() => useSendingValueMetric(props));

      expect(updateTransactionEventFragmentMock).not.toHaveBeenCalled();

      jest.restoreAllMocks();
    });
  });
});
