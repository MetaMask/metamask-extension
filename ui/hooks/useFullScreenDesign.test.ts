import { it } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../shared/constants/app';
import { getEnvironmentType } from '../../shared/lib/environment-type';
import {
  FULL_SCREEN_DESIGN_MIN_WIDTH,
  useFullScreenDesign,
} from './useFullScreenDesign';

jest.mock('../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../shared/lib/environment-type'),
  getEnvironmentType: jest.fn(),
}));

const mockGetEnvironmentType = jest.mocked(getEnvironmentType);

/**
 * Mocks `window.matchMedia` with a controllable `min-width` media query.
 *
 * @param initialWidth - The viewport width to start with.
 * @returns A function that resizes the mocked viewport and notifies listeners.
 */
function mockViewportWidth(initialWidth: number) {
  let width = initialWidth;
  const listeners = new Set<() => void>();

  jest.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
    const minWidth = Number(/min-width:\s*(\d+)px/u.exec(query)?.[1]);
    return {
      get matches() {
        return width >= minWidth;
      },
      media: query,
      addEventListener: (_event: string, listener: () => void) => {
        listeners.add(listener);
      },
      removeEventListener: (_event: string, listener: () => void) => {
        listeners.delete(listener);
      },
    } as unknown as MediaQueryList;
  });

  return {
    resize: (newWidth: number) => {
      width = newWidth;
      listeners.forEach((listener) => listener());
    },
    getListenerCount: () => listeners.size,
  };
}

describe('useFullScreenDesign', () => {
  beforeEach(() => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true in the fullscreen environment with a wide viewport', () => {
    mockViewportWidth(FULL_SCREEN_DESIGN_MIN_WIDTH);

    const { result } = renderHook(() => useFullScreenDesign());

    expect(result.current).toBe(true);
  });

  it('returns false in the fullscreen environment with a narrow viewport', () => {
    mockViewportWidth(FULL_SCREEN_DESIGN_MIN_WIDTH - 1);

    const { result } = renderHook(() => useFullScreenDesign());

    expect(result.current).toBe(false);
  });

  it.each([
    ENVIRONMENT_TYPE_POPUP,
    ENVIRONMENT_TYPE_SIDEPANEL,
    ENVIRONMENT_TYPE_NOTIFICATION,
  ])(
    'returns false in the %s environment even with a wide viewport',
    (type) => {
      mockGetEnvironmentType.mockReturnValue(type);
      mockViewportWidth(1280);

      const { result } = renderHook(() => useFullScreenDesign());

      expect(result.current).toBe(false);
    },
  );

  it('updates when the viewport crosses the breakpoint', () => {
    const viewport = mockViewportWidth(1280);
    const { result } = renderHook(() => useFullScreenDesign());
    expect(result.current).toBe(true);

    act(() => viewport.resize(FULL_SCREEN_DESIGN_MIN_WIDTH - 1));
    expect(result.current).toBe(false);

    act(() => viewport.resize(FULL_SCREEN_DESIGN_MIN_WIDTH));
    expect(result.current).toBe(true);
  });

  it('removes its media query listener on unmount', () => {
    const viewport = mockViewportWidth(1280);
    const { unmount } = renderHook(() => useFullScreenDesign());
    expect(viewport.getListenerCount()).toBe(1);

    unmount();

    expect(viewport.getListenerCount()).toBe(0);
  });
});
