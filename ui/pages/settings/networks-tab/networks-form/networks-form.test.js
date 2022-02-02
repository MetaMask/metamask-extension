import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent, screen } from '@testing-library/react';
import nock from 'nock';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import { defaultNetworksData } from '../networks-tab.constants';
import NetworksForm from '.';

nock('https://chainid.network:443', { encodedQueryParams: true })
  .get('/chains.json')
  .reply(200, []);

const renderComponent = (props) => {
  const store = configureMockStore([])({ metamask: {} });
  return renderWithProvider(<NetworksForm {...props} />, store);
};

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
  it('should render Add new network form correctly', async () => {
    const { queryByText, queryAllByText } = renderComponent(propNewNetwork);
    expect(
      queryByText(
        'A malicious network provider can lie about the state of the blockchain and record your network activity. Only add custom networks you trust.',
      ),
    ).toBeInTheDocument();
    expect(queryByText('Network Name')).toBeInTheDocument();
    expect(queryByText('New RPC URL')).toBeInTheDocument();
    expect(queryByText('Chain ID')).toBeInTheDocument();
    expect(queryByText('Currency Symbol')).toBeInTheDocument();
    expect(queryByText('Block Explorer URL')).toBeInTheDocument();
    expect(queryAllByText('(Optional)')).toHaveLength(1);
    expect(queryByText('Cancel')).toBeInTheDocument();
    expect(queryByText('Save')).toBeInTheDocument();

    await fireEvent.change(screen.getByRole('textbox', { name: 'Chain ID' }), {
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

  it('should render network form correctly', async () => {
    const { queryByText, getByDisplayValue } = renderComponent(
      propNetworkDisplay,
    );
    expect(queryByText('Network Name')).toBeInTheDocument();
    expect(queryByText('New RPC URL')).toBeInTheDocument();
    expect(queryByText('Chain ID')).toBeInTheDocument();
    expect(queryByText('Currency Symbol')).toBeInTheDocument();
    expect(queryByText('Block Explorer URL')).toBeInTheDocument();
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

    await fireEvent.change(
      getByDisplayValue(propNetworkDisplay.selectedNetwork.chainId),
      {
        target: { value: '1' },
      },
    );
    expect(
      await screen.findByText(
        'Could not fetch chain ID. Is your RPC URL correct?',
      ),
    ).toBeInTheDocument();

    await fireEvent.change(
      getByDisplayValue(propNetworkDisplay.selectedNetwork.rpcUrl),
      {
        target: { value: 'test' },
      },
    );
    expect(
      await screen.findByText(
        'URLs require the appropriate HTTP/HTTPS prefix.',
      ),
    ).toBeInTheDocument();

    await fireEvent.change(
      getByDisplayValue(propNetworkDisplay.selectedNetwork.label),
      {
        target: { value: 'LocalHost 8545' },
      },
    );
    expect(getByDisplayValue('LocalHost 8545')).toBeInTheDocument();
  });
});
