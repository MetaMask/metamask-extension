/* eslint-disable @typescript-eslint/naming-convention */
import { renderHook } from '@testing-library/react';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { createEventBuilder } from '../../../shared/lib/analytics/create-event-builder';
import {
  RAMPS_RAMP_ROUTING,
  RAMPS_RAMP_TYPE,
} from '../../../shared/lib/ramps/analytics';
import { useRampsAnalytics } from './useRampsAnalytics';
import { createRampsMockStore, createRampsTestWrapper } from './test-utils';

const mockTrackEvent = jest.fn();

jest.mock('../useAnalytics', () => ({
  useAnalytics: () => ({
    trackEvent: mockTrackEvent,
    // Real builder so we assert the actual payload shape sent to Segment.
    createEventBuilder: jest.requireActual(
      '../../../shared/lib/analytics/create-event-builder',
    ).createEventBuilder,
  }),
}));

jest.mock('../../store/controller-actions/ramps-controller', () => ({
  setRampsUserRegion: jest.fn(),
}));

function renderRampsAnalytics(rampsEnabled = true) {
  const store = createRampsMockStore({
    remoteFeatureFlags: { rampsEnabled },
  });
  return renderHook(() => useRampsAnalytics(), {
    wrapper: createRampsTestWrapper(store),
  });
}

describe('useRampsAnalytics', () => {
  beforeEach(() => mockTrackEvent.mockClear());

  it('tracks token selected with region, currency source and ramp_type', () => {
    const { result } = renderRampsAnalytics();

    result.current.trackTokenSelected({
      tokenCaip19: 'eip155:1/erc20:0xabc',
      tokenSymbol: 'USDC',
      currencyDestination: 'eip155:1',
      currencyDestinationSymbol: 'USDC',
      currencyDestinationNetwork: 'Ethereum',
    });

    const built = createEventBuilder(MetaMetricsEventName.RampsTokenSelected)
      .addCategory(MetaMetricsEventCategory.Ramps)
      .addProperties({
        ramp_type: RAMPS_RAMP_TYPE,
        ramp_routing: RAMPS_RAMP_ROUTING,
        region: 'us-ca',
        currency_source: 'USD',
        token_caip19: 'eip155:1/erc20:0xabc',
        token_symbol: 'USDC',
        currency_destination: 'eip155:1',
        currency_destination_symbol: 'USDC',
        currency_destination_network: 'Ethereum',
      })
      .build();

    expect(mockTrackEvent).toHaveBeenCalledWith(built);
  });

  it('tracks screen viewed', () => {
    const { result } = renderRampsAnalytics();

    result.current.trackScreenViewed('Order Details');

    const [built] = mockTrackEvent.mock.calls[0];
    expect(built.name).toBe(MetaMetricsEventName.RampsScreenViewed);
    expect(built.properties).toStrictEqual({
      category: MetaMetricsEventCategory.Ramps,
      ramp_type: RAMPS_RAMP_TYPE,
      ramp_routing: RAMPS_RAMP_ROUTING,
      location: 'Order Details',
      region: 'us-ca',
    });
  });

  it('does not track when rampsEnabled is off', () => {
    const { result } = renderRampsAnalytics(false);

    result.current.trackScreenViewed('Amount Input');
    result.current.trackProviderSelected({
      provider: 'Transak',
      location: 'Provider Selection',
    });

    expect(mockTrackEvent).not.toHaveBeenCalled();
  });
});
