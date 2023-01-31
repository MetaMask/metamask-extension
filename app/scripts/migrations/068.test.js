import migration68 from './068';

describe('migration #68', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 67,
      },
      data: {},
    };

    const newStorage = await migration68.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 68,
    });
  });

  it('should migrate all data', async () => {
    const oldStorage = {
      meta: {
        version: 67,
      },
      data: getOldState(),
    };

    const newStorage = await migration68.migrate(oldStorage);
    expect(newStorage).toMatchObject({
      meta: {
        version: 68,
      },
      data: {
        FooController: { a: 'b' },
        PermissionController: { subjects: expect.any(Object) },
        PermissionLogController: {
          permissionActivityLog: expect.any(Object),
          permissionHistory: expect.any(Object),
        },
        SubjectMetadataController: { subjectMetadata: expect.any(Object) },
      },
    });
    expect(newStorage.PermissionsController).toBeUndefined();
    expect(newStorage.PermissionsMetadata).toBeUndefined();
  });

  it('should migrate the PermissionsController state', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PermissionsController: getOldState().PermissionsController,
      },
    };

    const newStorage = await migration68.migrate(oldStorage);
    const { PermissionController } = newStorage.data;

    expect(PermissionController).toStrictEqual({
      subjects: {
        'https://faucet.metamask.io': {
          origin: 'https://faucet.metamask.io',
          permissions: {
            eth_accounts: {
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: ['0xc42edfcc21ed14dda456aa0756c153f7985d8813'],
                },
              ],
              date: 1597334833084,
              id: 'e01bada4-ddc7-47b6-be67-d4603733e0e9',
              invoker: 'https://faucet.metamask.io',
              parentCapability: 'eth_accounts',
            },
          },
        },
        'https://metamask.github.io': {
          origin: 'https://metamask.github.io',
          permissions: {
            eth_accounts: {
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
                },
              ],
              date: 1616006369498,
              id: '3d0bdc27-e8e4-4fb0-a24b-340d61f6a3fa',
              invoker: 'https://metamask.github.io',
              parentCapability: 'eth_accounts',
            },
          },
        },
        'https://xdai.io': {
          origin: 'https://xdai.io',
          permissions: {
            eth_accounts: {
              caveats: [
                {
                  type: 'restrictReturnedAccounts',
                  value: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
                },
              ],
              date: 1605908022382,
              id: '88c5de24-11a9-4f1e-9651-b072f4c11928',
              invoker: 'https://xdai.io',
              parentCapability: 'eth_accounts',
            },
          },
        },
      },
    });
  });

  it('should migrate the PermissionsMetadata state', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PermissionsMetadata: getOldState().PermissionsMetadata,
      },
    };

    const newStorage = await migration68.migrate(oldStorage);
    const { PermissionLogController, SubjectMetadataController } =
      newStorage.data;
    const expected = getOldState().PermissionsMetadata;

    expect(PermissionLogController.permissionHistory).toStrictEqual(
      expected.permissionsHistory,
    );
    expect(PermissionLogController.permissionActivityLog).toStrictEqual(
      expected.permissionsLog,
    );

    expect(SubjectMetadataController).toStrictEqual({
      subjectMetadata: {
        'https://1inch.exchange': {
          iconUrl: 'https://1inch.exchange/assets/favicon/favicon-32x32.png',
          name: 'DEX Aggregator - 1inch.exchange',
          origin: 'https://1inch.exchange',
          extensionId: null,
        },
        'https://ascii-tree-generator.com': {
          iconUrl: 'https://ascii-tree-generator.com/favicon.ico',
          name: 'ASCII Tree Generator',
          origin: 'https://ascii-tree-generator.com',
          extensionId: null,
        },
        'https://caniuse.com': {
          iconUrl: 'https://caniuse.com/img/favicon-128.png',
          name: 'Can I use... Support tables for HTML5, CSS3, etc',
          origin: 'https://caniuse.com',
          extensionId: null,
        },
        'https://core-geth.org': {
          iconUrl: 'https://core-geth.org/icons/icon-48x48.png',
          name: 'core-geth.org',
          origin: 'https://core-geth.org',
          extensionId: null,
        },
        'https://docs.npmjs.com': {
          iconUrl: 'https://docs.npmjs.com/favicon-32x32.png',
          name: 'package-locks | npm Docs',
          origin: 'https://docs.npmjs.com',
          extensionId: null,
        },
      },
    });
  });

  it('should handle domain metadata edge cases', async () => {
    const oldStorage = {
      meta: {},
      data: {
        PermissionsMetadata: {
          domainMetadata: {
            'foo.bar': {
              // no name
              icon: 'fooIcon',
              extensionId: 'fooExtension', // non-null
              origin: null, // should get overwritten
              extraProperty: 'bar', // should be preserved
            },
          },
        },
      },
    };

    const newStorage = await migration68.migrate(oldStorage);
    expect(
      newStorage.data.SubjectMetadataController.subjectMetadata,
    ).toStrictEqual({
      'foo.bar': {
        name: null, // replaced with null
        iconUrl: 'fooIcon', // preserved value, changed name
        extensionId: 'fooExtension', // preserved
        origin: 'foo.bar', // overwritten with correct origin
        extraProperty: 'bar', // preserved
      },
    });
  });
});

