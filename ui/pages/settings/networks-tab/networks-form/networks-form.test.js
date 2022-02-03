import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { tick } from '../../../../../test/lib/tick';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import { defaultNetworksData } from '../networks-tab.constants';
import NetworksForm from '.';

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
  it('should render Add new network form correctly', () => {
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
    expect(queryAllByText('(Optional)')).toHaveLength(2);
    expect(queryByText('Cancel')).toBeInTheDocument();
    expect(queryByText('Save')).toBeInTheDocument();
  });

  it('should render network form correctly', () => {
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
    fireEvent.change(
      getByDisplayValue(propNetworkDisplay.selectedNetwork.label),
      {
        target: { value: 'LocalHost 8545' },
      },
    );
    expect(getByDisplayValue('LocalHost 8545')).toBeInTheDocument();
    fireEvent.change(
      getByDisplayValue(propNetworkDisplay.selectedNetwork.chainId),
      {
        target: { value: '1' },
      },
    );
    expect(
      queryByText('This Chain ID is currently used by the mainnet network.'),
    ).toBeInTheDocument();

    fireEvent.change(
      getByDisplayValue(propNetworkDisplay.selectedNetwork.rpcUrl),
      {
        target: { value: 'test' },
      },
    );
    expect(
      queryByText('URLs require the appropriate HTTP/HTTPS prefix.'),
    ).toBeInTheDocument();
  });

  it('should button Save in the correct state', async () => {
    const { queryByText, getByLabelText } = renderComponent(propNewNetwork);
    const saveButton = queryByText('Save');
    const networkNameText = getByLabelText('Network Name');
    const rpcUrlText = getByLabelText('New RPC URL');
    const chainIdText = getByLabelText('Chain ID');

    expect(queryByText('Save')).toBeDisabled();
    fireEvent.change(networkNameText, {
      target: { value: 'TEST' },
    });
    expect(saveButton).toBeDisabled();
    fireEvent.change(rpcUrlText, {
      target: {
        value: 'https://mainnet.infura.io/v3/undefined',
      },
    });
    expect(saveButton).toBeDisabled();
    expect(
      queryByText('This URL is currently used by the mainnet network.'),
    ).toBeInTheDocument();
    fireEvent.change(chainIdText, {
      target: { value: '1' },
    });
    expect(saveButton).toBeDisabled();
    fireEvent.change(rpcUrlText, {
      target: {
        value: 'https://mainnet.infura.io/v3/fake',
      },
    });
    expect(saveButton).toBeEnabled();

    fireEvent.click(saveButton);
    await tick();

    expect(
      queryByText('Could not fetch chain ID. Is your RPC URL correct?'),
    ).toBeInTheDocument();
    fireEvent.change(rpcUrlText, {
      target: {
        value: 'https://mainnet.infura.io/v3/undefined',
      },
    });
    expect(saveButton).toBeDisabled();
  });
});
