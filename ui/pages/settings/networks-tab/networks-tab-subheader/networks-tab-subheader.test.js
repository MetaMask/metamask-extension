import React from 'react';
import configureMockStore from 'redux-mock-store';
import { waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import NetworksTabSubheader from '.';

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
  return renderWithProvider(<NetworksTabSubheader {...props} />, store);
};

describe('NetworksTabSubheader Component', () => {
  it('should render network subheader correctly', () => {
    const { queryByText, getByRole } = renderComponent({
      addNewNetwork: false,
    });

    expect(queryByText('Networks')).toBeInTheDocument();
    expect(queryByText('Add a network')).toBeInTheDocument();
    expect(getByRole('button', { text: 'Add a network' })).toBeDefined();
  });
  it('should render add network form subheader correctly', () => {
    const { queryByText, getAllByText } = renderComponent({
      addNewNetwork: true,
    });
    expect(queryByText('Networks')).toBeInTheDocument();
    waitFor(() => expect(getAllByText('>')).toBeInTheDocument());
    expect(queryByText('Add a network')).toBeInTheDocument();
  });
});
