import {
  MethodNames,
  PermissionDoesNotExistError,
} from '@metamask/permission-controller';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/chain-agnostic-permission';
import { flushPromises } from '../../../../test/lib/timer-helpers';
import * as NetworkSelectors from '../../../../shared/modules/selectors/networks';
import { getPermissionBackgroundApiMethods } from './background-api';

jest.mock('../../../../shared/modules/selectors/networks', () => ({
  ...jest.requireActual('../../../../shared/modules/selectors/networks'),
  getNetworkConfigurationsByCaipChainId: jest.fn(),
}));
const MockNetworkSelectors = jest.mocked(NetworkSelectors);

const setupPermissionBackgroundApiMethods = (overrides) => {
  const params = {
    permissionController: {
      getCaveat: jest.fn(),
      updateCaveat: jest.fn(),
      grantPermissions: jest.fn(),
      revokePermission: jest.fn(),
    },
    approvalController: {
      addAndShowApprovalRequest: jest.fn(),
    },
    accountsController: {
      getAccountByAddress: jest.fn(),
      state: {
        internalAccounts: {},
      },
    },
    networkController: {
      state: {
        networkConfigurationsByChainId: {},
      },
    },
    multichainNetworkController: {
      state: {
        multichainNetworkConfigurationsByChainId: {},
      },
    },
    ...overrides,
  };

  return getPermissionBackgroundApiMethods(params);
};

