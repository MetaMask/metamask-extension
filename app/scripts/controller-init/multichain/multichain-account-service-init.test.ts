import { MultichainAccountService } from '@metamask/multichain-account-service';
import {
  ActionConstraint,
  MOCK_ANY_NAMESPACE,
  Messenger,
  MockAnyNamespace,
} from '@metamask/messenger';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  getMultichainAccountServiceInitMessenger,
  getMultichainAccountServiceMessenger,
  MultichainAccountServiceInitMessenger,
  MultichainAccountServiceMessenger,
} from '../messengers/accounts';
import { PreferencesControllerGetStateAction } from '../../controllers/preferences-controller';
import { MultichainAccountServiceInit } from './multichain-account-service-init';

jest.mock('@metamask/multichain-account-service');

const PREFERENCES_STATE = { useExternalServices: false };

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
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
    jest.fn().mockReturnValue({}),
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

      expect(result.controller).toBeInstanceOf(MultichainAccountService);
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
        providers: expect.any(Array),
        providerConfigs: expect.any(Object),
        config: expect.any(Object),
      });
    });

    it('passes Solana provider config with maxConcurrency 1 and discovery/createAccounts timeouts', () => {
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

    it('subscribes to RemoteFeatureFlagController:stateChange on controllerMessenger', () => {
      const requestMock = buildInitRequestMock();
      const subscribeSpy = jest.spyOn(
        requestMock.controllerMessenger,
        'subscribe',
      );

      MultichainAccountServiceInit(requestMock);

      expect(subscribeSpy).toHaveBeenCalledWith(
        'RemoteFeatureFlagController:stateChange',
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
        .spyOn(result.controller, 'setBasicFunctionality')
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
        .spyOn(result.controller, 'setBasicFunctionality')
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
});
