import React, { StrictMode } from 'react';
import { it as jestIt } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import type * as Sentry from '@sentry/browser';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../shared/constants/app';
import { TraceName, TraceOperation } from '../../shared/lib/trace';
import type * as Readiness from '../helpers/utils/useful-screen-ready';
import type * as Timing from '../../shared/lib/ui-startup-timing';
import {
  useUsefulScreenReady,
  useUsefulScreenReadyNavigation,
  UsefulScreenReadyContext,
} from './useUsefulScreenReady';

let mockReadiness: typeof Readiness;
let mockLocation = { key: 'initial', pathname: '/' };
let mockNavigationType = 'POP';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => mockLocation,
  useNavigationType: () => mockNavigationType,
}));
jest.mock('../helpers/utils/useful-screen-ready', () => ({
  observeUsefulScreenNavigation: (
    navigation: Parameters<typeof Readiness.observeUsefulScreenNavigation>[0],
  ) => mockReadiness.observeUsefulScreenNavigation(navigation),
  reportUsefulScreenReady: (key: string, screen: Readiness.UsefulScreen) =>
    mockReadiness.reportUsefulScreenReady(key, screen),
}));

const Wrapper = ({ children }: React.PropsWithChildren) => {
  useUsefulScreenReadyNavigation();
  return (
    <UsefulScreenReadyContext.Provider value={mockLocation.key}>
      {children}
    </UsefulScreenReadyContext.Provider>
  );
};

