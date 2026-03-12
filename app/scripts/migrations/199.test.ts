import { cloneDeep } from 'lodash';
import { migrate, version } from './199';

const VERSION = version;
const OLD_VERSION = VERSION - 1;

const testInfuraProjectId = 'test-infura-project-id';

jest.mock('../../../shared/constants/network', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  ...jest.requireActual('../../../shared/constants/network'),
  get infuraProjectId() {
    return testInfuraProjectId;
  },
}));

describe(`migration #${VERSION}`, () => {
  it('removes the infura project ID from the rpc URL', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  url: `https://mainnet.infura.io/v3/${testInfuraProjectId}`,
                  type: 'custom',
                },
              ],
            },
          },
        },
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual({
      NetworkController: {
        networkConfigurationsByChainId: {
          '0x1': {
            rpcEndpoints: [
              {
                url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
                type: 'infura',
              },
            ],
          },
        },
      },
    });
    expect(changedControllers).toStrictEqual(new Set(['NetworkController']));
  });

  it('adds an infura rpc endpoint if an infura endpoint is missing', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  url: `https://something.io/rpc`,
                  type: 'custom',
                },
              ],
            },
          },
        },
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual({
      NetworkController: {
        networkConfigurationsByChainId: {
          '0x1': {
            rpcEndpoints: [
              {
                url: `https://something.io/rpc`,
                type: 'custom',
              },
              {
                url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
                type: 'infura',
                failoverUrls: [],
                networkClientId: 'mainnet',
              },
            ],
          },
        },
      },
    });
    expect(changedControllers).toStrictEqual(new Set(['NetworkController']));
  });

  it('does not change other custom rpc enpoints', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                {
                  url: `https://mainnet.infura.io/v3/${testInfuraProjectId}`,
                  type: 'custom',
                },
                {
                  url: 'https://somethingelse.com/rpc',
                  type: 'custom',
                },
              ],
            },
          },
        },
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual({
      NetworkController: {
        networkConfigurationsByChainId: {
          '0x1': {
            rpcEndpoints: [
              {
                url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
                type: 'infura',
              },
              {
                url: 'https://somethingelse.com/rpc',
                type: 'custom',
              },
            ],
          },
        },
      },
    });
    expect(changedControllers).toStrictEqual(new Set(['NetworkController']));
  });

  it('does nothing when NetworkController does not exist', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        SomeOtherController: {},
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when NetworkController is not an object', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        NetworkController: 'not an object',
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when networkConfigurationsByChainId does not exist', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        NetworkController: {},
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('does nothing when rpcEndpoints does not exist', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1234': {},
          },
        },
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual(oldStorage.data);
    expect(changedControllers.size).toBe(0);
  });

  it('ignores invalid rpcEndpoints', async () => {
    const oldStorage = {
      meta: { version: OLD_VERSION },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              rpcEndpoints: [
                'not an object',
                {
                  url: `https://mainnet.infura.io/v3/${testInfuraProjectId}`,
                  type: 'custom',
                },
              ],
            },
          },
        },
      },
    };
    const versionedData = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(versionedData, changedControllers);

    expect(versionedData.meta.version).toBe(VERSION);
    expect(versionedData.data).toStrictEqual({
      NetworkController: {
        networkConfigurationsByChainId: {
          '0x1': {
            rpcEndpoints: [
              'not an object',
              {
                url: `https://mainnet.infura.io/v3/{infuraProjectId}`,
                type: 'infura',
              },
            ],
          },
        },
      },
    });
    expect(changedControllers).toStrictEqual(new Set(['NetworkController']));
  });
});
