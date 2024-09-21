import migration73 from './073';

describe('migration #73', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 72,
      },
      data: {},
    };

    const newStorage = await migration73.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 73,
    });
  });

  it('should empty knownMethodData object in PreferencesController', async () => {
    const oldStorage = {
      meta: {
        version: 72,
      },
      data: {
        PreferencesController: {
          knownMethodData: {
            '0x095ea7b3': {
              name: 'Approve',
              params: [
                {
                  type: 'address',
                },
                {
                  type: 'uint256',
                },
              ],
            },
            '0x1249c58b': {
              name: 'Mint',
              params: [],
            },
            '0x1688f0b9': {
              name: 'Create Proxy With Nonce',
              params: [
                {
                  type: 'address',
                },
                {
                  type: 'bytes',
                },
                {
                  type: 'uint256',
                },
              ],
            },
            '0x18cbafe5': {
              name: 'Swap Exact Tokens For E T H',
              params: [
                {
                  type: 'uint256',
                },
                {
                  type: 'uint256',
                },
                {
                  type: 'address[]',
                },
                {
                  type: 'address',
                },
                {
                  type: 'uint256',
                },
              ],
            },
            '0x23b872dd': {
              name: 'Transfer From',
              params: [
                {
                  type: 'address',
                },
                {
                  type: 'address',
                },
                {
                  type: 'uint256',
                },
              ],
            },
            '0x2e1a7d4d': {
              name: 'Withdraw',
              params: [
                {
                  type: 'uint256',
                },
              ],
            },
            '0x2e7ba6ef': {
              name: 'Claim',
              params: [
                {
                  type: 'uint256',
                },
                {
                  type: 'address',
                },
                {
                  type: 'uint256',
                },
                {
                  type: 'bytes32[]',
                },
              ],
            },
            '0x2eb2c2d6': {
              name: 'Safe Batch Transfer From',
              params: [
                {
                  type: 'address',
                },
                {
                  type: 'address',
                },
                {
                  type: 'uint256[]',
                },
                {
                  type: 'uint256[]',
                },
                {
                  type: 'bytes',
                },
              ],
            },
            '0x3671f8cf': {},
            '0x41441d3b': {
              name: 'Enter Staking',
              params: [
                {
                  type: 'uint256',
                },
              ],
            },
            '0x441a3e70': {
              name: 'Withdraw',
              params: [
                {
                  type: 'uint256',
                },
                {
                  type: 'uint256',
                },
              ],
            },
            '0x6f652e1a': {
              name: 'Create Order',
              params: [
                {
                  type: 'address',
                },
                {
                  type: 'uint256',
                },
                {
                  type: 'uint256',
                },
                {
                  type: 'uint256',
                },
              ],
            },
            '0x8dbdbe6d': {
              name: 'Deposit',
              params: [
                {
                  type: 'uint256',
                },
                {
                  type: 'uint256',
                },
                {
                  type: 'address',
                },
              ],
            },
            '0x8ed955b9': {
              name: 'Harvest All',
              params: [],
            },
            '0xa22cb465': {
              name: 'Set Approval For All',
              params: [
                {
                  type: 'address',
                },
                {
                  type: 'bool',
                },
              ],
            },
            '0xa9059cbb': {
              name: 'Transfer',
              params: [
                {
                  type: 'address',
                },
                {
                  type: 'uint256',
                },
              ],
            },
            '0xab834bab': {
              name: 'Atomic Match_',
              params: [
                {
                  type: 'address[14]',
                },
                {
                  type: 'uint256[18]',
                },
                {
                  type: 'uint8[8]',
                },
                {
                  type: 'bytes',
                },
                {
                  type: 'bytes',
                },
                {
                  type: 'bytes',
                },
                {
                  type: 'bytes',
                },
                {
                  type: 'bytes',
                },
                {
                  type: 'bytes',
                },
                {
                  type: 'uint8[2]',
                },
                {
                  type: 'bytes32[5]',
                },
              ],
            },
            '0xd0e30db0': {
              name: 'Deposit',
              params: [],
            },
            '0xddd81f82': {
              name: 'Register Proxy',
              params: [],
            },
            '0xded9382a': {
              name: 'Remove Liquidity E T H With Permit',
              params: [
                {
                  type: 'address',
                },
                {
                  type: 'uint256',
                },
                {
                  type: 'uint256',
                },
                {
                  type: 'uint256',
                },
                {
                  type: 'address',
                },
                {
                  type: 'uint256',
                },
                {
                  type: 'bool',
                },
                {
                  type: 'uint8',
                },
                {
                  type: 'bytes32',
                },
                {
                  type: 'bytes32',
                },
              ],
            },
            '0xe2bbb158': {
              name: 'Deposit',
              params: [
                {
                  type: 'uint256',
                },
                {
                  type: 'uint256',
                },
              ],
            },
            '0xf305d719': {
              name: 'Add Liquidity E T H',
              params: [
                {
                  type: 'address',
                },
                {
                  type: 'uint256',
                },
                {
                  type: 'uint256',
                },
                {
                  type: 'uint256',
                },
                {
                  type: 'address',
                },
                {
                  type: 'uint256',
                },
              ],
            },
          },
        },
      },
    };

    const newStorage = await migration73.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 73,
      },
      data: {
        PreferencesController: {
          knownMethodData: {},
        },
      },
    });
  });

  it('should preserve other PreferencesController state', async () => {
    const oldStorage = {
      meta: {
        version: 72,
      },
      data: {
        PreferencesController: {
          currentLocale: 'en',
          dismissSeedBackUpReminder: false,
          ipfsGateway: 'dweb.link',
          knownMethodData: {
            '0xd0e30db0': {
              name: 'Deposit',
              params: [],
            },
            '0xddd81f82': {
              name: 'Register Proxy',
              params: [],
            },
          },
          openSeaEnabled: false,
          useTokenDetection: false,
        },
      },
    };

    const newStorage = await migration73.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 73,
      },
      data: {
        PreferencesController: {
          currentLocale: 'en',
          dismissSeedBackUpReminder: false,
          ipfsGateway: 'dweb.link',
          knownMethodData: {},
          openSeaEnabled: false,
          useTokenDetection: false,
        },
      },
    });
  });

  it('should not change state in controllers other than PreferencesController', async () => {
    const oldStorage = {
      meta: {
        version: 71,
      },
      data: {
        PreferencesController: {
          knownMethodData: {
            '0xd0e30db0': {
              name: 'Deposit',
              params: [],
            },
            '0xddd81f82': {
              name: 'Register Proxy',
              params: [],
            },
          },
        },
        data: {
          FooController: { a: 'b' },
        },
      },
    };

    const newStorage = await migration73.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 73,
      },
      data: {
        PreferencesController: {
          knownMethodData: {},
        },
        data: {
          FooController: { a: 'b' },
        },
      },
    });
  });
});
