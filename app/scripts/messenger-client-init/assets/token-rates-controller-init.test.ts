import {
  TokenRatesController,
  TokenRatesControllerMessenger,
} from '@metamask/assets-controllers';
import { PreferencesController } from '@metamask/preferences-controller';
import {
  Messenger,
  ActionConstraint,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  getTokenRatesControllerInitMessenger,
  getTokenRatesControllerMessenger,
  TokenRatesControllerInitMessenger,
} from '../messengers/assets';
import { OnboardingControllerGetStateAction } from '../../controllers/onboarding';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { TokenRatesControllerInit } from './token-rates-controller-init';

jest.mock('@metamask/assets-controllers');

/**
 * Build a mock PreferencesController.
 * This returns a partial mock that includes the state property expected by the TokenRatesController (for example, `useCurrencyRateCheck`).
 *
 * @param {Partial<PreferencesController>} partialMock - The partial mock to be merged with the default mock.
 * @returns {PreferencesController} The mock PreferencesController.
 */

function buildControllerMock(
  partialMock?: Partial<PreferencesController>,
): PreferencesController {
  const defaultPreferencesControllerMock = {
    state: { useCurrencyRateCheck: true },
  };

  // @ts-expect-error Incomplete mock, just includes properties used by code-under-test.
  return {
    ...defaultPreferencesControllerMock,
    ...partialMock,
  };
}

/**
 * Build a mock init request.
 *
 * Notice that we also mock the getController method to return the
 * stubbed PreferencesController.
 *
 * @param options - Test configuration options.
 * @param options.useCurrencyRateCheck - Whether the currency rate check preference is enabled (default: true).
 * @param options.completedOnboarding - Whether onboarding is completed (default: true).
 */
function buildInitRequestMock(
  options: {
    useCurrencyRateCheck?: boolean;
    completedOnboarding?: boolean;
  } = {},
): {
  requestMock: jest.Mocked<
    MessengerClientInitRequest<
      TokenRatesControllerMessenger,
      TokenRatesControllerInitMessenger
    >
  >;
  preferencesGetStateMock: jest.Mock;
  onboardingGetStateMock: jest.Mock;
} {
  const { useCurrencyRateCheck = true, completedOnboarding = true } = options;

  const baseControllerMessenger = new Messenger<
    MockAnyNamespace,
    | PreferencesControllerGetStateAction
    | OnboardingControllerGetStateAction
    | ActionConstraint,
    never
  >({
    namespace: MOCK_ANY_NAMESPACE,
  });

  const preferencesGetStateMock = jest
    .fn()
    .mockReturnValue({ useCurrencyRateCheck });
  const onboardingGetStateMock = jest
    .fn()
    .mockReturnValue({ completedOnboarding });

  baseControllerMessenger.registerActionHandler(
    'PreferencesController:getState',
    preferencesGetStateMock,
  );
  baseControllerMessenger.registerActionHandler(
    'OnboardingController:getState',
    onboardingGetStateMock,
  );

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getTokenRatesControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getTokenRatesControllerInitMessenger(
      baseControllerMessenger,
    ),
  };

  // @ts-expect-error Incomplete mock, just includes properties used by code-under-test.
  requestMock.getMessengerClient.mockReturnValue(buildControllerMock());

  return { requestMock, preferencesGetStateMock, onboardingGetStateMock };
}

