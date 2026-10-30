import { StrictMode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { it as jestIt } from '@jest/globals';
import { createMemoryRouter } from 'react-router-dom';
import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../shared/constants/app';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { registerDocumentLoadMeasurement } from '../../helpers/utils/useful-screen-ready';
import { registerHomeMeasurement, useHomeReady } from './home-performance';

jest.mock('../../helpers/utils/useful-screen-ready');
jest.mock('../../../shared/lib/environment-type');

describe('Home readiness', () => {
  const measurement = { reportReady: jest.fn(), discard: jest.fn() };
  let router: ReturnType<typeof createMemoryRouter>;
  const register = (
    overrides: Partial<Parameters<typeof registerHomeMeasurement>[0]> = {},
  ) =>
    registerHomeMeasurement(
      { isUnlocked: true, completedOnboarding: true, ...overrides },
      router,
    );

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.mocked(getEnvironmentType).mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    jest.mocked(registerDocumentLoadMeasurement).mockReturnValue(measurement);
    router = createMemoryRouter([{ path: '*', element: null }]);
  });

  afterEach(() => {
    router.dispose();
    jest.useRealTimers();
  });

  it('reports once after paint, including StrictMode replay', async () => {
    register();
    expect(registerDocumentLoadMeasurement).toHaveBeenCalledWith({
      screen: 'home',
      tags: {
        'wallet.unlocked': true,
        'wallet.ui_type': ENVIRONMENT_TYPE_SIDEPANEL,
      },
    });
    renderHook(() => useHomeReady(true), { wrapper: StrictMode });
    expect(measurement.reportReady).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(48));
    await router.navigate('/settings');

    expect(measurement.reportReady).toHaveBeenCalledTimes(1);
    expect(measurement.discard).not.toHaveBeenCalled();
  });

  jestIt.each([
    { isUnlocked: false },
    { completedOnboarding: false },
    { pendingApprovals: { request: {} } },
  ])('excludes initial wallet state %j', (state) => {
    register(state);
    renderHook(() => useHomeReady(true));
    act(() => jest.advanceTimersByTime(48));
    expect(registerDocumentLoadMeasurement).not.toHaveBeenCalled();
    expect(measurement.reportReady).not.toHaveBeenCalled();
  });

  it('excludes documents that start elsewhere', async () => {
    await router.navigate('/settings');
    register();
    await router.navigate('/');
    renderHook(() => useHomeReady(true));
    act(() => jest.advanceTimersByTime(48));
    expect(registerDocumentLoadMeasurement).not.toHaveBeenCalled();
  });

  it('waits for content and cancels a pending report when content becomes unready', () => {
    register();
    const { rerender } = renderHook(({ ready }) => useHomeReady(ready), {
      initialProps: { ready: false },
    });
    act(() => jest.advanceTimersByTime(48));
    expect(measurement.reportReady).not.toHaveBeenCalled();
    rerender({ ready: true });
    rerender({ ready: false });
    act(() => jest.advanceTimersByTime(48));
    expect(measurement.reportReady).not.toHaveBeenCalled();
    rerender({ ready: true });
    act(() => jest.advanceTimersByTime(48));
    expect(measurement.reportReady).toHaveBeenCalledTimes(1);
  });

  jestIt.each([false, true])(
    'excludes leaving and returning after mounting: %s',
    async (mountBeforeNavigation) => {
      register();
      if (mountBeforeNavigation) {
        renderHook(() => useHomeReady(true));
      }
      await router.navigate('/settings');
      await router.navigate('/');
      renderHook(() => useHomeReady(true));
      act(() => jest.advanceTimersByTime(48));
      expect(measurement.discard).toHaveBeenCalledTimes(1);
      expect(measurement.reportReady).not.toHaveBeenCalled();
    },
  );
});
