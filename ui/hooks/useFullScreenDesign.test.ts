import { act } from '@testing-library/react';
import { renderHookWithProviderTyped } from '../../test/lib/render-helpers-navigate';
import {
  FULL_SCREEN_DESIGN_MIN_WIDTH,
  useFullScreenDesign,
} from './useFullScreenDesign';

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

function renderUseFullScreenDesign(
  remoteFeatureFlags: Record<string, unknown> = {
    extensionUxFullscreenRedesign: true,
  },
) {
  return renderHookWithProviderTyped(() => useFullScreenDesign(), {
    metamask: { remoteFeatureFlags },
  });
}

describe('useFullScreenDesign', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true when the flag is enabled and the viewport is at the minimum width', () => {
    mockViewportWidth(FULL_SCREEN_DESIGN_MIN_WIDTH);
    const { result } = renderUseFullScreenDesign();
    expect(result.current).toBe(true);
  });

  it('returns false when the flag is enabled but the viewport is narrower than the minimum width', () => {
    mockViewportWidth(FULL_SCREEN_DESIGN_MIN_WIDTH - 1);
    const { result } = renderUseFullScreenDesign();
    expect(result.current).toBe(false);
  });

  it('returns false when the flag is disabled on a wide viewport', () => {
    mockViewportWidth(1280);
    const { result } = renderUseFullScreenDesign({
      extensionUxFullscreenRedesign: false,
    });
    expect(result.current).toBe(false);
  });

  it('returns false when the flag is missing on a wide viewport', () => {
    mockViewportWidth(1280);
    const { result } = renderUseFullScreenDesign({});
    expect(result.current).toBe(false);
  });

  it('returns true when the flag is a version-gated value that is enabled', () => {
    mockViewportWidth(1280);
    const { result } = renderUseFullScreenDesign({
      extensionUxFullscreenRedesign: {
        enabled: true,
        minimumVersion: '0.0.0',
      },
    });
    expect(result.current).toBe(true);
  });

  it('updates when the viewport crosses the breakpoint', () => {
    const viewport = mockViewportWidth(1280);
    const { result } = renderUseFullScreenDesign();
    expect(result.current).toBe(true);

    act(() => viewport.resize(FULL_SCREEN_DESIGN_MIN_WIDTH - 1));
    expect(result.current).toBe(false);

    act(() => viewport.resize(FULL_SCREEN_DESIGN_MIN_WIDTH));
    expect(result.current).toBe(true);
  });

  it('removes its media query listener on unmount', () => {
    const viewport = mockViewportWidth(1280);
    const { unmount } = renderUseFullScreenDesign();
    expect(viewport.getListenerCount()).toBe(1);

    unmount();

    expect(viewport.getListenerCount()).toBe(0);
  });
});
