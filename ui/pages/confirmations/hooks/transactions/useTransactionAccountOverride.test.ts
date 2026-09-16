import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';

import { selectTransactionPayAccountOverrideByTransactionId } from '../../../../selectors/transactionPayController';
import { useTransactionAccountOverride } from './useTransactionAccountOverride';
import { useTransactionMetadataRequest } from './useTransactionMetadataRequest';

jest.mock('react-redux', () => ({ useSelector: jest.fn() }));
jest.mock('./useTransactionMetadataRequest');
jest.mock('../../../../selectors/transactionPayController', () => ({
  selectTransactionPayAccountOverrideByTransactionId: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);
const mockUseTransactionMetadataRequest = jest.mocked(
  useTransactionMetadataRequest,
);

describe('useTransactionAccountOverride', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns accountOverride from transaction config', () => {
    mockUseTransactionMetadataRequest.mockReturnValue({
      id: 'tx-1',
    } as never);
    mockUseSelector.mockReturnValue('0xOverrideAddress' as never);

    const { result } = renderHook(() => useTransactionAccountOverride());

    expect(result.current).toBe('0xOverrideAddress');
  });

  it('returns undefined when no accountOverride is set', () => {
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
      selectTransactionPayAccountOverrideByTransactionId,
    ).toHaveBeenCalledWith({}, 'tx-42');
  });
});