describe('permission background API methods', () => {
  afterEach(() => {
    jest.resetAllMocks();
    MockNetworkSelectors.getNetworkConfigurationsByCaipChainId.mockReturnValue(
      {},
    );
  });

  describe('addPermittedAccount', () => {
    it('gets the CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      try {
        setupPermissionBackgroundApiMethods({
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
        getCaveat: jest.fn().mockImplementation(() => {
          throw new PermissionDoesNotExistError();
        }),
      };

      expect(() =>
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedAccount('foo.com', '0x1'),
      ).toThrow(
        new Error(
          `Cannot add account permissions for origin "foo.com": no permission currently exists for this origin.`,
        ),
      );
    });

    it('throws an error if getCaveat fails unexpectedly', () => {
      const permissionController = {
        getCaveat: jest.fn().mockImplementation(() => {
          throw new Error('unexpected getCaveat error');
        }),
      };

      expect(() =>
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedAccount('foo.com', '0x1'),
      ).toThrow(new Error(`unexpected getCaveat error`));
    });

    it('gets the account for the passed in address', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {},
            optionalScopes: {},
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      const accountsController = {
        getAccountByAddress: jest.fn(),
        state: {
          internalAccounts: {},
        },
      };

      try {
        setupPermissionBackgroundApiMethods({
          permissionController,
          accountsController,
        }).addPermittedAccount('foo.com', '0x4');
      } catch (err) {
        // noop
      }

      expect(accountsController.getAccountByAddress).toHaveBeenCalledTimes(1);
      expect(accountsController.getAccountByAddress).toHaveBeenCalledWith(
        '0x4',
      );
    });

    it('calls updateCaveat with the caip account address added and all matching scopes added when no matching permitted scopes already exist', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                accounts: [],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      const accountsController = {
        getAccountByAddress: jest.fn().mockReturnValue({
          address: '0x4',
          scopes: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
        }),
        state: {
          internalAccounts: {},
        },
      };

      MockNetworkSelectors.getNetworkConfigurationsByCaipChainId.mockReturnValue(
        {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {},
          'solana:foo': {},
          'solana:bar': {},
        },
      );

      setupPermissionBackgroundApiMethods({
        permissionController,
        accountsController,
      }).addPermittedAccount('foo.com', '0x4');

      expect(permissionController.updateCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              accounts: [],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
              accounts: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:0x4'],
            },
            'solana:foo': {
              accounts: ['solana:foo:0x4'],
            },
            'solana:bar': {
              accounts: ['solana:bar:0x4'],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });

    it('calls updateCaveat with the caip account address added to existing matching permitted scopes', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                accounts: [],
              },
              'eip155:10': {
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                accounts: ['eip155:1:0x2', 'eip155:1:0x3'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      const accountsController = {
        getAccountByAddress: jest.fn().mockReturnValue({
          address: '0x4',
          scopes: ['eip155:0'],
        }),
        state: {
          internalAccounts: {},
        },
      };

      setupPermissionBackgroundApiMethods({
        permissionController,
        accountsController,
      }).addPermittedAccount('foo.com', '0x4');

      expect(permissionController.updateCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              accounts: [
                'eip155:1:0x1',
                'eip155:1:0x2',
                'eip155:1:0x3',
                'eip155:1:0x4',
              ],
            },
            'eip155:10': {
              accounts: [
                'eip155:10:0x1',
                'eip155:10:0x2',
                'eip155:10:0x3',
                'eip155:10:0x4',
              ],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
            'eip155:1': {
              accounts: [
                'eip155:1:0x1',
                'eip155:1:0x2',
                'eip155:1:0x3',
                'eip155:1:0x4',
              ],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });
  });

  describe('addPermittedAccounts', () => {
    it('gets the CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      try {
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedAccounts('foo.com', ['0x1']);
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
        getCaveat: jest.fn().mockImplementation(() => {
          throw new PermissionDoesNotExistError();
        }),
      };

      expect(() =>
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedAccounts('foo.com', ['0x1']),
      ).toThrow(
        new Error(
          `Cannot add account permissions for origin "foo.com": no permission currently exists for this origin.`,
        ),
      );
    });

    it('throws an error if getCaveat fails unexpectedly', () => {
      const permissionController = {
        getCaveat: jest.fn().mockImplementation(() => {
          throw new Error('unexpected getCaveat error');
        }),
      };

      expect(() =>
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedAccounts('foo.com', ['0x1']),
      ).toThrow(new Error(`unexpected getCaveat error`));
    });

    it('gets the accounts for the passed in addresses', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {},
            optionalScopes: {},
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      const accountsController = {
        getAccountByAddress: jest.fn(),
        state: {
          internalAccounts: {},
        },
      };

      try {
        setupPermissionBackgroundApiMethods({
          permissionController,
          accountsController,
        }).addPermittedAccounts('foo.com', ['0x4', '0x5']);
      } catch (err) {
        // noop
      }

      expect(accountsController.getAccountByAddress).toHaveBeenCalledTimes(2);
      expect(accountsController.getAccountByAddress).toHaveBeenCalledWith(
        '0x4',
      );
      expect(accountsController.getAccountByAddress).toHaveBeenCalledWith(
        '0x5',
      );
    });

    it('calls updateCaveat with the caip account addresses added to respective scopes and all accounts for each scopes synced', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                accounts: [],
              },
              'eip155:10': {
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                accounts: ['eip155:1:0x2', 'eip155:1:0x3'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      const accountsController = {
        getAccountByAddress: jest
          .fn()
          .mockReturnValueOnce({
            address: '0x4',
            scopes: ['eip155:0'],
          })
          .mockReturnValueOnce({
            address: '0x5',
            scopes: ['eip155:0'],
          }),
        state: {
          internalAccounts: {},
        },
      };

      setupPermissionBackgroundApiMethods({
        permissionController,
        accountsController,
      }).addPermittedAccounts('foo.com', ['0x4', '0x5']);

      expect(permissionController.updateCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              accounts: [
                'eip155:1:0x1',
                'eip155:1:0x2',
                'eip155:1:0x3',
                'eip155:1:0x4',
                'eip155:1:0x5',
              ],
            },
            'eip155:10': {
              accounts: [
                'eip155:10:0x1',
                'eip155:10:0x2',
                'eip155:10:0x3',
                'eip155:10:0x4',
                'eip155:10:0x5',
              ],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
            'eip155:1': {
              accounts: [
                'eip155:1:0x1',
                'eip155:1:0x2',
                'eip155:1:0x3',
                'eip155:1:0x4',
                'eip155:1:0x5',
              ],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });

    it('calls updateCaveat with the caip account addresses added when no matching permitted scopes already exist', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                accounts: [],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      const accountsController = {
        getAccountByAddress: jest
          .fn()
          .mockReturnValueOnce({
            address: '0x4',
            scopes: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
          })
          .mockReturnValueOnce({
            address: '0x5',
            scopes: ['solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
          }),
        state: {
          internalAccounts: {},
        },
      };

      MockNetworkSelectors.getNetworkConfigurationsByCaipChainId.mockReturnValue(
        {
          'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {},
          'solana:foo': {},
          'solana:bar': {},
        },
      );

      setupPermissionBackgroundApiMethods({
        permissionController,
        accountsController,
      }).addPermittedAccounts('foo.com', ['0x4', '0x5']);

      expect(permissionController.updateCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              accounts: [],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
            'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
              accounts: [
                'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:0x4',
                'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:0x5',
              ],
            },
            'solana:foo': {
              accounts: ['solana:foo:0x4', 'solana:foo:0x5'],
            },
            'solana:bar': {
              accounts: ['solana:bar:0x4', 'solana:bar:0x5'],
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
        setupPermissionBackgroundApiMethods({
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
        getCaveat: jest.fn().mockImplementation(() => {
          throw new PermissionDoesNotExistError();
        }),
      };

      expect(() =>
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).removePermittedAccount('foo.com', '0x1'),
      ).toThrow(
        new Error(
          `Cannot remove account "0x1": No permissions exist for origin "foo.com".`,
        ),
      );
    });

    it('throws an error if getCaveat fails unexpectedly', () => {
      const permissionController = {
        getCaveat: jest.fn().mockImplementation(() => {
          throw new Error('unexpected getCaveat error');
        }),
      };

      expect(() =>
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).removePermittedAccount('foo.com', '0x1'),
      ).toThrow(new Error(`unexpected getCaveat error`));
    });

    it('gets the account for the passed in address', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {},
            optionalScopes: {},
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      const accountsController = {
        getAccountByAddress: jest.fn(),
        state: {
          internalAccounts: {},
        },
      };

      try {
        setupPermissionBackgroundApiMethods({
          permissionController,
          accountsController,
        }).removePermittedAccount('foo.com', '0x1');
      } catch (err) {
        // noop
      }

      expect(accountsController.getAccountByAddress).toHaveBeenCalledTimes(1);
      expect(accountsController.getAccountByAddress).toHaveBeenCalledWith(
        '0x1',
      );
    });

    it('does nothing if the account being removed does not exist', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                accounts: [],
              },
              'eip155:10': {
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                accounts: ['eip155:1:0x2', 'eip155:1:0x3'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
        revokePermission: jest.fn(),
      };

      const accountsController = {
        getAccountByAddress: jest.fn().mockReturnValue({
          address: '0xdeadbeef',
          scopes: ['eip155:0'],
        }),
        state: {
          internalAccounts: {},
        },
      };

      setupPermissionBackgroundApiMethods({
        permissionController,
        accountsController,
      }).removePermittedAccount('foo.com', '0xdeadbeef');

      expect(permissionController.updateCaveat).not.toHaveBeenCalled();
      expect(permissionController.revokePermission).not.toHaveBeenCalled();
    });

    it('revokes the entire permission if the removed account is the only account', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                accounts: [],
              },
              'eip155:10': {
                accounts: ['eip155:10:0x1'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                accounts: [],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        revokePermission: jest.fn(),
      };

      const accountsController = {
        getAccountByAddress: jest.fn().mockReturnValue({
          address: '0x1',
          scopes: ['eip155:0'],
        }),
        state: {
          internalAccounts: {},
        },
      };

      setupPermissionBackgroundApiMethods({
        permissionController,
        accountsController,
      }).removePermittedAccount('foo.com', '0x1');

      expect(permissionController.revokePermission).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
      );
    });

    it('updates the caveat with the account removed and all accounts synced across respective scope', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                accounts: [],
              },
              'eip155:10': {
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                accounts: ['eip155:1:0x2', 'eip155:1:0x3'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      const accountsController = {
        getAccountByAddress: jest.fn().mockReturnValue({
          address: '0x2',
          scopes: ['eip155:0'],
        }),
        state: {
          internalAccounts: {},
        },
      };

      setupPermissionBackgroundApiMethods({
        permissionController,
        accountsController,
      }).removePermittedAccount('foo.com', '0x2');

      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              accounts: ['eip155:1:0x1', 'eip155:1:0x3'],
            },
            'eip155:10': {
              accounts: ['eip155:10:0x1', 'eip155:10:0x3'],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
            'eip155:1': {
              accounts: ['eip155:1:0x1', 'eip155:1:0x3'],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });
  });

  describe('setPermittedAccounts', () => {
    it('gets the CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      try {
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).setPermittedAccounts('foo.com', ['eip155:1:0x1']);
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
        getCaveat: jest.fn().mockImplementation(() => {
          throw new PermissionDoesNotExistError();
        }),
      };

      expect(() =>
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).setPermittedAccounts('foo.com', ['eip155:1:0x1']),
      ).toThrow(
        new Error(
          `Cannot set account permissions "eip155:1:0x1" for origin "foo.com": no permission currently exists for this origin.`,
        ),
      );
    });

    it('throws an error if getCaveat fails unexpectedly', () => {
      const permissionController = {
        getCaveat: jest.fn().mockImplementation(() => {
          throw new Error('unexpected getCaveat error');
        }),
      };

      expect(() =>
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).setPermittedAccounts('foo.com', ['eip155:1:0x1']),
      ).toThrow(new Error(`unexpected getCaveat error`));
    });

    it('revokes the entire permission if the no accounts are set', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                accounts: [],
              },
              'eip155:10': {
                accounts: ['eip155:10:0x1'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                accounts: [],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        revokePermission: jest.fn(),
      };
      setupPermissionBackgroundApiMethods({
        permissionController,
      }).setPermittedAccounts('foo.com', []);

      expect(permissionController.revokePermission).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
      );
    });

    it('updates the caveat with the accounts set and all accounts synced across respective scope', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                accounts: [],
              },
              'eip155:10': {
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                accounts: ['eip155:1:0x2', 'eip155:1:0x3'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      setupPermissionBackgroundApiMethods({
        permissionController,
      }).setPermittedAccounts('foo.com', [
        'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
        'eip155:0:0x1',
        'eip155:0:0x4',
      ]);

      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              accounts: ['eip155:1:0x1', 'eip155:1:0x4'],
            },
            'eip155:10': {
              accounts: ['eip155:10:0x1', 'eip155:10:0x4'],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
            'eip155:1': {
              accounts: ['eip155:1:0x1', 'eip155:1:0x4'],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });
  });

  describe('requestAccountsAndChainPermissionsWithId', () => {
    const approvedPermissions = {
      [Caip25EndowmentPermissionName]: {
        caveats: [
          {
            type: Caip25CaveatType,
            value: {
              requiredScopes: {},
              optionalScopes: {
                'eip155:1': {
                  accounts: ['eip155:1:0xdeadbeef'],
                },
                'eip155:5': {
                  accounts: ['eip155:5:0xdeadbeef'],
                },
              },
              isMultichainOrigin: false,
            },
          },
        ],
      },
    };

    it('requests eth_accounts and permittedChains approval and returns the request id', async () => {
      const approvalController = {
        addAndShowApprovalRequest: jest.fn().mockResolvedValue({
          permissions: approvedPermissions,
        }),
      };

      const permissionController = {
        grantPermissions: jest.fn(),
      };

      const result = setupPermissionBackgroundApiMethods({
        approvalController,
        permissionController,
      }).requestAccountsAndChainPermissionsWithId('foo.com');

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
              [Caip25EndowmentPermissionName]: {
                caveats: [
                  {
                    type: Caip25CaveatType,
                    value: {
                      requiredScopes: {},
                      optionalScopes: {},
                      isMultichainOrigin: false,
                    },
                  },
                ],
              },
            },
          },
          type: MethodNames.RequestPermissions,
        },
      );
    });

    it('grants a legacy CAIP-25 permission (isMultichainOrigin: false) with the approved eip155 chainIds and accounts', async () => {
      const approvalController = {
        addAndShowApprovalRequest: jest.fn().mockResolvedValue({
          permissions: approvedPermissions,
        }),
      };

      const permissionController = {
        grantPermissions: jest.fn(),
      };

      setupPermissionBackgroundApiMethods({
        approvalController,
        permissionController,
      }).requestAccountsAndChainPermissionsWithId('foo.com');

      await flushPromises();

      expect(permissionController.grantPermissions).toHaveBeenCalledWith({
        subject: {
          origin: 'foo.com',
        },
        approvedPermissions,
      });
    });
  });

  describe('addPermittedChain', () => {
    it('gets the CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      try {
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedChain('foo.com', 'eip155:1');
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
        getCaveat: jest.fn().mockImplementation(() => {
          throw new PermissionDoesNotExistError();
        }),
      };

      expect(() =>
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedChain('foo.com', 'eip155:1'),
      ).toThrow(
        new Error(
          `Cannot add chain permissions for origin "foo.com": no permission currently exists for this origin.`,
        ),
      );
    });

    it('throws an error if getCaveat fails unexpectedly', () => {
      const permissionController = {
        getCaveat: jest.fn().mockImplementation(() => {
          throw new Error('unexpected getCaveat error');
        }),
      };

      expect(() =>
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedChain('foo.com', 'eip155:1'),
      ).toThrow(new Error(`unexpected getCaveat error`));
    });

    it('calls updateCaveat with the chain added and all accounts synced across respective scopes', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                accounts: [],
              },
              'eip155:10': {
                accounts: ['eip155:10:0x1'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                accounts: ['eip155:1:0x2'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      setupPermissionBackgroundApiMethods({
        permissionController,
      }).addPermittedChain('foo.com', 'eip155:1337');

      expect(permissionController.updateCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
            },
            'eip155:10': {
              accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
            'eip155:1': {
              accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
            },
            'eip155:1337': {
              accounts: ['eip155:1337:0x1', 'eip155:1337:0x2'],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });
  });

  describe('addPermittedChains', () => {
    it('gets the CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      try {
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedChains('foo.com', ['eip155:1']);
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
        getCaveat: jest.fn().mockImplementation(() => {
          throw new PermissionDoesNotExistError();
        }),
      };

      expect(() =>
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedChains('foo.com', ['eip155:1']),
      ).toThrow(
        new Error(
          `Cannot add chain permissions for origin "foo.com": no permission currently exists for this origin.`,
        ),
      );
    });

    it('throws an error if getCaveat fails unexpectedly', () => {
      const permissionController = {
        getCaveat: jest.fn().mockImplementation(() => {
          throw new Error('unexpected getCaveat error');
        }),
      };

      expect(() =>
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).addPermittedChains('foo.com', ['eip155:1']),
      ).toThrow(new Error(`unexpected getCaveat error`));
    });

    it('calls updateCaveat with the chains added and all accounts synced across respective scopes', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                accounts: [],
              },
              'eip155:10': {
                accounts: ['eip155:10:0x1'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
              'eip155:1': {
                accounts: ['eip155:1:0x2'],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      setupPermissionBackgroundApiMethods({
        permissionController,
      }).addPermittedChains('foo.com', ['eip155:4', 'eip155:5']);

      expect(permissionController.updateCaveat).toHaveBeenCalledTimes(1);
      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
            },
            'eip155:10': {
              accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
            'eip155:1': {
              accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
            },
            'eip155:4': {
              accounts: ['eip155:4:0x1', 'eip155:4:0x2'],
            },
            'eip155:5': {
              accounts: ['eip155:5:0x1', 'eip155:5:0x2'],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });
  });

  describe('removePermittedChain', () => {
    it('gets the CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      try {
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).removePermittedChain('foo.com', 'eip155:1');
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
        getCaveat: jest.fn().mockImplementation(() => {
          throw new PermissionDoesNotExistError();
        }),
      };

      expect(() =>
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).removePermittedChain('foo.com', 'eip155:1'),
      ).toThrow(
        new Error(
          `Cannot remove permission for chainId "eip155:1": No permissions exist for origin "foo.com".`,
        ),
      );
    });

    it('throws an error if getCaveat fails unexpectedly', () => {
      const permissionController = {
        getCaveat: jest.fn().mockImplementation(() => {
          throw new Error('unexpected getCaveat error');
        }),
      };

      expect(() =>
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).removePermittedChain('foo.com', 'eip155:1'),
      ).toThrow(new Error(`unexpected getCaveat error`));
    });

    it('does nothing if the chain being removed does not exist', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                accounts: [],
              },
              'eip155:10': {
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
        revokePermission: jest.fn(),
      };

      setupPermissionBackgroundApiMethods({
        permissionController,
      }).removePermittedChain('foo.com', 'eip155:12345');

      expect(permissionController.updateCaveat).not.toHaveBeenCalled();
      expect(permissionController.revokePermission).not.toHaveBeenCalled();
    });

    // TODO: Verify this behavior (wallet vs non-wallet scopes)
    it('revokes the entire permission if the removed chain is the only scope', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {},
            },
            optionalScopes: {},
            isMultichainOrigin: true,
          },
        }),
        revokePermission: jest.fn(),
      };

      setupPermissionBackgroundApiMethods({
        permissionController,
      }).removePermittedChain('foo.com', 'eip155:1');

      expect(permissionController.revokePermission).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
      );
    });

    it('updates the caveat with the chain removed and accounts synced', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                accounts: [],
              },
              'eip155:10': {
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      setupPermissionBackgroundApiMethods({
        permissionController,
      }).removePermittedChain('foo.com', 'eip155:10');

      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });
  });

  describe('setPermittedChains', () => {
    it('gets the CAIP-25 caveat', () => {
      const permissionController = {
        getCaveat: jest.fn(),
      };

      try {
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).setPermittedChains('foo.com', ['eip155:1']);
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
        getCaveat: jest.fn().mockImplementation(() => {
          throw new PermissionDoesNotExistError();
        }),
      };

      expect(() =>
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).setPermittedChains('foo.com', ['eip155:1']),
      ).toThrow(
        new Error(
          `Cannot set permission for chainIds "eip155:1": No permissions exist for origin "foo.com".`,
        ),
      );
    });

    it('throws an error if getCaveat fails unexpectedly', () => {
      const permissionController = {
        getCaveat: jest.fn().mockImplementation(() => {
          throw new Error('unexpected getCaveat error');
        }),
      };

      expect(() =>
        setupPermissionBackgroundApiMethods({
          permissionController,
        }).setPermittedChains('foo.com', ['eip155:1']),
      ).toThrow(new Error(`unexpected getCaveat error`));
    });

    // TODO: Verify this behavior (wallet vs non-wallet scopes)
    it('revokes the entire permission if no chain are set', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {},
            },
            optionalScopes: {},
            isMultichainOrigin: true,
          },
        }),
        revokePermission: jest.fn(),
      };

      setupPermissionBackgroundApiMethods({
        permissionController,
      }).setPermittedChains('foo.com', []);

      expect(permissionController.revokePermission).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
      );
    });

    it('updates the caveat with the chains set and accounts synced', () => {
      const permissionController = {
        getCaveat: jest.fn().mockReturnValue({
          value: {
            requiredScopes: {
              'eip155:1': {
                accounts: [],
              },
              'eip155:10': {
                accounts: ['eip155:10:0x1', 'eip155:10:0x2'],
              },
            },
            optionalScopes: {
              'bip122:000000000019d6689c085ae165831e93': {
                accounts: [
                  'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
                ],
              },
            },
            isMultichainOrigin: true,
          },
        }),
        updateCaveat: jest.fn(),
      };

      setupPermissionBackgroundApiMethods({
        permissionController,
      }).setPermittedChains('foo.com', [
        'eip155:1',
        'bip122:000000000019d6689c085ae165831e93',
      ]);

      expect(permissionController.updateCaveat).toHaveBeenCalledWith(
        'foo.com',
        Caip25EndowmentPermissionName,
        Caip25CaveatType,
        {
          requiredScopes: {
            'eip155:1': {
              accounts: ['eip155:1:0x1', 'eip155:1:0x2'],
            },
          },
          optionalScopes: {
            'bip122:000000000019d6689c085ae165831e93': {
              accounts: [
                'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
              ],
            },
          },
          isMultichainOrigin: true,
        },
      );
    });
  });
});
