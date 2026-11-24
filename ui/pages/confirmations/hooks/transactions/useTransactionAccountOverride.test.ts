import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';

import { selectTransactionPayEvmAccountOverrideByTransactionId } from '../../../../selectors/transactionPayController';
import { useTransactionAccountOverride } from './useTransactionAccountOverride';
import { useTransactionMetadataRequest } from './useTransactionMetadataRequest';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('./useTransactionMetadataRequest');
jest.mock('../../../../selectors/transactionPayController', () => ({
  selectTransactionPayEvmAccountOverrideByTransactionId: jest.fn(),
}));

const OVERRIDE_ADDRESS_MOCK = '0xabcdef1234567890abcdef1234567890abcdef12';

const mockUseSelector = jest.mocked(useSelector);
const mockUseTransactionMetadataRequest = jest.mocked(
  useTransactionMetadataRequest,
);

describe('useTransactionAccountOverride', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns the EVM address of the account override', () => {
    mockUseTransactionMetadataRequest.mockReturnValue({
      id: 'tx-1',
    } as never);
    mockUseSelector.mockReturnValue(OVERRIDE_ADDRESS_MOCK as never);

    const { result } = renderHook(() => useTransactionAccountOverride());

    expect(result.current).toBe(OVERRIDE_ADDRESS_MOCK);
  });

  it('returns undefined when no EVM account override is set', () => {
    mockUseTransactionMetadataRequest.mockReturnValue({
      id: 'tx-1',
    } as never);
    mockUseSelector.mockReturnValue(undefined);

    const { result } = renderHook(() => useTransactionAccountOverride());

    expect(result.current).toBeUndefined();
  });

  it('reads the override for the current transaction id', () => {
    mockUseTransactionMetadataRequest.mockReturnValue({
      id: 'tx-42',
    } as never);
    mockUseSelector.mockImplementation((selector) =>
      typeof selector === 'function' ? selector({} as never) : undefined,
    );

    renderHook(() => useTransactionAccountOverride());

    expect(
      selectTransactionPayEvmAccountOverrideByTransactionId,
    ).toHaveBeenCalledWith({}, 'tx-42');
  });
});
