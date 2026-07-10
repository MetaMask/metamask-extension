import { act, renderHook } from '@testing-library/react-hooks';
import React from 'react';

import { PERPS_EVENT_VALUE } from '../../../shared/constants/perps-events';
import { submitRequestToBackground } from '../../store/background-connection';
import {
  PerpsAttributionProvider,
  usePerpsAttributionContext,
} from './PerpsAttributionContext';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn().mockResolvedValue(undefined),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);

function createWrapper(locationSearch?: string) {
  return function wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      PerpsAttributionProvider,
      { locationSearch },
      children,
    );
  };
}

describe('PerpsAttributionContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('maps known source params and sets deeplink entry point', async () => {
    const { result } = renderHook(() => usePerpsAttributionContext(), {
      wrapper: createWrapper(),
    });

    const cases: { source: string; discovery: string; entry?: string }[] =
      [
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

  it('skips controller sync when search has no UTM params', async () => {
    const { result } = renderHook(() => usePerpsAttributionContext(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.syncUtmAttributionFromSearch('?source=market_list');
    });

    expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
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

  it('swallows controller sync failures', async () => {
    mockSubmitRequestToBackground.mockRejectedValueOnce(new Error('offline'));

    const { result } = renderHook(() => usePerpsAttributionContext(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.syncUtmAttributionFromSearch('?utm_source=ads');
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
    expect(result.current.flowAttribution).toStrictEqual({});
  });
});
