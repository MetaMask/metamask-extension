import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import { defaultNetworksData } from '../networks-tab.constants';
import NetworksList from '.';

const mockState = {
  metamask: {
    providerConfig: {
      chainId: '0x5',
      nickname: '',
      rpcPrefs: {},
      rpcUrl: 'https://goerli.infura.io/v3/undefined',
      ticker: 'ETH',
      type: 'goerli',
    },
  },
};

const renderComponent = (props) => {
  const store = configureMockStore([])(mockState);
  return renderWithProvider(<NetworksList {...props} />, store);
};

const defaultNetworks = defaultNetworksData.map((network) => ({
  ...network,
  viewOnly: true,
  isATestNetwork: true,
}));

const props = {
  networkDefaultedToProvider: false,
  networkIsSelected: false,
  networksToRender: defaultNetworks,
  selectedRpcUrl: 'http://localhost:8545',
  isATestNetwork: true,
};

describe('NetworksList Component', () => {
  it('should render a list of networks correctly', () => {
    const { queryByText } = renderComponent(props);

    expect(queryByText('Ethereum Mainnet')).toBeInTheDocument();
    expect(queryByText('Sepolia test network')).toBeInTheDocument();
  });
});
