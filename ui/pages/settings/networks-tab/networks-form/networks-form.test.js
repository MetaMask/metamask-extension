import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, screen } from '@testing-library/react';
import nock from 'nock';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import { defaultNetworksData } from '../networks-tab.constants';
import {
  NETWORK_TYPES,
  getRpcUrl,
} from '../../../../../shared/constants/network';
import * as fetchWithCacheModule from '../../../../../shared/lib/fetch-with-cache';
import NetworksForm from '.';

const renderComponent = (props) => {
  const store = configureMockStore([])({
    metamask: {
      useSafeChainsListValidation: true,
      orderedNetworkList: {
        networkId: '0x1',
        networkRpcUrl: 'https://mainnet.infura.io/v3/',
      },
    },
  });
  return renderWithProvider(<NetworksForm {...props} />, store);
};

jest.mock('../../../../helpers/utils/feature-flags', () => ({
  getLocalNetworkMenuRedesignFeatureFlag: jest.fn(() => false),
}));

const defaultNetworks = defaultNetworksData.map((network) => ({
  ...network,
  viewOnly: true,
}));

const propNewNetwork = {
  networksToRender: defaultNetworks,
  addNewNetwork: true,
};

const propNetworkDisplay = {
  selectedNetwork: {
    rpcUrl: 'http://localhost:8545',
    chainId: '1337',
    ticker: 'ETH',
    label: 'LocalHost',
    blockExplorerUrl: '',
    viewOnly: false,
    rpcPrefs: {},
  },
  isCurrentRpcTarget: false,
  networksToRender: defaultNetworks,
  addNewNetwork: false,
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
    const { queryByText, getByTestId } = renderComponent(propNewNetwork);
    expect(
      queryByText(
        'A malicious network provider can lie about the state of the blockchain and record your network activity. Only add custom networks you trust.',
      ),
    ).toBeInTheDocument();
    expect(queryByText('Network name')).toBeInTheDocument();
    expect(queryByText('New RPC URL')).toBeInTheDocument();
    expect(queryByText('Chain ID')).toBeInTheDocument();
    expect(queryByText('Currency symbol')).toBeInTheDocument();
    expect(queryByText('Block explorer URL (Optional)')).toBeInTheDocument();
    expect(queryByText('Cancel')).toBeInTheDocument();
    expect(queryByText('Save')).toBeInTheDocument();

    const chainIdField = getByTestId('network-form-chain-id');

    fireEvent.change(chainIdField, {
      target: { value: '1' },
    });

    expect(
      await screen.findByText(
        'This Chain ID is currently used by the mainnet network.',
      ),
    ).toBeInTheDocument();

    await fireEvent.change(
      screen.getByRole('textbox', { name: 'New RPC URL' }),
      {
        target: { value: 'test' },
      },
    );
    expect(
      await screen.findByText(
        'URLs require the appropriate HTTP/HTTPS prefix.',
      ),
    ).toBeInTheDocument();
  });

  it('should render network form correctly', () => {
    const { queryByText, getByDisplayValue } =
      renderComponent(propNetworkDisplay);
    expect(queryByText('Network name')).toBeInTheDocument();
    expect(queryByText('New RPC URL')).toBeInTheDocument();
    expect(queryByText('Chain ID')).toBeInTheDocument();
    expect(queryByText('Currency symbol')).toBeInTheDocument();
    expect(queryByText('Block explorer URL (Optional)')).toBeInTheDocument();
    expect(queryByText('Delete')).toBeInTheDocument();
    expect(queryByText('Cancel')).toBeInTheDocument();
    expect(queryByText('Save')).toBeInTheDocument();

    expect(
      getByDisplayValue(propNetworkDisplay.selectedNetwork.label),
    ).toBeInTheDocument();
    expect(
      getByDisplayValue(propNetworkDisplay.selectedNetwork.rpcUrl),
    ).toBeInTheDocument();
    expect(
      getByDisplayValue(propNetworkDisplay.selectedNetwork.chainId),
    ).toBeInTheDocument();
    expect(
      getByDisplayValue(propNetworkDisplay.selectedNetwork.ticker),
    ).toBeInTheDocument();
    expect(
      getByDisplayValue(propNetworkDisplay.selectedNetwork.blockExplorerUrl),
    ).toBeInTheDocument();
  });

  it('should validate RPC URL field correctly', async () => {
    const { getByTestId } = renderComponent(propNewNetwork);

    const rpcUrlField = screen.getByRole('textbox', { name: 'New RPC URL' });
    await fireEvent.change(rpcUrlField, {
      target: { value: 'test' },
    });

    const chainIdField = getByTestId('network-form-chain-id');

    fireEvent.change(chainIdField, {
      target: { value: '1' },
    });
    expect(
      await screen.findByText(
        'URLs require the appropriate HTTP/HTTPS prefix.',
      ),
    ).toBeInTheDocument();

    await fireEvent.change(rpcUrlField, {
      target: { value: '  ' },
    });
    expect(await screen.findByText('Invalid RPC URL')).toBeInTheDocument();

    await fireEvent.change(rpcUrlField, {
      target: {
        value: getRpcUrl({
          network: NETWORK_TYPES.MAINNET,
          excludeProjectId: true,
        }),
      },
    });

    expect(
      await screen.findByText(
        'This URL is currently used by the mainnet network.',
      ),
    ).toBeInTheDocument();
  });

  it('should convert rpcUrl field to lowercase when not in input mode', async () => {
    const networkDisplay = {
      ...propNetworkDisplay,
      selectedNetwork: {
        ...propNetworkDisplay.suggestedNetwork,
        rpcUrl: 'http://LOCALHOST:8545',
        viewOnly: true,
      },
    };
    const { getByDisplayValue } = renderComponent(networkDisplay);

    expect(
      getByDisplayValue(
        propNetworkDisplay.selectedNetwork.rpcUrl.toLowerCase(),
      ),
    ).toBeInTheDocument();
  });

  it('should validate chain id field correctly', async () => {
    const { getByTestId } = renderComponent(propNewNetwork);
    const chainIdField = getByTestId('network-form-chain-id');

    const rpcUrlField = screen.getByRole('textbox', { name: 'New RPC URL' });
    const currencySymbolField = getByTestId('network-form-ticker-input');

    fireEvent.change(chainIdField, {
      target: { value: '1' },
    });

    fireEvent.change(currencySymbolField, {
      target: { value: 'test' },
    });

    fireEvent.change(rpcUrlField, {
      target: { value: 'https://rpc.flashbots.net' },
    });

    expect(
      await screen.findByText(
        'This Chain ID is currently used by the mainnet network.',
      ),
    ).toBeInTheDocument();

    expect(screen.getByText('Save')).not.toBeDisabled();

    fireEvent.change(rpcUrlField, {
      target: { value: 'https://bsc-dataseed.binance.org/' },
    });

    const expectedWarning =
      'The RPC URL you have entered returned a different chain ID (56). Please update the Chain ID to match the RPC URL of the network you are trying to add.';
    expect(await screen.findByText(expectedWarning)).toBeInTheDocument();

    expect(screen.getByText('Save')).toBeDisabled();

    fireEvent.change(chainIdField, {
      target: { value: 'a' },
    });

    expect(
      await screen.findByText('Invalid hexadecimal number.'),
    ).toBeInTheDocument();

    // reset RCP URL field
    fireEvent.change(rpcUrlField, {
      target: { value: '' },
    });

    fireEvent.change(chainIdField, {
      target: { value: '00000012314' },
    });

    expect(
      await screen.findByText('Invalid number. Remove any leading zeros.'),
    ).toBeInTheDocument();
  });

  it('should validate currency symbol field correctly', async () => {
    const { getByTestId } = renderComponent(propNewNetwork);

    const chainIdField = getByTestId('network-form-chain-id');
    const currencySymbolField = getByTestId('network-form-ticker-input');

    fireEvent.change(chainIdField, {
      target: { value: '1234' },
    });

    fireEvent.change(currencySymbolField, {
      target: { value: 'abcd' },
    });

    const expectedWarning =
      'Ticker symbol verification data is currently unavailable, make sure that the symbol you have entered is correct. It will impact the conversion rates that you see for this network';
    expect(await screen.findByText(expectedWarning)).toBeInTheDocument();

    fireEvent.change(chainIdField, {
      target: { value: '137' },
    });
    expect(
      await screen.findByTestId('network-form-ticker-warning'),
    ).toBeInTheDocument();
  });

  it('should validate block explorer URL field correctly', async () => {
    const { getByTestId } = renderComponent(propNewNetwork);

    const blockExplorerUrlField = getByTestId(
      'network-form-block-explorer-url',
    );

    fireEvent.change(blockExplorerUrlField, {
      target: { value: '1234' },
    });
    expect(
      await screen.findByText(
        'URLs require the appropriate HTTP/HTTPS prefix.',
      ),
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

    const { getByTestId } = renderComponent(propNewNetwork);

    const chainIdField = getByTestId('network-form-chain-id');
    const currencySymbolField = getByTestId('network-form-ticker-input');

    fireEvent.change(chainIdField, {
      target: { value: '42161' },
    });

    fireEvent.change(currencySymbolField, {
      target: { value: 'abcd' },
    });

    const expectedSymbolWarning = 'Suggested ticker symbol:';
    expect(await screen.findByText(expectedSymbolWarning)).toBeInTheDocument();

    expect(
      await screen.findByTestId('network-form-ticker-warning'),
    ).toBeInTheDocument();

    fireEvent.change(currencySymbolField, {
      target: { value: 'ETH' },
    });

    expect(
      await screen.findByTestId('network-form-ticker-warning'),
    ).not.toBeInTheDocument();
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

    const { getByTestId } = renderComponent(propNewNetwork);

    const chainIdField = getByTestId('network-form-chain-id');
    const currencySymbolField = screen.getByTestId('network-form-ticker-input');

    fireEvent.change(chainIdField, {
      target: { value: '78' },
    });

    fireEvent.change(currencySymbolField, {
      target: { value: 'ZYN' },
    });

    expect(
      await screen.queryByTestId('network-form-ticker-suggestion'),
    ).not.toBeInTheDocument();

    fireEvent.change(currencySymbolField, {
      target: { value: 'ETH' },
    });

    expect(
      await screen.queryByTestId('network-form-ticker-suggestion'),
    ).toBeInTheDocument();

    const expectedSymbolWarning = 'Suggested ticker symbol:';
    expect(await screen.findByText(expectedSymbolWarning)).toBeInTheDocument();

    fireEvent.change(currencySymbolField, {
      target: { value: 'PETH' },
    });

    expect(
      await screen.queryByTestId('network-form-ticker-suggestion'),
    ).not.toBeInTheDocument();

    expect(
      await screen.queryByText(expectedSymbolWarning),
    ).not.toBeInTheDocument();
  });
});
