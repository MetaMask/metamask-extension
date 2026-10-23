import { it as jestIt } from '@jest/globals';
import { createMemoryRouter } from 'react-router-dom';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import { registerDocumentLoadMeasurement } from '../../helpers/utils/useful-screen-ready';
import { registerUnlockMeasurement } from './unlock-performance';

jest.mock('../../helpers/utils/useful-screen-ready');

describe('registerUnlockMeasurement', () => {
  const measurement = { reportReady: jest.fn(), discard: jest.fn() };
  let router: ReturnType<typeof createMemoryRouter>;

  const register = (
    overrides: Partial<Parameters<typeof registerUnlockMeasurement>[0]> = {},
  ) =>
    registerUnlockMeasurement({
      isUnlocked: false,
      completedOnboarding: true,
      uiType: ENVIRONMENT_TYPE_POPUP,
      router,
      ...overrides,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(registerDocumentLoadMeasurement).mockReturnValue(measurement);
    router = createMemoryRouter([{ path: '*', element: null }], {
      initialEntries: ['/unlock'],
    });
  });

  afterEach(() => router.dispose());

  it('registers before mounting and waits for the page to report readiness', () => {
    const handle = register();
    expect(registerDocumentLoadMeasurement).toHaveBeenCalledWith({
      screen: 'unlock',
      tags: {
        'wallet.unlocked': false,
        'wallet.ui_type': ENVIRONMENT_TYPE_POPUP,
      },
    });
    expect(measurement.reportReady).not.toHaveBeenCalled();

    handle?.reportReady();

    expect(measurement.reportReady).toHaveBeenCalledTimes(1);
    expect(measurement.discard).not.toHaveBeenCalled();
  });

  jestIt.each([{ isUnlocked: true }, { completedOnboarding: false }])(
    'does not register for initial wallet state %j',
    (state) => {
      expect(register(state)).toBeUndefined();
      expect(registerDocumentLoadMeasurement).not.toHaveBeenCalled();
    },
  );

  it('does not register when the document starts on an unrelated route', async () => {
    await router.navigate('/settings');
    expect(register()).toBeUndefined();
    expect(registerDocumentLoadMeasurement).not.toHaveBeenCalled();
  });

  it('accepts the initial authentication redirect, including StrictMode replay', async () => {
    await router.navigate('/');
    const from = router.state.location;
    const handle = register();

    await router.navigate('/unlock', { replace: true, state: { from } });
    // Navigate's mount effect is replayed with the same source entry.
    await router.navigate('/unlock', { replace: true, state: { from } });
    handle?.reportReady();

    expect(measurement.discard).not.toHaveBeenCalled();
    expect(measurement.reportReady).toHaveBeenCalledTimes(1);
  });

  jestIt.each([
    { replace: true },
    { replace: false },
    { replace: true, state: { from: { key: 'another-entry' } } },
  ])('excludes a later root-to-Unlock navigation: %j', async (options) => {
    await router.navigate('/');
    register();

    await router.navigate('/unlock', options);

    expect(measurement.discard).toHaveBeenCalledTimes(1);
  });

  jestIt.each([false, true])(
    'excludes leaving and returning before mounting, replace: %s',
    async (replace) => {
      register();

      await router.navigate('/restore-vault', { replace });
      await router.navigate('/unlock', { replace });

      expect(measurement.discard).toHaveBeenCalledTimes(1);
      expect(registerDocumentLoadMeasurement).toHaveBeenCalledTimes(1);
    },
  );

  it('excludes history navigation away from the initial visit', async () => {
    await router.navigate('/unlock');
    register();

    await router.navigate(-1);

    expect(measurement.discard).toHaveBeenCalledTimes(1);
  });

  it('stops observing navigation when the page discards its measurement', async () => {
    const handle = register();
    handle?.discard();

    await router.navigate('/');

    expect(measurement.discard).toHaveBeenCalledTimes(1);
  });
});
