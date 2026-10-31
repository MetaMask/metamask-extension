import migrationTemplate from './030';

type MigrationInput = Parameters<typeof migrationTemplate.migrate>[0];

const storage: MigrationInput = {
  meta: { version: 29 },
  data: {
    NetworkController: {
      network: 'fail',
      provider: {
        chainId: 'fail',
        nickname: '',
        rpcTarget: 'https://api.myetherwallet.com/eth',
        ticker: 'ETH',
        type: 'rinkeby',
      },
    },
    PreferencesController: {
      frequentRpcListDetail: [
        {
          chainId: 'fail',
          nickname: '',
          rpcUrl: 'http://127.0.0.1:8545',
          ticker: '',
        },
        {
          chainId: '1',
          nickname: '',
          rpcUrl: 'https://api.myetherwallet.com/eth',
          ticker: 'ETH',
        },
      ],
    },
  },
};

describe('storage is migrated successfully', () => {
  it('should work', async () => {
    const migratedData = await migrationTemplate.migrate(storage);

    expect(migratedData.meta.version).toStrictEqual(30);
    expect(
      (
        migratedData.data.PreferencesController as {
          frequentRpcListDetail: { chainId?: string }[];
        }
      ).frequentRpcListDetail[0].chainId,
    ).toBeUndefined();
    expect(
      (
        migratedData.data.PreferencesController as {
          frequentRpcListDetail: { chainId?: string }[];
        }
      ).frequentRpcListDetail[1].chainId,
    ).toStrictEqual('1');
    expect(
      (
        migratedData.data.NetworkController as {
          provider: { chainId?: string };
        }
      ).provider.chainId,
    ).toBeUndefined();
    expect(
      (migratedData.data.NetworkController as { network?: string }).network,
    ).toBeUndefined();
  });
});
