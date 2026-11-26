import { renderHook } from '@testing-library/react';
import { flushPromises } from '../../../../../test/lib/timer-helpers';
import { usePerpsPositionAlreadyClosed } from './usePerpsPositionAlreadyClosed';

const mockReplacePerpsToastByKey = jest.fn();
const mockRefreshPositions = jest.fn();
const mockCaptureException = jest.fn();

jest.mock('../perps-toast', () => ({
  PERPS_TOAST_KEYS: {
    POSITION_ALREADY_CLOSED: 'perpsToastPositionAlreadyClosed',
  },
  usePerpsToast: () => ({
    replacePerpsToastByKey: mockReplacePerpsToastByKey,
  }),
}));

jest.mock('../../../../providers/perps', () => ({
  getPerpsStreamManager: () => ({ refreshPositions: mockRefreshPositions }),
}));

jest.mock('../../../../../shared/lib/sentry', () => ({
  captureException: (...args: unknown[]) => mockCaptureException(...args),
}));

describe('usePerpsPositionAlreadyClosed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the already-closed toast and refreshes positions', async () => {
    mockRefreshPositions.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePerpsPositionAlreadyClosed());

    result.current();
    await flushPromises();

    expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
      key: 'perpsToastPositionAlreadyClosed',
    });
    expect(mockRefreshPositions).toHaveBeenCalledTimes(1);
    expect(mockCaptureException).not.toHaveBeenCalled();
  });

  it('reports a failed refresh and keeps the already-closed toast', async () => {
    const error = new Error('network down');
    mockRefreshPositions.mockRejectedValue(error);
    const { result } = renderHook(() => usePerpsPositionAlreadyClosed());

    result.current();
    await flushPromises();

    expect(mockCaptureException).toHaveBeenCalledWith(error);
    expect(mockReplacePerpsToastByKey).toHaveBeenCalledTimes(1);
    expect(mockReplacePerpsToastByKey).toHaveBeenCalledWith({
      key: 'perpsToastPositionAlreadyClosed',
    });
  });
});
