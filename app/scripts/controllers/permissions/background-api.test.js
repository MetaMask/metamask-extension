import { MethodNames } from '@metamask/permission-controller';
import {
  CaveatTypes,
  RestrictedMethods,
} from '../../../../shared/constants/permissions';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '../../lib/multichain-api/caip25permissions';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import {
  validNotifications,
  validRpcMethods,
} from '../../lib/multichain-api/scope';
import { getPermissionBackgroundApiMethods } from './background-api';
import { PermissionNames } from './specifications';

describe('permission background API methods', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('addPermittedAccount', () => {
    it('gets the CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      try {
        getPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedAccount('foo.com', '0x1');
      } catch (err) {
        // noop
      }

      expect(permissionController.getCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );
    });

    it('throws an error if there is no existing CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      expect(() =>
        getPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedAccount('foo.com', '0x1'),
      ).toThrow(
        new Error('tried to add accounts when none have been permissioned'),
      );
    });

    it('calls updateCaveat with the account added', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
              },
              'eip155:10': {
                methods: [],
                notifications: [],
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                methods: [],
                notifications: [],
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                methods: [],
                notifications: [],
                accounts: ['eip155:1:0x2', 'eip155:1:0x3'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        permissionController,
      }).addPermittedAccount('foo.com', '0x4');

      expect(permissionController.updateCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: [
                'eip155:1:0x2',
                'eip155:1:0x3',
                'eip155:1:0x1',
                'eip155:1:0x4',
              ],
            },
            'eip155:10': {
              methods: [],
              notifications: [],
              accounts: [
                'eip155:10:0x2',
                'eip155:10:0x3',
                'eip155:10:0x1',
                'eip155:10:0x4',
              ],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              methods: [],
              notifications: [],
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: [
                'eip155:1:0x2',
                'eip155:1:0x3',
                'eip155:1:0x1',
                'eip155:1:0x4',
              ],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });
  });

  describe('addMorePermittedAccounts', () => {
    it('gets the CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      try {
        getPermissionBackgroundApiMethods({
          permissionController,
        }).addMorePermittedAccounts('foo.com', ['0x1']);
      } catch (err) {
        // noop
      }

      expect(permissionController.getCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );
    });

    it('throws an error if there is no existing CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      expect(() =>
        getPermissionBackgroundApiMethods({
          permissionController,
        }).addMorePermittedAccounts('foo.com', ['0x1']),
      ).toThrow(
        new Error('tried to add accounts when none have been permissioned'),
      );
    });

    it('calls updateCaveat with the accounts added and all eip155 accounts synced', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
              },
              'eip155:10': {
                methods: [],
                notifications: [],
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                methods: [],
                notifications: [],
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                methods: [],
                notifications: [],
                accounts: ['eip155:1:0x2', 'eip155:1:0x3'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        permissionController,
      }).addMorePermittedAccounts('foo.com', ['0x4', '0x5']);

      expect(permissionController.updateCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: [
                'eip155:1:0x2',
                'eip155:1:0x3',
                'eip155:1:0x1',
                'eip155:1:0x4',
                'eip155:1:0x5',
              ],
            },
            'eip155:10': {
              methods: [],
              notifications: [],
              accounts: [
                'eip155:10:0x2',
                'eip155:10:0x3',
                'eip155:10:0x1',
                'eip155:10:0x4',
                'eip155:10:0x5',
              ],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              methods: [],
              notifications: [],
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: [
                'eip155:1:0x2',
                'eip155:1:0x3',
                'eip155:1:0x1',
                'eip155:1:0x4',
                'eip155:1:0x5',
              ],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });
  });

  describe('removePermittedAccount', () => {
    it('gets the CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      try {
        getPermissionBackgroundApiMethods({
          permissionController,
        }).removePermittedAccount('foo.com', '0x1');
      } catch (err) {
        // noop
      }

      expect(permissionController.getCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
      );
    });

    it('throws an error if there is no existing CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      expect(() =>
        getPermissionBackgroundApiMethods({
          permissionController,
        }).removePermittedAccount('foo.com', '0x1'),
      ).toThrow(
        new Error('tried to remove accounts when none have been permissioned'),
      );
    });

    it('does nothing if the account being removed does not exist', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
              },
              'eip155:10': {
                methods: [],
                notifications: [],
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                methods: [],
                notifications: [],
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                methods: [],
                notifications: [],
                accounts: ['eip155:1:0x2', 'eip155:1:0x3'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
        revokePermission: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        permissionController,
      }).removePermittedAccount('foo.com', '0xdeadbeef');

      expect(permissionController.updateCaveat).not.toHaveBeenCalled();
      expect(permissionController.revokePermission).not.toHaveBeenCalled();
    });

    it('revokes the permission if the removed account is the only eth account', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
              },
              'eip155:10': {
                methods: [],
                notifications: [],
                accounts: ['eip155:10:0x1'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                methods: [],
                notifications: [],
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        revokePermission: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        permissionController,
      }).removePermittedAccount('foo.com', '0x1');

      expect(permissionController.revokePermission).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
      );
    });

    it('updates the caveat with the account removed and all eip155 accounts synced', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                methods: [],
                notifications: [],
              },
              'eip155:10': {
                methods: [],
                notifications: [],
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                methods: [],
                notifications: [],
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                methods: [],
                notifications: [],
                accounts: ['eip155:1:0x2', 'eip155:1:0x3'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        permissionController,
      }).removePermittedAccount('foo.com', '0x2');

      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: ['eip155:1:0x3', 'eip155:1:0x1'],
            },
            'eip155:10': {
              methods: [],
              notifications: [],
              accounts: ['eip155:10:0x3', 'eip155:10:0x1'],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              methods: [],
              notifications: [],
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
            'eip155:1': {
              methods: [],
              notifications: [],
              accounts: ['eip155:1:0x3', 'eip155:1:0x1'],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });
  });

  describe('requestAccountsPermissionWithId', () => {
    it('gets the networkConfiguration for the currently selected network client', () => {
      const networkController = {
        state: {
          selectedNetworkClientId: 'mainnet',
        },
        getNetworkConfigurationByNetworkClientId: jest.fn().mockReturnValue({
          chainId: '0x1',
        }),
      };
      const approvalController = {
        addAndShowApprovalRequest: jest.fn().mockResolvedValue({
          approvedChainIds: ['0x1', '0x5'],
          approvedAccounts: ['0xdeadbeef'],
        }),
      };
      const permissionController = {
        grantPermissions: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        networkController,
        approvalController,
        permissionController,
      }).requestAccountsPermissionWithId('foo.com');

      expect(
        networkController.getNetworkConfigurationByNetworkClientId,
      ).toHaveBeenCalledWith('mainnet');
    });

    it('requests eth_accounts and permittedChains approval and returns the request id', async () => {
      const networkController = {
        state: {
          selectedNetworkClientId: 'mainnet',
        },
        getNetworkConfigurationByNetworkClientId: jest.fn().mockReturnValue({
          chainId: '0x1',
        }),
      };
      const approvalController = {
        addAndShowApprovalRequest: jest.fn().mockResolvedValue({
          approvedChainIds: ['0x1', '0x5'],
          approvedAccounts: ['0xdeadbeef'],
        }),
      };
      const permissionController = {
        grantPermissions: jest.fn(),
      };

      const result = getPermissionBackgroundApiMethods({
        networkController,
        approvalController,
        permissionController,
      }).requestAccountsPermissionWithId('foo.com');

      const { id } =
        approvalController.addAndShowApprovalRequest.mock.calls[0][0];

      expect(result).toStrictEqual(id);
      expect(approvalController.addAndShowApprovalRequest).toHaveBeenCalledWith(
        {
          id,
          origin: 'foo.com',
          requestData: {
            metadata: {
              id,
              origin: 'foo.com',
            },
            permissions: {
              [RestrictedMethods.eth_accounts]: {},
              [PermissionNames.permittedChains]: {
                caveats: [
                  {
                    type: CaveatTypes.restrictNetworkSwitching,
                    value: ['0x1'],
                  },
                ],
              },
            },
          },
          type: MethodNames.requestPermissions,
        },
      );
    });

    it('grants a legacy CAIP-25 permission (isMultichainOrigin: false) with the approved eip155 chainIds and accounts', async () => {
      const networkController = {
        state: {
          selectedNetworkClientId: 'mainnet',
        },
        getNetworkConfigurationByNetworkClientId: jest.fn().mockReturnValue({
          chainId: '0x1',
        }),
      };
      const approvalController = {
        addAndShowApprovalRequest: jest.fn().mockResolvedValue({
          approvedChainIds: ['0x1', '0x5'],
          approvedAccounts: ['0xdeadbeef'],
        }),
      };
      const permissionController = {
        grantPermissions: jest.fn(),
      };

      getPermissionBackgroundApiMethods({
        networkController,
        approvalController,
        permissionController,
      }).requestAccountsPermissionWithId('foo.com');

      await flushPromises();

      expect(permissionController.grantPermissions).toHaveBeenCalledWith({
        subject: {
          origin: 'foo.com',
        },
        approvedPermissions: {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: {
                  requiredScopes: {},
                  optionalScopes: {
                    'eip155:1': {
                      methods: validRpcMethods,
                      notifications: validNotifications,
                      accounts: ['eip155:1:0xdeadbeef'],
                    },
                    'eip155:5': {
                      methods: validRpcMethods,
                      notifications: validNotifications,
                      accounts: ['eip155:5:0xdeadbeef'],
                    },
                  },
                  isMultichainOrigin: false,
                },
              },
            ],
          },
        },
      });
    });
  });
});
