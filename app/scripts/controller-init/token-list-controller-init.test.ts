import { Messenger, ActionConstraint } from '@metamask/base-controller';
import { TokenListController } from '@metamask/assets-controllers';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
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

jest.mock('@metamask/assets-controllers');

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    TokenListControllerMessenger,
    TokenListControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<
    | NetworkControllerGetStateAction
    | NetworkControllerGetNetworkClientByIdAction
    | PreferencesControllerGetStateAction
    | ActionConstraint,
    never
  >();

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
      preventPollingOnNetworkRestart: false,
    });
  });
});
