import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import { getPermissionBackgroundApiMethods } from './background-api';
import { CaveatFactories, PermissionNames } from './specifications';

describe('permission background API methods', () => {
  const getEthAccountsPermissions = (accounts) => ({
    [RestrictedMethods.eth_accounts]: {
      caveats: [CaveatFactories.restrictReturnedAccounts(accounts)],
    },
  });

  const getPermittedChainsPermissions = (chainIds) => ({
    [PermissionNames.permittedChains]: {
      caveats: [CaveatFactories.restrictNetworkSwitching(chainIds)],
    },
  });

  describe('addPermittedAccount', () => {
    it('calls grantPermissionsIncremental with expected parameters', () => {
      const permissionController = {
        grantPermissionsIncremental: jest.fn(),
      };

      getPermissionBackgroundApiMethods(
        permissionController,
      ).addPermittedAccount('foo.com', '0x1');

      expect(
        permissionController.grantPermissionsIncremental,
      ).toHaveBeenCalledTimes(1);
      expect(
        permissionController.grantPermissionsIncremental,
      ).toHaveBeenCalledWith({
        subject: { origin: 'foo.com' },
        approvedPermissions: getEthAccountsPermissions(['0x1']),
      });
    });
  });

  describe('addPermittedAccounts', () => {
    it('calls grantPermissionsIncremental with expected parameters for single account', () => {
      const permissionController = {
        grantPermissionsIncremental: jest.fn(),
      };

      getPermissionBackgroundApiMethods(
        permissionController,
      ).addPermittedAccounts('foo.com', ['0x1']);

      expect(
        permissionController.grantPermissionsIncremental,
      ).toHaveBeenCalledTimes(1);
      expect(
        permissionController.grantPermissionsIncremental,
      ).toHaveBeenCalledWith({
        subject: { origin: 'foo.com' },
        approvedPermissions: getEthAccountsPermissions(['0x1']),
      });
    });

    it('calls grantPermissionsIncremental with expected parameters with multiple accounts', () => {
      const permissionController = {
        grantPermissionsIncremental: jest.fn(),
      };

      getPermissionBackgroundApiMethods(
        permissionController,
      ).addPermittedAccounts('foo.com', ['0x1', '0x2']);

      expect(
        permissionController.grantPermissionsIncremental,
      ).toHaveBeenCalledTimes(1);
      expect(
        permissionController.grantPermissionsIncremental,
      ).toHaveBeenCalledWith({
        subject: { origin: 'foo.com' },
        approvedPermissions: getEthAccountsPermissions(['0x1', '0x2']),
      });
    });
  });

  describe('removePermittedAccount', () => {
    it('removes a permitted account', () => {
      const permissionController = {
        getCaveat: jest.fn().mockImplementationOnce(() => {
          return {
            type: CaveatTypes.restrictReturnedAccounts,
            value: ['0x1', '0x2'],
          };
        }),
        revokePermission: jest.fn(),
        updateCaveat: jest.fn(),
      };

      getPermissionBackgroundApiMethods(
        permissionController,
      ).removePermittedAccount('foo.com', '0x2');

      expect(permissionController.getCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.getCaveat).toHaveBeenCalledWith(
        'foo.com',
        RestrictedMethods.eth_accounts,
        CaveatTypes.restrictReturnedAccounts,
      );

      expect(permissionController.revokePermission).not.toHaveBeenCalled();

      expect(permissionController.updateCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        RestrictedMethods.eth_accounts,
        CaveatTypes.restrictReturnedAccounts,
        ['0x1'],
      );
    });

    it('revokes the accounts permission if the removed account is the only permitted account', () => {
      const permissionController = {
        getCaveat: jest.fn().mockImplementationOnce(() => {
          return {
            type: CaveatTypes.restrictReturnedAccounts,
            value: ['0x1'],
          };
        }),
        revokePermission: jest.fn(),
        updateCaveat: jest.fn(),
      };

      getPermissionBackgroundApiMethods(
        permissionController,
      ).removePermittedAccount('foo.com', '0x1');

      expect(permissionController.getCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.getCaveat).toHaveBeenCalledWith(
        'foo.com',
        RestrictedMethods.eth_accounts,
        CaveatTypes.restrictReturnedAccounts,
      );

      expect(permissionController.revokePermission).toHaveBeenCalledTimes(1);
      expect(permissionController.revokePermission).toHaveBeenCalledWith(
        'foo.com',
        RestrictedMethods.eth_accounts,
      );

      expect(permissionController.updateCaveat).not.toHaveBeenCalled();
    });

    it('does not call permissionController.updateCaveat if the specified account is not permitted', () => {
      const permissionController = {
        getCaveat: jest.fn().mockImplementationOnce(() => {
          return { type: CaveatTypes.restrictReturnedAccounts, value: ['0x1'] };
        }),
        revokePermission: jest.fn(),
        updateCaveat: jest.fn(),
      };

      getPermissionBackgroundApiMethods(
        permissionController,
      ).removePermittedAccount('foo.com', '0x2');
      expect(permissionController.getCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.getCaveat).toHaveBeenCalledWith(
        'foo.com',
        RestrictedMethods.eth_accounts,
        CaveatTypes.restrictReturnedAccounts,
      );

      expect(permissionController.revokePermission).not.toHaveBeenCalled();
      expect(permissionController.updateCaveat).not.toHaveBeenCalled();
    });
  });

  describe('requestAccountsPermissionWithId', () => {
    it('request an accounts permission and returns the request id', async () => {
      const permissionController = {
        requestPermissions: jest
          .fn()
          .mockImplementationOnce(async (_, __, { id }) => {
            return [null, { id }];
          }),
      };

      const id = await getPermissionBackgroundApiMethods(
        permissionController,
      ).requestAccountsPermissionWithId('foo.com');

      expect(permissionController.requestPermissions).toHaveBeenCalledTimes(1);
      expect(permissionController.requestPermissions).toHaveBeenCalledWith(
        { origin: 'foo.com' },
        { eth_accounts: {} },
        { id: expect.any(String) },
      );

      expect(id.length > 0).toBe(true);
      expect(id).toStrictEqual(
        permissionController.requestPermissions.mock.calls[0][2].id,
      );
    });
  });

  describe('requestAccountsAndChainPermissionsWithId', () => {
    it('request eth_accounts and permittedChains permissions and returns the request id', async () => {
      const permissionController = {
        requestPermissions: jest
          .fn()
          .mockImplementationOnce(async (_, __, { id }) => {
            return [null, { id }];
          }),
      };

      const id = await getPermissionBackgroundApiMethods(
        permissionController,
      ).requestAccountsAndChainPermissionsWithId('foo.com');

      expect(permissionController.requestPermissions).toHaveBeenCalledTimes(1);
      expect(permissionController.requestPermissions).toHaveBeenCalledWith(
        { origin: 'foo.com' },
        {
          [PermissionNames.eth_accounts]: {},
          [PermissionNames.permittedChains]: {},
        },
        { id: expect.any(String) },
      );

      expect(id.length > 0).toBe(true);
      expect(id).toStrictEqual(
        permissionController.requestPermissions.mock.calls[0][2].id,
      );
    });
  });

  describe('addPermittedChain', () => {
    it('calls grantPermissionsIncremental with expected parameters', () => {
      const permissionController = {
        grantPermissionsIncremental: jest.fn(),
      };

      getPermissionBackgroundApiMethods(permissionController).addPermittedChain(
        'foo.com',
        '0x1',
      );

      expect(
        permissionController.grantPermissionsIncremental,
      ).toHaveBeenCalledTimes(1);
      expect(
        permissionController.grantPermissionsIncremental,
      ).toHaveBeenCalledWith({
        subject: { origin: 'foo.com' },
        approvedPermissions: getPermittedChainsPermissions(['0x1']),
      });
    });
  });

  describe('addPermittedChains', () => {
    it('calls grantPermissionsIncremental with expected parameters for single chain', () => {
      const permissionController = {
        grantPermissionsIncremental: jest.fn(),
      };

      getPermissionBackgroundApiMethods(
        permissionController,
      ).addPermittedChains('foo.com', ['0x1']);

      expect(
        permissionController.grantPermissionsIncremental,
      ).toHaveBeenCalledTimes(1);
      expect(
        permissionController.grantPermissionsIncremental,
      ).toHaveBeenCalledWith({
        subject: { origin: 'foo.com' },
        approvedPermissions: getPermittedChainsPermissions(['0x1']),
      });
    });

    it('calls grantPermissionsIncremental with expected parameters with multiple chains', () => {
      const permissionController = {
        grantPermissionsIncremental: jest.fn(),
      };

      getPermissionBackgroundApiMethods(
        permissionController,
      ).addPermittedChains('foo.com', ['0x1', '0x2']);

      expect(
        permissionController.grantPermissionsIncremental,
      ).toHaveBeenCalledTimes(1);
      expect(
        permissionController.grantPermissionsIncremental,
      ).toHaveBeenCalledWith({
        subject: { origin: 'foo.com' },
        approvedPermissions: getPermittedChainsPermissions(['0x1', '0x2']),
      });
    });
  });

  describe('removePermittedChain', () => {
    it('removes a permitted chain', () => {
      const permissionController = {
        getCaveat: jest.fn().mockImplementationOnce(() => {
          return {
            type: CaveatTypes.restrictNetworkSwitching,
            value: ['0x1', '0x2'],
          };
        }),
        revokePermission: jest.fn(),
        updateCaveat: jest.fn(),
      };

      getPermissionBackgroundApiMethods(
        permissionController,
      ).removePermittedChain('foo.com', '0x2');

      expect(permissionController.getCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.getCaveat).toHaveBeenCalledWith(
        'foo.com',
        PermissionNames.permittedChains,
        CaveatTypes.restrictNetworkSwitching,
      );

      expect(permissionController.revokePermission).not.toHaveBeenCalled();

      expect(permissionController.updateCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        PermissionNames.permittedChains,
        CaveatTypes.restrictNetworkSwitching,
        ['0x1'],
      );
    });

    it('revokes the permittedChains permission if the removed chain is the only permitted chain', () => {
      const permissionController = {
        getCaveat: jest.fn().mockImplementationOnce(() => {
          return {
            type: CaveatTypes.restrictNetworkSwitching,
            value: ['0x1'],
          };
        }),
        revokePermission: jest.fn(),
        updateCaveat: jest.fn(),
      };

      getPermissionBackgroundApiMethods(
        permissionController,
      ).removePermittedChain('foo.com', '0x1');

      expect(permissionController.getCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.getCaveat).toHaveBeenCalledWith(
        'foo.com',
        PermissionNames.permittedChains,
        CaveatTypes.restrictNetworkSwitching,
      );

      expect(permissionController.revokePermission).toHaveBeenCalledTimes(1);
      expect(permissionController.revokePermission).toHaveBeenCalledWith(
        'foo.com',
        PermissionNames.permittedChains,
      );

      expect(permissionController.updateCaveat).not.toHaveBeenCalled();
    });

    it('does not call permissionController.updateCaveat if the specified chain is not permitted', () => {
      const permissionController = {
        getCaveat: jest.fn().mockImplementationOnce(() => {
          return { type: CaveatTypes.restrictNetworkSwitching, value: ['0x1'] };
        }),
        revokePermission: jest.fn(),
        updateCaveat: jest.fn(),
      };

      getPermissionBackgroundApiMethods(
        permissionController,
      ).removePermittedChain('foo.com', '0x2');
      expect(permissionController.getCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.getCaveat).toHaveBeenCalledWith(
        'foo.com',
        PermissionNames.permittedChains,
        CaveatTypes.restrictNetworkSwitching,
      );

      expect(permissionController.revokePermission).not.toHaveBeenCalled();
      expect(permissionController.updateCaveat).not.toHaveBeenCalled();
    });
  });
});
