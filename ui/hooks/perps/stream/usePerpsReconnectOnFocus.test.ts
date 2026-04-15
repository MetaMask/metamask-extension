import { renderHook } from '@testing-library/react-hooks';
import { usePerpsReconnectOnFocus } from './usePerpsReconnectOnFocus';

const mockSubmitRequestToBackground = jest.fn();
jest.mock('../../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

const MIN_HIDDEN_DURATION_MS = 30_000;

function fireVisibilityChange(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('usePerpsReconnectOnFocus', () => {
  let nowSpy: jest.SpyInstance;
  let currentTime: number;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);

    currentTime = 100_000;
    nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => currentTime);

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it('calls perpsCheckHealth after tab hidden for >= 30 s', () => {
    renderHook(() => usePerpsReconnectOnFocus());

    fireVisibilityChange('hidden');
    currentTime += MIN_HIDDEN_DURATION_MS + 1;
    fireVisibilityChange('visible');

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsCheckHealth',
    );
  });

  it('skips check if hidden for less than 30 s', () => {
    renderHook(() => usePerpsReconnectOnFocus());

    fireVisibilityChange('hidden');
    currentTime += MIN_HIDDEN_DURATION_MS - 1;
    fireVisibilityChange('visible');

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
  });

  it('fires health check on visible event with no prior hide', () => {
    renderHook(() => usePerpsReconnectOnFocus());

    fireVisibilityChange('visible');

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsCheckHealth',
    );
  });

  it('does not throw when perpsCheckHealth rejects', () => {
    mockSubmitRequestToBackground.mockRejectedValue(new Error('not available'));

    renderHook(() => usePerpsReconnectOnFocus());

    fireVisibilityChange('hidden');
    currentTime += MIN_HIDDEN_DURATION_MS + 1;
    fireVisibilityChange('visible');

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsCheckHealth',
    );
  });

  it('cleans up visibilitychange listener on unmount', () => {
    const addSpy = jest.spyOn(document, 'addEventListener');
    const removeSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() => usePerpsReconnectOnFocus());

    expect(addSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );

    unmount();

    expect(removeSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
