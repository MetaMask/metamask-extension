import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import { defaultNetworksData } from '../networks-tab.constants';
import { mockNetworkState } from '../../../../../test/stub/networks';
import { CHAIN_IDS } from '../../../../../shared/constants/network';
import NetworksListItem from '.';

const mockState = {
  metamask: {
    ...mockNetworkState({ chainId: CHAIN_IDS.GOERLI }),
  },
};

const renderComponent = (props) => {
  const store = configureMockStore([])(mockState);
  return renderWithProvider(<NetworksListItem {...props} />, store);
};

const defaultNetworks = defaultNetworksData.map((network) => ({
  ...network,
  viewOnly: true,
}));

const MainnetProps = {
  network: defaultNetworks[0],
  networkIsSelected: false,
  selectedRpcUrl: 'http://localhost:8545',
};
const testNetProps = {
  network: defaultNetworks[1],
  networkIsSelected: false,
  selectedRpcUrl: 'http://localhost:8545',
};

describe('NetworksListItem Component', () => {
  it('should render a Mainnet network item correctly', () => {
    const { queryByText } = renderComponent(MainnetProps);
    expect(queryByText('Ethereum Mainnet')).toBeInTheDocument();
  });

  it('should render a test network item correctly', () => {
    const { queryByText } = renderComponent(testNetProps);
    expect(queryByText('Sepolia test network')).toBeInTheDocument();
  });
});
