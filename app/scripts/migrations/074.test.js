import migration74 from './074';

describe('migration #74', () => {
  it('should update the version metadata', async () => {
    const oldStorage = {
      meta: {
        version: 73,
      },
      data: {},
    };

    const newStorage = await migration74.migrate(oldStorage);
    expect(newStorage.meta).toStrictEqual({
      version: 74,
    });
  });

  it('should add a deprecated testnet to custom networks if that network is currently selected', async () => {
    const oldStorage = {
      meta: {
        version: 73,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0x4',
          },
        },
      },
    };

    const newStorage = await migration74.migrate(oldStorage);
    expect(newStorage).toStrictEqual({
      meta: {
        version: 74,
      },
      data: {
        NetworkController: {
          provider: {
            chainId: '0x4',
          },
        },
        PreferencesController: {
          frequentRpcListDetail: [
            {
              rpcUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
              chainId: '0x4',
              ticker: 'ETH',
              nickname: 'Rinkeby',
              rpcPrefs: {},
            },
          ],
        },
      },
    });
  });
});
