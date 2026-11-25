import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { setupLocale } from '../shared/lib/error-utils';
import { FirstTimeFlowType } from '../shared/constants/onboarding';
import { START_UI_SYNC } from '../shared/constants/ui-initialization';
import * as browserRuntimeUtils from '../shared/lib/browser-runtime.utils';
import * as traceModule from '../shared/lib/trace';
import defaultMockState from '../test/data/mock-state.json';
import * as actions from './store/actions';
import * as selectors from './selectors';
import * as metamaskBaseSelectors from './ducks/metamask/base-selectors';
import { SEEDLESS_PASSWORD_OUTDATED_CHECK_INTERVAL_MS } from './constants';
import {
  readPerpsLifecycleContext,
  primePerpsLifecycleContext,
} from './helpers/perps/entry-trace';
import {
  connectToBackground,
  getCleanAppState,
  launchMetamaskUi,
  runInitialActions,
} from '.';

const enMessages = {
  troubleStarting: {
    message:
      'MetaMask had trouble starting. This error could be intermittent, so try restarting the extension.',
  },
  restartMetamask: {
    message: 'Restart MetaMask',
  },
  stillGettingMessage: {
    message: 'Still getting this message?',
  },
};

const esMessages = {
  troubleStarting: {
    message:
      'MetaMask tuvo problemas para iniciarse. Este error podría ser intermitente, así que intente reiniciar la extensión.',
  },
  restartMetamask: {
    message: 'Reiniciar metamáscara',
  },
};

jest.mock('../shared/lib/i18n', () => ({
  fetchLocale: jest.fn((locale) => (locale === 'en' ? enMessages : esMessages)),
  loadRelativeTimeFormatLocaleData: jest.fn(),
}));

jest.mock('./store/actions', () => ({
  ...jest.requireActual('./store/actions'),
  checkIsSeedlessPasswordOutdated: jest.fn(),
}));

jest.mock('./selectors', () => ({
  ...jest.requireActual('./selectors'),
  getNetworkToAutomaticallySwitchTo: jest.fn(),
  getFirstTimeFlowType: jest.fn(),
  getIsSocialLoginFlow: jest.fn(),
}));

const mockRender = jest.fn();

jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({ render: mockRender })),
}));

jest.mock('./pages', () => ({
  __esModule: true,
  default: () => null,
  router: {},
}));

jest.mock('./pages/confirmations/confirmation-performance');
jest.mock('./pages/home/home-performance');
jest.mock('./pages/unlock-page/unlock-performance');
jest.mock('./helpers/utils/web-vitals');
jest.mock('./helpers/utils/tags', () => ({ getStartupTraceTags: () => ({}) }));

jest.mock('./ducks/metamask/base-selectors', () => ({
  ...jest.requireActual('./ducks/metamask/base-selectors'),
  getIsUnlocked: jest.fn(),
}));

