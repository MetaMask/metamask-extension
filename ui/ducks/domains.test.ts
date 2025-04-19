import { fetchResolutions, shouldSkipEnsResolutionSnap } from './domains';
// eslint-disable-next-line import/order
import * as storeActions from '../store/actions';

jest.mock('../store/actions', () => ({
  ...jest.requireActual('../store/actions'),
  handleSnapRequest: jest.fn(() => Promise.resolve({ resolvedAddresses: [] })),
}));
const mockedStoreActions = jest.mocked(storeActions);

const preinstalledSnapState = {
  snaps: {
    'npm:@metamask/ens-resolver-snap': {
      blocked: false,
      enabled: true,
      id: 'npm:@metamask/ens-resolver-snap',
      initialPermissions: {
        'endowment:ethereum-provider': {},
        'endowment:name-lookup': {},
        'endowment:network-access': {},
      },
      localizationFiles: [],
      manifest: {
        description: 'A Snap used for ENS name resolution',
        initialPermissions: {
          'endowment:ethereum-provider': {},
          'endowment:name-lookup': {},
          'endowment:network-access': {},
        },
        manifestVersion: '0.1',
        proposedName: 'Ethereum Name Service resolver',
        repository: {
          type: 'git',
          url: 'https://github.com/MetaMask/ens-resolver-snap.git',
        },
        source: {
          location: {
            npm: {
              filePath: 'dist/bundle.js',
              iconPath: 'images/icon.svg',
              packageName: '@metamask/ens-resolver-snap',
              registry: 'https://registry.npmjs.org/',
            },
          },
          shasum: 'BizRmzfV+oKEIlvph12McsIqzzDECIw/Td7Lx+/cios=',
        },
        version: '0.1.2',
      },
      preinstalled: true,
      removable: false,
      status: 'crashed',
      version: '0.1.2',
      versionHistory: [
        { date: 1726481055390, origin: 'metamask', version: '0.1.2' },
      ],
    },
  },
  subjects: {
    'npm:@metamask/ens-resolver-snap': {
      origin: 'npm:@metamask/ens-resolver-snap',
      permissions: {
        'endowment:ethereum-provider': {
          caveats: null,
          date: 1726481055390,
          id: '5BFL-61JzLdm9GD-fxBy2',
          invoker: 'npm:@metamask/ens-resolver-snap',
          parentCapability: 'endowment:ethereum-provider',
        },
        'endowment:name-lookup': {
          caveats: null,
          date: 1726481055390,
          id: 'b0q0p5kbA95LB1pRB9lsm',
          invoker: 'npm:@metamask/ens-resolver-snap',
          parentCapability: 'endowment:name-lookup',
        },
        'endowment:network-access': {
          caveats: null,
          date: 1726481055390,
          id: 'XMk2mHrkgrRgXC8kjwtzV',
          invoker: 'npm:@metamask/ens-resolver-snap',
          parentCapability: 'endowment:network-access',
        },
      },
    },
  },
};

describe('domain resolution using preinstalled snap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not skip ENS snap for mainnet', async () => {
    const state = {
      metamask: {
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            name: 'Ethereum Mainnet',
            nativeCurrency: 'ETH',
            rpcEndpoints: [
              {
                networkClientId: 'mainnet',
                url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
                type: 'infura',
              },
            ],
            defaultRpcEndpointIndex: 0,
          },
        },
        ...preinstalledSnapState,
      },
    };

    await fetchResolutions({
      domain: 'test.eth',
      chainId: 'eip155:1',
      state,
    });

    expect(mockedStoreActions.handleSnapRequest).toHaveBeenCalledWith({
      snapId: 'npm:@metamask/ens-resolver-snap',
      origin: '',
      handler: 'onNameLookup',
      request: {
        jsonrpc: '2.0',
        method: ' ',
        params: {
          chainId: 'eip155:1',
          domain: 'test.eth',
        },
      },
    });
  });

  it('does not skip other snaps', async () => {
    const skip = shouldSkipEnsResolutionSnap(
      'eip155:100',
      'npm:@metamask/other-snap',
      {},
    );

    expect(skip).toBe(false);
  });

  it('does not skip ENS snap when non-mainnet and using infura', async () => {
    const state = {
      metamask: {
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            name: 'Ethereum Mainnet',
            nativeCurrency: 'ETH',
            rpcEndpoints: [
              {
                networkClientId: 'mainnet',
                url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
                type: 'infura',
              },
            ],
            defaultRpcEndpointIndex: 0,
          },
        },
        ...preinstalledSnapState,
      },
    };

    await fetchResolutions({
      domain: 'test.eth',
      chainId: 'eip155:100',
      state,
    });

    expect(mockedStoreActions.handleSnapRequest).toHaveBeenCalledWith({
      snapId: 'npm:@metamask/ens-resolver-snap',
      origin: '',
      handler: 'onNameLookup',
      request: {
        jsonrpc: '2.0',
        method: ' ',
        params: {
          chainId: 'eip155:100',
          domain: 'test.eth',
        },
      },
    });
  });

  it('skips ENS snap when non-mainnet and using custom RPC', async () => {
    const state = {
      metamask: {
        networkConfigurationsByChainId: {
          '0x1': {
            chainId: '0x1',
            name: 'Ethereum Mainnet',
            nativeCurrency: 'ETH',
            rpcEndpoints: [
              {
                networkClientId: 'mainnet',
                url: 'https://mainnet.infura.io/v3/{infuraProjectId}',
                type: 'infura',
              },
              {
                url: 'https://eth.llamarpc.com',
                name: 'llama',
                type: 'custom',
                networkClientId: '39f2289a-1876-4a9d-ae85-3bb84fb013cf',
              },
            ],
            defaultRpcEndpointIndex: 1,
          },
        },
        ...preinstalledSnapState,
      },
    };
    const resolutions = await fetchResolutions({
      domain: 'test.eth',
      chainId: 'eip155:100',
      state,
    });
    expect(resolutions).toEqual([]);
    expect(mockedStoreActions.handleSnapRequest).not.toHaveBeenCalled();
  });

  it('skips ENS snap when non-mainnet and no RPC defined for mainnet', async () => {
    const skip = shouldSkipEnsResolutionSnap(
      'eip155:100',
      'npm:@metamask/ens-resolver-snap',
      {
        metamask: {
          networkConfigurationsByChainId: {},
        },
      },
    );

    expect(skip).toBe(true);
  });
});
