/* eslint-disable @typescript-eslint/naming-convention -- MetaMetrics event properties use snake_case */
import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { PERPS_EVENT_VALUE } from '../../../shared/constants/perps-events';
import { submitRequestToBackground } from '../../store/background-connection';
import { captureException } from '../../../shared/lib/sentry';
import {
  PerpsAttributionProvider,
  resetPerpsSessionAttribution,
  usePerpsAttributionContext,
} from './PerpsAttributionContext';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);
const mockCaptureException = jest.mocked(captureException);

function createWrapper(locationSearch?: string) {
  return function wrapper({ children }: { children: React.ReactNode }) {
    return (
      <PerpsAttributionProvider locationSearch={locationSearch}>
        {children}
      </PerpsAttributionProvider>
    );
  };
}

describe('PerpsAttributionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetPerpsSessionAttribution();
  });

  afterEach(() => {
    resetPerpsSessionAttribution();
  });

  it('throws when used outside PerpsAttributionProvider', () => {
    const { result } = renderHook(() => usePerpsAttributionContext());

    expect(result.error).toEqual(
      new Error(
        'usePerpsAttributionContext must be used within PerpsAttributionProvider',
      ),
    );
  });

  it('merges and clears flow attribution', () => {
    const { result } = renderHook(() => usePerpsAttributionContext(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setFlowAttribution({
        entryPoint: 'market_list',
        discoverySource: 'market_list',
      });
    });

    expect(result.current.flowAttribution).toStrictEqual({
      entryPoint: 'market_list',
      discoverySource: 'market_list',
    });

    act(() => {
      result.current.clearFlowAttribution();
    });

    expect(result.current.flowAttribution).toStrictEqual({});
  });

  it('syncs UTM params to the controller and maps source to discovery', async () => {
    const { result } = renderHook(() => usePerpsAttributionContext(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.syncUtmAttributionFromSearch(
        '?utm_source=twitter&utm_medium=social&utm_campaign=launch&utm_content=banner&utm_term=perps&source=market_list',
      );
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsSetAttributionContext',
      [
        {
          utmSource: 'twitter',
          utmMedium: 'social',
          utmCampaign: 'launch',
          utmContent: 'banner',
          utmTerm: 'perps',
        },
      ],
    );
    expect(result.current.flowAttribution).toStrictEqual({
      discoverySource: PERPS_EVENT_VALUE.SOURCE.MARKET_LIST,
    });
  });

  it('forwards the accumulated session UTM to the controller across consecutive partial updates', async () => {
    const { result } = renderHook(() => usePerpsAttributionContext(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.syncUtmAttributionFromSearch(
        '?utm_source=A&utm_medium=B',
      );
    });
    await act(async () => {
      result.current.syncUtmAttributionFromSearch('?utm_source=C');
    });

    // The controller replaces its stored context wholesale, so the second call
    // must carry the MERGED session UTM ({ utmSource: 'C', utmMedium: 'B' }) —
    // not just the latest partial ({ utmSource: 'C' }) — to stay in sync with
    // the client-side accumulation.
    expect(mockSubmitRequestToBackground).toHaveBeenLastCalledWith(
      'perpsSetAttributionContext',
      [{ utmSource: 'C', utmMedium: 'B' }],
    );
  });

  it('maps known source params and sets deeplink entry point', async () => {
    const { result } = renderHook(() => usePerpsAttributionContext(), {
      wrapper: createWrapper(),
    });

    const cases: { source: string; discovery: string; entry?: string }[] = [
      {
        source: 'asset_details',
        discovery: PERPS_EVENT_VALUE.SOURCE.ASSET_DETAILS,
      },
      {
        source: 'trading',
        discovery: PERPS_EVENT_VALUE.SOURCE.TRADING,
      },
      {
        source: 'wallet_home_perps_tab',
        discovery: PERPS_EVENT_VALUE.SOURCE.HOMESCREEN_TAB,
      },
      {
        source: 'homescreen_tab',
        discovery: PERPS_EVENT_VALUE.SOURCE.HOMESCREEN_TAB,
      },
      {
        source: 'deeplink',
        discovery: PERPS_EVENT_VALUE.SOURCE.DEEPLINK,
        entry: PERPS_EVENT_VALUE.SOURCE.DEEPLINK,
      },
      {
        source: 'custom_campaign',
        discovery: 'custom_campaign',
      },
    ];

    for (const { source, discovery, entry } of cases) {
      act(() => {
        result.current.clearFlowAttribution();
      });
      await act(async () => {
        result.current.syncUtmAttributionFromSearch(`?source=${source}`);
      });
      expect(result.current.flowAttribution).toStrictEqual({
        discoverySource: discovery,
        ...(entry ? { entryPoint: entry } : {}),
      });
    }
  });

  it('seeds screenViewedAttribution synchronously from locationSearch on first render', () => {
    const { result } = renderHook(() => usePerpsAttributionContext(), {
      wrapper: createWrapper('?utm_source=ads&utm_medium=cpc&source=deeplink'),
    });

    // Available on the first render (from useState initializers), not after an
    // effect — so a screen view emitted on mount already carries attribution.
    expect(result.current.screenViewedAttribution).toStrictEqual({
      utm_source: 'ads',
      utm_medium: 'cpc',
      source: PERPS_EVENT_VALUE.SOURCE.DEEPLINK,
    });
  });

  it('keeps source=deeplink on screen views after flow-attribution churn from navigation', () => {
    const { result } = renderHook(() => usePerpsAttributionContext(), {
      wrapper: createWrapper('?source=deeplink&utm_source=ads'),
    });

    expect(result.current.screenViewedAttribution).toStrictEqual({
      utm_source: 'ads',
      source: PERPS_EVENT_VALUE.SOURCE.DEEPLINK,
    });

    // Normal in-app navigation overwrites the mutable flow entry point (e.g.
    // market list -> order entry). The deeplink screen-view attribution is
    // session-scoped and must survive that churn.
    act(() => {
      result.current.setFlowAttribution({
        entryPoint: PERPS_EVENT_VALUE.SOURCE.TRADE_SCREEN,
      });
    });
    act(() => {
      result.current.syncUtmAttributionFromSearch('?source=market_list');
    });

    expect(result.current.screenViewedAttribution).toStrictEqual({
      utm_source: 'ads',
      source: PERPS_EVENT_VALUE.SOURCE.DEEPLINK,
    });
  });

  it('skips controller UTM sync when search has no UTM params', async () => {
    const { result } = renderHook(() => usePerpsAttributionContext(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.syncUtmAttributionFromSearch('?source=market_list');
    });

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalledWith(
      'perpsSetAttributionContext',
      expect.anything(),
    );
    expect(result.current.flowAttribution.discoverySource).toBe(
      PERPS_EVENT_VALUE.SOURCE.MARKET_LIST,
    );
  });

  it('syncs locationSearch on mount via provider effect', async () => {
    renderHook(() => usePerpsAttributionContext(), {
      wrapper: createWrapper('?utm_source=ads&source=deeplink'),
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
      'perpsSetAttributionContext',
      [{ utmSource: 'ads' }],
    );
  });

  it('surfaces controller sync failures to Sentry without breaking the flow', async () => {
    mockSubmitRequestToBackground.mockRejectedValue(new Error('offline'));

    const { result } = renderHook(() => usePerpsAttributionContext(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.syncUtmAttributionFromSearch('?utm_source=ads');
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockCaptureException).toHaveBeenCalled();
    expect(result.current.flowAttribution).toStrictEqual({});
  });
});
