import { ActionConstraint, Messenger } from '@metamask/base-controller';
import { AssetsContractController } from '@metamask/assets-controllers';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import { buildControllerInitRequestMock, CHAIN_ID_MOCK } from '../test/utils';
import { ControllerInitRequest } from '../types';
import {
  AssetsContractControllerInitMessenger,
  AssetsContractControllerMessenger,
  getAssetsContractControllerInitMessenger,
  getAssetsContractControllerMessenger,
} from '../messengers/assets';
import { AssetsContractControllerInit } from './assets-contract-controller-init';

jest.mock('@metamask/assets-controllers');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    AssetsContractControllerMessenger,
    AssetsContractControllerInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger<
    | NetworkControllerGetNetworkClientByIdAction
    | NetworkControllerGetStateAction
    | ActionConstraint,
    never
  >();

  baseControllerMessenger.registerActionHandler(
    'NetworkController:getNetworkClientById',
    // @ts-expect-error: Partial mock.
    (id: string) => {
      if (id === 'mainnet') {
        return {
          configuration: { chainId: CHAIN_ID_MOCK },
        };
      }

      throw new Error('Unknown network client ID');
    },
  );

  baseControllerMessenger.registerActionHandler(
    'NetworkController:getState',
    () => ({
      selectedNetworkClientId: 'mainnet',
      networkConfigurationsByChainId: {},
      networksMetadata: {},
    }),
  );

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getAssetsContractControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: getAssetsContractControllerInitMessenger(
      baseControllerMessenger,
    ),
  };
}

describe('AssetsContractControllerInit', () => {
  const assetsContractControllerClassMock = jest.mocked(
    AssetsContractController,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(AssetsContractControllerInit(requestMock).controller).toBeInstanceOf(
      AssetsContractController,
    );
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    AssetsContractControllerInit(requestMock);

    expect(assetsContractControllerClassMock).toHaveBeenCalled();
  });
});
