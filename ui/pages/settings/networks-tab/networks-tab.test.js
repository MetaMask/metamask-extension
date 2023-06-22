import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/jest/rendering';
import NetworksTab from '.';

const mockState = {
  metamask: {
    providerConfig: {
      chainId: '0x539',
      nickname: '',
      rpcPrefs: {},
      rpcUrl: 'http://localhost:8545',
      ticker: 'ETH',
      type: 'localhost',
    },
    networkConfigurations: {},
  },
  appState: {
    networksTabSelectedRpcUrl: 'http://localhost:8545',
  },
};

const renderComponent = (props) => {
  const store = configureMockStore([])(mockState);
  return renderWithProvider(<NetworksTab {...props} />, store);
};

describe('NetworksTab Component', () => {
  it('should render networks tab content correctly', () => {
    const { queryByText } = renderComponent({
      addNewNetwork: false,
    });

    expect(queryByText('Ethereum Mainnet')).toBeInTheDocument();
    expect(queryByText('Goerli test network')).toBeInTheDocument();
    expect(queryByText('Sepolia test network')).toBeInTheDocument();
    expect(queryByText('Add network')).toBeInTheDocument();
  });
  it('should render add network form correctly', () => {
    const { queryByText } = renderComponent({
      addNewNetwork: true,
    });
    expect(queryByText('Network name')).toBeInTheDocument();
    expect(queryByText('New RPC URL')).toBeInTheDocument();
    expect(queryByText('Chain ID')).toBeInTheDocument();
    expect(queryByText('Currency symbol')).toBeInTheDocument();
    expect(queryByText('Block explorer URL')).toBeInTheDocument();
    expect(queryByText('Cancel')).toBeInTheDocument();
    expect(queryByText('Save')).toBeInTheDocument();
  });
});
