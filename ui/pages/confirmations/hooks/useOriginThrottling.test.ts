import { renderHook, act } from '@testing-library/react-hooks';
import { useDispatch, useSelector } from 'react-redux';
import { updateThrottledOriginState } from '../../../store/actions';
import { useOriginThrottling } from './useOriginThrottling';
import useCurrentConfirmation from './useCurrentConfirmation';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('./useCurrentConfirmation', () => jest.fn());

jest.mock('../../../store/actions', () => ({
  updateThrottledOriginState: jest.fn(),
}));

describe('useOriginThrottling', () => {
  const mockDispatch = jest.fn();
  const mockOrigin = 'test-origin';
  const mockThrottledOrigins = {
    [mockOrigin]: {
      rejections: 2,
      lastRejection: Date.now() - 1000,
    },
  };

  beforeEach(() => {
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selectorFn) =>
      selectorFn({ metamask: { throttledOrigins: mockThrottledOrigins } }),
    );
    (useCurrentConfirmation as jest.Mock).mockReturnValue({
      currentConfirmation: { origin: mockOrigin },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return shouldThrottleOrigin as true when conditions are met', () => {
    const { result } = renderHook(() => useOriginThrottling());

    expect(result.current.shouldThrottleOrigin).toBe(true);
  });

  it('should call updateThrottledOriginState when resetOrigin is called', async () => {
    const { result } = renderHook(() => useOriginThrottling());

    await act(async () => {
      await result.current.resetOrigin();
    });

    expect(mockDispatch).toHaveBeenCalledWith(
      updateThrottledOriginState(mockOrigin, {
        rejections: 0,
        lastRejection: 0,
      }),
    );
  });
});
