import { act } from '@testing-library/react';
import { renderHookWithProviderTyped } from '../../test/lib/render-helpers-navigate';
import { MetaMetricsEventName } from '../../shared/constants/metametrics';
import { WIDE_SCREEN_DESIGN_MIN_WIDTH } from '../../shared/constants/layout';
import { WIDE_SCREEN_REDESIGN_AB_KEY } from '../../shared/lib/ab-testing/configs/wide-screen-redesign';
import { DEFAULT_ROUTE, SETTINGS_ROUTE } from '../helpers/constants/routes';
import { clearABTestExposureTrackingForTest } from './useABTest';
import { useFullScreenDesign } from './useFullScreenDesign';

const mockTrackEvent = jest.fn();

jest.mock('./useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

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
    [WIDE_SCREEN_REDESIGN_AB_KEY]: { name: 'treatment' },
  },
  pathname = DEFAULT_ROUTE,
) {
  return renderHookWithProviderTyped(
    () => useFullScreenDesign(),
    { metamask: { remoteFeatureFlags } },
    pathname,
  );
}

describe('useFullScreenDesign', () => {
  beforeEach(() => {
    mockTrackEvent.mockReset();
    clearABTestExposureTrackingForTest();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true when treatment is assigned and the viewport is wide', () => {
    mockViewportWidth(WIDE_SCREEN_DESIGN_MIN_WIDTH);
    const { result } = renderUseFullScreenDesign();
    expect(result.current).toBe(true);
  });

  it('returns false when treatment is assigned but the viewport is narrow', () => {
    mockViewportWidth(WIDE_SCREEN_DESIGN_MIN_WIDTH - 1);
    const { result } = renderUseFullScreenDesign();
    expect(result.current).toBe(false);
  });

  it('returns false when control is assigned on a wide viewport', () => {
    mockViewportWidth(1280);
    const { result } = renderUseFullScreenDesign({
      [WIDE_SCREEN_REDESIGN_AB_KEY]: { name: 'control' },
    });
    expect(result.current).toBe(false);
  });

  it('returns false when the assignment is missing on a wide viewport', () => {
    mockViewportWidth(1280);
    const { result } = renderUseFullScreenDesign({});
    expect(result.current).toBe(false);
  });

  it('ignores the retired boolean fullscreen flag', () => {
    mockViewportWidth(1280);
    const { result } = renderUseFullScreenDesign({
      extensionUxFullscreenRedesign: true,
    });
    expect(result.current).toBe(false);
  });

  it('updates when the viewport crosses the breakpoint', () => {
    const viewport = mockViewportWidth(1280);
    const { result } = renderUseFullScreenDesign();
    expect(result.current).toBe(true);

    act(() => viewport.resize(WIDE_SCREEN_DESIGN_MIN_WIDTH - 1));
    expect(result.current).toBe(false);

    act(() => viewport.resize(WIDE_SCREEN_DESIGN_MIN_WIDTH));
    expect(result.current).toBe(true);
  });

  it('removes its media query listener on unmount', () => {
    const viewport = mockViewportWidth(1280);
    const { unmount } = renderUseFullScreenDesign();
    expect(viewport.getListenerCount()).toBe(1);

    unmount();

    expect(viewport.getListenerCount()).toBe(0);
  });

  it('records exposure on the wide home screen', () => {
    mockViewportWidth(1280);
    renderUseFullScreenDesign();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.ExperimentViewed,
        properties: expect.objectContaining({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          experiment_id: WIDE_SCREEN_REDESIGN_AB_KEY,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          variation_id: 'treatment',
        }),
      }),
    );
  });

  it('does not record exposure on a narrow home screen', () => {
    mockViewportWidth(WIDE_SCREEN_DESIGN_MIN_WIDTH - 1);
    renderUseFullScreenDesign();

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('does not record exposure away from home', () => {
    mockViewportWidth(1280);
    renderUseFullScreenDesign(
      { [WIDE_SCREEN_REDESIGN_AB_KEY]: { name: 'treatment' } },
      SETTINGS_ROUTE,
    );

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });

  it('records exposure when a narrow home screen becomes wide', () => {
    const viewport = mockViewportWidth(WIDE_SCREEN_DESIGN_MIN_WIDTH - 1);
    renderUseFullScreenDesign();
    expect(mockTrackEvent).not.toHaveBeenCalled();

    act(() => viewport.resize(WIDE_SCREEN_DESIGN_MIN_WIDTH));

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
  });
});