describe('Index Tests', () => {
  afterAll(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });
  it('primes Perps lifecycle once the background starts UI sync', async () => {
    const background = {
      perpsGetLifecycleContext: jest.fn().mockResolvedValue('cold_process'),
      onNotification: jest.fn(),
    };
    connectToBackground(background, jest.fn());
    expect(background.perpsGetLifecycleContext).not.toHaveBeenCalled();
    await background.onNotification.mock.calls[0][0]({
      method: START_UI_SYNC,
      params: [{}],
    });
    await primePerpsLifecycleContext();
    expect(background.perpsGetLifecycleContext).toHaveBeenCalledTimes(1);
    expect(readPerpsLifecycleContext()).toBe('cold_process');
    await background.onNotification.mock.calls[0][0]({
      method: 'perpsStreamUpdate',
      params: [{ channel: 'lifecycleContext', data: 'warm' }],
    });
    expect(readPerpsLifecycleContext()).toBe('warm');
  });

  it('should get locale messages by calling setupLocale', async () => {
    let result = await setupLocale('en');
    const { currentLocaleMessages: clm, enLocaleMessages: elm } = result;
    expect(clm).toBeDefined();
    expect(elm).toBeDefined();
    expect(clm.troubleStarting).toStrictEqual(enMessages.troubleStarting);

    expect(clm.restartMetamask).toStrictEqual(enMessages.restartMetamask);

    expect(clm.stillGettingMessage).toStrictEqual(
      enMessages.stillGettingMessage,
    );

    result = await setupLocale('es_419');

    const { currentLocaleMessages: clm2, enLocaleMessages: elm2 } = result;
    expect(clm2).toBeDefined();
    expect(elm2).toBeDefined();

    expect(clm2.troubleStarting).toStrictEqual(esMessages.troubleStarting);

    expect(clm2.restartMetamask).toStrictEqual(esMessages.restartMetamask);

    expect(clm2.stillGettingMessage).toBeUndefined();
    expect(elm2.stillGettingMessage).toStrictEqual(
      enMessages.stillGettingMessage,
    );
  });

  it('should get clean app state with socialLoginEmail undefined', async () => {
    const mockVersion = '1.0.0';
    const mockUserAgent = 'test-user-agent';

    jest.spyOn(global.platform, 'getVersion').mockReturnValue(mockVersion);
    jest
      .spyOn(window.navigator, 'userAgent', 'get')
      .mockReturnValue(mockUserAgent);

    const mockState = {
      metamask: {
        currentLocale: 'en',
        completedOnboarding: true,
        socialLoginEmail: 'test@test.com',
      },
    };
    const store = configureMockStore([thunk])({
      ...mockState,
    });

    const cleanAppState = await getCleanAppState(store);
    expect(cleanAppState).toStrictEqual({
      metamask: {
        ...mockState.metamask,
        socialLoginEmail: undefined,
      },
      version: mockVersion,
      browser: mockUserAgent,
    });
  });

  it('should remove QR sync state from downloaded state logs', async () => {
    const mockVersion = '1.0.0';
    const mockUserAgent = 'test-user-agent';

    jest.spyOn(global.platform, 'getVersion').mockReturnValue(mockVersion);
    jest
      .spyOn(window.navigator, 'userAgent', 'get')
      .mockReturnValue(mockUserAgent);

    const mockState = {
      metamask: {
        currentLocale: 'en',
        qrSyncPhase: 'displaying-qr',
        qrSyncConnectionStatus: 'connected',
        qrSyncSessionId: 'session-123',
        qrSyncQrPayload: 'qr-payload',
        syncOffer: { isOnboardingCompleted: true },
        qrSyncSelectedAccountGroupIds: ['entropy-1/0'],
        qrSyncError: { code: 'SYNC_FAILED', message: 'failed' },
        qrSyncCreatedAt: 1,
        qrSyncUpdatedAt: 2,
      },
    };
    const store = configureMockStore([thunk])({
      ...mockState,
    });

    const cleanAppState = await getCleanAppState(store);
    expect(cleanAppState).toStrictEqual({
      metamask: {
        currentLocale: 'en',
        socialLoginEmail: undefined,
      },
      version: mockVersion,
      browser: mockUserAgent,
    });
  });

  describe('runInitialActions', () => {
    beforeEach(() => {
      jest.useFakeTimers();

      jest
        .spyOn(browserRuntimeUtils, 'getBrowserName')
        .mockReturnValue('chrome');
      selectors.getNetworkToAutomaticallySwitchTo.mockReturnValue(undefined);
      metamaskBaseSelectors.getIsUnlocked.mockImplementation(
        (state) => state.metamask.isUnlocked,
      );
      selectors.getFirstTimeFlowType.mockImplementation(
        (state) => state.metamask.firstTimeFlowType,
      );
      selectors.getIsSocialLoginFlow.mockImplementation(
        (state) => state.metamask.isSocialLoginFlow,
      );
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('dispatches the outdated-password check on the initial run when the wallet is unlocked', async () => {
      const checkIsSeedlessPasswordOutdatedAction = {
        type: 'CHECK_IS_SEEDLESS_PASSWORD_OUTDATED',
      };
      jest
        .spyOn(actions, 'checkIsSeedlessPasswordOutdated')
        .mockReturnValue(checkIsSeedlessPasswordOutdatedAction);

      const store = {
        getState: jest.fn().mockReturnValue({
          metamask: {
            browserEnvironment: {},
            isUnlocked: true,
            firstTimeFlowType: FirstTimeFlowType.socialCreate,
            isSocialLoginFlow: true,
          },
        }),
        dispatch: jest.fn().mockResolvedValue(undefined),
      };

      await runInitialActions(store);

      expect(actions.checkIsSeedlessPasswordOutdated).toHaveBeenCalledWith(
        false,
        false,
      );
      expect(store.dispatch).toHaveBeenCalledWith(
        checkIsSeedlessPasswordOutdatedAction,
      );
    });

    it('dispatches the outdated-password check on the interval tick when the wallet is unlocked', async () => {
      const checkIsSeedlessPasswordOutdatedAction = {
        type: 'CHECK_IS_SEEDLESS_PASSWORD_OUTDATED',
      };
      jest
        .spyOn(actions, 'checkIsSeedlessPasswordOutdated')
        .mockReturnValue(checkIsSeedlessPasswordOutdatedAction);

      const store = {
        getState: jest.fn().mockReturnValue({
          metamask: {
            browserEnvironment: {},
            isUnlocked: true,
            firstTimeFlowType: FirstTimeFlowType.socialCreate,
            isSocialLoginFlow: true,
          },
        }),
        dispatch: jest.fn().mockResolvedValue(undefined),
      };

      await runInitialActions(store);
      actions.checkIsSeedlessPasswordOutdated.mockClear();
      store.dispatch.mockClear();

      await jest.advanceTimersByTimeAsync(
        SEEDLESS_PASSWORD_OUTDATED_CHECK_INTERVAL_MS,
      );

      expect(actions.checkIsSeedlessPasswordOutdated).toHaveBeenCalledWith(
        false,
        false,
      );
      expect(store.dispatch).toHaveBeenCalledWith(
        checkIsSeedlessPasswordOutdatedAction,
      );
    });

    it('stops the outdated-password interval after reset to a non-social login flow', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const checkIsSeedlessPasswordOutdatedAction = {
        type: 'CHECK_IS_SEEDLESS_PASSWORD_OUTDATED',
      };
      jest
        .spyOn(actions, 'checkIsSeedlessPasswordOutdated')
        .mockReturnValue(checkIsSeedlessPasswordOutdatedAction);

      const store = {
        getState: jest
          .fn()
          .mockReturnValueOnce({
            metamask: {
              browserEnvironment: {},
              isUnlocked: true,
              firstTimeFlowType: FirstTimeFlowType.socialCreate,
              isSocialLoginFlow: true,
            },
          })
          .mockReturnValue({
            metamask: {
              browserEnvironment: {},
              isUnlocked: true,
              firstTimeFlowType: FirstTimeFlowType.create,
              isSocialLoginFlow: false,
            },
          }),
        dispatch: jest.fn().mockResolvedValue(undefined),
      };

      await runInitialActions(store);
      clearIntervalSpy.mockClear();
      actions.checkIsSeedlessPasswordOutdated.mockClear();
      store.dispatch.mockClear();
      store.getState.mockClear();

      await jest.advanceTimersByTimeAsync(
        SEEDLESS_PASSWORD_OUTDATED_CHECK_INTERVAL_MS,
      );

      expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
      expect(actions.checkIsSeedlessPasswordOutdated).not.toHaveBeenCalled();
      expect(store.dispatch).not.toHaveBeenCalled();
      expect(store.getState).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(
        SEEDLESS_PASSWORD_OUTDATED_CHECK_INTERVAL_MS,
      );

      expect(store.getState).toHaveBeenCalledTimes(1);
    });
  });

  describe('launchMetamaskUi', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest
        .spyOn(browserRuntimeUtils, 'getBrowserName')
        .mockReturnValue('chrome');
      selectors.getNetworkToAutomaticallySwitchTo.mockReturnValue(undefined);
      metamaskBaseSelectors.getIsUnlocked.mockReturnValue(false);
      mockRender.mockClear();
      window.stateHooks = {};
    });

    afterEach(() => {
      delete window.stateHooks;
      jest.clearAllTimers();
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    const launch = (onFirstCommit) =>
      launchMetamaskUi({
        activeTab: {},
        container: document.createElement('div'),
        backgroundConnection: { startSendingPatches: jest.fn() },
        traceContext: undefined,
        initialState: { ...defaultMockState.metamask, currentLocale: 'en' },
        onFirstCommit,
      });

    it('ends the First Render trace and calls onFirstCommit when React commits the root', async () => {
      const endTraceSpy = jest.spyOn(traceModule, 'endTrace');
      const onFirstCommit = jest.fn();

      await launch(onFirstCommit);

      expect(mockRender).toHaveBeenCalledTimes(1);
      expect(onFirstCommit).not.toHaveBeenCalled();
      expect(endTraceSpy).not.toHaveBeenCalledWith({
        name: traceModule.TraceName.FirstRender,
      });

      mockRender.mock.calls[0][0].props.onFirstCommit();

      expect(endTraceSpy).toHaveBeenCalledWith({
        name: traceModule.TraceName.FirstRender,
      });
      expect(onFirstCommit).toHaveBeenCalledTimes(1);
    });

    it('does not require an onFirstCommit callback', async () => {
      await launch(undefined);

      expect(() =>
        mockRender.mock.calls[0][0].props.onFirstCommit(),
      ).not.toThrow();
    });
  });
});
