import { renderHook, act } from '@testing-library/react';
import {
  PERPS_EVENT_PROPERTY,
  PERPS_EVENT_VALUE,
} from '../../../shared/constants/perps-events';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import { usePerpsMarketAboutTracking } from './usePerpsMarketAboutTracking';

const mockTrack = jest.fn();
const mockUsePerpsEventTracking = jest.fn(
  (options?: { properties?: Record<string, unknown> }) =>
    options ? undefined : { track: mockTrack },
);
const mockAboutRef = jest.fn();
let latestIntersectionCallback: ((isIntersecting: boolean) => void) | undefined;
let latestIntersectionThreshold: number | undefined;

jest.mock('./usePerpsEventTracking', () => ({
  usePerpsEventTracking: (options?: { properties?: Record<string, unknown> }) =>
    mockUsePerpsEventTracking(options),
}));

jest.mock('../useIntersectionObserver', () => ({
  useIntersectionObserver: ({
    onChange,
    threshold,
  }: {
    onChange: (isIntersecting: boolean) => void;
    threshold: number;
  }) => {
    latestIntersectionCallback = onChange;
    latestIntersectionThreshold = threshold;
    return [mockAboutRef, false, undefined];
  },
}));

describe('usePerpsMarketAboutTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    latestIntersectionCallback = undefined;
    latestIntersectionThreshold = undefined;
  });

  it('reports whether the description has non-whitespace content', () => {
    const { result, rerender } = renderHook(
      ({ description }: { description?: string }) =>
        usePerpsMarketAboutTracking({ description }),
      { initialProps: { description: '  Description  ' } },
    );

    expect(result.current.hasDescription).toBe(true);

    rerender({ description: ' \n\t ' });

    expect(result.current.hasDescription).toBe(false);
  });

  it('configures the displayed event with shared market properties', () => {
    renderHook(() =>
      usePerpsMarketAboutTracking({
        symbol: 'SMSN',
        marketType: 'stock',
        description: '  Samsung description.  ',
      }),
    );

    const [options] = mockUsePerpsEventTracking.mock.calls[0];

    expect(options).toEqual({
      eventName: MetaMetricsEventName.PerpsUiInteraction,
      conditions: true,
      resetKey: 'SMSN',
      properties: {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.MARKET_ABOUT_SECTION_DISPLAYED,
        [PERPS_EVENT_PROPERTY.MARKET_SYMBOL]: 'SMSN',
        [PERPS_EVENT_PROPERTY.MARKET_TYPE]: 'stock',
        [PERPS_EVENT_PROPERTY.DESCRIPTION_LENGTH]: 'Samsung description.'
          .length,
      },
    });
  });

  it('configures the displayed event as disabled without a description', () => {
    renderHook(() =>
      usePerpsMarketAboutTracking({ symbol: 'BTC', description: '  ' }),
    );

    const [options] = mockUsePerpsEventTracking.mock.calls[0];

    expect(options).toEqual(
      expect.objectContaining({
        conditions: false,
        resetKey: 'BTC',
      }),
    );
  });

  it('defaults the market type to crypto', () => {
    renderHook(() =>
      usePerpsMarketAboutTracking({
        symbol: 'BTC',
        description: 'Bitcoin description.',
      }),
    );

    const [options] = mockUsePerpsEventTracking.mock.calls[0];

    expect(options?.properties).toEqual(
      expect.objectContaining({
        [PERPS_EVENT_PROPERTY.MARKET_TYPE]: 'crypto',
      }),
    );
  });

  it('tracks the viewed event once when the section intersects', () => {
    renderHook(() =>
      usePerpsMarketAboutTracking({
        symbol: 'BTC',
        marketType: 'crypto',
        description: 'Bitcoin description.',
      }),
    );

    act(() => {
      latestIntersectionCallback?.(true);
      latestIntersectionCallback?.(true);
    });

    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith(
      MetaMetricsEventName.PerpsUiInteraction,
      {
        [PERPS_EVENT_PROPERTY.INTERACTION_TYPE]:
          PERPS_EVENT_VALUE.INTERACTION_TYPE.MARKET_ABOUT_SECTION_VIEWED,
        [PERPS_EVENT_PROPERTY.MARKET_SYMBOL]: 'BTC',
        [PERPS_EVENT_PROPERTY.MARKET_TYPE]: 'crypto',
        [PERPS_EVENT_PROPERTY.DESCRIPTION_LENGTH]: 'Bitcoin description.'
          .length,
      },
    );
  });

  it('observes the section at the required twenty percent threshold', () => {
    renderHook(() =>
      usePerpsMarketAboutTracking({
        symbol: 'BTC',
        description: 'Bitcoin description.',
      }),
    );

    expect(latestIntersectionThreshold).toBe(0.2);
  });

  it('does not track the viewed event without a description', () => {
    renderHook(() =>
      usePerpsMarketAboutTracking({ symbol: 'BTC', description: undefined }),
    );

    act(() => {
      latestIntersectionCallback?.(true);
    });

    expect(mockTrack).not.toHaveBeenCalled();
  });

  it('re-arms the viewed event when the market symbol changes', () => {
    const { rerender } = renderHook(
      ({ symbol }: { symbol: string }) =>
        usePerpsMarketAboutTracking({
          symbol,
          description: 'Market description.',
        }),
      { initialProps: { symbol: 'BTC' } },
    );

    act(() => {
      latestIntersectionCallback?.(true);
    });

    rerender({ symbol: 'ETH' });

    act(() => {
      latestIntersectionCallback?.(true);
    });

    expect(mockTrack).toHaveBeenCalledTimes(2);
    expect(mockTrack.mock.calls[1][1]).toEqual(
      expect.objectContaining({
        [PERPS_EVENT_PROPERTY.MARKET_SYMBOL]: 'ETH',
      }),
    );
  });
});
