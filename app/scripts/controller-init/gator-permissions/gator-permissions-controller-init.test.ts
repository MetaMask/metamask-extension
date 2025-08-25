import { GatorPermissionsController } from '@metamask/gator-permissions-controller';
import { Messenger } from '@metamask/base-controller';
import { buildControllerInitRequestMock } from '../test/utils';
import type { ControllerInitRequest } from '../types';
import {
  type GatorPermissionsControllerMessenger,
  getGatorPermissionsControllerMessenger,
  getGatorPermissionsControllerInitMessenger,
  type GatorPermissionsControllerInitMessenger,
} from '../messengers/gator-permissions';
import { GatorPermissionsControllerInit } from './gator-permissions-controller-init';

jest.mock('@metamask/gator-permissions-controller');

function buildInitRequestMock(): jest.Mocked<
  ControllerInitRequest<
    GatorPermissionsControllerMessenger,
    GatorPermissionsControllerInitMessenger
  >
> {
  const baseControllerMessenger = new Messenger();
  const controllerMessenger = getGatorPermissionsControllerMessenger(
    baseControllerMessenger,
  );
  const initMessenger = getGatorPermissionsControllerInitMessenger(
    baseControllerMessenger,
  );

  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger,
    initMessenger,
  };
}

describe('GatorPermissionsControllerInit', () => {
  const GatorPermissionsControllerClassMock = jest.mocked(
    GatorPermissionsController,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns controller instance', () => {
    const requestMock = buildInitRequestMock();
    expect(
      GatorPermissionsControllerInit(requestMock).controller,
    ).toBeInstanceOf(GatorPermissionsController);
  });

  it('initializes with correct messenger and state', () => {
    const requestMock = buildInitRequestMock();
    GatorPermissionsControllerInit(requestMock);

    expect(GatorPermissionsControllerClassMock).toHaveBeenCalledWith({
      messenger: requestMock.controllerMessenger,
      state: requestMock.persistedState.GatorPermissionsController,
      config: {
        gatorPermissionsProviderSnapId: 'local:http://localhost:8082',
      },
    });
  });

  it('returns correct API methods', () => {
    const requestMock = buildInitRequestMock();
    const result = GatorPermissionsControllerInit(requestMock);

    expect(result.api).toEqual({
      enableGatorPermissions: expect.any(Function),
      disableGatorPermissions: expect.any(Function),
      fetchAndUpdateGatorPermissions: expect.any(Function),
    });
  });

  it('binds API methods to controller instance', () => {
    const requestMock = buildInitRequestMock();
    const result = GatorPermissionsControllerInit(requestMock);

    expect(typeof result.api.enableGatorPermissions).toBe('function');
    expect(typeof result.api.disableGatorPermissions).toBe('function');
    expect(typeof result.api.fetchAndUpdateGatorPermissions).toBe('function');
  });

  it('uses correct configuration', () => {
    const requestMock = buildInitRequestMock();
    GatorPermissionsControllerInit(requestMock);

    expect(GatorPermissionsControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        config: {
          gatorPermissionsProviderSnapId: 'local:http://localhost:8082',
        },
      }),
    );
  });

  it('passes persisted state correctly', () => {
    const requestMock = buildInitRequestMock();
    const mockGatorPermissionsControllerState = {
      isFetchingGatorPermissions: false,
      isGatorPermissionsEnabled: true,
      gatorPermissionsListStringify: JSON.stringify({
        'native-token-stream': {
          '0x1': [
            {
              permissionResponse: {
                chainId: '0x1',
                address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                expiry: 1750291200,
                isAdjustmentAllowed: true,
                signer: {
                  type: 'account',
                  data: {
                    address: '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63',
                  },
                },
                permission: {
                  type: 'native-token-stream',
                  data: {
                    maxAmount: '0x22b1c8c1227a0000',
                    initialAmount: '0x6f05b59d3b20000',
                    amountPerSecond: '0x6f05b59d3b20000',
                    startTime: 1747699200,
                    justification: 'Test',
                  },
                  rules: {},
                },
                context: '0x00000000',
                accountMeta: [],
                signerMeta: {},
              },
              siteOrigin: 'http://localhost:8000',
            },
          ],
        },
        'native-token-periodic': {},
        'erc20-token-stream': {},
      }),
    };
    const mockPersistedState = {
      GatorPermissionsController: mockGatorPermissionsControllerState,
    };
    requestMock.persistedState = mockPersistedState;

    GatorPermissionsControllerInit(requestMock);

    expect(GatorPermissionsControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        state: mockGatorPermissionsControllerState,
      }),
    );
    expect(
      Object.keys(GatorPermissionsControllerClassMock.mock.calls[0][0].state),
    ).toEqual([
      'isFetchingGatorPermissions',
      'isGatorPermissionsEnabled',
      'gatorPermissionsListStringify',
    ]);
  });

  it('handles undefined persisted state', () => {
    const requestMock = buildInitRequestMock();
    requestMock.persistedState = {};

    GatorPermissionsControllerInit(requestMock);

    expect(GatorPermissionsControllerClassMock).toHaveBeenCalledWith(
      expect.objectContaining({
        state: undefined,
      }),
    );
  });
});
