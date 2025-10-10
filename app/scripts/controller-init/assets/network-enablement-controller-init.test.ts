import { Messenger } from '@metamask/base-controller';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { buildControllerInitRequestMock } from '../test/utils';
import {
  NetworkEnablementController,
} from '@metamask/network-enablement-controller';
import { getNetworkEnablementControllerMessenger } from '../messengers/assets';
import { NetworkEnablementControllerInit } from './network-enablement-controller-init';
import { KnownCaipNamespace } from '@metamask/utils';
import { BtcScope, SolScope } from '@metamask/keyring-api';

jest.mock('@metamask/network-enablement-controller');

const originalEnv = process.env;

// Mock Type for testing purposes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockVar = any;

function buildInitRequestMock() {
  const baseControllerMessenger = new Messenger();
  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getNetworkEnablementControllerMessenger(
      baseControllerMessenger,
    ),
    initMessenger: undefined,
    getController: jest.fn(),
  };
}

describe('NetworkEnablementControllerInit', () => {
  const arrange = () => {
    const requestMock = buildInitRequestMock();

    requestMock.getController.mockImplementation((controllerName: string) => {
      if (controllerName === 'MultichainNetworkController') {
        return {
          state: {
            multichainNetworkConfigurationsByChainId: {
              [SolScope.Mainnet]: {},
              [BtcScope.Mainnet]: {},
            },
          },
        };
      }

      if (controllerName === 'NetworkController') {
        return {
          state: {
            networkConfigurationsByChainId: {
              [CHAIN_IDS.MAINNET]: {},
              [CHAIN_IDS.POLYGON]: {},
              [CHAIN_IDS.SEPOLIA]: {},
              [CHAIN_IDS.LOCALHOST]: {},
            },
          },
        };
      }
    });

    return {
      requestMock,
      controllerClassMock: jest.mocked(NetworkEnablementController),
    };
  };

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns controller instance', () => {
    const { requestMock, controllerClassMock } = arrange();
    const controllerMock = {} as NetworkEnablementController;
    controllerClassMock.mockReturnValue(controllerMock);
    const result = NetworkEnablementControllerInit(requestMock);

    expect(result.controller).toBe(controllerMock);
  });

  it('initialises the controller with the correct networks for prod environment', () => {
    process.env.METAMASK_DEBUG = '';
    process.env.METAMASK_ENVIRONMENT = 'production';
    process.env.IN_TEST = '';

    const { requestMock, controllerClassMock } = arrange();
    NetworkEnablementControllerInit(requestMock);

    expect(controllerClassMock).toHaveBeenCalledWith(expect.objectContaining({
      state: expect.objectContaining({
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            [CHAIN_IDS.MAINNET]: true,
            [CHAIN_IDS.POLYGON]: true,
            [CHAIN_IDS.SEPOLIA]: false,
            [CHAIN_IDS.LOCALHOST]: false,
          },
          [KnownCaipNamespace.Solana]: {
            [SolScope.Mainnet]: true,
          },
          [KnownCaipNamespace.Bip122]: {
            [BtcScope.Mainnet]: true,
          },
        },
      }),
    }))
  });

  it('initialises the controller with the correct networks for IN_TEST environment', () => {
    process.env.IN_TEST = 'true';

    const { requestMock, controllerClassMock } = arrange();
    NetworkEnablementControllerInit(requestMock);

    expect(controllerClassMock).toHaveBeenCalledWith(expect.objectContaining({
      state: expect.objectContaining({
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            [CHAIN_IDS.MAINNET]: false,
            [CHAIN_IDS.POLYGON]: false,
            [CHAIN_IDS.SEPOLIA]: false,
            [CHAIN_IDS.LOCALHOST]: true,
          },
          [KnownCaipNamespace.Solana]: {
            [SolScope.Mainnet]: false,
          },
          [KnownCaipNamespace.Bip122]: {
            [BtcScope.Mainnet]: false,
          },
        },
      }),
    }))
  });

  it('initialises the controller with the correct networks for DEBUG environment', () => {
    process.env.METAMASK_DEBUG = 'true';
    process.env.METAMASK_ENVIRONMENT = 'production';
    process.env.IN_TEST = '';

    const { requestMock, controllerClassMock } = arrange();
    NetworkEnablementControllerInit(requestMock);

    expect(controllerClassMock).toHaveBeenCalledWith(expect.objectContaining({
      state: expect.objectContaining({
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            [CHAIN_IDS.MAINNET]: false,
            [CHAIN_IDS.POLYGON]: false,
            [CHAIN_IDS.SEPOLIA]: true,
            [CHAIN_IDS.LOCALHOST]: false,
          },
          [KnownCaipNamespace.Solana]: {
            [SolScope.Mainnet]: false,
          },
          [KnownCaipNamespace.Bip122]: {
            [BtcScope.Mainnet]: false,
          },
        },
      }),
    }))
  });

  it('initialises the controller with the correct networks for test environment', () => {
    process.env.METAMASK_DEBUG = '';
    process.env.METAMASK_ENVIRONMENT = 'test';
    process.env.IN_TEST = '';

    const { requestMock, controllerClassMock } = arrange();
    NetworkEnablementControllerInit(requestMock);

    expect(controllerClassMock).toHaveBeenCalledWith(expect.objectContaining({
      state: expect.objectContaining({
        enabledNetworkMap: {
          [KnownCaipNamespace.Eip155]: {
            [CHAIN_IDS.MAINNET]: false,
            [CHAIN_IDS.POLYGON]: false,
            [CHAIN_IDS.SEPOLIA]: true,
            [CHAIN_IDS.LOCALHOST]: false,
          },
          [KnownCaipNamespace.Solana]: {
            [SolScope.Mainnet]: false,
          },
          [KnownCaipNamespace.Bip122]: {
            [BtcScope.Mainnet]: false,
          },
        },
      }),
    }))
  });
});
