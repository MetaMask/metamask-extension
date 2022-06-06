import migration70 from './070';

describe('migration #70', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 69,
      },
      data: {},
    };

    const newStorage = await migration70.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 70,
    });
  });

  it('should migrate all data', async () => {
    const oldStorage = {
      meta: {
        version: 69,
      },
      data: {
        FooController: { a: 'b' },
        PermissionLogController: {
          permissionActivityLog: [
            {
              id: 522690215,
              method: 'eth_accounts',
              methodType: 'restricted',
              origin: 'https://metamask.io',
              request: {
                method: 'eth_accounts',
                params: [],
                jsonrpc: '2.0',
                id: 522690215,
                origin: 'https://metamask.io',
                tabId: 5,
              },
              requestTime: 1602643170686,
              response: {
                id: 522690215,
                jsonrpc: '2.0',
                result: [],
              },
              responseTime: 1602643170688,
              success: true,
            },
            {
              id: 1620464600,
              method: 'eth_accounts',
              methodType: 'restricted',
              origin: 'https://widget.getacute.io',
              request: {
                method: 'eth_accounts',
                params: [],
                jsonrpc: '2.0',
                id: 1620464600,
                origin: 'https://widget.getacute.io',
                tabId: 5,
              },
              requestTime: 1602643172935,
              response: {
                id: 1620464600,
                jsonrpc: '2.0',
                result: [],
              },
              responseTime: 1602643172935,
              success: true,
            },
            {
              id: 4279100021,
              method: 'eth_accounts',
              methodType: 'restricted',
              origin: 'https://app.uniswap.org',
              request: {
                method: 'eth_accounts',
                jsonrpc: '2.0',
                id: 4279100021,
                origin: 'https://app.uniswap.org',
                tabId: 5,
              },
              requestTime: 1620710669962,
              response: {
                id: 4279100021,
                jsonrpc: '2.0',
                result: [],
              },
              responseTime: 1620710669963,
              success: true,
            },
            {
              id: 4279100022,
              method: 'eth_requestAccounts',
              methodType: 'restricted',
              origin: 'https://app.uniswap.org',
              request: {
                method: 'eth_requestAccounts',
                jsonrpc: '2.0',
                id: 4279100022,
                origin: 'https://app.uniswap.org',
                tabId: 5,
              },
              requestTime: 1620710686872,
              response: {
                id: 4279100022,
                jsonrpc: '2.0',
                result: ['0x64a845a5b02460acf8a3d84503b0d68d028b4bb4'],
              },
              responseTime: 1620710693187,
              success: true,
            },
            {
              id: 4279100023,
              method: 'eth_requestAccounts',
              methodType: 'restricted',
              origin: 'https://app.uniswap.org',
              request: {
                method: 'eth_requestAccounts',
                jsonrpc: '2.0',
                id: 4279100023,
                origin: 'https://app.uniswap.org',
                tabId: 5,
              },
              requestTime: 1620710693204,
              response: {
                id: 4279100023,
                jsonrpc: '2.0',
                result: ['0x64a845a5b02460acf8a3d84503b0d68d028b4bb4'],
              },
              responseTime: 1620710693213,
              success: true,
            },
            {
              id: 4279100034,
              method: 'eth_accounts',
              methodType: 'restricted',
              origin: 'https://app.uniswap.org',
              request: {
                method: 'eth_accounts',
                params: [],
                jsonrpc: '2.0',
                id: 4279100034,
                origin: 'https://app.uniswap.org',
                tabId: 5,
              },
              requestTime: 1620710712072,
              response: {
                id: 4279100034,
                jsonrpc: '2.0',
                result: ['0x64a845a5b02460acf8a3d84503b0d68d028b4bb4'],
              },
              responseTime: 1620710712075,
              success: true,
            },
          ],
        },
      },
    };

    const newStorage = await migration70.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 70,
      },
      data: {
        FooController: { a: 'b' },
        PermissionLogController: {
          permissionActivityLog: [
            {
              id: 522690215,
              method: 'eth_accounts',
              methodType: 'restricted',
              origin: 'https://metamask.io',
              requestTime: 1602643170686,
              responseTime: 1602643170688,
              success: true,
            },
            {
              id: 1620464600,
              method: 'eth_accounts',
              methodType: 'restricted',
              origin: 'https://widget.getacute.io',
              requestTime: 1602643172935,
              responseTime: 1602643172935,
              success: true,
            },
            {
              id: 4279100021,
              method: 'eth_accounts',
              methodType: 'restricted',
              origin: 'https://app.uniswap.org',
              requestTime: 1620710669962,
              responseTime: 1620710669963,
              success: true,
            },
            {
              id: 4279100022,
              method: 'eth_requestAccounts',
              methodType: 'restricted',
              origin: 'https://app.uniswap.org',
              requestTime: 1620710686872,
              responseTime: 1620710693187,
              success: true,
            },
            {
              id: 4279100023,
              method: 'eth_requestAccounts',
              methodType: 'restricted',
              origin: 'https://app.uniswap.org',
              requestTime: 1620710693204,
              responseTime: 1620710693213,
              success: true,
            },
            {
              id: 4279100034,
              method: 'eth_accounts',
              methodType: 'restricted',
              origin: 'https://app.uniswap.org',
              requestTime: 1620710712072,
              responseTime: 1620710712075,
              success: true,
            },
          ],
        },
      },
    });
  });

  it('should handle missing PermissionLogController', async () => {
    const oldStorage = {
      meta: {
        version: 69,
      },
      data: {
        FooController: { a: 'b' },
      },
    };

    const newStorage = await migration70.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 70,
      },
      data: {
        FooController: { a: 'b' },
      },
    });
  });

  it('should handle missing PermissionLogController.permissionActivityLog', async () => {
    const oldStorage = {
      meta: {
        version: 69,
      },
      data: {
        FooController: { a: 'b' },
        PermissionLogController: {},
      },
    };

    const newStorage = await migration70.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 70,
      },
      data: {
        FooController: { a: 'b' },
        PermissionLogController: {},
      },
    });
  });
});