describe('TokenRatesControllerInit', () => {
  const tokenRatesControllerClassMock = jest.mocked(TokenRatesController);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const { requestMock } = buildInitRequestMock();
    expect(
      TokenRatesControllerInit(requestMock).messengerClient,
    ).toBeInstanceOf(TokenRatesController);
  });

  it('initializes with correct messenger and state', () => {
    const { requestMock } = buildInitRequestMock();
    TokenRatesControllerInit(requestMock);

    expect(tokenRatesControllerClassMock).toHaveBeenCalled();
  });

  it('initializes the controller enabled when onboarding is completed and useCurrencyRateCheck is enabled', () => {
    const { requestMock } = buildInitRequestMock({
      useCurrencyRateCheck: true,
      completedOnboarding: true,
    });
    TokenRatesControllerInit(requestMock);

    expect(tokenRatesControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: false }),
    );
  });

  it('initializes the controller disabled during onboarding even when useCurrencyRateCheck is enabled', () => {
    const { requestMock } = buildInitRequestMock({
      useCurrencyRateCheck: true,
      completedOnboarding: false,
    });
    TokenRatesControllerInit(requestMock);

    expect(tokenRatesControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: true }),
    );
  });

  it('initializes the controller disabled when useCurrencyRateCheck is disabled', () => {
    const { requestMock } = buildInitRequestMock({
      useCurrencyRateCheck: false,
      completedOnboarding: true,
    });
    TokenRatesControllerInit(requestMock);

    expect(tokenRatesControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: true }),
    );
  });

  describe('enable/disable subscriptions', () => {
    /**
     * Build an init request whose `initMessenger.subscribe` is replaced with a
     * jest mock so tests can capture and invoke the registered handlers
     * directly, bypassing the messenger's namespace-prefixed publish
     * restriction.
     *
     * @param options - Test configuration options.
     * @param options.useCurrencyRateCheck - Whether the currency rate check preference is enabled.
     * @param options.completedOnboarding - Whether onboarding is completed.
     */
    function setupSubscriptionTest(options: {
      useCurrencyRateCheck?: boolean;
      completedOnboarding?: boolean;
    }) {
      const { requestMock, preferencesGetStateMock, onboardingGetStateMock } =
        buildInitRequestMock(options);
      const subscribeMock = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (requestMock.initMessenger as any).subscribe = subscribeMock;

      const { messengerClient } = TokenRatesControllerInit(requestMock);

      const getHandler = (event: string) => {
        const subscription = subscribeMock.mock.calls.find(
          ([subscribedEvent]) => subscribedEvent === event,
        );
        if (!subscription) {
          throw new Error(`No subscription found for ${event}`);
        }
        return subscription[1];
      };

      return {
        messengerClient,
        preferencesGetStateMock,
        onboardingGetStateMock,
        getHandler,
      };
    }

    it('enables the controller when onboarding completes with useCurrencyRateCheck enabled', () => {
      const { messengerClient, onboardingGetStateMock, getHandler } =
        setupSubscriptionTest({
          useCurrencyRateCheck: true,
          completedOnboarding: false,
        });
      const onOnboardingStateChange = getHandler(
        'OnboardingController:stateChange',
      );

      // Simulate onboarding completing
      onboardingGetStateMock.mockReturnValue({ completedOnboarding: true });
      onOnboardingStateChange(true);

      expect(messengerClient.enable).toHaveBeenCalled();
      expect(messengerClient.disable).not.toHaveBeenCalled();
    });

    it('keeps the controller disabled when onboarding completes with useCurrencyRateCheck disabled', () => {
      const {
        messengerClient,
        preferencesGetStateMock,
        onboardingGetStateMock,
        getHandler,
      } = setupSubscriptionTest({
        useCurrencyRateCheck: true,
        completedOnboarding: false,
      });
      const onPreferencesStateChange = getHandler(
        'PreferencesController:stateChange',
      );
      const onOnboardingStateChange = getHandler(
        'OnboardingController:stateChange',
      );

      // Simulate the user turning basic functionality off during onboarding,
      // then completing onboarding (matching the flow in issue #43998).
      preferencesGetStateMock.mockReturnValue({ useCurrencyRateCheck: false });
      onPreferencesStateChange({ useCurrencyRateCheck: false });
      onboardingGetStateMock.mockReturnValue({ completedOnboarding: true });
      onOnboardingStateChange(true);

      expect(messengerClient.enable).not.toHaveBeenCalled();
      expect(messengerClient.disable).toHaveBeenCalled();
    });

    it('does not enable the controller when useCurrencyRateCheck turns on during onboarding', () => {
      const { messengerClient, preferencesGetStateMock, getHandler } =
        setupSubscriptionTest({
          useCurrencyRateCheck: false,
          completedOnboarding: false,
        });
      const onPreferencesStateChange = getHandler(
        'PreferencesController:stateChange',
      );

      preferencesGetStateMock.mockReturnValue({ useCurrencyRateCheck: true });
      onPreferencesStateChange({ useCurrencyRateCheck: true });

      expect(messengerClient.enable).not.toHaveBeenCalled();
      expect(messengerClient.disable).toHaveBeenCalled();
    });

    it('toggles the controller when useCurrencyRateCheck changes after onboarding', () => {
      const { messengerClient, preferencesGetStateMock, getHandler } =
        setupSubscriptionTest({
          useCurrencyRateCheck: true,
          completedOnboarding: true,
        });
      const onPreferencesStateChange = getHandler(
        'PreferencesController:stateChange',
      );

      preferencesGetStateMock.mockReturnValue({ useCurrencyRateCheck: false });
      onPreferencesStateChange({ useCurrencyRateCheck: false });
      expect(messengerClient.disable).toHaveBeenCalled();

      preferencesGetStateMock.mockReturnValue({ useCurrencyRateCheck: true });
      onPreferencesStateChange({ useCurrencyRateCheck: true });
      expect(messengerClient.enable).toHaveBeenCalled();
    });
  });
});
