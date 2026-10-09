import { it as jestIt } from '@jest/globals';
import type * as Sentry from '@sentry/browser';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../shared/constants/app';
import { TraceName, TraceOperation } from '../../../shared/lib/trace';
import { recordBackgroundInitializationTiming } from '../../../shared/lib/ui-startup-timing';
import {
  createUsefulScreenReadyTrace,
  initializeUsefulScreenReadyTrace,
  observeUsefulScreenNavigation,
  signalUsefulScreenReady,
} from './useful-screen-ready';

describe('useful screen readiness', () => {
  const setTag = jest.fn();
  const end = jest.fn();
  const startSpanManual = jest.fn();
  const instances: ReturnType<typeof createUsefulScreenReadyTrace>[] = [];

  const create = (
    options: Partial<Parameters<typeof createUsefulScreenReadyTrace>[0]> = {},
  ) => {
    const instance = createUsefulScreenReadyTrace({
      isUnlocked: true,
      uiType: ENVIRONMENT_TYPE_POPUP,
      ...options,
    });
    instances.push(instance);
    instance.observeNavigation({
      key: 'initial',
      pathname: '/',
      navigationType: 'POP',
    });
    return instance;
  };

  beforeEach(() => {
    jest.useFakeTimers({ now: 0, doNotFake: ['performance'] });
    jest.spyOn(performance, 'now').mockImplementation(() => Date.now());
    jest.clearAllMocks();
    jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    const span = { end, setAttribute: jest.fn() } as unknown as Sentry.Span;
    startSpanManual.mockImplementation((_, callback) => callback(span));
    jest.replaceProperty(global, 'sentry', {
      startSpanManual,
      withIsolationScope: (callback: (scope: Sentry.Scope) => unknown) =>
        callback({ setTag } as unknown as Sentry.Scope),
    });
  });

  afterEach(() => {
    instances.splice(0).forEach((instance) => instance.discard());
    jest.useRealTimers();
  });

  describe('signalReady', () => {
    it('includes pre-mount loading and waits for two frames after all Home sections', () => {
      const instance = create({
        backgroundInitializedAt: performance.timeOrigin - 100,
      });
      jest.advanceTimersByTime(400);
      instance.signalReady('initial', {
        screen: 'home',
        section: 'account',
        generation: 'account-a',
      });
      jest.advanceTimersByTime(48);
      expect(startSpanManual).not.toHaveBeenCalled();
      instance.signalReady('initial', {
        screen: 'home',
        section: 'assets',
        generation: 'account-a',
      });
      jest.advanceTimersByTime(16);
      expect(startSpanManual).not.toHaveBeenCalled();
      jest.advanceTimersByTime(16);

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
      expect(setTag).toHaveBeenCalledWith('screen', 'home');
      expect(setTag).toHaveBeenCalledWith(
        'wallet.ui_type',
        ENVIRONMENT_TYPE_POPUP,
      );
      expect(setTag).toHaveBeenCalledWith('wallet.unlocked', true);
      expect(setTag).toHaveBeenCalledWith(
        'ui.background_initialized_before_navigation',
        true,
      );
      expect(setTag).not.toHaveBeenCalledWith(expect.any(String), 'account-a');
    });

    it('requires both request details and actions for a transaction', () => {
      const instance = create({ uiType: ENVIRONMENT_TYPE_NOTIFICATION });
      instance.observeNavigation({
        key: 'confirmation',
        pathname: '/confirmation/request-a',
        navigationType: 'REPLACE',
      });
      instance.signalReady('confirmation', {
        screen: 'confirmation',
        section: 'details',
        generation: 'request-a',
      });
      jest.advanceTimersByTime(48);
      expect(startSpanManual).not.toHaveBeenCalled();
      instance.signalReady('confirmation', {
        screen: 'confirmation',
        section: 'actions',
        generation: 'request-a',
      });
      jest.advanceTimersByTime(32);
      expect(setTag).toHaveBeenCalledWith('screen', 'confirmation');
      expect(startSpanManual).toHaveBeenCalledTimes(1);
    });

    it('records a locked Unlock form without waiting for a password or network', () => {
      const instance = create({ isUnlocked: false });
      instance.observeNavigation({
        key: 'unlock',
        pathname: '/unlock',
        navigationType: 'REPLACE',
      });
      instance.signalReady('unlock', {
        screen: 'unlock',
        section: 'form',
        generation: 'unlock',
      });
      jest.advanceTimersByTime(32);
      expect(setTag).toHaveBeenCalledWith('screen', 'unlock');
      expect(setTag).toHaveBeenCalledWith('wallet.unlocked', false);
    });

    it('does not combine sections from different accounts or requests', () => {
      const instance = create();
      instance.signalReady('initial', {
        screen: 'home',
        section: 'account',
        generation: 'a',
      });
      instance.signalReady('initial', {
        screen: 'home',
        section: 'assets',
        generation: 'b',
      });
      jest.advanceTimersByTime(48);
      expect(startSpanManual).not.toHaveBeenCalled();
      instance.signalReady('initial', {
        screen: 'home',
        section: 'account',
        generation: 'b',
      });
      jest.advanceTimersByTime(32);
      expect(startSpanManual).toHaveBeenCalledTimes(1);
    });

    it('cancels readiness when a section unmounts before the second frame', () => {
      const instance = create();
      instance.signalReady('initial', {
        screen: 'home',
        section: 'account',
        generation: 'a',
      });
      const cleanup = instance.signalReady('initial', {
        screen: 'home',
        section: 'assets',
        generation: 'a',
      });
      jest.advanceTimersByTime(16);
      cleanup?.();
      jest.advanceTimersByTime(48);
      expect(startSpanManual).not.toHaveBeenCalled();
    });

    it('survives StrictMode cleanup and remount without recording twice', () => {
      const instance = create({ isUnlocked: false });
      instance.observeNavigation({
        key: 'unlock',
        pathname: '/unlock',
        navigationType: 'REPLACE',
      });
      const signal = {
        screen: 'unlock',
        section: 'form',
        generation: 'unlock',
      } as const;
      instance.signalReady('unlock', signal)?.();
      instance.signalReady('unlock', signal);
      jest.advanceTimersByTime(32);
      instance.signalReady('unlock', signal);
      jest.advanceTimersByTime(32);
      expect(startSpanManual).toHaveBeenCalledTimes(1);
      expect(end).toHaveBeenCalledTimes(1);
    });

    it('does not report unlocked screens after a locked startup', () => {
      const instance = create({ isUnlocked: false });
      instance.signalReady('initial', {
        screen: 'home',
        section: 'account',
        generation: 'a',
      });
      instance.signalReady('initial', {
        screen: 'home',
        section: 'assets',
        generation: 'a',
      });
      jest.advanceTimersByTime(32);
      expect(startSpanManual).not.toHaveBeenCalled();
    });
  });

  describe('observeNavigation', () => {
    it('withdraws transient Home readiness when startup redirects to confirmation', () => {
      const instance = create();
      instance.signalReady('initial', {
        screen: 'home',
        section: 'account',
        generation: 'a',
      });
      instance.signalReady('initial', {
        screen: 'home',
        section: 'assets',
        generation: 'a',
      });
      jest.advanceTimersByTime(16);
      instance.observeNavigation({
        key: 'confirmation',
        pathname: '/confirmation/request-a',
        navigationType: 'REPLACE',
      });
      jest.advanceTimersByTime(48);
      expect(startSpanManual).not.toHaveBeenCalled();
      instance.signalReady('initial', {
        screen: 'home',
        section: 'assets',
        generation: 'a',
      });
      instance.signalReady('confirmation', {
        screen: 'confirmation',
        section: 'details',
        generation: 'request-a',
      });
      instance.signalReady('confirmation', {
        screen: 'confirmation',
        section: 'actions',
        generation: 'request-a',
      });
      jest.advanceTimersByTime(32);
      expect(setTag).toHaveBeenCalledWith('screen', 'confirmation');
      expect(startSpanManual).toHaveBeenCalledTimes(1);
    });

    jestIt.each(['PUSH', 'POP'])(
      'does not treat subsequent %s navigation as a document load',
      (navigationType) => {
        const instance = create();
        instance.observeNavigation({
          key: 'next',
          pathname: '/',
          navigationType,
        });
        instance.signalReady('next', {
          screen: 'home',
          section: 'account',
          generation: 'a',
        });
        instance.signalReady('next', {
          screen: 'home',
          section: 'assets',
          generation: 'a',
        });
        jest.advanceTimersByTime(32);
        expect(startSpanManual).not.toHaveBeenCalled();
      },
    );

    it('does not start timing a later Home visit after an unsupported initial screen', () => {
      const instance = create();
      instance.observeNavigation({
        key: 'settings',
        pathname: '/settings',
        navigationType: 'REPLACE',
      });
      instance.observeNavigation({
        key: 'home',
        pathname: '/',
        navigationType: 'REPLACE',
      });
      instance.signalReady('home', {
        screen: 'home',
        section: 'account',
        generation: 'a',
      });
      instance.signalReady('home', {
        screen: 'home',
        section: 'assets',
        generation: 'a',
      });
      jest.advanceTimersByTime(32);
      expect(startSpanManual).not.toHaveBeenCalled();
    });
  });

  describe('visibility', () => {
    it('excludes initially hidden pages even if later shown', () => {
      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
      const instance = create();
      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
      instance.signalReady('initial', {
        screen: 'home',
        section: 'account',
        generation: 'a',
      });
      instance.signalReady('initial', {
        screen: 'home',
        section: 'assets',
        generation: 'a',
      });
      jest.advanceTimersByTime(32);
      expect(startSpanManual).not.toHaveBeenCalled();
    });

    it('cancels a pending result if the document is hidden and shown again', () => {
      const instance = create();
      instance.signalReady('initial', {
        screen: 'home',
        section: 'account',
        generation: 'a',
      });
      instance.signalReady('initial', {
        screen: 'home',
        section: 'assets',
        generation: 'a',
      });
      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
      jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
      jest.advanceTimersByTime(32);
      expect(startSpanManual).not.toHaveBeenCalled();
    });

    it('cancels a result when the document closes', () => {
      const instance = create();
      instance.signalReady('initial', {
        screen: 'home',
        section: 'account',
        generation: 'a',
      });
      instance.signalReady('initial', {
        screen: 'home',
        section: 'assets',
        generation: 'a',
      });
      window.dispatchEvent(new Event('pagehide'));
      jest.advanceTimersByTime(32);
      expect(startSpanManual).not.toHaveBeenCalled();
    });
  });

  describe('background warmness', () => {
    jestIt.each([
      [undefined, 'unknown'],
      [performance.timeOrigin - 100, true],
      [performance.timeOrigin + 100, false],
    ])(
      'classifies initialization time %s as %s',
      (backgroundInitializedAt, expected) => {
        const instance = create({ backgroundInitializedAt });
        instance.signalReady('initial', {
          screen: 'home',
          section: 'account',
          generation: 'a',
        });
        instance.signalReady('initial', {
          screen: 'home',
          section: 'assets',
          generation: 'a',
        });
        jest.advanceTimersByTime(32);
        expect(setTag).toHaveBeenCalledWith(
          'ui.background_initialized_before_navigation',
          expected,
        );
      },
    );
  });

  describe('initial document context', () => {
    it('captures the background port payload and initial state only once', () => {
      recordBackgroundInitializationTiming({
        data: {
          method: 'ALIVE',
          params: { initializedAt: performance.timeOrigin + 100 },
        },
      });
      recordBackgroundInitializationTiming({
        data: {
          method: 'BACKGROUND_INITIALIZED',
          params: { initializedAt: performance.timeOrigin - 100 },
        },
      });
      recordBackgroundInitializationTiming({
        data: {
          method: 'BACKGROUND_INITIALIZED',
          params: { initializedAt: 'invalid' },
        },
      });
      initializeUsefulScreenReadyTrace({
        isUnlocked: true,
        uiType: ENVIRONMENT_TYPE_POPUP,
      });
      initializeUsefulScreenReadyTrace({
        isUnlocked: false,
        uiType: ENVIRONMENT_TYPE_NOTIFICATION,
      });
      observeUsefulScreenNavigation({
        key: 'initial',
        pathname: '/',
        navigationType: 'POP',
      });
      signalUsefulScreenReady('initial', {
        screen: 'home',
        section: 'account',
        generation: 'a',
      });
      signalUsefulScreenReady('initial', {
        screen: 'home',
        section: 'assets',
        generation: 'a',
      });
      jest.advanceTimersByTime(32);
      expect(setTag).toHaveBeenCalledWith('wallet.unlocked', true);
      expect(setTag).toHaveBeenCalledWith(
        'ui.background_initialized_before_navigation',
        true,
      );
      expect(startSpanManual).toHaveBeenCalledTimes(1);
    });
  });
});
