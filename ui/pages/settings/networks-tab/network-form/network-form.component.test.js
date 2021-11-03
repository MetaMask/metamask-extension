import React from 'react';
import configureMockStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import { defaultNetworksData } from '../networks-tab.constants';
import NetworkForm from '.';

const renderComponent = (props) => {
  const store = configureMockStore([])({ metamask: {} });
  return renderWithProvider(<NetworkForm {...props} />, store);
};

const defaultNetworks = defaultNetworksData.map((network) => ({
  ...network,
  viewOnly: true,
}));

const propNewNetwork = {
  onClear: () => undefined,
  setRpcTarget: () => undefined,
  networksToRender: defaultNetworks,
  onAddNetwork: () => undefined,
  setNewNetworkAdded: () => undefined,
  addNewNetwork: true,
};

const propNetworkDisplay = {
  editRpc: () => undefined,
  showConfirmDeleteNetworkModal: () => undefined,
  rpcUrl: 'http://localhost:8545',
  chainId: '1337',
  ticker: 'ETH',
  viewOnly: false,
  networkName: 'LocalHost',
  onClear: () => undefined,
  setRpcTarget: () => undefined,
  isCurrentRpcTarget: false,
  blockExplorerUrl: '',
  rpcPrefs: {},
  networksToRender: defaultNetworks,
  onAddNetwork: () => undefined,
  setNewNetworkAdded: () => undefined,
  addNewNetwork: false,
};

describe('NetworkForm Component', () => {
  it('should render Add new network form correctly', () => {
    const { queryByText } = renderComponent(propNewNetwork);
    expect(queryByText('Network Name')).toBeInTheDocument();
    expect(queryByText('New RPC URL')).toBeInTheDocument();
    expect(queryByText('Chain ID')).toBeInTheDocument();
    expect(queryByText('Currency Symbol (optional)')).toBeInTheDocument();
    expect(queryByText('Block Explorer URL (optional)')).toBeInTheDocument();
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
    expect(queryByText('Currency Symbol (optional)')).toBeInTheDocument();
    expect(queryByText('Block Explorer URL (optional)')).toBeInTheDocument();
    expect(queryByText('Delete')).toBeInTheDocument();
    expect(queryByText('Cancel')).toBeInTheDocument();
    expect(queryByText('Save')).toBeInTheDocument();

    expect(
      getByDisplayValue(propNetworkDisplay.networkName),
    ).toBeInTheDocument();
    expect(getByDisplayValue(propNetworkDisplay.rpcUrl)).toBeInTheDocument();
    expect(getByDisplayValue(propNetworkDisplay.chainId)).toBeInTheDocument();
    expect(getByDisplayValue(propNetworkDisplay.ticker)).toBeInTheDocument();
    expect(
      getByDisplayValue(propNetworkDisplay.blockExplorerUrl),
    ).toBeInTheDocument();
    fireEvent.change(getByDisplayValue(propNetworkDisplay.networkName), {
      target: { value: 'LocalHost 8545' },
    });
    expect(getByDisplayValue('LocalHost 8545')).toBeInTheDocument();
    fireEvent.change(getByDisplayValue(propNetworkDisplay.chainId), {
      target: { value: '1' },
    });
    expect(
      queryByText('This Chain ID is currently used by the mainnet network.'),
    ).toBeInTheDocument();

    fireEvent.change(getByDisplayValue(propNetworkDisplay.rpcUrl), {
      target: { value: 'test' },
    });
    expect(
      queryByText('URLs require the appropriate HTTP/HTTPS prefix.'),
    ).toBeInTheDocument();
  });
});
