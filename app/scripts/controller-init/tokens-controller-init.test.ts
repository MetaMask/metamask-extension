import { Messenger, ActionConstraint } from '@metamask/base-controller';
import { TokensController } from '@metamask/assets-controllers';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetSelectedNetworkClientAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import { ControllerInitRequest } from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getTokensControllerInitMessenger,
  getTokensControllerMessenger,
  TokensControllerInitMessenger,
  TokensControllerMessenger,
} from './messengers';
import { TokensControllerInit } from './tokens-controller-init';

jest.mock('@metamask/assets-controllers');

const MOCK_PROVIDER = jest.fn();

function getInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    TokensControllerMessenger,
    TokensControllerInitMessenger
  >
> {
  const baseMessenger = new Messenger<
    | NetworkControllerGetStateAction
    | NetworkControllerGetNetworkClientByIdAction
    | NetworkControllerGetSelectedNetworkClientAction
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

  baseMessenger.registerActionHandler(
    'NetworkController:getSelectedNetworkClient',
    () => ({
      // @ts-expect-error: Partial mock.
      provider: MOCK_PROVIDER,
    }),
  );

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getTokensControllerMessenger(baseMessenger),
    initMessenger: getTokensControllerInitMessenger(baseMessenger),
  };

  return requestMock;
}

describe('TokensControllerInit', () => {
  it('initializes the controller', () => {
    const { controller } = TokensControllerInit(getInitRequestMock());
    expect(controller).toBeInstanceOf(TokensController);
  });

  it('passes the proper arguments to the controller', () => {
    TokensControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(TokensController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      chainId: '0x1',
      provider: MOCK_PROVIDER,
    });
  });
});
