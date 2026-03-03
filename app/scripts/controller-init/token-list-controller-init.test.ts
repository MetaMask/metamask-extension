import { TokenListController } from '@metamask/assets-controllers';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import {
  Messenger,
  ActionConstraint,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import { PreferencesControllerGetStateAction } from '../controllers/preferences-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getTokenListControllerInitMessenger,
  getTokenListControllerMessenger,
  TokenListControllerInitMessenger,
  TokenListControllerMessenger,
} from './messengers';
import { TokenListControllerInit } from './token-list-controller-init';

jest.mock('@metamask/assets-controllers', () => {
  return {
    TokenListController: jest.fn().mockImplementation(function (this: {
      initialize: jest.Mock;
      _executePoll: jest.Mock;
    }) {
      this.initialize = jest.fn().mockResolvedValue(undefined);
      this._executePoll = jest.fn().mockResolvedValue(undefined);
    }),
  };
});

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    TokenListControllerMessenger,
    TokenListControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<
    MockAnyNamespace,
    | NetworkControllerGetStateAction
    | NetworkControllerGetNetworkClientByIdAction
    | PreferencesControllerGetStateAction
    | ActionConstraint,
    never
  >({
    namespace: MOCK_ANY_NAMESPACE,
  });

  baseMessenger.registerActionHandler('NetworkController:getState', () => ({
    selectedNetworkClientId: 'mainnet',
    networkConfigurationsByChainId: {},
    networksMetadata: {},
  }));

  baseMessenger.registerActionHandler(
    'NetworkController:getNetworkClientById',
    // @ts-expect-error: Partial mock.
    (id: string) => {
      if (id === 'mainnet') {
        return {
          configuration: { chainId: '0x1' },
        };
      }

      throw new Error('Unknown network client ID');
    },
  );

  baseMessenger.registerActionHandler('PreferencesController:getState', () => ({
    useTokenDetection: true,
    useExternalServices: true,
    // @ts-expect-error: Partial mock.
    preferences: { petnamesEnabled: false },
    useTransactionSimulations: false,
  }));

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getTokenListControllerMessenger(baseMessenger),
    initMessenger: getTokenListControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('TokenListControllerInit', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes the controller', () => {
    const { controller } = TokenListControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(TokenListController);
  });

  it('passes the proper arguments to the controller', () => {
    TokenListControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(TokenListController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      chainId: '0x1',
    });
  });

  it('waits for initialize to finish before executing poll', async () => {
    let resolveInitialize: (() => void) | undefined;
    const initializePromise = new Promise<void>((resolve) => {
      resolveInitialize = resolve;
    });
    const executePollMock = jest.fn().mockResolvedValue(undefined);

    const controllerMock = jest.mocked(TokenListController);
    controllerMock.mockImplementationOnce(function (this: {
      initialize: jest.Mock;
      _executePoll: jest.Mock;
    }) {
      this.initialize = jest.fn().mockReturnValue(initializePromise);
      this._executePoll = executePollMock;
      return this as unknown as TokenListController;
    });

    const { controller } = TokenListControllerInit(getInitRequestMock());
    const pollPromise = controller._executePoll({ chainId: '0x1' });

    expect(executePollMock).not.toHaveBeenCalled();

    resolveInitialize?.();
    await pollPromise;

    expect(executePollMock).toHaveBeenCalledWith({ chainId: '0x1' });
  });

  it('continues polling even if initialize fails', async () => {
    const initializeError = new Error('initialize failed');
    const executePollMock = jest.fn().mockResolvedValue(undefined);
    const consoleErrorMock = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const controllerMock = jest.mocked(TokenListController);
    controllerMock.mockImplementationOnce(function (this: {
      initialize: jest.Mock;
      _executePoll: jest.Mock;
    }) {
      this.initialize = jest.fn().mockRejectedValue(initializeError);
      this._executePoll = executePollMock;
      return this as unknown as TokenListController;
    });

    const { controller } = TokenListControllerInit(getInitRequestMock());
    await controller._executePoll({ chainId: '0x1' });

    expect(consoleErrorMock).toHaveBeenCalledWith(
      'TokenListController: Failed to initialize from storage:',
      initializeError,
    );
    expect(executePollMock).toHaveBeenCalledWith({ chainId: '0x1' });
  });
});
