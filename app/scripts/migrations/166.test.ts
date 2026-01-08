import { NetworkState } from '@metamask/network-controller';
import { getBaseNetworkConfiguration, migrate, version } from './166';

const oldVersion = 165;

describe(`migration #${version}`, () => {
  beforeEach(() => {
    global.sentry = { captureException: jest.fn() };
  });

  afterEach(() => {
    global.sentry = undefined;
  });

  it('updates the version metadata', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {},
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(newStorage.meta).toStrictEqual({ version });
  });

  it('logs an error and returns the original state if NetworkController is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {},
    };

    const mockWarn = jest.spyOn(console, 'warn').mockImplementation(jest.fn());

    const newStorage = await migrate(oldStorage);

    expect(mockWarn).toHaveBeenCalledWith(
      `Migration ${version}: NetworkController not found.`,
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('logs an error and returns the original state if NetworkController is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: 'not an object',
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: NetworkController is not an object: string`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('logs an error and returns the original state if networkConfigurationsByChainId is missing', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {},
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: NetworkController missing property networkConfigurationsByChainId.`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('logs an error and returns the original state if networkConfigurationsByChainId is not an object', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: 'not an object',
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    expect(global.sentry.captureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${version}: NetworkController.networkConfigurationsByChainId is not an object: string.`,
      ),
    );
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('does not modify state if Base network is already present', async () => {
    const customBaseConfig = {
      chainId: '0x2105',
      ticker: 'ETH',
      nickname: 'My Custom Base',
      rpcUrl: 'https://custom-base-rpc.example.com',
    };
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x2105': customBaseConfig,
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Assert - Base network config is unchanged
    expect(
      (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId['0x2105'],
    ).toStrictEqual(customBaseConfig);

    // Assert - the entire state structure is unchanged
    expect(newStorage.data).toStrictEqual(oldStorage.data);
  });

  it('adds Base network to networkConfigurationsByChainId if not already present', async () => {
    const oldStorage = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            // Some network configurations, but not Base
            '0x1': { chainId: '0x1' },
            '0x1337': { chainId: '0x1337' },
          },
        },
      },
    };

    const newStorage = await migrate(oldStorage);

    // Assert - Base network was added
    expect(
      (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId['0x2105'],
    ).toStrictEqual(getBaseNetworkConfiguration());

    // Assert - Other networks are unchanged
    expect(
      (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId['0x1'],
    ).toStrictEqual(
      oldStorage.data.NetworkController.networkConfigurationsByChainId['0x1'],
    );
    expect(
      (newStorage.data.NetworkController as NetworkState)
        .networkConfigurationsByChainId['0x1337'],
    ).toStrictEqual(
      oldStorage.data.NetworkController.networkConfigurationsByChainId[
        '0x1337'
      ],
    );
  });
});
