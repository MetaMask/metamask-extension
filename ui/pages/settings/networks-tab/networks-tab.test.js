import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/jest/rendering';
import NetworksTab from '.';

const mockState = {
  metamask: {
    provider: {
      chainId: '0x539',
      nickname: '',
      rpcPrefs: {},
      rpcUrl: 'http://localhost:8545',
      ticker: 'ETH',
      type: 'localhost',
    },
    frequentRpcListDetail: [],
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
    expect(queryByText('Ropsten Test Network')).toBeInTheDocument();
    expect(queryByText('Rinkeby Test Network')).toBeInTheDocument();
    expect(queryByText('Goerli Test Network')).toBeInTheDocument();
    expect(queryByText('Kovan Test Network')).toBeInTheDocument();
    expect(queryByText('Add Network')).toBeInTheDocument();
  });
  it('should render add network form correctly', () => {
    const { queryByText } = renderComponent({
      addNewNetwork: true,
    });
    expect(queryByText('Network Name')).toBeInTheDocument();
    expect(queryByText('New RPC URL')).toBeInTheDocument();
    expect(queryByText('Chain ID')).toBeInTheDocument();
    expect(queryByText('Currency Symbol')).toBeInTheDocument();
    expect(queryByText('Block Explorer URL')).toBeInTheDocument();
    expect(queryByText('Cancel')).toBeInTheDocument();
    expect(queryByText('Save')).toBeInTheDocument();
  });
});
