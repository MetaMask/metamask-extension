import { migrate, version } from './126';

const oldVersion = 125;

describe(`migration #${version}`, () => {
  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('Does nothing if `providerConfig` is not in the network controller state', async () => {
    const oldState = {
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
      },
    };

    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    expect(transformedState.data).toStrictEqual(oldState);
  });

  it('Removes providerConfig from the network controller state', async () => {
    const oldState = {
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
        providerConfig: {
          chainId: '0x1',
          ticker: 'ETH',
        } as object | undefined,
      },
    };
    const transformedState = await migrate({
      meta: { version: oldVersion },
      data: oldState,
    });

    delete oldState.NetworkController.providerConfig;
    expect(transformedState.data).toStrictEqual(oldState);
  });
});