function getOldState() {
  return {
    FooController: { a: 'b' }, // just to ensure it's not touched
    PermissionsController: {
      domains: {
        'https://faucet.metamask.io': {
          permissions: [
            {
              '@context': ['https://github.com/MetaMask/rpc-cap'],
              caveats: [
                {
                  name: 'primaryAccountOnly',
                  type: 'limitResponseLength',
                  value: 1,
                },
                {
                  name: 'exposedAccounts',
                  type: 'filterResponse',
                  value: ['0xc42edfcc21ed14dda456aa0756c153f7985d8813'],
                },
              ],
              date: 1597334833084,
              id: 'e01bada4-ddc7-47b6-be67-d4603733e0e9',
              invoker: 'https://faucet.metamask.io',
              parentCapability: 'eth_accounts',
            },
          ],
        },
        'https://metamask.github.io': {
          permissions: [
            {
              '@context': ['https://github.com/MetaMask/rpc-cap'],
              caveats: [
                {
                  name: 'primaryAccountOnly',
                  type: 'limitResponseLength',
                  value: 1,
                },
                {
                  name: 'exposedAccounts',
                  type: 'filterResponse',
                  value: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
                },
              ],
              date: 1616006369498,
              id: '3d0bdc27-e8e4-4fb0-a24b-340d61f6a3fa',
              invoker: 'https://metamask.github.io',
              parentCapability: 'eth_accounts',
            },
          ],
        },
        'https://xdai.io': {
          permissions: [
            {
              '@context': ['https://github.com/MetaMask/rpc-cap'],
              caveats: [
                {
                  name: 'primaryAccountOnly',
                  type: 'limitResponseLength',
                  value: 1,
                },
                {
                  name: 'exposedAccounts',
                  type: 'filterResponse',
                  value: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
                },
              ],
              date: 1605908022382,
              id: '88c5de24-11a9-4f1e-9651-b072f4c11928',
              invoker: 'https://xdai.io',
              parentCapability: 'eth_accounts',
            },
          ],
        },
      },
      permissionsDescriptions: {},
      permissionsRequests: [],
    },
    PermissionsMetadata: {
      domainMetadata: {
        'https://1inch.exchange': {
          host: '1inch.exchange',
          icon: 'https://1inch.exchange/assets/favicon/favicon-32x32.png',
          lastUpdated: 1605489265143,
          name: 'DEX Aggregator - 1inch.exchange',
        },
        'https://ascii-tree-generator.com': {
          host: 'ascii-tree-generator.com',
          icon: 'https://ascii-tree-generator.com/favicon.ico',
          lastUpdated: 1637721988618,
          name: 'ASCII Tree Generator',
        },
        'https://caniuse.com': {
          host: 'caniuse.com',
          icon: 'https://caniuse.com/img/favicon-128.png',
          lastUpdated: 1637692936599,
          name: 'Can I use... Support tables for HTML5, CSS3, etc',
        },
        'https://core-geth.org': {
          host: 'core-geth.org',
          icon: 'https://core-geth.org/icons/icon-48x48.png',
          lastUpdated: 1637692093173,
          name: 'core-geth.org',
        },
        'https://docs.npmjs.com': {
          host: 'docs.npmjs.com',
          icon: 'https://docs.npmjs.com/favicon-32x32.png',
          lastUpdated: 1637721451476,
          name: 'package-locks | npm Docs',
        },
      },
      permissionsHistory: {
        'https://opensea.io': {
          eth_accounts: {
            accounts: {
              '0xc42edfcc21ed14dda456aa0756c153f7985d8813': 1617399873696,
            },
            lastApproved: 1617399873696,
          },
        },
        'https://faucet.metamask.io': {
          eth_accounts: {
            accounts: {
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1620369333736,
            },
            lastApproved: 1610405614031,
          },
        },
        'https://metamask.github.io': {
          eth_accounts: {
            accounts: {
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1620759882723,
              '0xf9eab18b7db3adf8cd6bd5f4aed9e1d5e0e7f926': 1616005950557,
            },
            lastApproved: 1620759882723,
          },
        },
        'https://xdai.io': {
          eth_accounts: {
            accounts: {
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1620369333736,
            },
            lastApproved: 1605908022384,
          },
        },
      },
      permissionsLog: [
        {
          id: 3642448888,
          method: 'eth_accounts',
          methodType: 'restricted',
          origin: 'https://metamask.github.io',
          request: {
            id: 3642448888,
            jsonrpc: '2.0',
            method: 'eth_accounts',
            origin: 'https://metamask.github.io',
            tabId: 489,
          },
          requestTime: 1615325885561,
          response: {
            id: 3642448888,
            jsonrpc: '2.0',
            result: [],
          },
          responseTime: 1615325885561,
          success: true,
        },
        {
          id: 2960964763,
          method: 'wallet_getPermissions',
          methodType: 'internal',
          origin: 'https://metamask.github.io',
          request: {
            id: 2960964763,
            jsonrpc: '2.0',
            method: 'wallet_getPermissions',
            origin: 'https://metamask.github.io',
            tabId: 145,
          },
          requestTime: 1620759866273,
          response: {
            id: 2960964763,
            jsonrpc: '2.0',
            result: [
              {
                '@context': ['https://github.com/MetaMask/rpc-cap'],
                caveats: [
                  {
                    name: 'primaryAccountOnly',
                    type: 'limitResponseLength',
                    value: 1,
                  },
                  {
                    name: 'exposedAccounts',
                    type: 'filterResponse',
                    value: ['0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc'],
                  },
                ],
                date: 1616006369498,
                id: '3d0bdc27-e8e4-4fb0-a24b-340d61f6a3fa',
                invoker: 'https://metamask.github.io',
                parentCapability: 'eth_accounts',
              },
            ],
          },
          responseTime: 1620759866273,
          success: true,
        },
        {
          id: 2960964764,
          method: 'eth_accounts',
          methodType: 'restricted',
          origin: 'https://metamask.github.io',
          request: {
            id: 2960964764,
            jsonrpc: '2.0',
            method: 'eth_accounts',
            origin: 'https://metamask.github.io',
            tabId: 145,
          },
          requestTime: 1620759866280,
          response: {
            id: 2960964764,
            jsonrpc: '2.0',
            result: [],
          },
          responseTime: 1620759866280,
          success: true,
        },
        {
          id: 519616456,
          method: 'eth_accounts',
          methodType: 'restricted',
          origin: 'http://localhost:9011',
          request:
            '{\n  "method": "eth_accounts",\n  "jsonrpc": "2.0",\n  "id": 519616456,\n  "origin": "http://localhost:9011",\n  "tabId": 1020\n}',
          requestTime: 1636479612050,
          response:
            '{\n  "id": 519616456,\n  "jsonrpc": "2.0",\n  "result": []\n}',
          responseTime: 1636479612051,
          success: true,
        },
      ],
    },
  };
}
