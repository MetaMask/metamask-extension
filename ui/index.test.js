import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { setupLocale } from '../shared/lib/error-utils';
import { FirstTimeFlowType } from '../shared/constants/onboarding';
import * as browserRuntimeUtils from '../shared/lib/browser-runtime.utils';
import * as actions from './store/actions';
import * as selectors from './selectors';
import * as metamaskSelectors from './ducks/metamask/metamask';
import { SEEDLESS_PASSWORD_OUTDATED_CHECK_INTERVAL_MS } from './constants';
import { getCleanAppState, runInitialActions } from '.';

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
  sendBugReport: {
    message: 'Send us a bug report.',
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
  sendBugReport: {
    message: 'Envíenos un informe de errores.',
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

jest.mock('./ducks/metamask/metamask', () => ({
  ...jest.requireActual('./ducks/metamask/metamask'),
  getIsUnlocked: jest.fn(),
}));

describe('Index Tests', () => {
  afterAll(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
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

    expect(clm.sendBugReport).toStrictEqual(enMessages.sendBugReport);

    result = await setupLocale('es');

    const { currentLocaleMessages: clm2, enLocaleMessages: elm2 } = result;
    expect(clm2).toBeDefined();
    expect(elm2).toBeDefined();

    expect(clm2.troubleStarting).toStrictEqual(esMessages.troubleStarting);

    expect(clm2.restartMetamask).toStrictEqual(esMessages.restartMetamask);

    expect(clm2.stillGettingMessage).toBeUndefined();
    expect(elm2.stillGettingMessage).toStrictEqual(
      enMessages.stillGettingMessage,
    );

    expect(clm2.sendBugReport).toStrictEqual(esMessages.sendBugReport);
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

  describe('runInitialActions', () => {
    beforeEach(() => {
      jest.useFakeTimers();

      jest
        .spyOn(browserRuntimeUtils, 'getBrowserName')
        .mockReturnValue('chrome');
      selectors.getNetworkToAutomaticallySwitchTo.mockReturnValue(undefined);
      metamaskSelectors.getIsUnlocked.mockImplementation(
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
});
