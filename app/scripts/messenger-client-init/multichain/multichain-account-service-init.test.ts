import {
  AccountProviderWrapper,
  MultichainAccountService,
  MultichainAccountServiceMessenger,
} from '@metamask/multichain-account-service';
import {
  ActionConstraint,
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { MessengerClientInitRequest } from '../types';
import {
  getMultichainAccountServiceInitMessenger,
  getMultichainAccountServiceMessenger,
  MultichainAccountServiceInitMessenger,
} from '../messengers/accounts';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { MultichainAccountServiceInit } from './multichain-account-service-init';

jest.mock('@metamask/multichain-account-service');

const PREFERENCES_STATE = { useExternalServices: false };

function buildInitRequestMock(
  remoteFeatureFlags: Record<string, unknown> = {},
): jest.Mocked<
  MessengerClientInitRequest<
    MultichainAccountServiceMessenger,
    MultichainAccountServiceInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger<
    MockAnyNamespace,
    | PreferencesControllerGetStateAction
    | RemoteFeatureFlagControllerGetStateAction
    | ActionConstraint,
    never
  >({ namespace: MOCK_ANY_NAMESPACE });

  baseControllerMessenger.registerActionHandler(
    'PreferencesController:getState',
    jest.fn().mockReturnValue(PREFERENCES_STATE),
  );

  baseControllerMessenger.registerActionHandler(
    'RemoteFeatureFlagController:getState',
    jest.fn().mockReturnValue({
      remoteFeatureFlags,
    }),
  );

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getMultichainAccountServiceMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getMultichainAccountServiceInitMessenger(
      baseControllerMessenger,
    ),
  };
}

