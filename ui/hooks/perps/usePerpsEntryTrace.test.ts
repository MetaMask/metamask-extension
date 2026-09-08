import { act, renderHook } from '@testing-library/react';
import type { PerpsMarketData } from '@metamask/perps-controller';
import {
  startPerpsEntry,
  endPerpsEntry,
} from '../../helpers/perps/entry-trace';
import { usePerpsEntryTrace } from './usePerpsEntryTrace';

jest.mock('../../helpers/perps/entry-trace', () => ({
  startPerpsEntry: jest.fn().mockReturnValue('entry'),
  endPerpsEntry: jest.fn(),
}));

const markets = [{ symbol: 'BTC' }] as PerpsMarketData[];

describe('usePerpsEntryTrace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
  });

  it('keeps one mount span across loading and cached-only renders', () => {
    const { rerender } = renderHook(
      ({ loading, live }) =>
        usePerpsEntryTrace('home', markets, loading, live, 'empty'),
      {
        initialProps: { loading: true, live: false },
      },
    );
    rerender({ loading: false, live: false });
    expect(endPerpsEntry).not.toHaveBeenCalled();

    rerender({ loading: false, live: true });

    expect(startPerpsEntry).toHaveBeenCalledTimes(1);
    expect(endPerpsEntry).toHaveBeenCalledWith(
      'entry',
      true,
      'live_rows_committed',
      'empty',
    );
  });

  it('does not complete without rendered rows', () => {
    renderHook(() => usePerpsEntryTrace('home', [], false, true));

    expect(endPerpsEntry).not.toHaveBeenCalled();
  });

  it('abandons its pending entry on unmount', () => {
    const { unmount } = renderHook(() =>
      usePerpsEntryTrace('home', markets, true, false),
    );

    unmount();

    expect(endPerpsEntry).toHaveBeenCalledWith('entry', false, 'unmounted');
  });

  it('waits for visibility and starts a new entry on resume', () => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    renderHook(() =>
      usePerpsEntryTrace('home', markets, false, true, 'position'),
    );
    expect(endPerpsEntry).not.toHaveBeenCalled();

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        value: 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(startPerpsEntry).toHaveBeenCalledTimes(2);
    expect(endPerpsEntry).toHaveBeenCalledWith(
      'entry',
      true,
      'live_rows_committed',
      'position',
    );
  });
});
