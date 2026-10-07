import { cloneDeep } from 'lodash';
import { RpcEndpointType } from '@metamask/network-controller';
import { migrate, version } from './231';

const VERSION = version;
const oldVersion = VERSION - 1;

const brokenCustomEndpoint = (networkClientId: string) => ({
  failoverUrls: [],
  name: 'Arc',
  networkClientId,
  type: RpcEndpointType.Custom,
  url: `https://arc-mainnet.infura.io/v3/{infuraProjectId}`,
});

const validInfuraEndpoint = (networkClientId: string) => ({
  failoverUrls: [],
  networkClientId,
  type: RpcEndpointType.Infura,
  url: `https://${networkClientId}.infura.io/v3/{infuraProjectId}`,
});

describe(`migration #${VERSION}`, () => {
  it('updates the version metadata', async () => {
    const versionedData = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x13b0': {
              chainId: '0x13b0',
              name: 'Arc',
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              rpcEndpoints: [brokenCustomEndpoint('a-uuid')],
            },
          },
        },
      },
    };
    const changedKeys = new Set<string>();
    await migrate(versionedData, changedKeys);

    expect(versionedData.meta).toStrictEqual({ version: VERSION });
    expect(changedKeys.has('NetworkController')).toBe(true);
  });

  it('converts a broken custom endpoint to an infura endpoint', async () => {
    const versionedData = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x13b0': {
              chainId: '0x13b0',
              name: 'Arc',
              nativeCurrency: 'USDC',
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              rpcEndpoints: [brokenCustomEndpoint('a-uuid')],
            },
          },
        },
      },
    };
    const changedKeys = new Set<string>();
    await migrate(versionedData, changedKeys);

    expect(
      versionedData.data.NetworkController.networkConfigurationsByChainId[
        '0x13b0'
      ].rpcEndpoints,
    ).toStrictEqual([
      {
        failoverUrls: [],
        name: 'Arc',
        networkClientId: 'arc-mainnet',
        type: RpcEndpointType.Infura,
        url: 'https://arc-mainnet.infura.io/v3/{infuraProjectId}',
      },
    ]);
  });

  it('remaps selectedNetworkClientId and networksMetadata', async () => {
    const versionedData = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          selectedNetworkClientId: 'old-uuid',
          networksMetadata: {
            'old-uuid': { status: 'available', EIPS: { 1559: true } },
          },
          networkConfigurationsByChainId: {
            '0x13b0': {
              chainId: '0x13b0',
              name: 'Arc',
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              rpcEndpoints: [brokenCustomEndpoint('old-uuid')],
            },
          },
        },
      },
    };
    const changedKeys = new Set<string>();
    await migrate(versionedData, changedKeys);

    const networkState = versionedData.data.NetworkController;
    expect(networkState.selectedNetworkClientId).toBe('arc-mainnet');
    expect(networkState.networksMetadata).toStrictEqual({
      'arc-mainnet': { status: 'available', EIPS: { 1559: true } },
    });
    expect(changedKeys.has('NetworkController')).toBe(true);
  });

  it('leaves built-in infura endpoints untouched', async () => {
    const versionedData = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              name: 'Ethereum',
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              rpcEndpoints: [validInfuraEndpoint('mainnet')],
            },
          },
        },
      },
    };
    const changedKeys = new Set<string>();
    await migrate(versionedData, changedKeys);

    expect(changedKeys.size).toBe(0);
    expect(
      versionedData.data.NetworkController.networkConfigurationsByChainId['0x1']
        .rpcEndpoints,
    ).toStrictEqual([validInfuraEndpoint('mainnet')]);
  });

  it('leaves custom endpoints with a real project ID alone', async () => {
    const repairedEndpoint = {
      networkClientId: 'another-uuid',
      type: RpcEndpointType.Custom,
      url: 'https://arc-mainnet.infura.io/v3/real-project-id',
    };
    const versionedData = {
      meta: { version: oldVersion },
      data: {
        NetworkController: {
          networkConfigurationsByChainId: {
            '0x13b0': {
              chainId: '0x13b0',
              name: 'Arc',
              defaultRpcEndpointIndex: 0,
              blockExplorerUrls: [],
              rpcEndpoints: [repairedEndpoint],
            },
          },
        },
      },
    };
    const changedKeys = new Set<string>();
    await migrate(versionedData, changedKeys);

    expect(changedKeys.size).toBe(0);
    expect(
      versionedData.data.NetworkController.networkConfigurationsByChainId[
        '0x13b0'
      ].rpcEndpoints,
    ).toStrictEqual([repairedEndpoint]);
  });

  it('skips non-object NetworkController state', async () => {
    const versionedData = {
      meta: { version: oldVersion },
      data: { NetworkController: 'unexpected' },
    };
    const changedKeys = new Set<string>();
    await migrate(versionedData, changedKeys);

    expect(versionedData.meta).toStrictEqual({ version: VERSION });
    expect(changedKeys.size).toBe(0);
  });
});
