import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { selectIsRedesignedConfirmationType } from '../selectors';
import { useIsRedesignedConfirmationType } from './useIsRedesignedTransactionType';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
}));

jest.mock('../selectors', () => ({
  selectIsRedesignedConfirmationType: jest.fn(),
}));

const mockState = {};

describe('useIsRedesignedConfirmationType', () => {
  const useSelectorMock = jest.mocked(useSelector);
  const useLocationMock = jest.mocked(useLocation);
  const selectIsRedesignedConfirmationTypeMock = jest.mocked(
    selectIsRedesignedConfirmationType,
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
    useSelectorMock.mockImplementation((selector) =>
      selector(mockState as never),
    );
  });

  it('returns true when selector reports redesigned type', () => {
    useLocationMock.mockReturnValue(
      buildLocation('/confirm-transaction/tx-123'),
    );
    selectIsRedesignedConfirmationTypeMock.mockReturnValue(true);

    const { result } = renderHook(() => useIsRedesignedConfirmationType());

    expect(result.current).toBe(true);
    expect(selectIsRedesignedConfirmationTypeMock).toHaveBeenCalledWith(
      mockState,
      'tx-123',
    );
  });

  it('returns false when selector reports non-redesigned type', () => {
    useLocationMock.mockReturnValue(
      buildLocation('/confirm-transaction/tx-123'),
    );
    selectIsRedesignedConfirmationTypeMock.mockReturnValue(false);

    const { result } = renderHook(() => useIsRedesignedConfirmationType());

    expect(result.current).toBe(false);
  });

  it('passes undefined when URL has no confirmation id', () => {
    useLocationMock.mockReturnValue(buildLocation('/settings'));
    selectIsRedesignedConfirmationTypeMock.mockReturnValue(false);

    const { result } = renderHook(() => useIsRedesignedConfirmationType());

    expect(result.current).toBe(false);
    expect(selectIsRedesignedConfirmationTypeMock).toHaveBeenCalledWith(
      mockState,
      undefined,
    );
  });
});
