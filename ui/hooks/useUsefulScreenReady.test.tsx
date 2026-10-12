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

  const initialize = (screen: Readiness.UsefulScreen = 'home') => {
    mockLocation.pathname = {
      home: '/',
      unlock: '/unlock',
      confirmation: '/confirmation/request',
    }[screen];
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
    mockLocation.pathname = '/';
    mockReadiness.initializeUsefulScreenReadyTrace({
      isUnlocked: true,
      uiType: ENVIRONMENT_TYPE_POPUP,
    });
    renderScreen();
    advance();
    expect(startSpanManual).not.toHaveBeenCalled();
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
      timing.recordBackgroundInitializationTiming({
        data: { method: 'BACKGROUND_INITIALIZED', params: { initializedAt } },
      });
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
