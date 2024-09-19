import React from 'react';
import configureMockStore from 'redux-mock-store';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import nock from 'nock';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import {
  CHAIN_IDS,
  MAINNET_DISPLAY_NAME,
  NETWORK_TYPES,
  getRpcUrl,
} from '../../../../../shared/constants/network';
import * as fetchWithCacheModule from '../../../../../shared/lib/fetch-with-cache';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { addNetwork } from '../../../../store/actions';
import { NetworksForm } from './networks-form';

jest.mock('../../../../../ui/store/actions', () => ({
  ...jest.requireActual('../../../../../ui/store/actions'),
  addNetwork: jest.fn(),
}));

const renderComponent = (props) => {
  const store = configureMockStore([])({
    metamask: {
      ...mockNetworkState({ chainId: CHAIN_IDS.MAINNET }),
      useSafeChainsListValidation: true,
      orderedNetworkList: {
        networkId: '0x1',
        networkRpcUrl: 'https://mainnet.infura.io/v3/',
      },
    },
  });
  return renderWithProvider(<NetworksForm {...props} />, store);
};

const propNetworkDisplay = {
  networkFormState: {
    chainId: '100',
    blockExplorers: {
      blockExplorerUrls: [],
    },
    clear: () => ({}),
    name: MAINNET_DISPLAY_NAME,
    rpcUrls: {
      defaultRpcEndpointIndex: 0,
      rpcEndpoints: [
        {
          url: getRpcUrl({
            network: NETWORK_TYPES.MAINNET,
            excludeProjectId: true,
          }),
        },
      ],
    },
    setBlockExplorers: () => ({}),
    setChainId: () => ({}),
    setName: () => ({}),
    setRpcUrls: () => ({}),
    setTicker: () => ({}),
    ticker: 'ETH',
  },
  onRpcAdd: () => ({}),
  onBlockExplorerAdd: () => ({}),
};