describe('MultichainAccountServiceInit', () => {
  const multichainAccountServiceClassMock = jest.mocked(
    MultichainAccountService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('return value', () => {
    it('returns controller as MultichainAccountService instance', () => {
      const requestMock = buildInitRequestMock();
      const result = MultichainAccountServiceInit(requestMock);

      expect(result.messengerClient).toBeInstanceOf(MultichainAccountService);
    });

    it('returns null memStateKey and persistedStateKey', () => {
      const requestMock = buildInitRequestMock();
      const result = MultichainAccountServiceInit(requestMock);

      expect(result.memStateKey).toBeNull();
      expect(result.persistedStateKey).toBeNull();
    });
  });

  describe('MultichainAccountService constructor', () => {
    it('is called with controller messenger, providers array, providerConfigs and config', () => {
      const requestMock = buildInitRequestMock();
      MultichainAccountServiceInit(requestMock);

      expect(multichainAccountServiceClassMock).toHaveBeenCalledWith({
        messenger: requestMock.controllerMessenger,
        providers: [expect.any(AccountProviderWrapper)],
        providerConfigs: expect.any(Object),
        config: expect.any(Object),
        ensureOnboardingComplete: requestMock.ensureOnboardingComplete,
      });
    });

    it('passes Solana provider config with maxConcurrency 1, discovery/createAccounts timeouts, and batched true', () => {
      const requestMock = buildInitRequestMock();
      MultichainAccountServiceInit(requestMock);

      const callArg = multichainAccountServiceClassMock.mock.calls[0][0];
      expect(callArg.providerConfigs).toMatchObject({
        Solana: {
          maxConcurrency: 1,
          discovery: {
            timeoutMs: 2000,
            maxAttempts: 3,
            backOffMs: 1000,
          },
          createAccounts: {
            timeoutMs: 3000,
          },
        },
      });
    });

    it('passes config with trace function', () => {
      const requestMock = buildInitRequestMock();
      MultichainAccountServiceInit(requestMock);

      const callArg = multichainAccountServiceClassMock.mock.calls[0][0];
      expect(callArg.config).toBeDefined();
      expect(typeof (callArg.config as { trace: unknown }).trace).toBe(
        'function',
      );
    });
  });

  describe('init messenger usage', () => {
    it('calls PreferencesController:getState during init', () => {
      const requestMock = buildInitRequestMock();
      const callSpy = jest.spyOn(
        requestMock.initMessenger,
        'call',
      ) as jest.Mock;

      MultichainAccountServiceInit(requestMock);

      expect(callSpy).toHaveBeenCalledWith('PreferencesController:getState');
    });
  });

  describe('subscriptions', () => {
    it('subscribes to PreferencesController:stateChange on initMessenger', () => {
      const requestMock = buildInitRequestMock();
      const subscribeSpy = jest.spyOn(requestMock.initMessenger, 'subscribe');

      MultichainAccountServiceInit(requestMock);

      expect(subscribeSpy).toHaveBeenCalledWith(
        'PreferencesController:stateChange',
        expect.any(Function),
      );
    });
  });

  describe('PreferencesController:stateChange handler', () => {
    it('calls setBasicFunctionality when useExternalServices changes', async () => {
      const requestMock = buildInitRequestMock();
      const subscribeSpy = jest.spyOn(requestMock.initMessenger, 'subscribe');

      const result = MultichainAccountServiceInit(requestMock);
      const setBasicFunctionalitySpy = jest
        .spyOn(result.messengerClient, 'setBasicFunctionality')
        .mockResolvedValue(undefined as never);

      const handler = subscribeSpy.mock.calls.find(
        (call) => call[0] === 'PreferencesController:stateChange',
      )?.[1];
      expect(handler).toBeDefined();

      await (handler as (payload: unknown) => Promise<boolean>)({
        useExternalServices: true,
      });

      expect(setBasicFunctionalitySpy).toHaveBeenCalledWith(true);
    });

    it('does not call setBasicFunctionality when useExternalServices is unchanged', async () => {
      const requestMock = buildInitRequestMock();
      const subscribeSpy = jest.spyOn(requestMock.initMessenger, 'subscribe');

      const result = MultichainAccountServiceInit(requestMock);
      const setBasicFunctionalitySpy = jest
        .spyOn(result.messengerClient, 'setBasicFunctionality')
        .mockResolvedValue(undefined as never);

      const handler = subscribeSpy.mock.calls.find(
        (call) => call[0] === 'PreferencesController:stateChange',
      )?.[1];
      expect(handler).toBeDefined();

      await (handler as (payload: unknown) => Promise<boolean>)({
        useExternalServices: false,
      });

      expect(setBasicFunctionalitySpy).not.toHaveBeenCalled();
    });
  });

  describe('Stellar provider', () => {
    const mockSetEnabled = jest.fn();
    const mockXlmProvider = {
      setEnabled: mockSetEnabled,
    } as unknown as AccountProviderWrapper;

    function getSubscriptionHandler(
      subscribeSpy: jest.SpyInstance,
      eventName: string,
    ) {
      const handler = subscribeSpy.mock.calls.find(
        (call) => call[0] === eventName,
      )?.[1];
      expect(handler).toBeDefined();
      return handler as (payload: unknown) => unknown;
    }

    beforeEach(() => {
      jest
        .mocked(AccountProviderWrapper)
        .mockImplementation(() => mockXlmProvider);
    });

    it('calls RemoteFeatureFlagController:getState during init', () => {
      const requestMock = buildInitRequestMock();
      const callSpy = jest.spyOn(
        requestMock.initMessenger,
        'call',
      ) as jest.Mock;

      MultichainAccountServiceInit(requestMock);

      expect(callSpy).toHaveBeenCalledWith(
        'RemoteFeatureFlagController:getState',
      );
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([true, false])(
      'sets XLM provider enabled to %s based on stellarAccounts feature flag',
      (enabled: boolean) => {
        MultichainAccountServiceInit(
          buildInitRequestMock({ stellarAccounts: enabled }),
        );

        expect(mockSetEnabled).toHaveBeenCalledWith(enabled);
      },
    );

    it('subscribes to RemoteFeatureFlagController:stateChange on initMessenger', () => {
      const requestMock = buildInitRequestMock();
      const subscribeSpy = jest.spyOn(requestMock.initMessenger, 'subscribe');

      MultichainAccountServiceInit(requestMock);

      expect(subscribeSpy).toHaveBeenCalledWith(
        'RemoteFeatureFlagController:stateChange',
        expect.any(Function),
      );
    });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      { initial: false, next: true, setEnabledCalls: 1, alignCalls: 1 },
      { initial: true, next: false, setEnabledCalls: 0, alignCalls: 0 },
      { initial: false, next: false, setEnabledCalls: 0, alignCalls: 0 },
      { initial: true, next: true, setEnabledCalls: 0, alignCalls: 0 },
    ])(
      'when feature flag goes from $initial to $next, setEnabled=$setEnabledCalls alignWallets=$alignCalls',
      async ({
        initial,
        next,
        setEnabledCalls,
        alignCalls,
      }: {
        initial: boolean;
        next: boolean;
        setEnabledCalls: number;
        alignCalls: number;
      }) => {
        const requestMock = buildInitRequestMock({
          stellarAccounts: initial,
        });
        const subscribeSpy = jest.spyOn(requestMock.initMessenger, 'subscribe');

        const result = MultichainAccountServiceInit(requestMock);
        const alignWalletsSpy = jest
          .spyOn(result.messengerClient, 'alignWallets')
          .mockResolvedValue(undefined as never);

        mockSetEnabled.mockClear();

        const handler = getSubscriptionHandler(
          subscribeSpy,
          'RemoteFeatureFlagController:stateChange',
        );

        await handler({
          remoteFeatureFlags: {
            stellarAccounts: next,
          },
        });

        expect(mockSetEnabled).toHaveBeenCalledTimes(setEnabledCalls);
        expect(alignWalletsSpy).toHaveBeenCalledTimes(alignCalls);
      },
    );
  });
});