describe('useUsefulScreenReady', () => {
  const setTag = jest.fn();
  const end = jest.fn();
  const startSpanManual = jest.fn();
  let timing: typeof Timing;
  let getEntriesByTypeDescriptor: PropertyDescriptor | undefined;

  const initialize = (screen: Readiness.UsefulScreen = 'home') => {
    mockLocation.pathname = {
      home: '/',
      unlock: '/unlock',
      confirmation: '/confirmation/request',
    }[screen];
    mockReadiness.trackUsefulScreenVisibility();
    mockReadiness.initializeUsefulScreenReadyTrace({
      isUnlocked: screen !== 'unlock',
      uiType:
        screen === 'confirmation'
          ? ENVIRONMENT_TYPE_NOTIFICATION
          : ENVIRONMENT_TYPE_POPUP,
    });
  };
  const renderScreen = (
    screen: Readiness.UsefulScreen = 'home',
    ready = true,
  ) =>
    renderHook(
      ({ ready: available }) => useUsefulScreenReady(screen, available),
      {
        initialProps: { ready },
        wrapper: Wrapper,
      },
    );
  const advance = (milliseconds = 32) =>
    act(() => jest.advanceTimersByTime(milliseconds));

  beforeEach(() => {
    jest.useFakeTimers({ now: 0, doNotFake: ['performance'] });
    jest.spyOn(performance, 'now').mockImplementation(() => Date.now());
    jest.clearAllMocks();
    jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    // JSDOM does not implement the performance timeline.
    getEntriesByTypeDescriptor = Object.getOwnPropertyDescriptor(
      performance,
      'getEntriesByType',
    );
    Object.defineProperty(performance, 'getEntriesByType', {
      configurable: true,
      writable: true,
      value: jest.fn().mockReturnValue([]),
    });
    startSpanManual.mockImplementation((_, callback) =>
      callback({ end, setAttribute: jest.fn() } as unknown as Sentry.Span),
    );
    jest.replaceProperty(global, 'sentry', {
      startSpanManual,
      withIsolationScope: (callback: (scope: Sentry.Scope) => unknown) =>
        callback({ setTag } as unknown as Sentry.Scope),
    });
    jest.isolateModules(() => {
      mockReadiness = jest.requireActual(
        '../helpers/utils/useful-screen-ready',
      );
      timing = jest.requireActual('../../shared/lib/ui-startup-timing');
    });
    mockLocation = { key: 'initial', pathname: '/' };
    mockNavigationType = 'POP';
  });

  afterEach(() => {
    window.dispatchEvent(new Event('pagehide'));
    if (getEntriesByTypeDescriptor) {
      Object.defineProperty(
        performance,
        'getEntriesByType',
        getEntriesByTypeDescriptor,
      );
    } else {
      Reflect.deleteProperty(performance, 'getEntriesByType');
    }
    jest.useRealTimers();
  });

  jestIt.each(['unlock', 'home', 'confirmation'] as const)(
    'measures %s from document navigation after a ready commit and two frames',
    (screen) => {
      initialize(screen);
      advance(400);
      const { rerender } = renderScreen(screen, false);
      advance(48);
      expect(startSpanManual).not.toHaveBeenCalled();
      rerender({ ready: true });
      advance(16);
      expect(startSpanManual).not.toHaveBeenCalled();
      advance(16);
      expect(startSpanManual).toHaveBeenCalledWith(
        expect.objectContaining({
          name: TraceName.UsefulScreenReady,
          op: TraceOperation.UiScreenPerformance,
          startTime: performance.timeOrigin,
          attributes: { success: true },
        }),
        expect.any(Function),
      );
      expect(end).toHaveBeenCalledWith(
        performance.timeOrigin + performance.now(),
      );
      expect(setTag).toHaveBeenCalledWith('screen', screen);
      expect(setTag).toHaveBeenCalledWith(
        'wallet.unlocked',
        screen !== 'unlock',
      );
      expect(setTag).toHaveBeenCalledWith(
        'wallet.ui_type',
        screen === 'confirmation'
          ? ENVIRONMENT_TYPE_NOTIFICATION
          : ENVIRONMENT_TYPE_POPUP,
      );
    },
  );

  it('ignores ordinary rerenders and later mounts, including StrictMode replay', () => {
    initialize();
    const { rerender, unmount } = renderHook(
      () => useUsefulScreenReady('home'),
      {
        wrapper: ({ children }) => (
          <StrictMode>
            <Wrapper>{children}</Wrapper>
          </StrictMode>
        ),
      },
    );
    advance();
    rerender();
    unmount();
    renderScreen();
    advance();
    expect(startSpanManual).toHaveBeenCalledTimes(1);
    expect(end).toHaveBeenCalledTimes(1);
  });

  it('keeps an explicitly excluded document excluded after readiness and remount', () => {
    initialize('unlock');
    const { rerender, unmount } = renderScreen('unlock', false);

    mockReadiness.discardUsefulScreenReadyTrace();
    rerender({ ready: true });
    advance();
    unmount();
    renderScreen('unlock');
    advance();

    expect(startSpanManual).not.toHaveBeenCalled();
  });

  jestIt.each(['unmount', 'unready'] as const)(
    'cancels a pending report on %s',
    (reason) => {
      initialize();
      const { rerender, unmount } = renderScreen();
      advance(16);
      if (reason === 'unmount') {
        unmount();
      } else {
        rerender({ ready: false });
      }
      advance(48);
      expect(startSpanManual).not.toHaveBeenCalled();
    },
  );

  it('cancels transient Home readiness when startup redirects to confirmation', () => {
    initialize();
    const home = renderScreen();
    advance(16);
    mockLocation = { key: 'confirmation', pathname: '/confirmation/request' };
    mockNavigationType = 'REPLACE';
    home.rerender({ ready: true });
    advance();
    expect(startSpanManual).not.toHaveBeenCalled();
    renderScreen('confirmation');
    advance();
    expect(setTag).toHaveBeenCalledWith('screen', 'confirmation');
    expect(startSpanManual).toHaveBeenCalledTimes(1);
  });

  jestIt.each([
    '/confirm-transaction/signature/signature-request',
    '/confirm-transaction/first-transaction',
  ])('excludes replacement of an initial request at %s', (pathname) => {
    initialize('confirmation');
    mockLocation.pathname = pathname;
    const { rerender } = renderScreen('confirmation', false);
    advance(20_000);

    mockLocation = {
      key: 'next-request',
      pathname: '/confirm-transaction/next-request',
    };
    mockNavigationType = 'REPLACE';
    rerender({ ready: true });
    advance();

    expect(startSpanManual).not.toHaveBeenCalled();
  });

  jestIt.each(['/confirmation', '/confirm-transaction'])(
    'allows startup resolution of the first request from %s',
    (pathname) => {
      initialize('confirmation');
      mockLocation.pathname = pathname;
      const { rerender } = renderScreen('confirmation', false);

      mockLocation = {
        key: 'resolved-request',
        pathname: '/confirm-transaction/request',
      };
      mockNavigationType = 'REPLACE';
      rerender({ ready: true });
      advance();

      expect(startSpanManual).toHaveBeenCalledTimes(1);
      expect(setTag).toHaveBeenCalledWith('screen', 'confirmation');
    },
  );

  it('allows a replacement redirect that retains the first request', () => {
    initialize('confirmation');
    const { rerender } = renderScreen('confirmation', false);

    mockLocation = {
      key: 'same-request',
      pathname: '/confirm-transaction/request',
    };
    mockNavigationType = 'REPLACE';
    rerender({ ready: true });
    advance();

    expect(startSpanManual).toHaveBeenCalledTimes(1);
  });

  it('excludes Home after replacing the initial confirmation', () => {
    initialize('confirmation');
    const confirmation = renderScreen('confirmation', false);

    mockLocation = { key: 'home', pathname: '/' };
    mockNavigationType = 'REPLACE';
    confirmation.rerender({ ready: false });
    renderScreen('home');
    advance();

    expect(startSpanManual).not.toHaveBeenCalled();
  });

  jestIt.each(['PUSH', 'POP'] as const)(
    'excludes later %s navigation even if the first screen never became ready',
    (navigationType) => {
      initialize();
      const { rerender } = renderScreen('home', false);
      mockLocation = { key: 'next', pathname: '/' };
      mockNavigationType = navigationType;
      rerender({ ready: true });
      advance();
      expect(startSpanManual).not.toHaveBeenCalled();
    },
  );

  it('excludes later Home after an unsupported initial route', () => {
    initialize();
    mockLocation.pathname = '/settings';
    const { rerender } = renderScreen();
    mockLocation = { key: 'next', pathname: '/' };
    mockNavigationType = 'REPLACE';
    rerender({ ready: true });
    advance();
    expect(startSpanManual).not.toHaveBeenCalled();
  });

  it('preserves initial locked state instead of including time spent unlocking', () => {
    initialize('unlock');
    const unlock = renderScreen('unlock', false);

    mockLocation = { key: 'home', pathname: '/' };
    mockNavigationType = 'REPLACE';
    unlock.rerender({ ready: false });
    renderScreen();
    advance();
    expect(startSpanManual).not.toHaveBeenCalled();
  });

  jestIt.each([
    { states: ['hidden', 'visible'] },
    { states: ['visible', 'hidden', 'visible'] },
  ])('excludes earlier hidden visibility history $states', ({ states }) => {
    jest
      .spyOn(performance, 'getEntriesByType')
      .mockImplementation((type) =>
        type === 'visibility-state'
          ? states.map((name) => ({ name }) as PerformanceEntry)
          : [],
      );

    initialize();
    renderScreen();
    advance();

    expect(startSpanManual).not.toHaveBeenCalled();
  });

  jestIt.each(['hidden', 'closed'] as const)(
    'excludes a document %s before background state arrives without visibility history',
    (reason) => {
      mockReadiness.trackUsefulScreenVisibility();
      if (reason === 'hidden') {
        jest
          .spyOn(document, 'visibilityState', 'get')
          .mockReturnValue('hidden');
        document.dispatchEvent(new Event('visibilitychange'));
        jest
          .spyOn(document, 'visibilityState', 'get')
          .mockReturnValue('visible');
      } else {
        window.dispatchEvent(new Event('pagehide'));
      }

      initialize();
      renderScreen();
      advance();

      expect(startSpanManual).not.toHaveBeenCalled();
    },
  );

  it('accepts an entirely visible document history', () => {
    jest
      .spyOn(performance, 'getEntriesByType')
      .mockReturnValue([{ name: 'visible' } as PerformanceEntry]);

    initialize();
    renderScreen();
    advance();

    expect(startSpanManual).toHaveBeenCalledTimes(1);
  });

  jestIt.each(['initially hidden', 'hidden during load', 'closed'] as const)(
    'excludes a document that is %s',
    (reason) => {
      if (reason === 'initially hidden') {
        jest
          .spyOn(document, 'visibilityState', 'get')
          .mockReturnValue('hidden');
      }
      initialize();
      renderScreen();
      advance(16);
      if (reason === 'hidden during load') {
        jest
          .spyOn(document, 'visibilityState', 'get')
          .mockReturnValue('hidden');
        document.dispatchEvent(new Event('visibilitychange'));
      } else if (reason === 'closed') {
        window.dispatchEvent(new Event('pagehide'));
      }
      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
      advance();
      expect(startSpanManual).not.toHaveBeenCalled();
    },
  );

  jestIt.each([
    [undefined, 'unknown'],
    [performance.timeOrigin - 100, true],
    [performance.timeOrigin + 100, false],
  ])(
    'classifies background initialization time %s as %s',
    (initializedAt, expected) => {
      if (initializedAt !== undefined) {
        timing.recordBackgroundInitializationTiming({
          data: { method: 'BACKGROUND_INITIALIZED', params: { initializedAt } },
        });
      }
      initialize();
      renderScreen();
      advance();
      expect(setTag).toHaveBeenCalledWith(
        'ui.background_initialized_before_navigation',
        expected,
      );
      expect(setTag).not.toHaveBeenCalledWith(expect.any(String), 'initial');
    },
  );

  it('does nothing in isolated component views without a provider', () => {
    initialize();
    renderHook(() => useUsefulScreenReady('home'));
    advance();
    expect(startSpanManual).not.toHaveBeenCalled();
  });
});