describe('NetworkForm Component', () => {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  beforeEach(() => {
    nock('https://chainid.network:443', { encodedQueryParams: true })
      .get('/chains.json')
      .reply(200, [
        {
          name: 'Polygon Mainnet',
          chain: 'Polygon',
          rpc: [
            'https://polygon-rpc.com/',
            'https://rpc-mainnet.matic.network',
            'https://matic-mainnet.chainstacklabs.com',
            'https://rpc-mainnet.maticvigil.com',
            'https://rpc-mainnet.matic.quiknode.pro',
            'https://matic-mainnet-full-rpc.bwarelabs.com',
          ],
          nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
          },
          shortName: 'MATIC',
          chainId: 137,
        },
      ]);

    nock('https://bsc-dataseed.binance.org:443', {
      encodedQueryParams: true,
    })
      .post('/')
      .reply(200, { jsonrpc: '2.0', result: '0x38' });

    nock('https://rpc.flashbots.net:443', {
      encodedQueryParams: true,
    })
      .post('/')
      .reply(200, { jsonrpc: '2.0', result: '0x1' });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should render add new network form correctly', async () => {
    const { queryByText } = renderComponent({
      ...propNetworkDisplay,
      networkFormState: {
        chainId: '1',
        blockExplorers: {
          blockExplorerUrls: [],
        },
        clear: () => ({}),
        name: MAINNET_DISPLAY_NAME,
        rpcUrls: {
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              url: getRpcUrl({
                network: NETWORK_TYPES.MAINNET,
                excludeProjectId: true,
              }),
            },
          ],
        },
        setBlockExplorers: () => ({}),
        setChainId: () => ({}),
        setName: () => ({}),
        setRpcUrls: () => ({}),
        setTicker: () => ({}),
        ticker: 'ETH',
      },
    });
    expect(queryByText('Network name')).toBeInTheDocument();
    expect(queryByText('Default RPC URL')).toBeInTheDocument();
    expect(queryByText('Chain ID')).toBeInTheDocument();
    expect(queryByText('Currency symbol')).toBeInTheDocument();
    expect(queryByText('Block explorer URL')).toBeInTheDocument();
    expect(queryByText('Save')).toBeInTheDocument();

    expect(
      await screen.findByText(
        'This Chain ID is currently used by the Ethereum Mainnet network.',
      ),
    ).toBeInTheDocument();
  });

  it('should render network form correctly', () => {
    const { queryByText, getByDisplayValue } =
      renderComponent(propNetworkDisplay);
    expect(queryByText('Network name')).toBeInTheDocument();
    expect(queryByText('Default RPC URL')).toBeInTheDocument();
    expect(queryByText('Chain ID')).toBeInTheDocument();
    expect(queryByText('Currency symbol')).toBeInTheDocument();
    expect(queryByText('Block explorer URL')).toBeInTheDocument();
    expect(queryByText('Save')).toBeInTheDocument();

    expect(
      getByDisplayValue(propNetworkDisplay.networkFormState.chainId),
    ).toBeInTheDocument();
    expect(
      getByDisplayValue(propNetworkDisplay.networkFormState.ticker),
    ).toBeInTheDocument();
    expect(
      getByDisplayValue(propNetworkDisplay.networkFormState.name),
    ).toBeInTheDocument();
  });

  it('should validate chain id field correctly', async () => {
    renderComponent({
      ...propNetworkDisplay,
      networkFormState: {
        chainId: '1',
        blockExplorers: {
          blockExplorerUrls: [],
        },
        clear: () => ({}),
        name: MAINNET_DISPLAY_NAME,
        rpcUrls: {
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              url: 'https://bsc-dataseed.binance.org/',
              type: 'custom',
              name: undefined,
            },
          ],
        },
        setBlockExplorers: () => ({}),
        setChainId: () => ({}),
        setName: () => ({}),
        setRpcUrls: () => ({}),
        setTicker: () => ({}),
        ticker: 'ETH',
      },
    });

    expect(
      await screen.findByText(
        'This Chain ID is currently used by the Ethereum Mainnet network.',
      ),
    ).toBeInTheDocument();

    const expectedWarning =
      'The RPC URL you have entered returned a different chain ID (56).';
    expect(await screen.findByText(expectedWarning)).toBeInTheDocument();

    expect(screen.getByText('Save')).toBeDisabled();
  });

  it('should chainID be a valid number', async () => {
    renderComponent({
      ...propNetworkDisplay,
      networkFormState: {
        chainId: 'a',
        blockExplorers: {
          blockExplorerUrls: [],
        },
        clear: () => ({}),
        name: MAINNET_DISPLAY_NAME,
        rpcUrls: {
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              url: 'https://bsc-dataseed.binance.org/',
              type: 'custom',
              name: undefined,
            },
          ],
        },
        setBlockExplorers: () => ({}),
        setChainId: () => ({}),
        setName: () => ({}),
        setRpcUrls: () => ({}),
        setTicker: () => ({}),
        ticker: 'ETH',
      },
    });

    expect(
      await screen.findByText(
        "Invalid number. Enter a decimal or '0x'-prefixed hexadecimal number.",
      ),
    ).toBeInTheDocument();
  });

  it('should chainID not be leading zeros', async () => {
    renderComponent({
      ...propNetworkDisplay,
      networkFormState: {
        chainId: '00000012314',
        blockExplorers: {
          blockExplorerUrls: [],
        },
        clear: () => ({}),
        name: MAINNET_DISPLAY_NAME,
        rpcUrls: {
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              url: 'https://bsc-dataseed.binance.org/',
              type: 'custom',
              name: undefined,
            },
          ],
        },
        setBlockExplorers: () => ({}),
        setChainId: () => ({}),
        setName: () => ({}),
        setRpcUrls: () => ({}),
        setTicker: () => ({}),
        ticker: 'ETH',
      },
    });

    expect(
      await screen.findByText('Invalid number. Remove any leading zeros.'),
    ).toBeInTheDocument();
  });

  it('should not show suggested ticker and duplicating the exact symbol', async () => {
    const safeChainsList = [
      {
        chainId: 42161,
        nativeCurrency: {
          symbol: 'ETH',
        },
      },
    ];

    // Mock the fetchWithCache function to return the safeChainsList
    jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(safeChainsList);

    renderComponent({
      ...propNetworkDisplay,
      networkFormState: {
        chainId: '42161',
        blockExplorers: {
          blockExplorerUrls: [],
        },
        clear: () => ({}),
        name: MAINNET_DISPLAY_NAME,
        rpcUrls: {
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              url: 'https://bsc-dataseed.binance.org/',
              type: 'custom',
              name: undefined,
            },
          ],
        },
        setBlockExplorers: () => ({}),
        setChainId: () => ({}),
        setName: () => ({}),
        setRpcUrls: () => ({}),
        setTicker: () => ({}),
        ticker: 'abcd',
      },
    });

    const expectedSymbolWarning = 'Suggested currency symbol:';
    expect(await screen.findByText(expectedSymbolWarning)).toBeInTheDocument();

    expect(
      await screen.findByText(
        "This token symbol doesn't match the network name or chain ID entered. Many popular tokens use similar symbols, which scammers can use to trick you into sending them a more valuable token in return. Verify everything before you continue.",
      ),
    ).toBeInTheDocument();
  });

  it('should validate currency symbol field for ZYN network', async () => {
    const safeChainsList = [
      {
        chainId: 78,
        nativeCurrency: {
          symbol: 'PETH',
        },
      },
    ];

    // Mock the fetchWithCache function to return the safeChainsList
    jest
      .spyOn(fetchWithCacheModule, 'default')
      .mockResolvedValue(safeChainsList);

    renderComponent({
      ...propNetworkDisplay,
      networkFormState: {
        chainId: '78',
        blockExplorers: {
          blockExplorerUrls: [],
        },
        clear: () => ({}),
        name: MAINNET_DISPLAY_NAME,
        rpcUrls: {
          defaultRpcEndpointIndex: 0,
          rpcEndpoints: [
            {
              url: 'https://bsc-dataseed.binance.org/',
              type: 'custom',
              name: undefined,
            },
          ],
        },
        setBlockExplorers: () => ({}),
        setChainId: () => ({}),
        setName: () => ({}),
        setRpcUrls: () => ({}),
        setTicker: () => ({}),
        ticker: 'ZYN',
      },
    });

    expect(
      await screen.queryByTestId('network-form-ticker-suggestion'),
    ).not.toBeInTheDocument();
  });

  it('should call addNetwork on save', async () => {
    const { getByText } = renderComponent(propNetworkDisplay);
    const saveButton = getByText('Save');
    fireEvent.click(saveButton);
    await waitFor(() => expect(addNetwork).toHaveBeenCalledTimes(1));
    expect(addNetwork).toHaveBeenCalledWith({
      chainId: '0x64',
      name: 'Ethereum Mainnet',
      nativeCurrency: 'ETH',
      rpcEndpoints: [
        {
          url: 'https://mainnet.infura.io/v3/',
        },
      ],
      defaultRpcEndpointIndex: 0,
      blockExplorerUrls: [],
      defaultBlockExplorerUrlIndex: undefined,
    });
  });
});
