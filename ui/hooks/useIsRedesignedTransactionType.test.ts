import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  oldestPendingConfirmationSelector,
  getPendingApprovals,
  selectIsTransactionTypeRedesigned,
} from '../selectors';
import { isCorrectSignatureApprovalType } from '../../shared/lib/confirmation.utils';
import { useIsRedesignedConfirmationType } from './useIsRedesignedTransactionType';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
}));

jest.mock('../selectors', () => ({
  oldestPendingConfirmationSelector: jest.fn(),
  getPendingApprovals: jest.fn(),
  selectIsTransactionTypeRedesigned: jest.fn(),
}));

jest.mock('../../shared/lib/confirmation.utils', () => ({
  isCorrectSignatureApprovalType: jest.fn(),
}));

const OLDEST_APPROVAL = { id: 'oldest-id', type: 'PersonalSign' };
const OTHER_APPROVAL = { id: 'other-id', type: 'EthSignTypedData' };

describe('useIsRedesignedConfirmationType', () => {
  const useSelectorMock = jest.mocked(useSelector);
  const useLocationMock = jest.mocked(useLocation);
  const selectIsTransactionTypeRedesignedMock = jest.mocked(
    selectIsTransactionTypeRedesigned,
  );
  const isCorrectSignatureApprovalTypeMock = jest.mocked(
    isCorrectSignatureApprovalType,
  );

  const buildLocation = (pathname: string): ReturnType<typeof useLocation> => ({
    pathname,
    search: '',
    hash: '',
    state: null,
    key: 'test-key',
  });

  beforeEach(() => {
    jest.clearAllMocks();

    useSelectorMock.mockImplementation((selector) => {
      if (selector === oldestPendingConfirmationSelector) {
        return OLDEST_APPROVAL;
      }
      if (selector === getPendingApprovals) {
        return [OLDEST_APPROVAL, OTHER_APPROVAL];
      }
      return selector({});
    });
  });

  it('returns true when transaction type supports redesigned flow', () => {
    useLocationMock.mockReturnValue(
      buildLocation('/confirm-transaction/tx-123'),
    );
    selectIsTransactionTypeRedesignedMock.mockReturnValue(true);
    isCorrectSignatureApprovalTypeMock.mockReturnValue(false);

    const { result } = renderHook(() => useIsRedesignedConfirmationType());

    expect(result.current).toBe(true);
    expect(selectIsTransactionTypeRedesignedMock).toHaveBeenCalledWith(
      {},
      'tx-123',
    );
  });

  it('returns true when approval type supports redesigned flow', () => {
    useLocationMock.mockReturnValue(
      buildLocation('/confirm-transaction/tx-123'),
    );
    selectIsTransactionTypeRedesignedMock.mockReturnValue(false);
    isCorrectSignatureApprovalTypeMock.mockReturnValue(true);

    const { result } = renderHook(() => useIsRedesignedConfirmationType());

    expect(result.current).toBe(true);
  });

  it('uses oldest pending approval id when url has no confirmation id', () => {
    useLocationMock.mockReturnValue(buildLocation('/settings'));
    selectIsTransactionTypeRedesignedMock.mockReturnValue(false);
    isCorrectSignatureApprovalTypeMock.mockReturnValue(false);

    const { result } = renderHook(() => useIsRedesignedConfirmationType());

    expect(result.current).toBe(false);
    expect(selectIsTransactionTypeRedesignedMock).toHaveBeenCalledWith(
      {},
      'oldest-id',
    );
  });

  it('checks the URL-matched approval type, not the oldest approval', () => {
    // URL points to the non-oldest approval
    useLocationMock.mockReturnValue(
      buildLocation('/confirm-transaction/other-id'),
    );
    selectIsTransactionTypeRedesignedMock.mockReturnValue(false);
    isCorrectSignatureApprovalTypeMock.mockReturnValue(false);

    renderHook(() => useIsRedesignedConfirmationType());

    // Must be called with the type from OTHER_APPROVAL, not OLDEST_APPROVAL
    expect(isCorrectSignatureApprovalTypeMock).toHaveBeenCalledWith(
      OTHER_APPROVAL.type,
    );
    expect(isCorrectSignatureApprovalTypeMock).not.toHaveBeenCalledWith(
      OLDEST_APPROVAL.type,
    );
  });
});
