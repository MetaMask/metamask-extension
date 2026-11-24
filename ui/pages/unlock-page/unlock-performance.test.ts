import { it as jestIt } from '@jest/globals';
import { createMemoryRouter } from 'react-router-dom';
import { createElement } from 'react';
import { act, render } from '@testing-library/react';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import { registerDocumentLoadMeasurement } from '../../helpers/utils/useful-screen-ready';
import {
  discardUnlockMeasurement,
  registerUnlockMeasurement,
  UnlockReady,
} from './unlock-performance';

jest.mock('../../helpers/utils/useful-screen-ready');
jest.mock('../../../shared/lib/environment-type');

describe('registerUnlockMeasurement', () => {
  const measurement = { reportReady: jest.fn(), discard: jest.fn() };
  let router: ReturnType<typeof createMemoryRouter>;

  const register = (
    overrides: Partial<Parameters<typeof registerUnlockMeasurement>[0]> = {},
  ) =>
    registerUnlockMeasurement(
      { isUnlocked: false, completedOnboarding: true, ...overrides },
      router,
    );

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.mocked(getEnvironmentType).mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    jest.mocked(registerDocumentLoadMeasurement).mockReturnValue(measurement);
    router = createMemoryRouter([{ path: '*', element: null }], {
      initialEntries: ['/unlock'],
    });
  });

  afterEach(() => {
    router.dispose();
    jest.useRealTimers();
  });

  it('registers before mounting and stops observing after readiness', async () => {
    register();
    expect(registerDocumentLoadMeasurement).toHaveBeenCalledWith({
      screen: 'unlock',
      tags: {
        'wallet.unlocked': false,
        'wallet.ui_type': ENVIRONMENT_TYPE_POPUP,
      },
    });
    expect(measurement.reportReady).not.toHaveBeenCalled();

    render(createElement(UnlockReady, { ready: true }));
    act(() => jest.advanceTimersByTime(48));
    await router.navigate('/');

    expect(measurement.reportReady).toHaveBeenCalledTimes(1);
    expect(measurement.discard).not.toHaveBeenCalled();
  });

  jestIt.each([{ isUnlocked: true }, { completedOnboarding: false }])(
    'does not register for initial wallet state %j',
    (state) => {
      register(state);
      render(createElement(UnlockReady, { ready: true }));
      act(() => jest.advanceTimersByTime(48));
      expect(registerDocumentLoadMeasurement).not.toHaveBeenCalled();
      expect(measurement.reportReady).not.toHaveBeenCalled();
    },
  );

  it('does not register when the document starts on an unrelated route', async () => {
    await router.navigate('/settings');
    register();
    expect(registerDocumentLoadMeasurement).not.toHaveBeenCalled();
  });

  it('accepts the initial authentication redirect, including StrictMode replay', async () => {
    await router.navigate('/');
    const from = router.state.location;
    register();

    await router.navigate('/unlock', { replace: true, state: { from } });
    // Navigate's mount effect is replayed with the same source entry.
    await router.navigate('/unlock', { replace: true, state: { from } });
    render(createElement(UnlockReady, { ready: true }));
    act(() => jest.advanceTimersByTime(48));

    expect(measurement.discard).not.toHaveBeenCalled();
    expect(measurement.reportReady).toHaveBeenCalledTimes(1);
  });

  jestIt.each([
    { replace: true, state: undefined },
    { replace: false },
    { replace: true, state: { from: { key: 'another-entry' } } },
  ])('excludes a later root-to-Unlock navigation: %j', async (options) => {
    await router.navigate('/');
    const from = router.state.location;
    register();

    await router.navigate('/unlock', { state: { from }, ...options });

    expect(measurement.discard).toHaveBeenCalledTimes(1);
  });

  it('excludes leaving and returning before mounting', async () => {
    register();

    await router.navigate('/restore-vault');
    await router.navigate('/unlock');

    expect(measurement.discard).toHaveBeenCalledTimes(1);
    expect(registerDocumentLoadMeasurement).toHaveBeenCalledTimes(1);
  });

  it('excludes history navigation away from the initial visit', async () => {
    await router.navigate('/unlock');
    register();

    await router.navigate(-1);

    expect(measurement.discard).toHaveBeenCalledTimes(1);
  });

  it('stops observing navigation when the page discards its measurement', async () => {
    register();
    discardUnlockMeasurement();

    await router.navigate('/');

    expect(measurement.discard).toHaveBeenCalledTimes(1);
  });

  it('cannot report a discarded measurement after the form remounts', () => {
    register();
    const { unmount } = render(createElement(UnlockReady, { ready: true }));

    discardUnlockMeasurement();
    act(() => jest.advanceTimersByTime(48));
    unmount();
    render(createElement(UnlockReady, { ready: true }));
    act(() => jest.advanceTimersByTime(48));

    expect(measurement.reportReady).not.toHaveBeenCalled();
    expect(measurement.discard).toHaveBeenCalledTimes(1);
  });
});
