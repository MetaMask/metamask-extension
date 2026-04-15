import { Caip25CaveatType } from '@metamask/chain-agnostic-permission';
import { PermissionController } from '@metamask/permission-controller';
import * as permissions from '../controllers/permissions';
import { getRootMessenger } from '../lib/messenger';
import type {
  MessengerClientByName,
  MessengerClientInitRequest,
  MessengerClientName,
} from './types';
import { buildControllerInitRequestMock } from './test/utils';
import {
  getPermissionControllerInitMessenger,
  getPermissionControllerMessenger,
  PermissionControllerInitMessenger,
  PermissionControllerMessenger,
} from './messengers';
import { PermissionControllerInit } from './permission-controller-init';

jest.mock('@metamask/permission-controller');

jest.mock('../controllers/permissions', () => {
  const actual = jest.requireActual<
    typeof import('../controllers/permissions')
  >('../controllers/permissions');
  return {
    ...actual,
    getCaveatSpecifications: jest.fn((deps) =>
      actual.getCaveatSpecifications(deps),
    ),
  };
});

function getInitRequestMock(): jest.Mocked<
  MessengerClientInitRequest<
    PermissionControllerMessenger,
    PermissionControllerInitMessenger
  >
> {
  const baseMessenger = getRootMessenger<never, never>();

  const requestMock = {
    ...buildControllerInitRequestMock(),
    controllerMessenger: getPermissionControllerMessenger(baseMessenger),
    initMessenger: getPermissionControllerInitMessenger(baseMessenger),
  };

  requestMock.getMessengerClient.mockImplementation(
    (name: MessengerClientName) => {
      if (name === 'ApprovalController') {
        return {
          addAndShowApprovalRequest: jest.fn(),
        } as unknown as MessengerClientByName['ApprovalController'];
      }

      if (name === 'KeyringController') {
        return {
          addNewKeyring: jest.fn(),
        } as unknown as MessengerClientByName['KeyringController'];
      }

      throw new Error(`Controller "${String(name)}" not found.`);
    },
  );

  return requestMock;
}

describe('PermissionControllerInit', () => {
  it('initializes the controller', () => {
    const { messengerClient } = PermissionControllerInit(getInitRequestMock());
    expect(messengerClient).toBeInstanceOf(PermissionController);
  });

  it('passes the proper arguments to the controller', () => {
    PermissionControllerInit(getInitRequestMock());

    const controllerMock = jest.mocked(PermissionController);
    expect(controllerMock).toHaveBeenCalledWith({
      messenger: expect.any(Object),
      state: undefined,
      caveatSpecifications: expect.any(Object),
      permissionSpecifications: expect.any(Object),
      unrestrictedMethods: expect.any(Array),
    });
  });

  it('passes persisted PermissionController state when present', () => {
    jest.mocked(PermissionController).mockClear();
    const request = getInitRequestMock();
    const permissionState = { subjects: {} };
    request.persistedState = {
      PermissionController: permissionState,
    };

    PermissionControllerInit(request);

    const constructorArgs = jest
      .mocked(PermissionController)
      .mock.calls.at(-1)?.[0];
    expect(constructorArgs?.state).toBe(permissionState);
  });

  it('includes CAIP-25 caveat specification in caveatSpecifications passed to PermissionController', () => {
    jest.mocked(PermissionController).mockClear();
    PermissionControllerInit(getInitRequestMock());
    const caveatSpecifications = jest.mocked(PermissionController).mock
      .calls[0][0].caveatSpecifications as Record<string, unknown>;
    expect(caveatSpecifications).toHaveProperty(Caip25CaveatType);
  });

  it('forwards initMessenger actions through caveat dependency hooks', () => {
    jest.mocked(permissions.getCaveatSpecifications).mockClear();

    const request = getInitRequestMock();
    const callMock = jest.spyOn(request.initMessenger, 'call');

    callMock.mockImplementation((action: string, ...args: unknown[]) => {
      if (action === 'AccountsController:listAccounts') {
        return [{ type: 'eip155:evm', address: '0xabc' }];
      }
      if (action === 'NetworkController:findNetworkClientIdByChainId') {
        return 'mainnet-client-id';
      }
      if (action === 'MultichainRoutingService:isSupportedScope') {
        return true;
      }
      if (action === 'MultichainRoutingService:getSupportedAccounts') {
        return ['bip122:abc'];
      }
      return undefined;
    });

    try {
      PermissionControllerInit(request);

      const deps = jest.mocked(permissions.getCaveatSpecifications).mock
        .calls[0][0] as Parameters<
        typeof permissions.getCaveatSpecifications
      >[0];

      expect(deps.listAccounts()).toStrictEqual([
        { type: 'eip155:evm', address: '0xabc' },
      ]);
      expect(deps.findNetworkClientIdByChainId('0x1')).toBe(
        'mainnet-client-id',
      );
      expect(deps.isNonEvmScopeSupported('eip155:0')).toBe(true);
      expect(deps.getNonEvmAccountAddresses('eip155:0')).toStrictEqual([
        'bip122:abc',
      ]);

      expect(callMock).toHaveBeenCalledWith('AccountsController:listAccounts');
      expect(callMock).toHaveBeenCalledWith(
        'NetworkController:findNetworkClientIdByChainId',
        '0x1',
      );
      expect(callMock).toHaveBeenCalledWith(
        'MultichainRoutingService:isSupportedScope',
        'eip155:0',
      );
      expect(callMock).toHaveBeenCalledWith(
        'MultichainRoutingService:getSupportedAccounts',
        'eip155:0',
      );
    } finally {
      callMock.mockRestore();
    }
  });
});
