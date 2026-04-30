import { renderHook, act } from '@testing-library/react-hooks';
import { usePerpsLifecycleBreadcrumbs } from './usePerpsLifecycleBreadcrumbs';

describe('usePerpsLifecycleBreadcrumbs', () => {
  afterEach(() => {
    jest.clearAllMocks();
    delete (globalThis as Record<string, unknown>).sentry;
  });

  it('does not throw when sentry is not initialized', () => {
    expect(() => {
      renderHook(() => usePerpsLifecycleBreadcrumbs());
    }).not.toThrow();
  });

  it('adds a breadcrumb on mount', () => {
    const mockAddBreadcrumb = jest.fn();
    (globalThis as Record<string, unknown>).sentry = {
      addBreadcrumb: mockAddBreadcrumb,
    };

    renderHook(() => usePerpsLifecycleBreadcrumbs());

    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'perps.lifecycle',
        message: 'Perps popup opened',
        level: 'info',
      }),
    );
  });

  it('adds a breadcrumb when the document becomes hidden', () => {
    const mockAddBreadcrumb = jest.fn();
    (globalThis as Record<string, unknown>).sentry = {
      addBreadcrumb: mockAddBreadcrumb,
    };

    renderHook(() => usePerpsLifecycleBreadcrumbs());
    mockAddBreadcrumb.mockClear();

    act(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => true,
      });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'perps.lifecycle',
        message: 'Perps popup hidden',
        level: 'info',
      }),
    );
  });

  it('adds a breadcrumb when the document becomes visible', () => {
    const mockAddBreadcrumb = jest.fn();
    (globalThis as Record<string, unknown>).sentry = {
      addBreadcrumb: mockAddBreadcrumb,
    };

    renderHook(() => usePerpsLifecycleBreadcrumbs());
    mockAddBreadcrumb.mockClear();

    act(() => {
      Object.defineProperty(document, 'hidden', {
        configurable: true,
        get: () => false,
      });
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'perps.lifecycle',
        message: 'Perps popup visible',
        level: 'info',
      }),
    );
  });

  it('adds a breadcrumb on beforeunload', () => {
    const mockAddBreadcrumb = jest.fn();
    (globalThis as Record<string, unknown>).sentry = {
      addBreadcrumb: mockAddBreadcrumb,
    };

    renderHook(() => usePerpsLifecycleBreadcrumbs());
    mockAddBreadcrumb.mockClear();

    act(() => {
      window.dispatchEvent(new Event('beforeunload'));
    });

    expect(mockAddBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'perps.lifecycle',
        message: 'Perps popup closing',
        level: 'info',
      }),
    );
  });

  it('removes event listeners on unmount', () => {
    const mockAddBreadcrumb = jest.fn();
    (globalThis as Record<string, unknown>).sentry = {
      addBreadcrumb: mockAddBreadcrumb,
    };

    const { unmount } = renderHook(() => usePerpsLifecycleBreadcrumbs());

    unmount();
    mockAddBreadcrumb.mockClear();

    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('beforeunload'));
    });

    expect(mockAddBreadcrumb).not.toHaveBeenCalled();
  });
});
