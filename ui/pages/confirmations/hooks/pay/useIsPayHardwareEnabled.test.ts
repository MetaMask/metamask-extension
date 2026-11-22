import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';

import { selectIsPayHardwareEnabled } from '../../selectors/feature-flags';
import { useTransactionMetadataRequestOptional } from '../transactions/useTransactionMetadataRequest';
import { useIsPayHardwareEnabled } from './useIsPayHardwareEnabled';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('../transactions/useTransactionMetadataRequest');
jest.mock('../../selectors/feature-flags', () => ({
  selectIsPayHardwareEnabled: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);
const mockSelectIsPayHardwareEnabled = jest.mocked(selectIsPayHardwareEnabled);
const mockUseTransactionMetadataRequestOptional = jest.mocked(
  useTransactionMetadataRequestOptional,
);

const STATE = { metamask: {} };

describe('useIsPayHardwareEnabled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSelector.mockImplementation((selector) =>
      typeof selector === 'function' ? selector(STATE as never) : undefined,
    );
  });

  it('resolves the nested pay type for a batched Money Account deposit', () => {
    mockUseTransactionMetadataRequestOptional.mockReturnValue({
      id: 'tx-1',
      type: TransactionType.batch,
      nestedTransactions: [{ type: TransactionType.moneyAccountDeposit }],
    } as unknown as TransactionMeta);
    mockSelectIsPayHardwareEnabled.mockReturnValue(true);

    const { result } = renderHook(() => useIsPayHardwareEnabled());

    expect(result.current).toBe(true);
    expect(mockSelectIsPayHardwareEnabled).toHaveBeenCalledWith(
      STATE,
      TransactionType.moneyAccountDeposit,
    );
  });

  it('uses the transaction type when it is not a pay type', () => {
    mockUseTransactionMetadataRequestOptional.mockReturnValue({
      id: 'tx-1',
      type: TransactionType.musdConversion,
    } as unknown as TransactionMeta);
    mockSelectIsPayHardwareEnabled.mockReturnValue(false);

    const { result } = renderHook(() => useIsPayHardwareEnabled());

    expect(result.current).toBe(false);
    expect(mockSelectIsPayHardwareEnabled).toHaveBeenCalledWith(
      STATE,
      TransactionType.musdConversion,
    );
  });

  it('reads the default when there is no transaction', () => {
    mockUseTransactionMetadataRequestOptional.mockReturnValue(undefined);
    mockSelectIsPayHardwareEnabled.mockReturnValue(false);

    renderHook(() => useIsPayHardwareEnabled());

    expect(mockSelectIsPayHardwareEnabled).toHaveBeenCalledWith(
      STATE,
      undefined,
    );
  });
});
