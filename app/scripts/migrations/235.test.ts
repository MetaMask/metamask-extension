import { cloneDeep } from 'lodash';
import { captureException } from '../../../shared/lib/sentry';
import { migrate, version } from './235';

jest.mock('../../../shared/lib/sentry', () => ({
  captureException: jest.fn(),
}));

const mockedCaptureException = jest.mocked(captureException);

const VERSION = version;
const OLD_VERSION = VERSION - 1;

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

const createState = (networkController: unknown): VersionedData => ({
  meta: { version: OLD_VERSION },
  data: {
    NetworkController: networkController,
    OtherController: { preserved: true },
  },
});

describe(`migration #${VERSION}`, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('bumps the version', async () => {
    const oldStorage = createState({ networkConfigurationsByChainId: {} });

    await migrate(oldStorage, new Set<string>());

    expect(oldStorage.meta.version).toBe(VERSION);
  });

  it('removes failoverUrls from every RPC endpoint of every network', async () => {
    const oldStorage = createState({
      selectedNetworkClientId: 'mainnet',
      networkConfigurationsByChainId: {
        '0x1': {
          chainId: '0x1',
          name: 'Ethereum',
          rpcEndpoints: [
            {
              networkClientId: 'mainnet',
              type: 'infura',
              url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
              failoverUrls: ['https://failover.example/mainnet'],
            },
            {
              networkClientId: 'custom-1',
              type: 'custom',
              url: 'https://custom.example/rpc',
              name: 'Custom',
              failoverUrls: [],
            },
          ],
        },
        '0x38': {
          chainId: '0x38',
          name: 'BNB Chain',
          rpcEndpoints: [
            {
              networkClientId: 'bsc',
              type: 'custom',
              url: 'https://bsc.example/rpc',
              failoverUrls: ['https://failover.example/bsc'],
            },
          ],
        },
      },
    });
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).toStrictEqual({
      NetworkController: {
        selectedNetworkClientId: 'mainnet',
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            name: 'Ethereum',
            rpcEndpoints: [
              {
                networkClientId: 'mainnet',
                type: 'infura',
                url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
              },
              {
                networkClientId: 'custom-1',
                type: 'custom',
                url: 'https://custom.example/rpc',
                name: 'Custom',
              },
            ],
          },
          '0x38': {
            chainId: '0x38',
            name: 'BNB Chain',
            rpcEndpoints: [
              {
                networkClientId: 'bsc',
                type: 'custom',
                url: 'https://bsc.example/rpc',
              },
            ],
          },
        },
      },
      OtherController: { preserved: true },
    });
    expect(changedControllers).toStrictEqual(new Set(['NetworkController']));
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('does not mark NetworkController as changed when no endpoint has failoverUrls', async () => {
    const oldStorage = createState({
      networkConfigurationsByChainId: {
        '0x1': {
          chainId: '0x1',
          rpcEndpoints: [
            {
              networkClientId: 'mainnet',
              type: 'infura',
              url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
            },
          ],
        },
      },
    });
    const before = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).toStrictEqual(before.data);
    expect(changedControllers).toStrictEqual(new Set());
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  it('skips invalid networks and endpoints while still cleaning valid ones', async () => {
    const oldStorage = createState({
      networkConfigurationsByChainId: {
        '0x1': null,
        '0x2': { chainId: '0x2' },
        '0x3': { chainId: '0x3', rpcEndpoints: 'invalid' },
        '0x4': {
          chainId: '0x4',
          rpcEndpoints: [
            null,
            'invalid',
            { url: 'https://a.example', failoverUrls: ['https://f.example'] },
          ],
        },
      },
    });
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data.NetworkController).toStrictEqual({
      networkConfigurationsByChainId: {
        '0x1': null,
        '0x2': { chainId: '0x2' },
        '0x3': { chainId: '0x3', rpcEndpoints: 'invalid' },
        '0x4': {
          chainId: '0x4',
          rpcEndpoints: [null, 'invalid', { url: 'https://a.example' }],
        },
      },
    });
    expect(changedControllers).toStrictEqual(new Set(['NetworkController']));
  });

  it('leaves the state untouched when NetworkController is absent', async () => {
    const oldStorage: VersionedData = {
      meta: { version: OLD_VERSION },
      data: { OtherController: { preserved: true } },
    };
    const before = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).toStrictEqual(before.data);
    expect(changedControllers).toStrictEqual(new Set());
    expect(mockedCaptureException).not.toHaveBeenCalled();
  });

  // @ts-expect-error 'each' function missing from type definitions, but it does exist
  it.each([null, 'invalid'])(
    'captures an exception when NetworkController is %p',
    async (networkController: null | string) => {
      const oldStorage = createState(networkController);
      const before = cloneDeep(oldStorage);
      const changedControllers = new Set<string>();

      await migrate(oldStorage, changedControllers);

      expect(oldStorage.data).toStrictEqual(before.data);
      expect(changedControllers).toStrictEqual(new Set());
      expect(mockedCaptureException).toHaveBeenCalledWith(
        new Error(
          `Migration ${VERSION}: Invalid NetworkController state: '${typeof networkController}'`,
        ),
      );
    },
  );

  it('captures an exception when networkConfigurationsByChainId is missing', async () => {
    const oldStorage = createState({});
    const before = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).toStrictEqual(before.data);
    expect(changedControllers).toStrictEqual(new Set());
    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${VERSION}: Missing networkConfigurationsByChainId property from NetworkController`,
      ),
    );
  });

  it('captures an exception when networkConfigurationsByChainId is invalid', async () => {
    const oldStorage = createState({ networkConfigurationsByChainId: null });
    const before = cloneDeep(oldStorage);
    const changedControllers = new Set<string>();

    await migrate(oldStorage, changedControllers);

    expect(oldStorage.data).toStrictEqual(before.data);
    expect(changedControllers).toStrictEqual(new Set());
    expect(mockedCaptureException).toHaveBeenCalledWith(
      new Error(
        `Migration ${VERSION}: Invalid networkConfigurationsByChainId state: 'object'`,
      ),
    );
  });
});
